using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using QBooking.Data;
using QBooking.Models;
using QBooking.Hubs;
using System.Text.Json;

namespace QBooking.Services
{
    public interface IEmailQueueService
    {
        Task QueueBookingConfirmationAsync(int userId, string email, object bookingData);
        Task QueueThankYouEmailAsync(int userId, string email, object thankYouData);
        Task QueueBookingCancelledAsync(int userId, string email, object cancelData);
        Task QueuePaymentReminderAsync(int userId, string email, object reminderData);
        Task<List<Notification>> GetPendingEmailsAsync(int batchSize = 10);
        Task MarkEmailAsSentAsync(int notificationId);
        Task MarkEmailAsFailedAsync(int notificationId, string errorMessage);
        Task MarkEmailForRetryAsync(int notificationId, string errorMessage);
        Task QueueAccountBannedAsync(int userId, string email, object banData);
        Task QueueNoShowNotificationAsync(int userId, string email, object noShowData);
        Task QueueHostBookingNotificationAsync(int hostUserId, string email, object bookingData);
            Task QueueAdminNotificationAsync(int userId, string email, string title, string content, string type);

        Task QueueRefundTicketCreatedAsync(int userId, string email, object refundData);
        Task QueueRefundTicketApprovedAsync(int userId, string email, object approvalData);
        Task QueueRefundTicketRejectedAsync(int userId, string email, object rejectionData);
    }

    public class EmailQueueService : IEmailQueueService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<EmailQueueService> _logger;
        private readonly IHubContext<NotificationHub> _hubContext;

        public EmailQueueService(
            ApplicationDbContext context,
            ILogger<EmailQueueService> logger,
            IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _logger = logger;
            _hubContext = hubContext;
        }
        public async Task QueueRefundTicketCreatedAsync(int userId, string email, object refundData)
        {
            await CreateNotificationAsync(userId, email, "refund_ticket_created",
                "Yêu cầu hoàn tiền đã được tạo",
                refundData,
                "high");
        }

        public async Task QueueRefundTicketApprovedAsync(int userId, string email, object approvalData)
        {
            await CreateNotificationAsync(userId, email, "refund_ticket_approved",
                "Yêu cầu hoàn tiền đã được duyệt",
                approvalData,
                "urgent");
        }

        public async Task QueueRefundTicketRejectedAsync(int userId, string email, object rejectionData)
        {
            await CreateNotificationAsync(userId, email, "refund_ticket_rejected",
                "Yêu cầu hoàn tiền bị từ chối",
                rejectionData,
                "high");
        }
        public async Task QueueAdminNotificationAsync(int userId, string email, string title, string content, string type)
        {
            await CreateNotificationAsync(userId, email, type,
                title,
                new { message = content },
                "normal");
        }
        public async Task QueueNoShowNotificationAsync(int userId, string email, object noShowData)
        {
            await CreateNotificationAsync(userId, email, "booking_no_show",
                "Thông báo: Booking của bạn đã bị đánh dấu No-Show",
                noShowData,
                "high");
        }

        public async Task QueueBookingConfirmationAsync(int userId, string email, object bookingData)
        {
            await CreateNotificationAsync(userId, email, "booking_confirmation",
                "Xác nhận đặt phòng thành công",
                bookingData,
                "high");
        }

        public async Task QueueThankYouEmailAsync(int userId, string email, object thankYouData)
        {
            await CreateNotificationAsync(userId, email, "thank_you",
                "Cảm ơn bạn đã sử dụng dịch vụ",
                thankYouData,
                "normal");
        }

        public async Task QueueBookingCancelledAsync(int userId, string email, object cancelData)
        {
            await CreateNotificationAsync(userId, email, "booking_cancelled",
                "Đặt phòng đã bị hủy",
                cancelData,
                "high");
        }

        public async Task QueuePaymentReminderAsync(int userId, string email, object reminderData)
        {
            await CreateNotificationAsync(userId, email, "payment_reminder",
                "Nhắc nhở thanh toán",
                reminderData,
                "urgent");
        }

