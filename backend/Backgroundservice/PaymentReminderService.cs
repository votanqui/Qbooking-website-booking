using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using QBooking.Data;
using QBooking.Services;

namespace QBooking.Services
{
    public class PaymentReminderService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<PaymentReminderService> _logger;
        private readonly IConfiguration _configuration;
        private readonly TimeSpan _period = TimeSpan.FromHours(1); // Chạy mỗi giờ

        public PaymentReminderService(
            IServiceProvider serviceProvider,
            ILogger<PaymentReminderService> logger,
            IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _configuration = configuration;
        }
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessPaymentRemindersAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi xử lý nhắc nhở thanh toán");
                }

                await Task.Delay(_period, stoppingToken);
            }
        }

        private async Task ProcessPaymentRemindersAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var emailQueueService = scope.ServiceProvider.GetRequiredService<IEmailQueueService>();

            try
            {
                // Lấy BaseUrl từ configuration
                var frontendBaseUrl = _configuration["Frontend:BaseUrl"] ?? "https://your-frontend-domain.com";

                _logger.LogInformation($"🔍 Using frontend base URL: {frontendBaseUrl}");

                // Lấy những booking chưa thanh toán và cần nhắc nhở
                var cutoffTime = DateTime.UtcNow.AddHours(-1); // Chỉ nhắc nhở những booking tạo hơn 1 giờ trước
                var reminderCutoff = DateTime.UtcNow.AddHours(-24); // Không nhắc nhở booking quá 6 giờ

                var unpaidBookings = await dbContext.Bookings
                    .Include(b => b.Property)
                    .Include(b => b.RoomType)
                    .Include(b => b.Customer)
                    .Where(b => b.Status == "pending" &&
                               b.PaymentStatus == "unpaid" &&
                               b.BookingDate <= cutoffTime &&
                               b.BookingDate >= reminderCutoff)
                    .ToListAsync();

                _logger.LogInformation($"📋 Tìm thấy {unpaidBookings.Count} booking chưa thanh toán cần nhắc nhở");

                foreach (var booking in unpaidBookings)
                {
                    try
                    {
                        // Kiểm tra xem đã gửi email nhắc nhở trong 2 giờ qua chưa
                        var recentReminderSent = await dbContext.Notifications
                            .AnyAsync(n => n.RelatedId == booking.Id &&
                                          n.RelatedType == "Booking" &&
                                          n.Type == "payment_reminder" &&
                                          n.CreatedAt >= DateTime.UtcNow.AddHours(-2));

                        if (recentReminderSent)
                        {
                            _logger.LogInformation($"⏭️ Đã gửi email nhắc nhở gần đây cho booking {booking.BookingCode}, bỏ qua");
                            continue;
                        }

                        // Tạo payment URL
                        var paymentUrl = $"{frontendBaseUrl}/payment/{booking.BookingCode}";

                        // Tạo data object cho email
                        var reminderData = new
                        {
                            GuestName = booking.GuestName,
                            GuestPhone = booking.GuestPhone,
                            BookingCode = booking.BookingCode,
                            CheckIn = booking.CheckIn,
                            CheckOut = booking.CheckOut,
                            Nights = booking.Nights,
                            Adults = booking.Adults,
                            Children = booking.Children,
                            RoomsCount = booking.RoomsCount,
                            RoomPrice = booking.RoomPrice,
                            DiscountPercent = booking.DiscountPercent,
                            DiscountAmount = booking.DiscountAmount,
                            TaxAmount = booking.TaxAmount,
                            ServiceFee = booking.ServiceFee,
                            TotalAmount = booking.TotalAmount,
                            PaymentUrl = paymentUrl,
                            SpecialRequests = booking.SpecialRequests ?? "",
                            PropertyName = booking.Property?.Name ?? "Hotel",
                            RoomTypeName = booking.RoomType?.Name ?? "Room"
                        };

                        // Queue email thông qua EmailQueueService
                        await emailQueueService.QueuePaymentReminderAsync(
                            booking.CustomerId ,
                            booking.GuestEmail,
                            reminderData
                        );

                        _logger.LogInformation($"📧 Đã queue email nhắc nhở thanh toán cho booking {booking.BookingCode} - Email: {booking.GuestEmail}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"❌ Lỗi khi xử lý booking {booking.BookingCode}");
                    }
                }

                _logger.LogInformation($"✅ Hoàn thành xử lý {unpaidBookings.Count} booking chưa thanh toán");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Lỗi trong ProcessPaymentRemindersAsync");
            }
        }
    }
}