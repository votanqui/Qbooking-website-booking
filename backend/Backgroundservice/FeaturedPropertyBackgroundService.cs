using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using QBooking.Data;
using QBooking.Models;
using System.Text.Json;

namespace QBooking.Services
{
    public class FeaturedPropertyBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<FeaturedPropertyBackgroundService> _logger;
        private readonly IConfiguration _configuration;

        private TimeSpan CheckInterval => TimeSpan.Parse(_configuration["FeaturedProperty:CheckInterval"] ?? "24:00:00");
        private decimal MinAverageRating => decimal.Parse(_configuration["FeaturedProperty:MinAverageRating"] ?? "4.0");
        private int MinBookingCount => int.Parse(_configuration["FeaturedProperty:MinBookingCount"] ?? "10");
        private int MinViewCount => int.Parse(_configuration["FeaturedProperty:MinViewCount"] ?? "100");
        private int MinReviewCount => int.Parse(_configuration["FeaturedProperty:MinReviewCount"] ?? "5");
        private int MinDaysSinceCreation => int.Parse(_configuration["FeaturedProperty:MinDaysSinceCreation"] ?? "30");

        public FeaturedPropertyBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<FeaturedPropertyBackgroundService> logger,
            IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Featured Property Background Service started. Check interval: {Interval}",
                CheckInterval);

            // Chạy ngay lần đầu
            await UpdateFeaturedProperties();

            // Sau đó chạy theo chu kỳ
            using var timer = new PeriodicTimer(CheckInterval);

            while (!stoppingToken.IsCancellationRequested &&
                   await timer.WaitForNextTickAsync(stoppingToken))
            {
                await UpdateFeaturedProperties();
            }
        }

        private async Task UpdateFeaturedProperties()
        {
            try
            {
                _logger.LogInformation("Starting featured properties update at {Time}", DateTime.UtcNow);

                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var auditLogService = scope.ServiceProvider.GetRequiredService<AuditLogService>();

                // Lấy tất cả properties active
                var properties = await context.Properties
                    .Include(p => p.Reviews)
                    .Where(p => p.IsActive && p.Status == "published")
                    .ToListAsync();

                int updatedCount = 0;
                int featuredCount = 0;

                foreach (var property in properties)
                {
                    var shouldBeFeatured = await ShouldBeFeatured(property);

                    // Chỉ cập nhật và ghi audit log khi có thay đổi
                    if (property.IsFeatured != shouldBeFeatured)
                    {
                        var oldStatus = property.IsFeatured;
                        property.IsFeatured = shouldBeFeatured;
                        property.UpdatedAt = DateTime.UtcNow;
                        updatedCount++;

                        // Ghi audit log cho việc thay đổi trạng thái featured
                        var oldValues = JsonSerializer.Serialize(new { IsFeatured = oldStatus });
                        var newValues = JsonSerializer.Serialize(new { IsFeatured = shouldBeFeatured });

                        await auditLogService.LogActionAsync(
                            actionType: shouldBeFeatured ? "SET_FEATURED" : "REMOVE_FEATURED",
                            tableName: "Property",
                            recordId: property.Id,
                            oldValues: oldValues,
                            newValues: newValues
                        );

                        _logger.LogInformation(
                            "Property {PropertyId} ({PropertyName}) featured status changed: {OldStatus} -> {NewStatus}",
                            property.Id, property.Name, oldStatus, shouldBeFeatured);
                    }

                    if (shouldBeFeatured)
                    {
                        featuredCount++;
                    }
                }

                if (updatedCount > 0)
                {
                    await context.SaveChangesAsync();
                    _logger.LogInformation(
                        "Updated {UpdatedCount} properties. Total featured properties: {FeaturedCount}",
                        updatedCount, featuredCount);
                }
                else
                {
                    _logger.LogInformation(
                        "No properties needed update. Total featured properties: {FeaturedCount}",
                        featuredCount);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating featured properties");
            }
        }

        private async Task<bool> ShouldBeFeatured(Property property)
        {
            try
            {
                // Tiêu chí 1: Kiểm tra đánh giá trung bình và số lượng review
                var reviews = property.Reviews?.Where(r => r.Status == "approved").ToList() ?? new List<Review>();

                if (reviews.Count < MinReviewCount)
                {
                    return false;
                }

                var averageRating = reviews.Average(r => r.OverallRating);
                if ((decimal)averageRating < MinAverageRating)
                {
                    return false;
                }

                // Tiêu chí 2: Kiểm tra số lượng booking
                if (property.BookingCount < MinBookingCount)
                {
                    return false;
                }

                // Tiêu chí 3: Kiểm tra số lượt xem
                if (property.ViewCount < MinViewCount)
                {
                    return false;
                }

                // Tiêu chí bổ sung: Property phải được tạo ít nhất X ngày trước
                if (property.CreatedAt > DateTime.UtcNow.AddDays(-MinDaysSinceCreation))
                {
                    return false;
                }

                _logger.LogDebug(
                    "Property {PropertyId} ({PropertyName}) qualifies as featured: " +
                    "Rating: {Rating:F2} ({ReviewCount} reviews), " +
                    "Bookings: {BookingCount}, Views: {ViewCount}",
                    property.Id, property.Name, averageRating, reviews.Count,
                    property.BookingCount, property.ViewCount);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error evaluating property {PropertyId} for featured status", property.Id);
                return false;
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Featured Property Background Service is stopping.");
            await base.StopAsync(stoppingToken);
        }
    }

    // Extension method để đăng ký service
   
}