using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using QBooking.Data;
using QBooking.Services;

namespace QBooking.Services.BackgroundServices
{
    public class AuditLogCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AuditLogCleanupService> _logger;
        private readonly TimeSpan _interval = TimeSpan.FromDays(1); // Chạy mỗi ngày
        private readonly TimeSpan _retentionPeriod = TimeSpan.FromDays(60); // Giữ lại 2 tháng

        public AuditLogCleanupService(
            IServiceProvider serviceProvider,
            ILogger<AuditLogCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Audit Log Cleanup Service started");

            // Log service start
            using var scope = _serviceProvider.CreateScope();
            var auditLogService = scope.ServiceProvider.GetRequiredService<AuditLogService>();
          
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CleanupOldAuditLogsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred in Audit Log Cleanup Service");

                    // Log error to audit
                    using var errorScope = _serviceProvider.CreateScope();
                    var errorAuditService = errorScope.ServiceProvider.GetRequiredService<AuditLogService>();
                    await errorAuditService.LogActionAsync("SERVICE_ERROR", "AuditLogCleanupService", null, null,
                        $"Error in cleanup service: {ex.Message}");
                }

                await Task.Delay(_interval, stoppingToken);
            }
        }

        private async Task CleanupOldAuditLogsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var auditLogService = scope.ServiceProvider.GetRequiredService<AuditLogService>();

            try
            {
                var cutoffDate = DateTime.UtcNow.Subtract(_retentionPeriod);

                _logger.LogInformation($"Starting cleanup of audit logs older than {cutoffDate:yyyy-MM-dd HH:mm:ss} UTC");

                // Đếm số lượng records cần xóa trước
                var countToDelete = await context.AuditLogs
                    .CountAsync(al => al.ActionTime < cutoffDate);

                if (countToDelete == 0)
                {
                    _logger.LogInformation("No old audit logs to cleanup");

                    // Log cleanup attempt with no records
                    await auditLogService.LogActionAsync("CLEANUP_ATTEMPT", "AuditLog", null, null,
                        $"Cleanup attempted - no records older than {cutoffDate:yyyy-MM-dd HH:mm:ss} found");
                    return;
                }

                _logger.LogInformation($"Found {countToDelete} audit logs to delete");

                // Log cleanup start
                await auditLogService.LogActionAsync("CLEANUP_START", "AuditLog", null, null,
                    $"Starting cleanup of {countToDelete} audit logs older than {cutoffDate:yyyy-MM-dd HH:mm:ss}");

                // Xóa theo batch để tránh timeout và lock table quá lâu
                var batchSize = 1000;
                var totalDeleted = 0;

                while (true)
                {
                    var batch = await context.AuditLogs
                        .Where(al => al.ActionTime < cutoffDate)
                        .Take(batchSize)
                        .ToListAsync();

                    if (!batch.Any())
                        break;

                    // Store some info about the batch being deleted for audit
                    var batchInfo = new
                    {
                        Count = batch.Count,
                        OldestRecord = batch.Min(b => b.ActionTime),
                        NewestRecord = batch.Max(b => b.ActionTime),
                        RecordIds = batch.Take(5).Select(b => b.Id).ToList() // Sample of IDs
                    };

                    context.AuditLogs.RemoveRange(batch);
                    await context.SaveChangesAsync();

                    totalDeleted += batch.Count;
                    _logger.LogInformation($"Deleted batch of {batch.Count} audit logs. Total deleted: {totalDeleted}/{countToDelete}");

                    // Log batch deletion
                    await auditLogService.LogActionAsync("CLEANUP_BATCH", "AuditLog", null, null,
                        $"Deleted batch: {batch.Count} records, Range: {batchInfo.OldestRecord:yyyy-MM-dd} to {batchInfo.NewestRecord:yyyy-MM-dd}");

                    // Nghỉ một chút giữa các batch để giảm tải database
                    await Task.Delay(TimeSpan.FromMilliseconds(100));
                }

                _logger.LogInformation($"Audit log cleanup completed. Total deleted: {totalDeleted} records");

                // Log thống kê sau khi cleanup
                var remainingCount = await context.AuditLogs.CountAsync();
                _logger.LogInformation($"Remaining audit logs in database: {remainingCount}");

                // Log cleanup completion
                await auditLogService.LogActionAsync("CLEANUP_COMPLETED", "AuditLog", null, null,
                    $"Cleanup completed successfully. Deleted: {totalDeleted} records, Remaining: {remainingCount} records");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CleanupOldAuditLogsAsync");

                // Log cleanup error
                await auditLogService.LogActionAsync("CLEANUP_ERROR", "AuditLog", null, null,
                    $"Error during cleanup: {ex.Message}");
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Audit Log Cleanup Service is stopping");

            // Log service stop
            using var scope = _serviceProvider.CreateScope();
            var auditLogService = scope.ServiceProvider.GetRequiredService<AuditLogService>();
            await auditLogService.LogActionAsync("SERVICE_STOP", "AuditLogCleanupService", null, null,
                "Audit Log Cleanup Service stopped");

            await base.StopAsync(stoppingToken);
        }
    }
}