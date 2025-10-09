// Services/ExpiredCouponCleanupService.cs
using Microsoft.EntityFrameworkCore;
using QBooking.Data;
using QBooking.Models;
using System.Text.Json;

namespace QBooking.Services
{
    public class ExpiredCouponCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ExpiredCouponCleanupService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1); // Check every hour

        public ExpiredCouponCleanupService(
            IServiceProvider serviceProvider,
            ILogger<ExpiredCouponCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ExpiredCouponCleanupService started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessExpiredCoupons();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing expired coupons");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }
        }

        private async Task ProcessExpiredCoupons()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var auditLogService = scope.ServiceProvider.GetRequiredService<AuditLogService>();

            var now = DateTime.UtcNow;

            // Find active coupons that have expired
            var expiredCoupons = await context.Coupons
                .Where(c => c.IsActive && c.EndDate < now)
                .ToListAsync();

            if (expiredCoupons.Any())
            {
                _logger.LogInformation($"Found {expiredCoupons.Count} expired coupons to deactivate");

                foreach (var coupon in expiredCoupons)
                {
                    // Store old values for audit log
                    var oldValues = new
                    {
                        Id = coupon.Id,
                        Code = coupon.Code,
                        Name = coupon.Name,
                        IsActive = coupon.IsActive,
                        EndDate = coupon.EndDate
                    };

                    // Update coupon
                    coupon.IsActive = false;
                    coupon.UpdatedAt = now;

                    // Store new values for audit log
                    var newValues = new
                    {
                        Id = coupon.Id,
                        Code = coupon.Code,
                        Name = coupon.Name,
                        IsActive = coupon.IsActive,
                        EndDate = coupon.EndDate,
                        UpdatedAt = coupon.UpdatedAt,
                        DeactivatedReason = "Expired automatically"
                    };

                    try
                    {
                        // Save changes to database
                        await context.SaveChangesAsync();

                        // Log the action in audit log
                        await auditLogService.LogActionAsync(
                            actionType: "SYSTEM_UPDATE",
                            tableName: "Coupon",
                            recordId: coupon.Id,
                            oldValues: JsonSerializer.Serialize(oldValues, new JsonSerializerOptions
                            {
                                WriteIndented = true
                            }),
                            newValues: JsonSerializer.Serialize(newValues, new JsonSerializerOptions
                            {
                                WriteIndented = true
                            })
                        );

                        _logger.LogInformation($"Deactivated expired coupon: {coupon.Code} (ID: {coupon.Id})");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Failed to deactivate coupon {coupon.Code} (ID: {coupon.Id})");

                        // Rollback the changes for this coupon if audit log fails
                        coupon.IsActive = true;
                        coupon.UpdatedAt = oldValues.EndDate; // Reset to original value

                        // You might want to implement a retry mechanism here
                    }
                }

                _logger.LogInformation($"Completed processing {expiredCoupons.Count} expired coupons");
            }
            else
            {
                _logger.LogDebug("No expired coupons found");
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ExpiredCouponCleanupService is stopping");
            await base.StopAsync(stoppingToken);
        }
    }
}