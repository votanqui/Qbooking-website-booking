using Microsoft.AspNetCore.SignalR;
using QBooking.Hubs;
using QBooking.Models;
using QBooking.Data;
using Microsoft.EntityFrameworkCore;
using QBooking.Dtos.Request;
using QBooking.Dtos.Response;

namespace QBooking.Services
{
    public interface INotificationService
    {
        Task SendNotificationAsync(Notification notification);
        Task<List<Notification>> GetUserNotificationsAsync(int userId, bool unreadOnly = false);
        Task<bool> MarkAsReadAsync(int notificationId, int userId);
        Task<int> GetUnreadCountAsync(int userId);
        // Thêm vào interface INotificationService
        Task<NotificationStatisticsResponse> GetStatisticsAsync();
        Task<UserNotificationStatisticsResponse> GetUserStatisticsAsync(int userId);
        Task<List<NotificationReportResponse>> GetReportAsync(DateTime fromDate, DateTime toDate, string groupBy);
        Task<PaginatedNotificationsResponse> GetNotificationsWithFilterAsync(AdminNotificationFilterRequest filter);
        Task<Notification> SendAdminNotificationAsync(AdminSendNotificationRequest request);
        Task<List<Notification>> BroadcastNotificationAsync(AdminBroadcastNotificationRequest request);
        Task<List<Notification>> SendNotificationToAllAsync(AdminSendToAllNotificationRequest request);
    }

    public class NotificationService : INotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ApplicationDbContext _context;

        public NotificationService(IHubContext<NotificationHub> hubContext, ApplicationDbContext context)
        {
            _hubContext = hubContext;
            _context = context;
        }
        public async Task<NotificationStatisticsResponse> GetStatisticsAsync()
        {
            var notifications = await _context.Notifications.ToListAsync();

            var stats = new NotificationStatisticsResponse
            {
                TotalNotifications = notifications.Count,
                TotalSent = notifications.Count,
                TotalRead = notifications.Count(n => n.IsRead),
                TotalUnread = notifications.Count(n => !n.IsRead),
                TotalEmailSent = notifications.Count(n => n.EmailSent && !string.IsNullOrEmpty(n.EmailTo)),
                TotalEmailFailed = notifications.Count(n => !n.EmailSent && n.EmailRetryCount >= n.MaxEmailRetries && !string.IsNullOrEmpty(n.EmailTo)),
                ByType = notifications.GroupBy(n => n.Type).ToDictionary(g => g.Key, g => g.Count()),
                ByPriority = notifications.GroupBy(n => n.Priority).ToDictionary(g => g.Key, g => g.Count())
            };

            stats.ReadRate = stats.TotalNotifications > 0
                ? Math.Round((double)stats.TotalRead / stats.TotalNotifications * 100, 2)
                : 0;

            var totalEmailAttempts = notifications.Count(n => !string.IsNullOrEmpty(n.EmailTo));
            stats.EmailSuccessRate = totalEmailAttempts > 0
                ? Math.Round((double)stats.TotalEmailSent / totalEmailAttempts * 100, 2)
                : 0;

            return stats;
        }
        public async Task<List<Notification>> SendNotificationToAllAsync(AdminSendToAllNotificationRequest request)
        {
            var notifications = new List<Notification>();

            // Lấy tất cả users (có thể thêm điều kiện lọc nếu cần)
            var users = await _context.Users
       .Where(u => u.IsActive) // Chỉ gửi cho user còn hoạt động
       .ToListAsync();


            foreach (var user in users)
            {
                var notification = new Notification
                {
                    UserId = user.Id,
                    Type = request.Type,
                    Title = request.Title,
                    Content = request.Content,
                    Priority = request.Priority,
                    RelatedType = request.RelatedType,
                    RelatedId = request.RelatedId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    EmailTo = request.SendEmail ? user.Email : null,
                    EmailSent = false,
                    EmailRetryCount = 0,
                    MaxEmailRetries = 3
                };

                _context.Notifications.Add(notification);
                notifications.Add(notification);
            }

            await _context.SaveChangesAsync();

            // Gửi realtime qua SignalR cho tất cả users
            foreach (var notification in notifications)
            {
                try
                {
                    await _hubContext.Clients
                        .Group($"user_{notification.UserId}")
                        .SendAsync("ReceiveNotification", new
                        {
                            id = notification.Id,
                            type = notification.Type,
                            title = notification.Title,
                            content = notification.Content,
                            priority = notification.Priority,
                            createdAt = notification.CreatedAt,
                            isRead = notification.IsRead,
                            relatedId = notification.RelatedId,
                            relatedType = notification.RelatedType
                        });
                }
                catch (Exception ex)
                {
                    // Log lỗi nhưng không throw để không ảnh hưởng đến việc gửi cho users khác
                    Console.WriteLine($"Error sending realtime notification to user {notification.UserId}: {ex.Message}");
                }
            }

            return notifications;
        }
        public async Task<UserNotificationStatisticsResponse> GetUserStatisticsAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return null;

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .ToListAsync();