        public async Task QueueAccountBannedAsync(int userId, string email, object banData)
        {
            await CreateNotificationAsync(userId, email, "account_banned",
                "Tài khoản đã bị tạm khóa",
                banData,
                "urgent");
        }
        public async Task QueueHostBookingNotificationAsync(int hostUserId, string email, object bookingData)
        {
            await CreateNotificationAsync(hostUserId, email, "host_new_booking",
                "Bạn có booking mới",
                bookingData,
                "high");
        }
        /// <summary>
        /// Tạo notification với cả DB + SignalR realtime + Email queue
        /// </summary>
        private async Task CreateNotificationAsync(int userId, string email, string type,
     string title, object dataObject, string priority)
        {
            try
            {
                _logger.LogInformation($"📧 Creating {type} notification for user {userId}, email {email}");

                // Serialize data object
                string contentJson = JsonSerializer.Serialize(dataObject);

                var notification = new Notification
                {
                    UserId = userId,
                    Type = type,
                    Title = title,
                    Content = contentJson, // Lưu JSON string
                    EmailTo = email,
                    EmailSent = false,
                    EmailSentAt = null,
                    IsRead = false,
                    ReadAt = null,
                    RelatedType = type switch
                    {
                        "account_banned" => "Security",
                        "booking_no_show" => "NoShow",
                        _ => "Booking"
                    },
                    Priority = priority,
                    CreatedAt = DateTime.UtcNow,
                    EmailRetryCount = 0,
                    MaxEmailRetries = type == "account_banned" ? 5 : 3,
                    NextEmailRetryAt = null,
                    EmailError = null
                };

                // 1️⃣ Lưu vào Database
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ Saved notification ID: {notification.Id} to database");

                // 2️⃣ Gửi SignalR Realtime - SỬA Ở ĐÂY
                try
                {
                    // Parse lại JSON string để đảm bảo format đồng nhất
                    var contentObject = JsonSerializer.Deserialize<JsonElement>(contentJson);

                    var realtimeData = new
                    {
                        id = notification.Id,
                        type = notification.Type,
                        title = notification.Title,
                        content = contentObject, // Gửi object đã parse
                        priority = notification.Priority,
                        createdAt = notification.CreatedAt,
                        isRead = notification.IsRead,
                        relatedId = notification.RelatedId,
                        relatedType = notification.RelatedType
                    };

                    await _hubContext.Clients
                        .Group($"user_{userId}")
                        .SendAsync("ReceiveNotification", realtimeData);

                    _logger.LogInformation($"🔔 Sent realtime notification to user_{userId} via SignalR");
                }
                catch (Exception signalREx)
                {
                    _logger.LogWarning(signalREx, $"⚠️ SignalR failed for notification {notification.Id}, but email is still queued");
                }

                _logger.LogInformation($"📬 Email queued for notification {notification.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Failed to create notification {type} for user {userId}");
                throw;
            }
        }

        public async Task<List<Notification>> GetPendingEmailsAsync(int batchSize = 10)
        {
            try
            {
                var pendingEmails = await _context.Notifications
                    .Where(n => n.EmailSent == false &&
                               n.EmailRetryCount < n.MaxEmailRetries &&
                               !string.IsNullOrEmpty(n.EmailTo) &&
                               (n.NextEmailRetryAt == null || n.NextEmailRetryAt <= DateTime.UtcNow))
                    .OrderByDescending(n => n.Priority == "urgent" ? 4 :
                                           n.Priority == "high" ? 3 :
                                           n.Priority == "normal" ? 2 : 1)
                    .ThenBy(n => n.CreatedAt)
                    .Take(batchSize)
                    .ToListAsync();

                _logger.LogInformation($"📬 Found {pendingEmails.Count} pending email notifications");
                return pendingEmails;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting pending emails");
                throw;
            }
        }

        public async Task MarkEmailAsSentAsync(int notificationId)
        {
            try
            {
                var notification = await _context.Notifications.FindAsync(notificationId);
                if (notification != null)
                {
                    notification.EmailSent = true;
                    notification.EmailSentAt = DateTime.UtcNow;
                    notification.EmailError = null;
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"✅ Marked notification {notificationId} as sent");
                }
                else
                {
                    _logger.LogWarning($"⚠️ Notification {notificationId} not found when marking as sent");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error marking notification {notificationId} as sent");
                throw;
            }
        }

        public async Task MarkEmailAsFailedAsync(int notificationId, string errorMessage)
        {
            try
            {
                var notification = await _context.Notifications.FindAsync(notificationId);
                if (notification != null)
                {
                    notification.EmailRetryCount++;
                    notification.EmailError = errorMessage?.Length > 1000 ? errorMessage.Substring(0, 1000) : errorMessage;

                    if (notification.EmailRetryCount >= notification.MaxEmailRetries)
                    {
                        notification.EmailSent = true;
                        _logger.LogError($"❌ Notification {notificationId} failed permanently after {notification.MaxEmailRetries} retries: {errorMessage}");
                    }

                    await _context.SaveChangesAsync();
                }
                else
                {
                    _logger.LogWarning($"⚠️ Notification {notificationId} not found when marking as failed");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error marking notification {notificationId} as failed");
                throw;
            }
        }

        public async Task MarkEmailForRetryAsync(int notificationId, string errorMessage)
        {
            try
            {
                var notification = await _context.Notifications.FindAsync(notificationId);
                if (notification != null)
                {
                    notification.EmailRetryCount++;
                    notification.EmailError = errorMessage?.Length > 1000 ? errorMessage.Substring(0, 1000) : errorMessage;

                    notification.NextEmailRetryAt = DateTime.UtcNow.AddMinutes(Math.Pow(2, notification.EmailRetryCount));

                    await _context.SaveChangesAsync();

                    _logger.LogWarning($"⏰ Scheduled notification {notificationId} for retry at {notification.NextEmailRetryAt}. Attempt {notification.EmailRetryCount}/{notification.MaxEmailRetries}");
                }
                else
                {
                    _logger.LogWarning($"⚠️ Notification {notificationId} not found when scheduling retry");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error scheduling notification {notificationId} for retry");
                throw;
            }
        }
    }
}