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
    public class NoShowCheckingBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<NoShowCheckingBackgroundService> _logger;
        private readonly IConfiguration _configuration;

        private TimeSpan CheckInterval => TimeSpan.Parse(_configuration["NoShowCheck:CheckInterval"] ?? "01:00:00");
        private int GracePeriodHours => int.Parse(_configuration["NoShowCheck:GracePeriodHours"] ?? "6");

        public NoShowCheckingBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<NoShowCheckingBackgroundService> logger,
            IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("No-Show Checking Background Service started. Check interval: {Interval}, Grace period: {GracePeriod} hours",
                CheckInterval, GracePeriodHours);

            // Chạy ngay lần đầu
            await CheckNoShowBookings();

            // Sau đó chạy theo chu kỳ
            using var timer = new PeriodicTimer(CheckInterval);

            while (!stoppingToken.IsCancellationRequested &&
                   await timer.WaitForNextTickAsync(stoppingToken))
            {
                await CheckNoShowBookings();
            }
        }

        private async Task CheckNoShowBookings()
        {
            try
            {
                _logger.LogInformation("🔍 Starting no-show check at {Time}", DateTime.UtcNow);

                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var emailQueueService = scope.ServiceProvider.GetRequiredService<IEmailQueueService>();
                var auditLogService = scope.ServiceProvider.GetRequiredService<AuditLogService>();

                // Tính thời điểm cut-off: CheckIn + GracePeriod
                var cutoffTime = DateTime.UtcNow.AddHours(-GracePeriodHours);

                // Tìm các booking đủ điều kiện cho no-show:
                // 1. Status = "confirmed" (đã thanh toán)
                // 2. CheckIn đã qua + grace period
                // 3. Chưa check-in (CheckedInAt == null)
                var noShowBookings = await context.Bookings
                    .Include(b => b.Customer)
                    .Include(b => b.Property)
                    .Include(b => b.RoomType)
                    .Where(b => b.Status == "confirmed" &&
                               b.PaymentStatus == "paid" &&
                               b.CheckIn <= cutoffTime &&
                               b.CheckedInAt == null)
                    .ToListAsync();

                _logger.LogInformation("📊 Found {Count} bookings eligible for no-show status", noShowBookings.Count);

                int updatedCount = 0;

                foreach (var booking in noShowBookings)
                {
                    try
                    {
                        var oldStatus = booking.Status;
                        booking.Status = "noShow";
                        booking.UpdatedAt = DateTime.UtcNow;

                        // Ghi audit log
                        var oldValues = JsonSerializer.Serialize(new { Status = oldStatus });
                        var newValues = JsonSerializer.Serialize(new { Status = "noShow" });

                        await auditLogService.LogActionAsync(
                            actionType: "SET_NO_SHOW",
                            tableName: "Booking",
                            recordId: booking.Id,
                            oldValues: oldValues,
                            newValues: newValues
                        );

                        // Queue email notification
                        var noShowData = new
                        {
                            BookingCode = booking.BookingCode,
                            GuestName = booking.GuestName,
                            GuestPhone = booking.GuestPhone,
                            PropertyName = booking.Property?.Name ?? "N/A",
                            RoomTypeName = booking.RoomType?.Name ?? "N/A",
                            CheckIn = booking.CheckIn.ToString("dd/MM/yyyy HH:mm"),
                            CheckOut = booking.CheckOut.ToString("dd/MM/yyyy HH:mm"),
                            Nights = booking.Nights,
                            Adults = booking.Adults,
                            Children = booking.Children,
                            RoomsCount = booking.RoomsCount,
                            TotalAmount = booking.TotalAmount,
                            GracePeriodHours = GracePeriodHours,
                            CurrentTime = DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm")
                        };

                        await emailQueueService.QueueNoShowNotificationAsync(
                            booking.CustomerId,
                            booking.GuestEmail,
                            noShowData
                        );

                        updatedCount++;

                        _logger.LogInformation(
                            "✅ Booking {BookingCode} (ID: {BookingId}) marked as no-show. " +
                            "CheckIn was: {CheckIn}, Grace period: {GracePeriod}h",
                            booking.BookingCode, booking.Id, booking.CheckIn, GracePeriodHours);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex,
                            "❌ Error processing booking {BookingCode} (ID: {BookingId}) for no-show",
                            booking.BookingCode, booking.Id);
                    }
                }

                if (updatedCount > 0)
                {
                    await context.SaveChangesAsync();
                    _logger.LogInformation(
                        "✅ Successfully marked {Count} bookings as no-show and queued notifications",
                        updatedCount);
                }
                else
                {
                    _logger.LogInformation("ℹ️ No bookings needed to be marked as no-show");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error occurred while checking for no-show bookings");
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("No-Show Checking Background Service is stopping.");
            await base.StopAsync(stoppingToken);
        }
    }
}