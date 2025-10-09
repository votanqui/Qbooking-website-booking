using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using QBooking.Data;
using QBooking.Models;
using QBooking.Services;

public class BookingAutoRejectService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BookingAutoRejectService> _logger;

    public BookingAutoRejectService(
        IServiceScopeFactory scopeFactory,
        ILogger<BookingAutoRejectService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await ProcessExpiredBookings(stoppingToken);
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private async Task ProcessExpiredBookings(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var auditService = scope.ServiceProvider.GetRequiredService<AuditLogService>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>(); // ✅ Thêm EmailService

        try
        {
            var now = DateTime.UtcNow;

            // Tìm booking chưa thanh toán và pending >24h - Include thêm Property và RoomType
            var expired = await context.Bookings
                .Include(b => b.Property)    // ✅ Include để lấy tên khách sạn
                .Include(b => b.RoomType)    // ✅ Include để lấy tên loại phòng
                .Where(b => b.Status == "pending"
                            && b.PaymentStatus == "unpaid"
                            && b.BookingDate < now.AddHours(-24))
                .ToListAsync(ct);

            foreach (var booking in expired)
            {
                var oldValues = $"Status:{booking.Status}, CancelledAt:{booking.CancelledAt}";

                booking.Status = "cancelled";
                booking.CancelledAt = now;
                booking.UpdatedAt = now;

                var newValues = $"Status:{booking.Status}, CancelledAt:{booking.CancelledAt:O}";

                // ✅ Gửi email thông báo hủy booking
                try
                {
                    await emailService.SendBookingCancelledAsync(
                        booking.GuestEmail,
                        booking.GuestName,
                        booking.GuestPhone,
                        booking.BookingCode,
                        booking.CheckIn,
                        booking.CheckOut,
                        booking.Nights,
                        booking.Adults,
                        booking.Children,
                        booking.RoomsCount,
                        booking.TotalAmount,
                        "Không thanh toán trong 24 giờ",
                        booking.Property?.Name,
                        booking.RoomType?.Name
                    );

                    _logger.LogInformation($"Đã gửi email thông báo hủy booking {booking.BookingCode} tới {booking.GuestEmail}");
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, $"Lỗi khi gửi email hủy booking {booking.BookingCode}");
                    // Không throw exception để không dừng việc cập nhật database
                }

                // Ghi log audit
                await auditService.LogActionAsync(
                    actionType: "SYSTEM_REJECT",
                    tableName: "Bookings",
                    recordId: booking.Id,
                    oldValues: oldValues,
                    newValues: newValues
                );
            }

            await context.SaveChangesAsync(ct);

            if (expired.Any())
            {
                _logger.LogInformation($"Đã tự động hủy {expired.Count} booking quá hạn thanh toán");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running BookingAutoRejectService");
        }
    }
}
