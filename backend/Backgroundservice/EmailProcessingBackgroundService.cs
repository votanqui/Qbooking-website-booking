using QBooking.Data;
using QBooking.Models;
using QBooking.Services;
using System.Text.Json;

namespace QBooking.Backgroundservice
{
    public class EmailProcessingBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<EmailProcessingBackgroundService> _logger;
        private readonly TimeSpan _processInterval = TimeSpan.FromSeconds(30);

        public EmailProcessingBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<EmailProcessingBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 Email Processing Background Service STARTED");

            // Wait a bit for the app to fully start
            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessPendingEmailsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error in email processing background service");
                }

                await Task.Delay(_processInterval, stoppingToken);
            }

            _logger.LogInformation("🛑 Email Processing Background Service STOPPED");
        }

        private async Task ProcessPendingEmailsAsync()
        {
            using var scope = _serviceProvider.CreateScope();

            try
            {
                var emailQueueService = scope.ServiceProvider.GetRequiredService<IEmailQueueService>();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                var pendingNotifications = await emailQueueService.GetPendingEmailsAsync(10);

                if (pendingNotifications?.Any() == true)
                {
                    _logger.LogInformation($"📧 Processing {pendingNotifications.Count} pending email notifications");

                    foreach (var notification in pendingNotifications)
                    {
                        try
                        {
                            // Validate notification data
                            if (string.IsNullOrEmpty(notification.EmailTo))
                            {
                                _logger.LogWarning($"⚠️ Skipping notification {notification.Id} - no email address");
                                continue;
                            }

                            if (string.IsNullOrEmpty(notification.Type))
                            {
                                _logger.LogWarning($"⚠️ Skipping notification {notification.Id} - no type specified");
                                continue;
                            }

                            _logger.LogInformation($"📨 Processing notification {notification.Id} - Type: {notification.Type} - To: {notification.EmailTo}");

                            // ✅ TRUYỀN scope.ServiceProvider VÀO ĐÂY
                            await ProcessEmailNotificationAsync(notification, emailService, emailQueueService, scope.ServiceProvider);

                            _logger.LogInformation($"✅ Successfully processed notification {notification.Id}");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"❌ Failed to process notification {notification.Id}: {ex.Message}");
                            await emailQueueService.MarkEmailForRetryAsync(notification.Id, ex.Message);
                        }
                    }

                    _logger.LogInformation($"✅ Completed processing {pendingNotifications.Count} email notifications");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in ProcessPendingEmailsAsync");
            }
        }

        private async Task ProcessEmailNotificationAsync(
     Notification notification,
     IEmailService emailService,
     IEmailQueueService emailQueueService,
     IServiceProvider serviceProvider)  // ⭐ THÊM THAM SỐ NÀY
        {
            // Parse the JSON data back to a proper object
            JsonElement? data = null;
            if (!string.IsNullOrEmpty(notification.Content))
            {
                try
                {
                    data = JsonSerializer.Deserialize<JsonElement>(notification.Content);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"⚠️ Could not parse notification data for {notification.Id}: {ex.Message}");
                }
            }

            switch (notification.Type?.ToLowerInvariant())
            {
                case "booking_confirmation":
                    await ProcessBookingConfirmationEmail(notification, data, emailService);
                    break;
                case "thank_you":
                    await ProcessThankYouEmail(notification, data, emailService);
                    break;
                case "booking_cancelled":
                    await ProcessBookingCancelledEmail(notification, data, emailService);
                    break;
                case "payment_reminder":
                    await ProcessPaymentReminderEmail(notification, data, emailService);
                    break;
                case "account_banned":
                    await ProcessAccountBannedEmail(notification, data, emailService);
                    break;
                case "booking_no_show":
                    await ProcessNoShowEmail(notification, data, emailService);
                    break;
                case "refund_ticket_created":
                    await ProcessRefundTicketCreatedEmail(notification, data, emailService);
                    break;
                case "refund_ticket_approved":
                    await ProcessRefundTicketApprovedEmail(notification, data, emailService);
                    break;
                case "refund_ticket_rejected":
                    await ProcessRefundTicketRejectedEmail(notification, data, emailService);
                    break;
                case "admin_announcement":
                case "admin_warning":
                case "admin_info":
                case "admin_promotion":
                case "admin_maintenance":
                    // ✅ SỬ DỤNG serviceProvider Ở ĐÂY
                    await ProcessAdminNotificationEmail(notification, data, emailService, serviceProvider);
                    break;
                default:
                    _logger.LogWarning($"⚠️ Unknown notification type: {notification.Type}");
                    break;
            }

            await emailQueueService.MarkEmailAsSentAsync(notification.Id);
            _logger.LogInformation($"📧 Successfully sent {notification.Type} email to {notification.EmailTo}");
        }


        private async Task ProcessAccountBannedEmail(Notification notification, JsonElement? data, IEmailService emailService)
        {
            try
            {
                // Extract data from JSON or use defaults
                string fullName = "Valued Customer";
                string email = notification.EmailTo!;
                string reason = "Phát hiện hoạt động bất thường từ tài khoản của bạn";
                string contactEmail = "support@qbooking.com";

                if (data.HasValue)
                {
                    try
                    {
                        if (data.Value.TryGetProperty("FullName", out var nameProperty) && nameProperty.ValueKind == JsonValueKind.String)
                            fullName = nameProperty.GetString() ?? fullName;

                        if (data.Value.TryGetProperty("Email", out var emailProperty) && emailProperty.ValueKind == JsonValueKind.String)
                            email = emailProperty.GetString() ?? email;

                        if (data.Value.TryGetProperty("Reason", out var reasonProperty) && reasonProperty.ValueKind == JsonValueKind.String)
                            reason = reasonProperty.GetString() ?? reason;

                        if (data.Value.TryGetProperty("ContactEmail", out var contactProperty) && contactProperty.ValueKind == JsonValueKind.String)
                            contactEmail = contactProperty.GetString() ?? contactEmail;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"⚠️ Error parsing account banned email data for notification {notification.Id}: {ex.Message}");
                    }
                }

                await emailService.SendAccountBannedAsync(
                    toEmail: email,
                    fullName: fullName,
                    reason: reason,
                    contactEmail: contactEmail
                );

                _logger.LogInformation($"✅ Account banned email sent to {email} - Reason: {reason}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Failed to send account banned email: {ex.Message}");
                throw;
            }
        }
        // Rest of the methods remain the same but with better null checking...
        private async Task ProcessBookingConfirmationEmail(Notification notification, JsonElement? data, IEmailService emailService)
        {
            try
            {
                // Extract data from JSON or use defaults
                string guestName = "Valued Customer";
                string guestPhone = "";
                string bookingCode = "UNKNOWN";
                DateTime checkIn = DateTime.Now.AddDays(1);
                DateTime checkOut = DateTime.Now.AddDays(2);
                int nights = 1;
                int adults = 1;
                int children = 0;
                int roomsCount = 1;
                decimal roomPrice = 0;
                decimal totalAmount = 0;
                string propertyName = "Hotel";
                string roomTypeName = "Room";
                string specialRequests = "";

                if (data.HasValue)
                {
                    try
                    {
                        if (data.Value.TryGetProperty("GuestName", out var nameProperty) && nameProperty.ValueKind == JsonValueKind.String)
                            guestName = nameProperty.GetString() ?? guestName;

                        if (data.Value.TryGetProperty("GuestPhone", out var phoneProperty) && phoneProperty.ValueKind == JsonValueKind.String)
                            guestPhone = phoneProperty.GetString() ?? guestPhone;

                        if (data.Value.TryGetProperty("BookingCode", out var codeProperty) && codeProperty.ValueKind == JsonValueKind.String)
                            bookingCode = codeProperty.GetString() ?? bookingCode;

                        if (data.Value.TryGetProperty("CheckIn", out var checkInProperty) && checkInProperty.ValueKind == JsonValueKind.String)
                            DateTime.TryParse(checkInProperty.GetString(), out checkIn);

                        if (data.Value.TryGetProperty("CheckOut", out var checkOutProperty) && checkOutProperty.ValueKind == JsonValueKind.String)
                            DateTime.TryParse(checkOutProperty.GetString(), out checkOut);

                        if (data.Value.TryGetProperty("Nights", out var nightsProperty) && nightsProperty.ValueKind == JsonValueKind.Number)
                            nights = nightsProperty.GetInt32();

                        if (data.Value.TryGetProperty("Adults", out var adultsProperty) && adultsProperty.ValueKind == JsonValueKind.Number)
                            adults = adultsProperty.GetInt32();

                        if (data.Value.TryGetProperty("Children", out var childrenProperty) && childrenProperty.ValueKind == JsonValueKind.Number)
                            children = childrenProperty.GetInt32();

                        if (data.Value.TryGetProperty("RoomsCount", out var roomsProperty) && roomsProperty.ValueKind == JsonValueKind.Number)
                            roomsCount = roomsProperty.GetInt32();

                        if (data.Value.TryGetProperty("RoomPrice", out var priceProperty) && priceProperty.ValueKind == JsonValueKind.Number)
                            roomPrice = priceProperty.GetDecimal();

                        if (data.Value.TryGetProperty("TotalAmount", out var totalProperty) && totalProperty.ValueKind == JsonValueKind.Number)
                            totalAmount = totalProperty.GetDecimal();

                        if (data.Value.TryGetProperty("PropertyName", out var propertyProperty) && propertyProperty.ValueKind == JsonValueKind.String)
                            propertyName = propertyProperty.GetString() ?? propertyName;

                        if (data.Value.TryGetProperty("RoomTypeName", out var roomTypeProperty) && roomTypeProperty.ValueKind == JsonValueKind.String)
                            roomTypeName = roomTypeProperty.GetString() ?? roomTypeName;

                        if (data.Value.TryGetProperty("SpecialRequests", out var requestsProperty) && requestsProperty.ValueKind == JsonValueKind.String)
                            specialRequests = requestsProperty.GetString() ?? specialRequests;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"⚠️ Error parsing booking data for notification {notification.Id}: {ex.Message}");
                    }
                }

                await emailService.SendBookingConfirmationAsync(
                    toEmail: notification.EmailTo!,
                    guestName: guestName,
                    guestPhone: guestPhone,
                    bookingCode: bookingCode,
                    checkIn: checkIn,
                    checkOut: checkOut,
                    nights: nights,
                    adults: adults,
                    children: children,
                    roomsCount: roomsCount,
                    roomPrice: roomPrice,
                    discountPercent: 0,
                    discountAmount: 0,
                    taxAmount: 0,
                    serviceFee: 0,
                    totalAmount: totalAmount,
                    paymentUrl: "",
                    specialRequests: specialRequests,
                    propertyName: propertyName,
                    roomTypeName: roomTypeName
                );

                _logger.LogInformation($"✅ Booking confirmation email sent to {notification.EmailTo} for booking {bookingCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Failed to send booking confirmation email: {ex.Message}");
                throw;
            }
        }

        private async Task ProcessThankYouEmail(Notification notification, JsonElement? data, IEmailService emailService)
        {
            try
            {
                // Extract data from JSON or use defaults
                string guestName = "Valued Customer";
                string guestPhone = "";
                string bookingCode = "UNKNOWN";
                DateTime checkIn = DateTime.Now.AddDays(-2);
                DateTime checkOut = DateTime.Now.AddDays(-1);
                int nights = 1;
                int adults = 1;
                int children = 0;
                int roomsCount = 1;
                decimal totalAmount = 0;
                string reviewUrl = "https://review-url.com";
                string propertyName = "Hotel";
                string roomTypeName = "Room";

                if (data.HasValue)
                {
                    try
                    {
                        if (data.Value.TryGetProperty("GuestName", out var nameProperty) && nameProperty.ValueKind == JsonValueKind.String)
                            guestName = nameProperty.GetString() ?? guestName;

                        if (data.Value.TryGetProperty("GuestPhone", out var phoneProperty) && phoneProperty.ValueKind == JsonValueKind.String)
                            guestPhone = phoneProperty.GetString() ?? guestPhone;

                        if (data.Value.TryGetProperty("BookingCode", out var codeProperty) && codeProperty.ValueKind == JsonValueKind.String)
                            bookingCode = codeProperty.GetString() ?? bookingCode;

                        if (data.Value.TryGetProperty("CheckIn", out var checkInProperty))
                        {
                            if (checkInProperty.ValueKind == JsonValueKind.String)
                                DateTime.TryParse(checkInProperty.GetString(), out checkIn);
                            else if (checkInProperty.ValueKind == JsonValueKind.Number)
                                checkIn = DateTimeOffset.FromUnixTimeSeconds(checkInProperty.GetInt64()).DateTime;
                        }

                        if (data.Value.TryGetProperty("CheckOut", out var checkOutProperty))
                        {
                            if (checkOutProperty.ValueKind == JsonValueKind.String)
                                DateTime.TryParse(checkOutProperty.GetString(), out checkOut);
                            else if (checkOutProperty.ValueKind == JsonValueKind.Number)
                                checkOut = DateTimeOffset.FromUnixTimeSeconds(checkOutProperty.GetInt64()).DateTime;
                        }

                        if (data.Value.TryGetProperty("Nights", out var nightsProperty) && nightsProperty.ValueKind == JsonValueKind.Number)
                            nights = nightsProperty.GetInt32();

                        if (data.Value.TryGetProperty("Adults", out var adultsProperty) && adultsProperty.ValueKind == JsonValueKind.Number)
                            adults = adultsProperty.GetInt32();

                        if (data.Value.TryGetProperty("Children", out var childrenProperty) && childrenProperty.ValueKind == JsonValueKind.Number)
                            children = childrenProperty.GetInt32();

                        if (data.Value.TryGetProperty("RoomsCount", out var roomsProperty) && roomsProperty.ValueKind == JsonValueKind.Number)
                            roomsCount = roomsProperty.GetInt32();

                        if (data.Value.TryGetProperty("TotalAmount", out var totalProperty) && totalProperty.ValueKind == JsonValueKind.Number)
                            totalAmount = totalProperty.GetDecimal();

                        if (data.Value.TryGetProperty("ReviewUrl", out var urlProperty) && urlProperty.ValueKind == JsonValueKind.String)
                            reviewUrl = urlProperty.GetString() ?? reviewUrl;

                        if (data.Value.TryGetProperty("PropertyName", out var propertyProperty) && propertyProperty.ValueKind == JsonValueKind.String)
                            propertyName = propertyProperty.GetString() ?? propertyName;

                        if (data.Value.TryGetProperty("RoomTypeName", out var roomTypeProperty) && roomTypeProperty.ValueKind == JsonValueKind.String)
                            roomTypeName = roomTypeProperty.GetString() ?? roomTypeName;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"Error parsing thank you email data for notification {notification.Id}: {ex.Message}");
                    }
                }

                await emailService.SendThankYouEmailAsync(
                    toEmail: notification.EmailTo!,
                    guestName: guestName,
                    guestPhone: guestPhone,
                    bookingCode: bookingCode,
                    checkIn: checkIn,
                    checkOut: checkOut,
                    nights: nights,
                    adults: adults,
                    children: children,
                    roomsCount: roomsCount,
                    totalAmount: totalAmount,
                    reviewUrl: reviewUrl,
                    propertyName: propertyName,
                    roomTypeName: roomTypeName
                );

                _logger.LogInformation($"Thank you email sent to {notification.EmailTo} for booking {bookingCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send thank you email: {ex.Message}");
                throw;
            }
        }

        // Cập nhật ProcessBookingCancelledEmail method trong EmailProcessingBackgroundService
        private async Task ProcessBookingCancelledEmail(Notification notification, JsonElement? data, IEmailService emailService)
        {
            try
            {
                // Extract data from JSON or use defaults
                string guestName = "Valued Customer";
                string guestPhone = "";
                string bookingCode = "UNKNOWN";
                DateTime checkIn = DateTime.Now.AddDays(1);
                DateTime checkOut = DateTime.Now.AddDays(2);
                int nights = 1;
                int adults = 1;
                int children = 0;
                int roomsCount = 1;
                decimal totalAmount = 0;
                string cancelReason = "Không thanh toán trong 24 giờ";
                string propertyName = "Hotel";
                string roomTypeName = "Room";

                if (data.HasValue)
                {
                    try
                    {
                        if (data.Value.TryGetProperty("GuestName", out var nameProperty) && nameProperty.ValueKind == JsonValueKind.String)
                            guestName = nameProperty.GetString() ?? guestName;

                        if (data.Value.TryGetProperty("GuestPhone", out var phoneProperty) && phoneProperty.ValueKind == JsonValueKind.String)
                            guestPhone = phoneProperty.GetString() ?? guestPhone;

                        if (data.Value.TryGetProperty("BookingCode", out var codeProperty) && codeProperty.ValueKind == JsonValueKind.String)
                            bookingCode = codeProperty.GetString() ?? bookingCode;

                        if (data.Value.TryGetProperty("CheckIn", out var checkInProperty) && checkInProperty.ValueKind == JsonValueKind.String)
                            DateTime.TryParse(checkInProperty.GetString(), out checkIn);

                        if (data.Value.TryGetProperty("CheckOut", out var checkOutProperty) && checkOutProperty.ValueKind == JsonValueKind.String)
                            DateTime.TryParse(checkOutProperty.GetString(), out checkOut);

                        if (data.Value.TryGetProperty("Nights", out var nightsProperty) && nightsProperty.ValueKind == JsonValueKind.Number)
                            nights = nightsProperty.GetInt32();

                        if (data.Value.TryGetProperty("Adults", out var adultsProperty) && adultsProperty.ValueKind == JsonValueKind.Number)
                            adults = adultsProperty.GetInt32();

                        if (data.Value.TryGetProperty("Children", out var childrenProperty) && childrenProperty.ValueKind == JsonValueKind.Number)
                            children = childrenProperty.GetInt32();

                        if (data.Value.TryGetProperty("RoomsCount", out var roomsProperty) && roomsProperty.ValueKind == JsonValueKind.Number)
                            roomsCount = roomsProperty.GetInt32();

                        if (data.Value.TryGetProperty("TotalAmount", out var totalProperty) && totalProperty.ValueKind == JsonValueKind.Number)
                            totalAmount = totalProperty.GetDecimal();

                        if (data.Value.TryGetProperty("CancelReason", out var reasonProperty) && reasonProperty.ValueKind == JsonValueKind.String)
                            cancelReason = reasonProperty.GetString() ?? cancelReason;

                        if (data.Value.TryGetProperty("PropertyName", out var propertyProperty) && propertyProperty.ValueKind == JsonValueKind.String)
                            propertyName = propertyProperty.GetString() ?? propertyName;

                        if (data.Value.TryGetProperty("RoomTypeName", out var roomTypeProperty) && roomTypeProperty.ValueKind == JsonValueKind.String)
                            roomTypeName = roomTypeProperty.GetString() ?? roomTypeName;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"⚠️ Error parsing booking cancelled email data for notification {notification.Id}: {ex.Message}");
                    }
                }

                await emailService.SendBookingCancelledAsync(
                    toEmail: notification.EmailTo!,
                    guestName: guestName,
                    guestPhone: guestPhone,
                    bookingCode: bookingCode,
                    checkIn: checkIn,
                    checkOut: checkOut,
                    nights: nights,
                    adults: adults,
                    children: children,
                    roomsCount: roomsCount,
                    totalAmount: totalAmount,
                    cancelReason: cancelReason,
                    propertyName: propertyName,
                    roomTypeName: roomTypeName
                );

                _logger.LogInformation($"✅ Booking cancelled email sent to {notification.EmailTo} for booking {bookingCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Failed to send booking cancelled email: {ex.Message}");
                throw;
            }
        }
        private async Task ProcessNoShowEmail(Notification notification, JsonElement? data, IEmailService emailService)
        {
            if (!data.HasValue)
                throw new InvalidOperationException("Missing data for no-show email");

            const string dateFormat = "dd/MM/yyyy HH:mm";
            var culture = System.Globalization.CultureInfo.InvariantCulture;

            await emailService.SendNoShowNotificationAsync(
                toEmail: notification.EmailTo,
                guestName: data.Value.GetProperty("GuestName").GetString(),
                guestPhone: data.Value.GetProperty("GuestPhone").GetString(),
                bookingCode: data.Value.GetProperty("BookingCode").GetString(),
                checkIn: DateTime.ParseExact(data.Value.GetProperty("CheckIn").GetString(), dateFormat, culture),
                checkOut: DateTime.ParseExact(data.Value.GetProperty("CheckOut").GetString(), dateFormat, culture),
                nights: data.Value.GetProperty("Nights").GetInt32(),
                adults: data.Value.GetProperty("Adults").GetInt32(),
                children: data.Value.GetProperty("Children").GetInt32(),
                roomsCount: data.Value.GetProperty("RoomsCount").GetInt32(),
                totalAmount: data.Value.GetProperty("TotalAmount").GetDecimal(),
                gracePeriodHours: data.Value.GetProperty("GracePeriodHours").GetInt32(),
                propertyName: data.Value.TryGetProperty("PropertyName", out var pn) ? pn.GetString() : null,
                roomTypeName: data.Value.TryGetProperty("RoomTypeName", out var rtn) ? rtn.GetString() : null
            );

            _logger.LogInformation("No-show notification sent to {Email} for booking {BookingCode}",
                notification.EmailTo, data.Value.GetProperty("BookingCode").GetString());
        }
        private async Task ProcessAdminNotificationEmail(Notification notification, JsonElement? data,
    IEmailService emailService, IServiceProvider serviceProvider)
        {
            try
            {
                // Lấy thông tin user
                var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
                var user = await context.Users.FindAsync(notification.UserId);

                if (user == null)
                {
                    _logger.LogWarning($"⚠️ User {notification.UserId} not found for notification {notification.Id}");
                    return;
                }

                // Extract message content
                string messageContent = notification.Title;
                if (data.HasValue && data.Value.TryGetProperty("message", out var msgProperty))
                {
                    messageContent = msgProperty.GetString() ?? notification.Title;
                }

                await emailService.SendAdminNotificationEmailAsync(
                    toEmail: notification.EmailTo!,
                    fullName: user.FullName,
                    title: notification.Title,
                    content: messageContent,
                    notificationType: notification.Type
                );

                _logger.LogInformation($"✅ Admin notification email sent to {notification.EmailTo} - Type: {notification.Type}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Failed to send admin notification email: {ex.Message}");
                throw;
            }
        }
        private async Task ProcessRefundTicketCreatedEmail(Notification notification, JsonElement? data, IEmailService emailService)
        {
            try
            {
                string customerName = "Valued Customer";
                string bookingCode = "UNKNOWN";
                decimal requestedAmount = 0;
                string reason = "";
                string refundTicketId = "";

                if (data.HasValue)
                {
                    try
                    {
                        if (data.Value.TryGetProperty("CustomerName", out var nameProperty) && nameProperty.ValueKind == JsonValueKind.String)
                            customerName = nameProperty.GetString() ?? customerName;

                        if (data.Value.TryGetProperty("BookingCode", out var codeProperty) && codeProperty.ValueKind == JsonValueKind.String)
                            bookingCode = codeProperty.GetString() ?? bookingCode;

                        if (data.Value.TryGetProperty("RequestedAmount", out var amountProperty) && amountProperty.ValueKind == JsonValueKind.Number)
                            requestedAmount = amountProperty.GetDecimal();

                        if (data.Value.TryGetProperty("Reason", out var reasonProperty) && reasonProperty.ValueKind == JsonValueKind.String)
                            reason = reasonProperty.GetString() ?? reason;

                        if (data.Value.TryGetProperty("RefundTicketId", out var idProperty) && idProperty.ValueKind == JsonValueKind.String)
                            refundTicketId = idProperty.GetString() ?? refundTicketId;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"⚠️ Error parsing refund ticket created email data for notification {notification.Id}: {ex.Message}");
                    }
                }

                await emailService.SendRefundTicketCreatedAsync(
                    toEmail: notification.EmailTo!,
                    customerName: customerName,
                    bookingCode: bookingCode,
                    requestedAmount: requestedAmount,
                    reason: reason,
                    refundTicketId: refundTicketId
                );

                _logger.LogInformation($"✅ Refund ticket created email sent to {notification.EmailTo}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Failed to send refund ticket created email: {ex.Message}");
                throw;
            }
        }

        private async Task ProcessRefundTicketApprovedEmail(Notification notification, JsonElement? data, IEmailService emailService)
        {
            try
            {
                string customerName = "Valued Customer";
                string bookingCode = "UNKNOWN";
                decimal refundedAmount = 0;
                string bankName = "";
                string accountNumber = "";
                string refundTicketId = "";

                if (data.HasValue)
                {
                    try
                    {
                        if (data.Value.TryGetProperty("CustomerName", out var nameProperty) && nameProperty.ValueKind == JsonValueKind.String)
                            customerName = nameProperty.GetString() ?? customerName;

                        if (data.Value.TryGetProperty("BookingCode", out var codeProperty) && codeProperty.ValueKind == JsonValueKind.String)
                            bookingCode = codeProperty.GetString() ?? bookingCode;

                        if (data.Value.TryGetProperty("RefundedAmount", out var amountProperty) && amountProperty.ValueKind == JsonValueKind.Number)
                            refundedAmount = amountProperty.GetDecimal();

                        if (data.Value.TryGetProperty("BankName", out var bankProperty) && bankProperty.ValueKind == JsonValueKind.String)
                            bankName = bankProperty.GetString() ?? bankName;

                        if (data.Value.TryGetProperty("AccountNumber", out var accProperty) && accProperty.ValueKind == JsonValueKind.String)
                            accountNumber = accProperty.GetString() ?? accountNumber;

                        if (data.Value.TryGetProperty("RefundTicketId", out var idProperty) && idProperty.ValueKind == JsonValueKind.String)
                            refundTicketId = idProperty.GetString() ?? refundTicketId;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"⚠️ Error parsing refund ticket approved email data for notification {notification.Id}: {ex.Message}");
                    }
                }

                await emailService.SendRefundTicketApprovedAsync(
                    toEmail: notification.EmailTo!,
                    customerName: customerName,
                    bookingCode: bookingCode,
                    refundedAmount: refundedAmount,
                    bankName: bankName,
                    accountNumber: accountNumber,
                    refundTicketId: refundTicketId
                );

                _logger.LogInformation($"✅ Refund ticket approved email sent to {notification.EmailTo}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Failed to send refund ticket approved email: {ex.Message}");
                throw;
            }
        }

        private async Task ProcessRefundTicketRejectedEmail(Notification notification, JsonElement? data, IEmailService emailService)
        {
            try
            {
                string customerName = "Valued Customer";
                string bookingCode = "UNKNOWN";
                decimal requestedAmount = 0;
                string rejectReason = "Không đáp ứng điều kiện hoàn tiền";
                string refundTicketId = "";

                if (data.HasValue)
                {
                    try
                    {
                        if (data.Value.TryGetProperty("CustomerName", out var nameProperty) && nameProperty.ValueKind == JsonValueKind.String)
                            customerName = nameProperty.GetString() ?? customerName;

                        if (data.Value.TryGetProperty("BookingCode", out var codeProperty) && codeProperty.ValueKind == JsonValueKind.String)
                            bookingCode = codeProperty.GetString() ?? bookingCode;

                        if (data.Value.TryGetProperty("RequestedAmount", out var amountProperty) && amountProperty.ValueKind == JsonValueKind.Number)
                            requestedAmount = amountProperty.GetDecimal();

                        if (data.Value.TryGetProperty("RejectReason", out var reasonProperty) && reasonProperty.ValueKind == JsonValueKind.String)
                            rejectReason = reasonProperty.GetString() ?? rejectReason;

                        if (data.Value.TryGetProperty("RefundTicketId", out var idProperty) && idProperty.ValueKind == JsonValueKind.String)
                            refundTicketId = idProperty.GetString() ?? refundTicketId;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"⚠️ Error parsing refund ticket rejected email data for notification {notification.Id}: {ex.Message}");
                    }
                }

                await emailService.SendRefundTicketRejectedAsync(
                    toEmail: notification.EmailTo!,
                    customerName: customerName,
                    bookingCode: bookingCode,
                    requestedAmount: requestedAmount,
                    rejectReason: rejectReason,
                    refundTicketId: refundTicketId
                );

                _logger.LogInformation($"✅ Refund ticket rejected email sent to {notification.EmailTo}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Failed to send refund ticket rejected email: {ex.Message}");
                throw;
            }
        }
        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Email Background Service is stopping.");
            await base.StopAsync(stoppingToken);
        }
        private async Task ProcessPaymentReminderEmail(Notification notification, JsonElement? data, IEmailService emailService)
        {
            await emailService.SendPaymentReminderAsync(
                notification.EmailTo!,
                "Valued Customer", "", "BookingCode",
                DateTime.Now, DateTime.Now.AddDays(1),
                1, 1, 0, 1,
                1000000, 0, 0, 0, 0, 1000000,
                "Payment URL",
                "", "Property Name", "Room Type"
            );
        }
    }
}