            var stats = new UserNotificationStatisticsResponse
            {
                UserId = userId,
                UserName = user.FullName,
                UserEmail = user.Email,
                TotalReceived = notifications.Count,
                TotalRead = notifications.Count(n => n.IsRead),
                TotalUnread = notifications.Count(n => !n.IsRead),
                TotalEmailSent = notifications.Count(n => n.EmailSent && !string.IsNullOrEmpty(n.EmailTo)),
                LastNotificationDate = notifications.OrderByDescending(n => n.CreatedAt).FirstOrDefault()?.CreatedAt,
                ByType = notifications.GroupBy(n => n.Type).ToDictionary(g => g.Key, g => g.Count())
            };

            stats.ReadRate = stats.TotalReceived > 0
                ? Math.Round((double)stats.TotalRead / stats.TotalReceived * 100, 2)
                : 0;

            return stats;
        }

        public async Task<List<NotificationReportResponse>> GetReportAsync(DateTime fromDate, DateTime toDate, string groupBy)
        {
            var notifications = await _context.Notifications
                .Where(n => n.CreatedAt >= fromDate && n.CreatedAt <= toDate)
                .ToListAsync();

            IEnumerable<IGrouping<DateTime, Notification>> grouped;

            switch (groupBy.ToLower())
            {
                case "week":
                    grouped = notifications.GroupBy(n => n.CreatedAt.Date.AddDays(-(int)n.CreatedAt.DayOfWeek));
                    break;
                case "month":
                    grouped = notifications.GroupBy(n => new DateTime(n.CreatedAt.Year, n.CreatedAt.Month, 1));
                    break;
                default: // day
                    grouped = notifications.GroupBy(n => n.CreatedAt.Date);
                    break;
            }

            return grouped.Select(g => new NotificationReportResponse
            {
                Period = groupBy.ToLower(),
                Date = g.Key,
                TotalSent = g.Count(),
                TotalRead = g.Count(n => n.IsRead),
                TotalEmailSent = g.Count(n => n.EmailSent && !string.IsNullOrEmpty(n.EmailTo)),
                ByType = g.GroupBy(n => n.Type).ToDictionary(t => t.Key, t => t.Count())
            })
            .OrderBy(r => r.Date)
            .ToList();
        }

        public async Task<PaginatedNotificationsResponse> GetNotificationsWithFilterAsync(AdminNotificationFilterRequest filter)
        {
            var query = _context.Notifications.AsQueryable();

            if (!string.IsNullOrEmpty(filter.Type))
                query = query.Where(n => n.Type == filter.Type);

            if (!string.IsNullOrEmpty(filter.Priority))
                query = query.Where(n => n.Priority == filter.Priority);

            if (filter.IsRead.HasValue)
                query = query.Where(n => n.IsRead == filter.IsRead.Value);

            if (filter.UserId.HasValue)
                query = query.Where(n => n.UserId == filter.UserId.Value);

            if (filter.FromDate.HasValue)
                query = query.Where(n => n.CreatedAt >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(n => n.CreatedAt <= filter.ToDate.Value);

            var totalCount = await query.CountAsync();

            var notifications = await query
                .OrderByDescending(n => n.CreatedAt)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PaginatedNotificationsResponse
            {
                Notifications = notifications,
                TotalCount = totalCount,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
            };
        }

        public async Task<Notification> SendAdminNotificationAsync(AdminSendNotificationRequest request)
        {
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
                throw new Exception($"User {request.UserId} not found");

            var notification = new Notification
            {
                UserId = request.UserId,
                Type = request.Type,
                Title = request.Title,
                Content = request.Content,
                Priority = request.Priority,
                RelatedType = request.RelatedType,
                RelatedId = request.RelatedId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                EmailTo = request.SendEmail ? user.Email : null,
                EmailSent = false,
                EmailRetryCount = 0,
                MaxEmailRetries = 3
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Gửi realtime qua SignalR
            await _hubContext.Clients
                .Group($"user_{notification.UserId}")
                .SendAsync("ReceiveNotification", new
                {
                    id = notification.Id,
                    type = notification.Type,
                    title = notification.Title,
                    content = notification.Content,
                    priority = notification.Priority,
                    createdAt = notification.CreatedAt,
                    isRead = notification.IsRead,
                    relatedId = notification.RelatedId,
                    relatedType = notification.RelatedType
                });

            return notification;
        }

        public async Task<List<Notification>> BroadcastNotificationAsync(AdminBroadcastNotificationRequest request)
        {
            var notifications = new List<Notification>();

            foreach (var userId in request.UserIds)
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null) continue;

                var notification = new Notification
                {
                    UserId = userId,
                    Type = request.Type,
                    Title = request.Title,
                    Content = request.Content,
                    Priority = request.Priority,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    EmailTo = request.SendEmail ? user.Email : null,
                    EmailSent = false,
                    EmailRetryCount = 0,
                    MaxEmailRetries = 3
                };

                _context.Notifications.Add(notification);
                notifications.Add(notification);
            }

            await _context.SaveChangesAsync();

            // Gửi realtime qua SignalR cho tất cả users
            foreach (var notification in notifications)
            {
                await _hubContext.Clients
                    .Group($"user_{notification.UserId}")
                    .SendAsync("ReceiveNotification", new
                    {
                        id = notification.Id,
                        type = notification.Type,
                        title = notification.Title,
                        content = notification.Content,
                        priority = notification.Priority,
                        createdAt = notification.CreatedAt,
                        isRead = notification.IsRead,
                        relatedId = notification.RelatedId,
                        relatedType = notification.RelatedType
                    });
            }

            return notifications;
        }
        public async Task SendNotificationAsync(Notification notification)
        {
            // Lưu vào database
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Gửi realtime qua SignalR
            await _hubContext.Clients
                .Group($"user_{notification.UserId}")
                .SendAsync("ReceiveNotification", new
                {
                    id = notification.Id,
                    type = notification.Type,
                    title = notification.Title,
                    content = notification.Content,
                    priority = notification.Priority,
                    createdAt = notification.CreatedAt,
                    isRead = notification.IsRead,
                    relatedId = notification.RelatedId,
                    relatedType = notification.RelatedType
                });
        }

        public async Task<List<Notification>> GetUserNotificationsAsync(int userId, bool unreadOnly = false)
        {
            var query = _context.Notifications.Where(n => n.UserId == userId);

            if (unreadOnly)
                query = query.Where(n => !n.IsRead);

            return await query
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .ToListAsync();
        }

        public async Task<bool> MarkAsReadAsync(int notificationId, int userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null) return false;

            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Thông báo client đã đọc
            await _hubContext.Clients
                .Group($"user_{userId}")
                .SendAsync("NotificationMarkedAsRead", notificationId);

            return true;
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }
    }
}