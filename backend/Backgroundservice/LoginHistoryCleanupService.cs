using QBooking.Services;

namespace QBooking.BackgroundServices
{
    public class LoginHistoryCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<LoginHistoryCleanupService> _logger;
        private readonly TimeSpan _period = TimeSpan.FromHours(24); // Chạy mỗi 24 giờ

        public LoginHistoryCleanupService(IServiceProvider serviceProvider,
                                        ILogger<LoginHistoryCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Login History Cleanup Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await DoCleanupAsync();
                    await CheckAndBanSuspiciousUsersAsync();
                    await Task.Delay(_period, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Login History Cleanup Service is stopping");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred in Login History Cleanup Service");
                    // Tiếp tục chạy sau khi gặp lỗi
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }
        }

        private async Task DoCleanupAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var historyLoginService = scope.ServiceProvider.GetRequiredService<HistoryLoginService>();

            try
            {
                _logger.LogInformation("Starting login history cleanup");

                // Giữ lại lịch sử trong 90 ngày và tự động mở khóa user
                var (deletedCount, unbannedUsers) = await historyLoginService.CleanupOldHistoryWithUnbanAsync(90);

                if (deletedCount > 0)
                {
                    _logger.LogInformation("Cleaned up {Count} old login history records", deletedCount);
                }
                else
                {
                    _logger.LogInformation("No old login history records to clean up");
                }

                if (unbannedUsers.Count > 0)
                {
                    _logger.LogInformation("Automatically unbanned {Count} users after 90 days: {Users}",
                                         unbannedUsers.Count, string.Join(", ", unbannedUsers));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login history cleanup");
            }
        }

        private async Task CheckAndBanSuspiciousUsersAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var historyLoginService = scope.ServiceProvider.GetRequiredService<HistoryLoginService>();

            try
            {
                _logger.LogInformation("Starting suspicious user detection");

                var bannedUsers = await historyLoginService.BanSuspiciousUsersAsync();

                if (bannedUsers.Count > 0)
                {
                    _logger.LogWarning("Automatically banned {Count} suspicious users: {Users}",
                                     bannedUsers.Count, string.Join(", ", bannedUsers.Select(u => $"{u.Email} (ID: {u.Id})")));
                }
                else
                {
                    _logger.LogInformation("No suspicious users detected");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during suspicious user detection");
            }
        }

        public override Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Login History Cleanup Service is stopping");
            return base.StopAsync(stoppingToken);
        }
    }
}