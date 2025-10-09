using Microsoft.EntityFrameworkCore;
using QBooking.Data;
using QBooking.Models;
using QBooking.Dtos.Request;
using QBooking.Dtos.Response;

using System.Text.Json;

namespace QBooking.Services
{
    public interface ISePayWebhookService
    {
        Task<PaymentProcessedResponse> ProcessWebhookAsync(SePayWebhookRequest request);
        Task<BookingStatusChangedNotification> GetBookingPaymentStatusAsync(int bookingId);
        Task<List<Payment>> GetPaymentHistoryByBookingCodeAsync(string bookingCode);
        Task<BookingStatusChangedNotification> GetBookingPaymentStatusByCodeAsync(string bookingCode);
    }

    public class SePayWebhookService : ISePayWebhookService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SePayWebhookService> _logger;
        private readonly IEmailService _emailService; // Thêm dòng này
        private readonly IEmailQueueService _emailQueueService;
        private readonly AuditLogService _auditLogService;
        private readonly INotificationService _notificationService;
        public SePayWebhookService(
            ApplicationDbContext context,
            ILogger<SePayWebhookService> logger,
            IEmailService emailService,
             IEmailQueueService emailQueueService,
             INotificationService notificationService) // Thêm parameter này
        {
            _context = context;
            _logger = logger;
            _emailService = emailService;
            _emailQueueService = emailQueueService;
            _notificationService = notificationService;
        }

