using Microsoft.EntityFrameworkCore;
using QBooking.Data;
using QBooking.Models;
using System.Net;

namespace QBooking.Services
{
    public class HistoryLoginService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<HistoryLoginService> _logger;
        private readonly IEmailQueueService _emailQueueService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AuditLogService _auditLogService;


        // Cấu hình cho việc phát hiện hành vi đáng ngờ
        private const int MAX_LOGIN_ATTEMPTS_PER_DAY = 10;
        private const int MAX_ACCOUNTS_PER_IP = 5;
        private const int MAX_DEVICES_PER_ACCOUNT = 10;
        public HistoryLoginService(ApplicationDbContext context,
                                 ILogger<HistoryLoginService> logger,
                                  IEmailQueueService emailQueueService,
                                 IHttpContextAccessor httpContextAccessor,
                                 AuditLogService auditLogService) // Thêm constructor parameter
        {
            _context = context;
            _logger = logger;
            _emailQueueService = emailQueueService;
            _httpContextAccessor = httpContextAccessor;
            _auditLogService = auditLogService; // Gán service
        }

        /// <summary>
        /// Ghi log đăng nhập thành công
        /// </summary>
        public async Task LogSuccessfulLoginAsync(int userId, string userName)
        {
            try
            {
                var ipAddress = GetClientIpAddress();
                var deviceInfo = GetDeviceInfo();

                var historyLogin = new HistoryLogin
                {
                    UserId = userId,
                    UserName = userName,
                    LoginTime = DateTime.UtcNow,
                    IpAddress = ipAddress,
                    DeviceInfo = deviceInfo,
                    IsSuccess = true,
                    FailureReason = null,
                    CreatedAt = DateTime.UtcNow
                };

                _context.HistoryLogins.Add(historyLogin);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successful login logged for user {UserId} from IP {IpAddress}", userId, ipAddress);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging successful login for user {UserId}", userId);
            }
        }

        /// <summary>
        /// Ghi log đăng nhập thất bại
        /// </summary>
        public async Task LogFailedLoginAsync(string email, string failureReason)
        {
            try
            {
                var ipAddress = GetClientIpAddress();
                var deviceInfo = GetDeviceInfo();

                // Tìm user để lấy thông tin (nếu có)
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == email);

                var historyLogin = new HistoryLogin
                {
                    UserId = user?.Id ?? 0, // 0 nếu không tìm thấy user
                    UserName = user?.FullName ?? email,
                    LoginTime = DateTime.UtcNow,
                    IpAddress = ipAddress,
                    DeviceInfo = deviceInfo,
                    IsSuccess = false,
                    FailureReason = failureReason,
                    CreatedAt = DateTime.UtcNow
                };

                _context.HistoryLogins.Add(historyLogin);
                await _context.SaveChangesAsync();

                _logger.LogWarning("Failed login attempt logged for email {Email} from IP {IpAddress}. Reason: {Reason}",
                                 email, ipAddress, failureReason);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging failed login for email {Email}", email);
            }
        }

        /// <summary>
        /// Kiểm tra số lần đăng nhập thất bại gần đây
        /// </summary>
        public async Task<int> GetRecentFailedAttemptsAsync(string email, int minutesToCheck = 15)
        {
            try
            {
                var cutoffTime = DateTime.UtcNow.AddMinutes(-minutesToCheck);
                var ipAddress = GetClientIpAddress();

                var failedAttempts = await _context.HistoryLogins
                    .Where(h => !h.IsSuccess &&
                               h.LoginTime >= cutoffTime &&
                               (h.IpAddress == ipAddress || h.UserName == email))
                    .CountAsync();

                return failedAttempts;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recent failed attempts for email {Email}", email);
                return 0;
            }
        }

        /// <summary>
        /// Xóa các bản ghi lịch sử cũ và tự động mở khóa user
        /// </summary>
        public async Task<(int deletedCount, List<string> unbannedUsers)> CleanupOldHistoryWithUnbanAsync(int daysToKeep = 90)
        {
            var unbannedUsers = new List<string>();
            var deletedCount = 0;

            try
            {
                var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);

                // Tìm các user bị khóa do hành vi đáng ngờ và đã qua 90 ngày
                var usersToUnban = await _context.Users
                    .Where(u => !u.IsActive)
                    .Where(u => _context.HistoryLogins
                        .Where(h => h.UserId == u.Id && h.CreatedAt < cutoffDate)
                        .Any())
                    .ToListAsync();

                // Mở khóa các user
                foreach (var user in usersToUnban)
                {
                    user.IsActive = true;
                    user.UpdatedAt = DateTime.UtcNow;
                    unbannedUsers.Add($"{user.Email} (ID: {user.Id})");
                    await _auditLogService.LogActionAsync(
              "AUTO_UNBAN",
              "User",
              user.Id,
              "IsActive: false",
              "IsActive: true (Automatic unban after 90 days)"
          );
                }

                // Xóa lịch sử cũ
                var oldRecords = await _context.HistoryLogins
                    .Where(h => h.CreatedAt < cutoffDate)
                    .ToListAsync();

                if (oldRecords.Any())
                {
                    _context.HistoryLogins.RemoveRange(oldRecords);
                    deletedCount = oldRecords.Count;
                }

                if (unbannedUsers.Any() || oldRecords.Any())
                {
                    await _context.SaveChangesAsync();
                }

                if (deletedCount > 0)
                {
                    _logger.LogInformation("Cleaned up {Count} old login history records older than {Days} days",
                                         deletedCount, daysToKeep);
                }

                if (unbannedUsers.Any())
                {
                    _logger.LogInformation("Automatically unbanned {Count} users after {Days} days",
                                         unbannedUsers.Count, daysToKeep);
                }

                return (deletedCount, unbannedUsers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up old login history and unbanning users");
                return (0, new List<string>());
            }
        }

        /// <summary>
        /// Xóa các bản ghi lịch sử cũ (method cũ để tương thích)
        /// </summary>
        public async Task<int> CleanupOldHistoryAsync(int daysToKeep = 90)
        {
            var (deletedCount, _) = await CleanupOldHistoryWithUnbanAsync(daysToKeep);
            return deletedCount;
        }

        /// <summary>
        /// Tự động khóa các user có hành vi đáng ngờ
        /// </summary>
        /// 
        public class AccountBanData
        {
            public string FullName { get; set; }
            public string Email { get; set; }
            public string Reason { get; set; }
            public string ContactEmail { get; set; }
            public DateTime BannedAt { get; set; }
            public List<string> SuspiciousActivities { get; set; } = new List<string>();
        }
        public async Task<List<User>> BanSuspiciousUsersAsync()
        {
            var bannedUsers = new List<User>();

            try
            {
                var today = DateTime.UtcNow.Date;
                var tomorrow = today.AddDays(1);

                // 1. Tìm IP có quá nhiều lần đăng nhập trong ngày
                var suspiciousIps = await _context.HistoryLogins
                    .Where(h => h.LoginTime >= today && h.LoginTime < tomorrow)
                    .GroupBy(h => h.IpAddress)
                    .Where(g => g.Count() > MAX_LOGIN_ATTEMPTS_PER_DAY)
                    .Select(g => g.Key)
                    .ToListAsync();

                // 2. Tìm IP có quá nhiều tài khoản khác nhau đăng nhập
                var ipsWithManyAccounts = await _context.HistoryLogins
                    .Where(h => h.LoginTime >= today && h.LoginTime < tomorrow && h.UserId > 0)
                    .GroupBy(h => h.IpAddress)
                    .Where(g => g.Select(x => x.UserId).Distinct().Count() > MAX_ACCOUNTS_PER_IP)
                    .Select(g => g.Key)
                    .ToListAsync();

                // 3. Tìm tài khoản có quá nhiều thiết bị khác nhau
                var usersWithManyDevices = await _context.HistoryLogins
                    .Where(h => h.LoginTime >= today && h.LoginTime < tomorrow && h.UserId > 0)
                    .GroupBy(h => h.UserId)
                    .Where(g => g.Select(x => x.DeviceInfo).Distinct().Count() > MAX_DEVICES_PER_ACCOUNT)
                    .Select(g => g.Key)
                    .ToListAsync();

                var allSuspiciousIps = suspiciousIps.Union(ipsWithManyAccounts).Distinct().ToList();

                // Lấy danh sách user cần ban
                var usersToBan = new List<int>();

                // Ban user từ IP đáng ngờ
                if (allSuspiciousIps.Any())
                {
                    var usersFromSuspiciousIps = await _context.HistoryLogins
                        .Where(h => h.LoginTime >= today &&
                                   h.LoginTime < tomorrow &&
                                   h.UserId > 0 &&
                                   allSuspiciousIps.Contains(h.IpAddress))
                        .Select(h => h.UserId)
                        .Distinct()
                        .ToListAsync();

                    usersToBan.AddRange(usersFromSuspiciousIps);
                }

                // Ban user có nhiều thiết bị
                usersToBan.AddRange(usersWithManyDevices);

                // Loại bỏ trùng lặp
                usersToBan = usersToBan.Distinct().ToList();

                if (usersToBan.Any())
                {
                    var users = await _context.Users
                        .Where(u => usersToBan.Contains(u.Id) && u.IsActive)
                        .ToListAsync();

                    foreach (var user in users)
                    {
                        user.IsActive = false;
                        user.UpdatedAt = DateTime.UtcNow;
                        bannedUsers.Add(user);

                        // Tạo lý do chi tiết
                        var suspiciousActivities = new List<string>();

                        if (suspiciousIps.Any())
                            suspiciousActivities.Add($"Đăng nhập quá nhiều lần từ IP: {string.Join(", ", suspiciousIps.Take(2))}");

                        if (ipsWithManyAccounts.Any())
                            suspiciousActivities.Add("IP được sử dụng bởi quá nhiều tài khoản khác nhau");

                        if (usersWithManyDevices.Contains(user.Id))
                            suspiciousActivities.Add("Sử dụng quá nhiều thiết bị khác nhau");

                        var reason = string.Join("; ", suspiciousActivities);
                        if (string.IsNullOrEmpty(reason))
                            reason = "Phát hiện hoạt động bất thường từ tài khoản của bạn";

                        // ⭐ SỬ DỤNG EMAIL QUEUE THAY VÌ GỬI TRỰC TIẾP
                        try
                        {
                            var banData = new AccountBanData
                            {
                                FullName = user.FullName,
                                Email = user.Email,
                                Reason = reason,
                                ContactEmail = "support@qbooking.com", // Có thể config
                                BannedAt = DateTime.UtcNow,
                                SuspiciousActivities = suspiciousActivities
                            };

                            await _emailQueueService.QueueAccountBannedAsync(user.Id, user.Email, banData);
                            _logger.LogInformation("✅ Queued ban notification email for user {Email}", user.Email);
                        }
                        catch (Exception emailEx)
                        {
                            _logger.LogError(emailEx, "❌ Failed to queue ban notification email for user {Email}", user.Email);
                            // Không throw exception để không ảnh hưởng đến việc ban user
                        }

                        await _auditLogService.LogActionAsync(
                            "AUTO_BAN",
                            "User",
                            user.Id,
                            "IsActive: true",
                            $"IsActive: false (Suspicious activity: {reason})"
                        );

                        _logger.LogWarning("User {Email} (ID: {UserId}) has been automatically banned due to: {Reason}",
                            user.Email, user.Id, reason);
                    }

                    if (users.Any())
                    {
                        await _context.SaveChangesAsync();
                    }
                }

                // Log thống kê
                if (suspiciousIps.Any())
                {
                    _logger.LogWarning("Found {Count} IPs with > {Max} login attempts today: {IPs}",
                                     suspiciousIps.Count, MAX_LOGIN_ATTEMPTS_PER_DAY, string.Join(", ", suspiciousIps));
                }

                if (ipsWithManyAccounts.Any())
                {
                    _logger.LogWarning("Found {Count} IPs with > {Max} different accounts: {IPs}",
                                     ipsWithManyAccounts.Count, MAX_ACCOUNTS_PER_IP, string.Join(", ", ipsWithManyAccounts));
                }

                if (usersWithManyDevices.Any())
                {
                    _logger.LogWarning("Found {Count} users with > {Max} different devices",
                                     usersWithManyDevices.Count, MAX_DEVICES_PER_ACCOUNT);
                }

                return bannedUsers;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during suspicious user detection");
                return new List<User>();
            }
        }

        /// <summary>
        /// Lấy địa chỉ IP của client
        /// </summary>
        private string GetClientIpAddress()
        {
            try
            {
                var httpContext = _httpContextAccessor.HttpContext;
                if (httpContext == null) return "Unknown";

                var ipAddress = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
                if (!string.IsNullOrEmpty(ipAddress))
                {
                    // X-Forwarded-For có thể chứa nhiều IP, lấy cái đầu tiên
                    ipAddress = ipAddress.Split(',')[0].Trim();
                }
                else
                {
                    ipAddress = httpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
                }

                if (string.IsNullOrEmpty(ipAddress))
                {
                    ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
                }

                // Xử lý IPv6 loopback
                if (ipAddress == "::1")
                {
                    ipAddress = "127.0.0.1";
                }

                return ipAddress ?? "Unknown";
            }
            catch
            {
                return "Unknown";
            }
        }

        /// <summary>
        /// Lấy thông tin thiết bị của client
        /// </summary>
        private string GetDeviceInfo()
        {
            try
            {
                var httpContext = _httpContextAccessor.HttpContext;
                if (httpContext == null) return "Unknown";

                var userAgent = httpContext.Request.Headers["User-Agent"].FirstOrDefault();

                if (string.IsNullOrEmpty(userAgent))
                    return "Unknown";

                // Rút gọn thông tin User Agent để lưu trữ
                if (userAgent.Length > 500)
                    userAgent = userAgent.Substring(0, 500) + "...";

                return userAgent;
            }
            catch
            {
                return "Unknown";
            }
        }

        /// <summary>
        /// Lấy thống kê đăng nhập theo user
        /// </summary>
        public async Task<object> GetUserLoginStatsAsync(int userId, int days = 30)
        {
            try
            {
                var fromDate = DateTime.UtcNow.AddDays(-days);

                var stats = await _context.HistoryLogins
                    .Where(h => h.UserId == userId && h.LoginTime >= fromDate)
                    .GroupBy(h => 1)
                    .Select(g => new
                    {
                        TotalAttempts = g.Count(),
                        SuccessfulLogins = g.Count(x => x.IsSuccess),
                        FailedLogins = g.Count(x => !x.IsSuccess),
                        LastLogin = g.Where(x => x.IsSuccess).Max(x => (DateTime?)x.LoginTime),
                        UniqueIps = g.Select(x => x.IpAddress).Distinct().Count()
                    })
                    .FirstOrDefaultAsync();

                return stats ?? new
                {
                    TotalAttempts = 0,
                    SuccessfulLogins = 0,
                    FailedLogins = 0,
                    LastLogin = (DateTime?)null,
                    UniqueIps = 0
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting login stats for user {UserId}", userId);
                return new
                {
                    TotalAttempts = 0,
                    SuccessfulLogins = 0,
                    FailedLogins = 0,
                    LastLogin = (DateTime?)null,
                    UniqueIps = 0
                };
            }
        }

        /// <summary>
        /// Kiểm tra xem user có đang bị khóa do hành vi đáng ngờ không
        /// </summary>
        public async Task<bool> IsUserBannedAsync(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                return user != null && !user.IsActive;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if user {UserId} is banned", userId);
                return false;
            }
        }

        /// <summary>
        /// Lấy thống kê hành vi đáng ngờ trong ngày
        /// </summary>
        public async Task<object> GetSuspiciousActivityStatsAsync()
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var tomorrow = today.AddDays(1);

                var stats = await _context.HistoryLogins
                    .Where(h => h.LoginTime >= today && h.LoginTime < tomorrow)
                    .GroupBy(h => 1)
                    .Select(g => new
                    {
                        TotalLoginAttempts = g.Count(),
                        UniqueIPs = g.Select(x => x.IpAddress).Distinct().Count(),
                        UniqueUsers = g.Where(x => x.UserId > 0).Select(x => x.UserId).Distinct().Count(),
                        FailedAttempts = g.Count(x => !x.IsSuccess),
                        SuspiciousIPs = g.GroupBy(x => x.IpAddress)
                                        .Count(x => x.Count() > MAX_LOGIN_ATTEMPTS_PER_DAY)
                    })
                    .FirstOrDefaultAsync();

                return stats ?? new
                {
                    TotalLoginAttempts = 0,
                    UniqueIPs = 0,
                    UniqueUsers = 0,
                    FailedAttempts = 0,
                    SuspiciousIPs = 0
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting suspicious activity stats");
                return new
                {
                    TotalLoginAttempts = 0,
                    UniqueIPs = 0,
                    UniqueUsers = 0,
                    FailedAttempts = 0,
                    SuspiciousIPs = 0
                };
            }
        }

    }
}