        public async Task<PaymentProcessedResponse> ProcessWebhookAsync(SePayWebhookRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Only process incoming transactions (tiền vào)
                if (request.TransferType != "in")
                {
                    return new PaymentProcessedResponse
                    {
                        Success = false,
                        Message = "Only incoming transactions are processed"
                    };
                }

                // Extract BookingCode from content (assuming it's in the content)
                var bookingCode = ExtractBookingCodeFromContent(request.Content);

                if (string.IsNullOrEmpty(bookingCode))
                {
                    _logger.LogWarning($"Could not extract booking code from content: {request.Content}");
                    return new PaymentProcessedResponse
                    {
                        Success = false,
                        Message = "Booking code not found in transaction content"
                    };
                }

                // Find booking by BookingCode and TotalAmount
                var booking = await _context.Bookings
                    .FirstOrDefaultAsync(b => b.BookingCode == bookingCode &&
                                            b.TotalAmount == request.TransferAmount);

                if (booking == null)
                {
                    _logger.LogWarning($"No matching booking found for code: {bookingCode}, amount: {request.TransferAmount}");
                    return new PaymentProcessedResponse
                    {
                        Success = false,
                        Message = "No matching booking found"
                    };
                }

                // Check if payment already processed
                var existingPayment = await _context.Payments
                    .FirstOrDefaultAsync(p => p.BookingId == booking.Id &&
                                            p.TransactionId == request.ReferenceCode &&
                                            p.Status == "completed");

                if (existingPayment != null)
                {
                    return new PaymentProcessedResponse
                    {
                        Success = true,
                        Message = "Payment already processed",
                        Data = new PaymentProcessedData
                        {
                            BookingId = booking.Id,
                            BookingCode = booking.BookingCode,
                            PaymentId = existingPayment.Id,
                            PaymentStatus = existingPayment.Status,
                            BookingStatus = booking.Status,
                            Amount = existingPayment.Amount,
                            TransactionId = existingPayment.TransactionId,
                            ProcessedAt = existingPayment.ProcessedAt ?? DateTime.UtcNow
                        }
                    };
                }

                // Create or update payment record
                var payment = new Payment
                {
                    BookingId = booking.Id,
                    PaymentMethod = "bank_transfer",
                    Gateway = request.Gateway,
                    TransactionId = request.ReferenceCode,
                    Amount = request.TransferAmount,
                    Currency = "VND",
                    Status = "completed",
                    GatewayResponse = JsonSerializer.Serialize(request),
                    ProcessedAt = DateTime.Parse(request.TransactionDate),
                    CompletedAt = DateTime.UtcNow
                };

                _context.Payments.Add(payment);

                // Update booking status
                var oldBookingStatus = booking.Status;
                var oldPaymentStatus = booking.PaymentStatus;

                booking.PaymentStatus = "paid";
                booking.Status = "confirmed";
                booking.ConfirmedAt = DateTime.UtcNow;
                booking.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation($"Payment processed successfully for booking {bookingCode}");

                // Return success response
                var response = new PaymentProcessedResponse
                {
                    Success = true,
                    Message = "Payment processed successfully",
                    Data = new PaymentProcessedData
                    {
                        BookingId = booking.Id,
                        BookingCode = booking.BookingCode,
                        PaymentId = payment.Id,
                        PaymentStatus = booking.PaymentStatus,
                        BookingStatus = booking.Status,
                        Amount = payment.Amount,
                        TransactionId = payment.TransactionId,
                        ProcessedAt = DateTime.UtcNow
                    }
                };

                // TODO: Send notification to frontend (SignalR, email, etc.)
                await NotifyBookingConfirmedAsync(booking);

                return response;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error processing SePay webhook");
                throw;
            }
        }

        public async Task<BookingStatusChangedNotification> GetBookingPaymentStatusAsync(int bookingId)
        {
            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
                return null;

            return new BookingStatusChangedNotification
            {
                BookingId = booking.Id,
                BookingCode = booking.BookingCode,
                NewStatus = booking.Status,
                PaymentStatus = booking.PaymentStatus,
                TotalAmount = booking.TotalAmount,
                GuestName = booking.GuestName,
                GuestEmail = booking.GuestEmail,
                UpdatedAt = booking.UpdatedAt
            };
        }

        public async Task<List<Payment>> GetPaymentHistoryByBookingCodeAsync(string bookingCode)
        {
            return await _context.Payments
                .Include(p => p.Booking)
                .Where(p => p.Booking.BookingCode == bookingCode)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        private string ExtractBookingCodeFromContent(string content)
        {
            // This method should be customized based on your booking code format
            // Example implementations:

            // If booking code is at the beginning: "BK001 chuyen tien mua iphone"
            var words = content.Split(' ');
            if (words.Length > 0 && words[0].StartsWith("BK"))
            {
                return words[0];
            }

            // If booking code is in a specific format: "Ma don hang: BK001"
            if (content.Contains("BK") || content.Contains("bk"))
            {
                var index = content.IndexOf("BK", StringComparison.OrdinalIgnoreCase);
                if (index >= 0)
                {
                    var remaining = content.Substring(index);
                    var bookingCode = remaining.Split(' ')[0];
                    return bookingCode;
                }
            }

            // Add more extraction logic based on your content format
            return null;
        }

        private async Task NotifyFrontendAsync(BookingStatusChangedNotification notification)
        {
            try
            {
                // TODO: Implement notification to frontend
                // This could be:
                // 1. SignalR hub notification
                // 2. WebSocket notification
                // 3. Email notification
                // 4. Push notification
                // 5. Queue message for background processing

                _logger.LogInformation($"Booking status changed notification: {JsonSerializer.Serialize(notification)}");

                // Example: SignalR notification (uncomment if you have SignalR)
                // await _hubContext.Clients.Group($"booking_{notification.BookingId}")
                //     .SendAsync("BookingStatusChanged", notification);

                // Example: Email notification (uncomment if you have email service)
                // await _emailService.SendBookingConfirmationEmailAsync(notification);

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending frontend notification");
            }
        }
        private async Task NotifyBookingConfirmedAsync(Booking booking)
        {
            try
            {
                var bookingWithDetails = await _context.Bookings
                    .Include(b => b.Property)
                        .ThenInclude(p => p.Host) // ⭐ Include Host
                    .Include(b => b.RoomType)
                    .Include(b => b.Customer)
                    .FirstOrDefaultAsync(b => b.Id == booking.Id);

                if (bookingWithDetails == null)
                {
                    _logger.LogWarning($"Booking {booking.Id} not found when sending notifications");
                    return;
                }

                // 📧 1️⃣ Gửi email xác nhận cho KHÁCH
                var guestEmailData = new
                {
                    bookingWithDetails.GuestName,
                    bookingWithDetails.GuestPhone,
                    bookingWithDetails.BookingCode,
                    bookingWithDetails.CheckIn,
                    bookingWithDetails.CheckOut,
                    bookingWithDetails.Nights,
                    bookingWithDetails.Adults,
                    bookingWithDetails.Children,
                    bookingWithDetails.RoomsCount,
                    bookingWithDetails.RoomPrice,
                    bookingWithDetails.DiscountPercent,
                    bookingWithDetails.DiscountAmount,
                    bookingWithDetails.TaxAmount,
                    bookingWithDetails.ServiceFee,
                    bookingWithDetails.TotalAmount,
                    PaymentUrl = "",
                    bookingWithDetails.SpecialRequests,
                    PropertyName = bookingWithDetails.Property?.Name,
                    RoomTypeName = bookingWithDetails.RoomType?.Name
                };

                await _emailQueueService.QueueBookingConfirmationAsync(
                    bookingWithDetails.CustomerId,
                    bookingWithDetails.GuestEmail,
                    guestEmailData);

                _logger.LogInformation($"✅ Guest confirmation queued for booking {booking.BookingCode}");

                // 📧 2️⃣ Gửi email thông báo cho HOST
                if (bookingWithDetails.Property?.Host != null)
                {
                    var host = bookingWithDetails.Property.Host;

                    var hostEmailData = new
                    {
                        HostName = host.FullName,
                        bookingWithDetails.GuestName,
                        bookingWithDetails.GuestPhone,
                        bookingWithDetails.GuestEmail,
                        bookingWithDetails.BookingCode,
                        bookingWithDetails.CheckIn,
                        bookingWithDetails.CheckOut,
                        bookingWithDetails.Nights,
                        bookingWithDetails.Adults,
                        bookingWithDetails.Children,
                        bookingWithDetails.RoomsCount,
                        bookingWithDetails.TotalAmount,
                        bookingWithDetails.SpecialRequests,
                        PropertyName = bookingWithDetails.Property?.Name,
                        RoomTypeName = bookingWithDetails.RoomType?.Name,
                        PropertyAddress = bookingWithDetails.Property?.AddressDetail,
                        BookedAt = bookingWithDetails.BookingDate,
                    };

                    await _emailQueueService.QueueHostBookingNotificationAsync(
                        host.Id,
                        host.Email,
                        hostEmailData);

                    _logger.LogInformation($"✅ Host notification queued for booking {booking.BookingCode} to host {host.Email}");
                }
                else
                {
                    _logger.LogWarning($"⚠️ Host not found for property in booking {booking.BookingCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error sending notifications for booking {booking.BookingCode}");
                // Không throw exception để không làm fail transaction chính
            }
        }
        public async Task<BookingStatusChangedNotification> GetBookingPaymentStatusByCodeAsync(string bookingCode)
        {
            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b => b.BookingCode == bookingCode);

            if (booking == null)
                return null;

            return new BookingStatusChangedNotification
            {
                BookingId = booking.Id,
                BookingCode = booking.BookingCode,
                NewStatus = booking.Status,
                PaymentStatus = booking.PaymentStatus,
                TotalAmount = booking.TotalAmount,
                GuestName = booking.GuestName,
                GuestEmail = booking.GuestEmail,
                UpdatedAt = booking.UpdatedAt
            };
        }
        // Updated CheckOutAsync

    }
}
