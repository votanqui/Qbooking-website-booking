using Microsoft.EntityFrameworkCore;
using QBooking.Models;
using QBooking.Data;
using QBooking.Dtos.Response;
using QBooking.Dtos.Request;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Azure.Core;
using System.Globalization;
using System.Text;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace QBooking.Services
{
    public interface IBookingService
    {
        Task<IEnumerable<BookingDto>> GetBookingsByUserIdAsync(
     int userId,
     string? bookingCode = null,
     string? propertyName = null,
     DateTime? fromDate = null,
     DateTime? toDate = null,
     string? status = null,
     string? paymentStatus = null
 );
        Task<BookingDetailDto?> GetBookingDetailByCodeAsync(string bookingCode, int userId);
        Task<BookingDetailDto?> GetBookingDetailAsync(int bookingId, int userId);
        Task<BookingDto> CreateBookingAsync(CreateBookingRequest request, int userId);
        Task<bool> ConfirmBookingAsync(int bookingId, int userId);
        Task<bool> CancelBookingAsync(int bookingId, int userId, string? reason = null);
        Task<bool> CheckInAsync(int bookingId, int userId);
        Task<bool> CheckOutAsync(int bookingId, int userId);
        Task<bool> CheckRoomAvailabilityAsync(int propertyId, int roomTypeId, DateTime checkIn, DateTime checkOut, int roomsCount);



        Task<IEnumerable<BookingDto>> GetHostBookingsAsync(int hostId, string? userRole, string? status = null, DateTime? fromDate = null, DateTime? toDate = null, int propertyId = 0);
        Task<AdminBookingListResponse> GetAllBookingsAdminAsync(
            string? status = null,
            DateTime? fromDate = null,
            DateTime? toDate = null,
            int? customerId = null,
            int? hostId = null,
            int? propertyId = null,
            int page = 1,
            int pageSize = 50);

        Task<AdminBookingDetailDto?> GetBookingDetailAdminAsync(int bookingId);

        Task<AdminBookingStatisticsDto> GetBookingStatisticsAdminAsync(
            DateTime? fromDate = null,
            DateTime? toDate = null,
            int? propertyId = null,
            int? hostId = null);
        Task<BookingStatisticsDto> GetBookingStatisticsAsync(int userId, string? userRole, DateTime? fromDate = null, DateTime? toDate = null, int? propertyId = null);
        Task<bool> AdminCancelBookingAsync(int bookingId, int adminId, string reason, decimal? refundAmount = null);


        // Thêm vào IBookingService

        Task<byte[]> ExportBookingsAsync(string? status, DateTime? fromDate, DateTime? toDate, int? customerId, int? hostId, int? propertyId, string format);

        Task<bool> UpdateBookingStatusAsync(int bookingId, string newStatus, int adminId, string? note = null);
        Task<bool> UpdatePaymentStatusAsync(int bookingId, string newPaymentStatus, int adminId, string? note = null);
        Task<DashboardOverviewDto> GetDashboardOverviewAsync(DateTime? fromDate, DateTime? toDate);
        Task<RevenueChartDto> GetRevenueChartAsync(DateTime? fromDate, DateTime? toDate, string groupBy);
        Task<BookingTrendsDto> GetBookingTrendsAsync(DateTime? fromDate, DateTime? toDate);
        Task<IEnumerable<TopPropertyDto>> GetTopPropertiesAsync(DateTime? fromDate, DateTime? toDate, int top);
        Task<IEnumerable<TopCustomerDto>> GetTopCustomersAsync(DateTime? fromDate, DateTime? toDate, int top);
        Task<DashboardAlertsDto> GetDashboardAlertsAsync();


        Task<byte[]> GenerateBookingReceiptPdfAsync(int bookingId);

        Task<object?> GetAvailableDatesInMonthAsync(
    int propertyId,
    int roomTypeId,
    int year,
    int month,
    int roomsCount);
        Task<object?> CheckRoomAvailabilityDetailedAsync(
    int propertyId,
    int roomTypeId,
    DateTime checkIn,
    DateTime checkOut,
    int roomsCount,
    int adults,
    int children);
        Task<BookingDetailDto?> GetHostBookingDetailAsync(
              int bookingId,
              int hostId,
              string? userRole
          );

        Task<object?> GetPriceQuoteAsync(
     int propertyId,
     int roomTypeId,
     DateTime checkIn,
     DateTime checkOut,
     int roomsCount);
    }

    public class BookingService : IBookingService
    {
        private readonly ApplicationDbContext _context;
        private readonly AuditLogService _auditLogService;
        private readonly IEmailService _emailService;
        private readonly string _frontendBaseUrl;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<BookingService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IEmailQueueService _emailQueueService;
        public BookingService(
            ApplicationDbContext context,
            AuditLogService auditLogService,
            IEmailService emailService ,
             IConfiguration config,
                 IServiceProvider serviceProvider,
    ILogger<BookingService> logger
            , IEmailQueueService emailQueueService
        )
        {
            _context = context;
            _auditLogService = auditLogService;
            _emailService = emailService;
            _frontendBaseUrl = config["Frontend:BaseUrl"];
            _serviceProvider = serviceProvider;
            _logger = logger;
            _emailQueueService = emailQueueService;
        }

        public async Task<IEnumerable<BookingDto>> GetBookingsByUserIdAsync(
            int userId,
            string? bookingCode = null,
            string? propertyName = null,
            DateTime? fromDate = null,
            DateTime? toDate = null,
            string? status = null,
            string? paymentStatus = null
        )
        {
            var query = _context.Bookings
                .Where(b => b.CustomerId == userId)
                .Include(b => b.Customer)
                .Include(b => b.Property)
                .Include(b => b.RoomType)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(bookingCode))
                query = query.Where(b => b.BookingCode.Contains(bookingCode));

            if (!string.IsNullOrWhiteSpace(propertyName))
                query = query.Where(b => b.Property.Name.Contains(propertyName));

            if (fromDate.HasValue && toDate.HasValue)
            {
                var start = fromDate.Value.Date;
                var end = toDate.Value.Date;
                query = query.Where(b => b.CheckIn >= start && b.CheckIn <= end);
            }

            // 🆕 Lọc theo trạng thái đặt phòng
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(b => b.Status == status);

            // 🆕 Lọc theo trạng thái thanh toán
            if (!string.IsNullOrWhiteSpace(paymentStatus))
                query = query.Where(b => b.PaymentStatus == paymentStatus);

            return await query
                          .OrderByDescending(b => b.BookingDate)
                          .Select(b => new BookingDto
                          {
                              Id = b.Id,
                              BookingCode = b.BookingCode,
                              CustomerId = b.CustomerId,
                              CustomerName = b.Customer.FullName,
                              CustomerEmail = b.Customer.Email,
                              CustomerPhone = b.Customer.Phone,

                              PropertyId = b.PropertyId,
                              PropertyName = b.Property.Name,
                              PropertyAddress = b.Property.AddressDetail,

                              RoomTypeId = b.RoomTypeId,
                              RoomTypeName = b.RoomType.Name,

                              CheckIn = b.CheckIn,
                              CheckOut = b.CheckOut,
                              Nights = b.Nights,
                              Adults = b.Adults,
                              Children = b.Children,
                              RoomsCount = b.RoomsCount,

                              GuestName = b.GuestName,
                              GuestPhone = b.GuestPhone,
                              GuestEmail = b.GuestEmail,

                              RoomPrice = b.RoomPrice,
                              DiscountAmount = b.DiscountAmount,
                              TaxAmount = b.TaxAmount,
                              ServiceFee = b.ServiceFee,
                              TotalAmount = b.TotalAmount,

                              Status = b.Status,
                              PaymentStatus = b.PaymentStatus,
                              BookingSource = b.BookingSource,

                              BookingDate = b.BookingDate,
                              ConfirmedAt = b.ConfirmedAt,
                              CheckedInAt = b.CheckedInAt,
                              CheckedOutAt = b.CheckedOutAt,
                              CancelledAt = b.CancelledAt
                          })
                          .ToListAsync();

        }

        public async Task<BookingDetailDto?> GetBookingDetailAsync(int bookingId, int userId)
        {
            var booking = await _context.Bookings
                .Include(b => b.Customer)
                .Include(b => b.Property)
                .Include(b => b.RoomType)
                .FirstOrDefaultAsync(b => b.Id == bookingId && b.CustomerId == userId);

            if (booking == null)
                return null;

            return new BookingDetailDto
            {
                Id = booking.Id,
                BookingCode = booking.BookingCode,
                CustomerId = booking.CustomerId,
                CustomerName = booking.Customer?.FullName,
                PropertyId = booking.PropertyId,
                PropertyName = booking.Property?.Name,
                RoomTypeId = booking.RoomTypeId,
                RoomTypeName = booking.RoomType?.Name,
                CheckIn = booking.CheckIn,
                CheckOut = booking.CheckOut,
                Nights = booking.Nights,
                Adults = booking.Adults,
                Children = booking.Children,
                RoomsCount = booking.RoomsCount,
                GuestName = booking.GuestName,
                GuestPhone = booking.GuestPhone,
                GuestEmail = booking.GuestEmail,
                GuestIdNumber = booking.GuestIdNumber,
                SpecialRequests = booking.SpecialRequests,
                RoomPrice = booking.RoomPrice,
                DiscountPercent = booking.DiscountPercent,
                DiscountAmount = booking.DiscountAmount,
                CouponDiscountPercent = booking.CouponDiscountPercent,
                CouponDiscountAmount = booking.CouponDiscountAmount,
                TaxAmount = booking.TaxAmount,
                ServiceFee = booking.ServiceFee,
                TotalAmount = booking.TotalAmount,
                Status = booking.Status,
                PaymentStatus = booking.PaymentStatus,
                BookingSource = booking.BookingSource,
                BookingDate = booking.BookingDate,
                ConfirmedAt = booking.ConfirmedAt,
                CheckedInAt = booking.CheckedInAt,
                CheckedOutAt = booking.CheckedOutAt,
                CancelledAt = booking.CancelledAt
            };
        }
        public async Task<BookingDetailDto?> GetBookingDetailByCodeAsync(string bookingCode, int userId)
        {
            var booking = await _context.Bookings
                .Include(b => b.Customer)
                .Include(b => b.Property)
                .Include(b => b.RoomType)
                .FirstOrDefaultAsync(b => b.BookingCode == bookingCode);

            if (booking == null)
                return null;

     
            if (booking.CustomerId != userId)
                return null;

            return new BookingDetailDto
            {
                Id = booking.Id,
                BookingCode = booking.BookingCode,
                CustomerId = booking.CustomerId,
                CustomerName = booking.Customer?.FullName,
                PropertyId = booking.PropertyId,
                PropertyName = booking.Property?.Name,
                RoomTypeId = booking.RoomTypeId,
                RoomTypeName = booking.RoomType?.Name,
                CheckIn = booking.CheckIn,
                CheckOut = booking.CheckOut,
                Nights = booking.Nights,
                Adults = booking.Adults,
                Children = booking.Children,
                RoomsCount = booking.RoomsCount,
                GuestName = booking.GuestName,
                GuestPhone = booking.GuestPhone,
                GuestEmail = booking.GuestEmail,
                GuestIdNumber = booking.GuestIdNumber,
                SpecialRequests = booking.SpecialRequests,
                RoomPrice = booking.RoomPrice,
                DiscountPercent = booking.DiscountPercent,
                DiscountAmount = booking.DiscountAmount,
                CouponDiscountPercent = booking.CouponDiscountPercent,
                CouponDiscountAmount = booking.CouponDiscountAmount,
                TaxAmount = booking.TaxAmount,
                ServiceFee = booking.ServiceFee,
                TotalAmount = booking.TotalAmount,
                Status = booking.Status,
                PaymentStatus = booking.PaymentStatus,
                BookingSource = booking.BookingSource,
                BookingDate = booking.BookingDate,
                ConfirmedAt = booking.ConfirmedAt,
                CheckedInAt = booking.CheckedInAt,
                CheckedOutAt = booking.CheckedOutAt,
                CancelledAt = booking.CancelledAt
            };
        }

        public async Task<BookingDetailDto?> GetHostBookingDetailAsync(int bookingId, int hostId, string? userRole)
        {
            var query = _context.Bookings
                .Include(b => b.Customer)
                .Include(b => b.Property)
                .Include(b => b.RoomType)
                .AsQueryable();

            // Nếu không phải admin => chỉ xem booking của property thuộc host
            if (userRole != "admin")
            {
                query = query.Where(b => b.Property.HostId == hostId);
            }

            var booking = await query.FirstOrDefaultAsync(b => b.Id == bookingId);
            if (booking == null) return null;

            return new BookingDetailDto
            {
                Id = booking.Id,
                BookingCode = booking.BookingCode,
                CustomerId = booking.CustomerId,
                CustomerName = booking.Customer?.FullName,
                PropertyId = booking.PropertyId,
                PropertyName = booking.Property?.Name,
                RoomTypeId = booking.RoomTypeId,
                RoomTypeName = booking.RoomType?.Name,
                CheckIn = booking.CheckIn,
                CheckOut = booking.CheckOut,
                Nights = booking.Nights,
                Adults = booking.Adults,
                Children = booking.Children,
                RoomsCount = booking.RoomsCount,
                GuestName = booking.GuestName,
                GuestPhone = booking.GuestPhone,
                GuestEmail = booking.GuestEmail,
                GuestIdNumber = booking.GuestIdNumber,
                SpecialRequests = booking.SpecialRequests,
                RoomPrice = booking.RoomPrice,
                DiscountPercent = booking.DiscountPercent,
                DiscountAmount = booking.DiscountAmount,
                TaxAmount = booking.TaxAmount,
                ServiceFee = booking.ServiceFee,
                TotalAmount = booking.TotalAmount,
                Status = booking.Status,
                PaymentStatus = booking.PaymentStatus,
                BookingSource = booking.BookingSource,
                BookingDate = booking.BookingDate,
                ConfirmedAt = booking.ConfirmedAt,
                CheckedInAt = booking.CheckedInAt,
                CheckedOutAt = booking.CheckedOutAt,
                CancelledAt = booking.CancelledAt
            };
        }

        public async Task<BookingDto> CreateBookingAsync(CreateBookingRequest request, int userId)
        {
            // Get room type for validation
            var roomType = await _context.RoomTypes
                .FirstOrDefaultAsync(rt => rt.Id == request.RoomTypeId && rt.IsActive);

            if (roomType == null)
            {
                await _auditLogService.LogActionAsync("CREATE_FAILED", "Booking", null, null,
                    $"Không tìm thấy loại phòng {request.RoomTypeId}");
                throw new InvalidOperationException("Không tìm thấy loại phòng hoặc loại phòng không hoạt động");
            }
            var property = await _context.Properties
                .FirstOrDefaultAsync(p => p.Id == request.PropertyId);

            if (property != null && property.HostId == userId)
            {
                await _auditLogService.LogActionAsync("CREATE_FAILED", "Booking", null, null,
                    $"Host {userId} không thể booking property của chính mình: {request.PropertyId}");
                throw new InvalidOperationException("Bạn không thể đặt phòng tại chỗ nghỉ của chính mình");
            }
            // Validate rooms count
            if (request.RoomsCount <= 0)
            {
                throw new ArgumentException("Số lượng phòng phải lớn hơn 0");
            }

            // Validate guests count
            if (request.Adults <= 0 && request.Children <= 0)
            {
                throw new ArgumentException("Phải có ít nhất 1 khách (người lớn hoặc trẻ em)");
            }

            // Validate guest count constraints based on RoomType
            if (request.Adults > roomType.MaxAdults)
            {
                throw new ArgumentException($"Số lượng người lớn vượt quá giới hạn. Tối đa {roomType.MaxAdults} người lớn cho loại phòng này");
            }

            if (request.Children > roomType.MaxChildren)
            {
                throw new ArgumentException($"Số lượng trẻ em vượt quá giới hạn. Tối đa {roomType.MaxChildren} trẻ em cho loại phòng này");
            }

            var totalGuests = request.Adults + request.Children;
            if (totalGuests > roomType.MaxGuests)
            {
                throw new ArgumentException($"Tổng số khách vượt quá giới hạn. Tối đa {roomType.MaxGuests} khách cho loại phòng này");
            }

            // Validate room count against total rooms
            if (request.RoomsCount > roomType.TotalRooms)
            {
                throw new ArgumentException($"Số lượng phòng yêu cầu vượt quá số phòng có sẵn. Tối đa {roomType.TotalRooms} phòng");
            }

            // Validate room availability
            var isAvailable = await CheckRoomAvailabilityAsync(
                request.PropertyId,
                request.RoomTypeId,
                request.CheckIn,
                request.CheckOut,
                request.RoomsCount
            );

            if (!isAvailable)
            {
                await _auditLogService.LogActionAsync("CREATE_FAILED", "Booking", null, null,
                    $"Phòng không có sẵn: Property {request.PropertyId}, RoomType {request.RoomTypeId}");
                throw new InvalidOperationException("Phòng không có sẵn cho ngày đã chọn");
            }

            // Calculate nights
            var nights = (request.CheckOut.Date - request.CheckIn.Date).Days;
            if (nights <= 0)
            {
                await _auditLogService.LogActionAsync("CREATE_FAILED", "Booking", null, null,
                    $"Ngày không hợp lệ: CheckIn {request.CheckIn}, CheckOut {request.CheckOut}");
                throw new ArgumentException("Ngày trả phòng phải sau ngày nhận phòng");
            }

            // Validate check-in date (cannot be in the past)
            if (request.CheckIn.Date < DateTime.Now.Date)
            {
                throw new ArgumentException("Ngày nhận phòng không thể là ngày trong quá khứ");
            }

            // Calculate pricing
            var roomPrice = CalculateRoomPrice(roomType, request.CheckIn, request.CheckOut, request.RoomsCount);
            var timeBasedDiscountPercent = CalculateTimeBasedDiscount(roomType, nights);
            var timeBasedDiscountAmount = roomPrice * (timeBasedDiscountPercent / 100);

            // Server-side additional discount set to 0 (as requested)
            decimal serverDiscountPercent = 0;
            var serverDiscountAmount = roomPrice * (serverDiscountPercent / 100);

            // Total discount
            var totalDiscountPercent = timeBasedDiscountPercent + serverDiscountPercent;
            var totalDiscountAmount = timeBasedDiscountAmount + serverDiscountAmount;
            var subtotal = roomPrice - totalDiscountAmount;

            // Calculate fees and taxes
            var serviceFee = CalculateServiceFee(subtotal, request.RoomsCount, nights);
            var taxAmount = subtotal * 0.1m; // 10% tax
            var totalAmount = subtotal + taxAmount + serviceFee;

            // Generate booking code
            var bookingCode = GenerateBookingCode();

            var booking = new Booking
            {
                BookingCode = bookingCode,
                CustomerId = userId,
                PropertyId = request.PropertyId,
                RoomTypeId = request.RoomTypeId,
                CheckIn = request.CheckIn,
                CheckOut = request.CheckOut,
                Nights = nights,
                Adults = request.Adults,
                Children = request.Children,
                RoomsCount = request.RoomsCount,
                GuestName = request.GuestName,
                GuestPhone = request.GuestPhone,
                GuestEmail = request.GuestEmail,
                GuestIdNumber = request.GuestIdNumber,
                SpecialRequests = request.SpecialRequests,
                RoomPrice = roomPrice,
                DiscountPercent = totalDiscountPercent, // Server-calculated discount
                DiscountAmount = totalDiscountAmount,
                CouponDiscountPercent = 0,
                CouponDiscountAmount = 0,
                TaxAmount = taxAmount,
                ServiceFee = serviceFee,
                TotalAmount = totalAmount,
                Status = "pending",
                PaymentStatus = "unpaid",
                BookingSource = request.BookingSource ?? "website",
                UtmSource = request.UtmSource,
                UtmCampaign = request.UtmCampaign,
                UtmMedium = request.UtmMedium,
                BookingDate = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();
            // Trong phương thức CreateBookingAsync, thay thế phần gọi email service:

            // Log the creation
            var newValues = JsonSerializer.Serialize(new
            {
                booking.Id,
                booking.BookingCode,
                booking.PropertyId,
                booking.RoomTypeId,
                booking.CheckIn,
                booking.CheckOut,
                booking.TotalAmount,
                booking.Status
            });
            await _auditLogService.LogInsertAsync("Booking", booking.Id, newValues);


            return new BookingDto
            {
                Id = booking.Id,
                BookingCode = booking.BookingCode,
                CheckIn = booking.CheckIn,
                CheckOut = booking.CheckOut,
                Nights = booking.Nights,
                Adults = booking.Adults,
                Children = booking.Children,
                RoomsCount = booking.RoomsCount,
                GuestName = booking.GuestName,
                GuestPhone = booking.GuestPhone,
                GuestEmail = booking.GuestEmail,
                TotalAmount = booking.TotalAmount,
                Status = booking.Status,
                PaymentStatus = booking.PaymentStatus,
                BookingDate = booking.BookingDate
            };
        }

      
        private async Task<bool> IsPropertyHostAsync(int propertyId, int userId)
        {
            return await _context.Properties
                .AnyAsync(p => p.Id == propertyId && p.HostId == userId);
        }
        public async Task<IEnumerable<BookingDto>> GetHostBookingsAsync(int hostId, string? userRole, string? status = null, DateTime? fromDate = null, DateTime? toDate = null, int propertyId = 0)
        {
            var query = _context.Bookings
                .Include(b => b.Customer)
                .Include(b => b.Property)
                .Include(b => b.RoomType)
                .AsQueryable();

            // Admin có thể xem tất cả, Host chỉ xem booking của properties mình sở hữu
            if (userRole != "admin")
            {
                query = query.Where(b => b.Property.HostId == hostId);
            }

            // Filter by status
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(b => b.Status == status);
            }

            // Filter by date range
            if (fromDate.HasValue)
            {
                query = query.Where(b => b.CheckIn >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                query = query.Where(b => b.CheckOut <= toDate.Value);
            }

            // Filter by specific property
            if (propertyId > 0)
            {
                query = query.Where(b => b.PropertyId == propertyId);
            }

            var bookings = await query
                .Select(b => new BookingDto
                {
                    Id = b.Id,
                    BookingCode = b.BookingCode,
                    CustomerName = b.Customer.FullName,
                    PropertyName = b.Property.Name,
                    RoomTypeName = b.RoomType.Name,
                    CheckIn = b.CheckIn,
                    CheckOut = b.CheckOut,
                    Nights = b.Nights,
                    Adults = b.Adults,
                    Children = b.Children,
                    RoomsCount = b.RoomsCount,
                    GuestName = b.GuestName,
                    GuestPhone = b.GuestPhone,
                    GuestEmail = b.GuestEmail,
                    TotalAmount = b.TotalAmount,
                    Status = b.Status,
                    PaymentStatus = b.PaymentStatus,
                    BookingDate = b.BookingDate
                })
                .OrderByDescending(b => b.BookingDate)
                .ToListAsync();

            return bookings;
        }
        public async Task<BookingStatisticsDto> GetBookingStatisticsAsync(int userId, string? userRole, DateTime? fromDate = null, DateTime? toDate = null, int? propertyId = null)
        {
            var query = _context.Bookings
                .Include(b => b.Property)
                .AsQueryable();

            // Admin có thể xem tất cả, Host chỉ xem booking của properties mình sở hữu
            if (userRole != "admin")
            {
                query = query.Where(b => b.Property.HostId == userId);
            }

            // Apply filters
            if (fromDate.HasValue)
            {
                query = query.Where(b => b.BookingDate >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                query = query.Where(b => b.BookingDate <= toDate.Value);
            }

            if (propertyId.HasValue)
            {
                query = query.Where(b => b.PropertyId == propertyId.Value);
            }

            var bookings = await query.ToListAsync();

            var statistics = new BookingStatisticsDto
            {
                TotalBookings = bookings.Count,
                PendingBookings = bookings.Count(b => b.Status == "pending"),
                ConfirmedBookings = bookings.Count(b => b.Status == "confirmed"),
                CheckedInBookings = bookings.Count(b => b.Status == "checkedIn"),
                CompletedBookings = bookings.Count(b => b.Status == "completed"),
                CancelledBookings = bookings.Count(b => b.Status == "cancelled"),
                TotalRevenue = bookings.Where(b => b.Status != "cancelled").Sum(b => b.TotalAmount),
                PendingRevenue = bookings.Where(b => b.Status == "pending").Sum(b => b.TotalAmount),
                ConfirmedRevenue = bookings.Where(b => b.Status == "confirmed").Sum(b => b.TotalAmount),
                CompletedRevenue = bookings.Where(b => b.Status == "completed").Sum(b => b.TotalAmount),
                TotalGuests = bookings.Where(b => b.Status != "cancelled").Sum(b => b.Adults + b.Children)
            };

            if (statistics.TotalBookings > 0)
            {
                statistics.AverageBookingValue = statistics.TotalRevenue / statistics.TotalBookings;
                statistics.AverageNights = bookings.Where(b => b.Status != "cancelled").Average(b => b.Nights);
            }

            // Booking by source
            statistics.BookingsBySource = bookings
                .Where(b => b.Status != "cancelled")
                .GroupBy(b => b.BookingSource ?? "unknown")
                .ToDictionary(g => g.Key, g => g.Count());

            // Revenue by month
            statistics.RevenueByMonth = bookings
                .Where(b => b.Status != "cancelled")
                .GroupBy(b => b.BookingDate.ToString("yyyy-MM"))
                .ToDictionary(g => g.Key, g => g.Sum(b => b.TotalAmount));

            // Bookings by property
            statistics.BookingsByProperty = bookings
                .Where(b => b.Status != "cancelled")
                .GroupBy(b => b.PropertyId)
                .ToDictionary(g => g.Key, g => g.Count());

            return statistics;
        }
        public async Task<AdminBookingListResponse> GetAllBookingsAdminAsync(
            string? status = null,
            DateTime? fromDate = null,
            DateTime? toDate = null,
            int? customerId = null,
            int? hostId = null,
            int? propertyId = null,
            int page = 1,
            int pageSize = 50)
        {
            var query = _context.Bookings
                .Include(b => b.Customer)
                .Include(b => b.Property)
                    .ThenInclude(p => p.Host)
                .Include(b => b.RoomType)
                .Include(b => b.RefundTickets)
                .Include(b => b.Refunds)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(status))
                query = query.Where(b => b.Status == status);

            if (fromDate.HasValue)
                query = query.Where(b => b.BookingDate >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(b => b.BookingDate <= toDate.Value);

            if (customerId.HasValue)
                query = query.Where(b => b.CustomerId == customerId.Value);

            if (hostId.HasValue)
                query = query.Where(b => b.Property.HostId == hostId.Value);

            if (propertyId.HasValue)
                query = query.Where(b => b.PropertyId == propertyId.Value);

            var totalRecords = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize);

            var bookings = await query
                .OrderByDescending(b => b.BookingDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new AdminBookingListDto
                {
                    Id = b.Id,
                    BookingCode = b.BookingCode,

                    // Customer Info
                    CustomerId = b.CustomerId,
                    CustomerName = b.Customer.FullName,
                    CustomerEmail = b.Customer.Email,
                    CustomerPhone = b.Customer.Phone,

                    // Property & Host Info
                    PropertyId = b.PropertyId,
                    PropertyName = b.Property.Name,
                    HostId = b.Property.HostId,
                    HostName = b.Property.Host.FullName,
                    HostEmail = b.Property.Host.Email,

                    // Room Info
                    RoomTypeId = b.RoomTypeId,
                    RoomTypeName = b.RoomType.Name,

                    // Booking Details
                    CheckIn = b.CheckIn,
                    CheckOut = b.CheckOut,
                    Nights = b.Nights,
                    Adults = b.Adults,
                    Children = b.Children,
                    RoomsCount = b.RoomsCount,

                    // Guest Info
                    GuestName = b.GuestName,
                    GuestPhone = b.GuestPhone,
                    GuestEmail = b.GuestEmail,

                    // Financial
                    TotalAmount = b.TotalAmount,
                    RoomPrice = b.RoomPrice,
                    DiscountAmount = b.DiscountAmount,
                    ServiceFee = b.ServiceFee,
                    TaxAmount = b.TaxAmount,

                    // Status
                    Status = b.Status,
                    PaymentStatus = b.PaymentStatus,

                    // Timestamps
                    BookingDate = b.BookingDate,
                    ConfirmedAt = b.ConfirmedAt,
                    CheckedInAt = b.CheckedInAt,
                    CheckedOutAt = b.CheckedOutAt,
                    CancelledAt = b.CancelledAt,
                    UpdatedAt = b.UpdatedAt,

                    // Refund Info
                    HasRefundTicket = b.RefundTickets.Any(),
                    RefundTicketStatus = b.RefundTickets.FirstOrDefault() != null ? b.RefundTickets.FirstOrDefault().Status : null,
                    RefundTicketAmount = b.RefundTickets.FirstOrDefault() != null ? b.RefundTickets.FirstOrDefault().RequestedAmount : null,
                    HasRefund = b.Refunds.Any(),
                    RefundedAmount = b.Refunds.Sum(r => r.RefundedAmount)
                })
                .ToListAsync();

            return new AdminBookingListResponse
            {
                Bookings = bookings,
                TotalRecords = totalRecords,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages
            };
        }

        public async Task<AdminBookingDetailDto?> GetBookingDetailAdminAsync(int bookingId)
        {
            var booking = await _context.Bookings
                .Include(b => b.Customer)
                .Include(b => b.Property)
                    .ThenInclude(p => p.Host)
                .Include(b => b.RoomType)
                .Include(b => b.RefundTickets)
                .Include(b => b.Refunds)
                    .ThenInclude(r => r.Customer)
                .Include(b => b.Reviews)
                .Include(b => b.Payments)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
                return null;

            return new AdminBookingDetailDto
            {
                // Basic Info
                Id = booking.Id,
                BookingCode = booking.BookingCode,

                // Customer Details
                CustomerId = booking.CustomerId,
                CustomerName = booking.Customer.FullName,
                CustomerEmail = booking.Customer.Email,
                CustomerPhone = booking.Customer.Phone,
                CustomerAvatar = booking.Customer.Avatar,

                // Property & Host Details
                PropertyId = booking.PropertyId,
                PropertyName = booking.Property.Name,
                PropertyAddress = booking.Property.AddressDetail,
                HostId = booking.Property.HostId,
                HostName = booking.Property.Host.FullName,
                HostEmail = booking.Property.Host.Email,
                HostPhone = booking.Property.Host.Phone,

                // Room Details
                RoomTypeId = booking.RoomTypeId,
                RoomTypeName = booking.RoomType.Name,
                TotalRooms = booking.RoomType.TotalRooms,
                MaxGuests = booking.RoomType.MaxGuests,

                // Booking Details
                CheckIn = booking.CheckIn,
                CheckOut = booking.CheckOut,
                Nights = booking.Nights,
                Adults = booking.Adults,
                Children = booking.Children,
                RoomsCount = booking.RoomsCount,

                // Guest Information
                GuestName = booking.GuestName,
                GuestPhone = booking.GuestPhone,
                GuestEmail = booking.GuestEmail,
                GuestIdNumber = booking.GuestIdNumber,
                SpecialRequests = booking.SpecialRequests,

                // Financial Breakdown
                RoomPrice = booking.RoomPrice,
                DiscountPercent = booking.DiscountPercent,
                DiscountAmount = booking.DiscountAmount,
                CouponDiscountPercent = booking.CouponDiscountPercent,
                CouponDiscountAmount = booking.CouponDiscountAmount,
                TaxAmount = booking.TaxAmount,
                ServiceFee = booking.ServiceFee,
                TotalAmount = booking.TotalAmount,

                // Status & Source
                Status = booking.Status,
                PaymentStatus = booking.PaymentStatus,
                BookingSource = booking.BookingSource,
                UtmSource = booking.UtmSource,
                UtmCampaign = booking.UtmCampaign,
                UtmMedium = booking.UtmMedium,

                // Timestamps
                BookingDate = booking.BookingDate,
                ConfirmedAt = booking.ConfirmedAt,
                CheckedInAt = booking.CheckedInAt,
                CheckedOutAt = booking.CheckedOutAt,
                CancelledAt = booking.CancelledAt,
                UpdatedAt = booking.UpdatedAt,

                // Refund Ticket (Customer Request)
                RefundTicket = booking.RefundTickets.FirstOrDefault() != null ? new RefundTicketDto
                {
                    Id = booking.RefundTickets.First().Id,
                    RequestedAmount = booking.RefundTickets.First().RequestedAmount,
                    Reason = booking.RefundTickets.First().Reason,
                    BankName = booking.RefundTickets.First().BankName,
                    BankAccountNumber = booking.RefundTickets.First().BankAccountNumber,
                    BankAccountName = booking.RefundTickets.First().BankAccountName,
                    Status = booking.RefundTickets.First().Status,
                    CreatedAt = booking.RefundTickets.First().CreatedAt,
                    ProcessedAt = booking.RefundTickets.First().ProcessedAt
                } : null,

                // Refunds (Admin Processed)
                Refunds = booking.Refunds.Select(r => new RefundDto
                {
                    Id = r.Id,
                    RefundTicketId = r.RefundTicketId,
                    ApprovedBy = r.ApprovedBy,
                    ApprovedByName = r.Customer.FullName,
                    RefundedAmount = r.RefundedAmount,
                    ReceiverBankName = r.ReceiverBankName,
                    ReceiverAccount = r.ReceiverAccount,
                    ReceiverName = r.ReceiverName,
                    PaymentMethod = r.PaymentMethod,
                    PaymentReference = r.PaymentReference,
                    Notes = r.Notes,
                    CreatedAt = r.CreatedAt
                }).ToList(),

                // Reviews
                Reviews = booking.Reviews.Select(r => new ReviewSummaryDto
                {
                    Id = r.Id,
                    OverallRating = r.OverallRating,
                    Title = r.Title,
                    ReviewText = r.ReviewText,
                    Status = r.Status,
                    CreatedAt = r.CreatedAt ?? DateTime.Now
                }).ToList(),

                // Payments
                Payments = booking.Payments.Select(p => new PaymentSummaryDto
                {
                    Id = p.Id,
                    Amount = p.Amount,
                    PaymentMethod = p.PaymentMethod,
                    Status = p.Status,
                    CreatedAt = p.CreatedAt
                }).ToList()
            };
        }
        public async Task<bool> AdminCancelBookingAsync(int bookingId, int adminId, string reason, decimal? refundAmount = null)
        {
            var booking = await _context.Bookings
                .Include(b => b.Property)
                .Include(b => b.RoomType)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
            {
                await _auditLogService.LogActionAsync("ADMIN_CANCEL_FAILED", "Booking", bookingId, null, "Không tìm thấy đặt phòng");
                return false;
            }

            if (booking.Status == "cancelled" || booking.Status == "completed")
            {
                await _auditLogService.LogActionAsync("ADMIN_CANCEL_FAILED", "Booking", bookingId, null,
                    $"Không thể hủy đặt phòng với trạng thái: {booking.Status}");
                throw new InvalidOperationException("Không thể hủy đặt phòng này");
            }

            var oldValues = JsonSerializer.Serialize(new
            {
                booking.Id,
                booking.BookingCode,
                booking.Status,
                booking.PaymentStatus,
                booking.TotalAmount,
                booking.UpdatedAt
            });

            booking.Status = "cancelled";
            booking.CancelledAt = DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var newValues = JsonSerializer.Serialize(new
            {
                booking.Id,
                booking.BookingCode,
                booking.Status,
                booking.PaymentStatus,
                booking.TotalAmount,
                booking.UpdatedAt,
                booking.CancelledAt,
                AdminCancellation = true,
                CancelReason = reason,
                RefundAmount = refundAmount
            });

            await _auditLogService.LogUpdateAsync("Booking", booking.Id, oldValues, newValues);
            await _auditLogService.LogActionAsync("ADMIN_CANCEL_SUCCESS", "Booking", booking.Id,
                $"Admin hủy booking {booking.BookingCode}. Lý do: {reason}. Số tiền hoàn: {refundAmount}");

            // Thêm email vào queue - sử dụng đúng method trong interface
            if (!string.IsNullOrEmpty(booking.GuestEmail))
            {
                var nights = (int)(booking.CheckOut - booking.CheckIn).TotalDays;
                var emailData = new
                {
                    GuestName = booking.GuestName,
                    GuestPhone = booking.GuestPhone ?? "",
                    BookingCode = booking.BookingCode,
                    CheckIn = booking.CheckIn.ToString("yyyy-MM-dd"),
                    CheckOut = booking.CheckOut.ToString("yyyy-MM-dd"),
                    Nights = nights,
                    Adults = booking.Adults,
                    Children = booking.Children,
                    RoomsCount = booking.RoomsCount,
                    TotalAmount = booking.TotalAmount,
                    PropertyName = booking.Property?.Name,
                    RoomTypeName = booking.RoomType?.Name,
                    CancelReason = $"Hủy bởi quản trị viên: {reason}" + (refundAmount.HasValue ? $" (Hoàn tiền: {refundAmount:C})" : "")
                };

                // Sử dụng method có sẵn trong interface
                await _emailQueueService.QueueBookingCancelledAsync(
                    booking.CustomerId , // userId
                    booking.GuestEmail,
                    emailData
                );

                await _auditLogService.LogActionAsync("EMAIL_QUEUED", "Booking", booking.Id,
                    $"Email hủy booking đã được thêm vào queue cho {booking.GuestEmail}");
            }

            return true;
        }
        public async Task<AdminBookingStatisticsDto> GetBookingStatisticsAdminAsync(
     DateTime? fromDate = null,
     DateTime? toDate = null,
     int? propertyId = null,
     int? hostId = null)
        {
            var query = _context.Bookings
                .Include(b => b.Property)
                .Include(b => b.RefundTickets)
                .Include(b => b.Refunds)
                .AsQueryable();

            // Apply filters
            if (fromDate.HasValue)
                query = query.Where(b => b.BookingDate >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(b => b.BookingDate <= toDate.Value);

            if (propertyId.HasValue)
                query = query.Where(b => b.PropertyId == propertyId.Value);

            if (hostId.HasValue)
                query = query.Where(b => b.Property.HostId == hostId.Value);

            var bookings = await query.ToListAsync();
            var activeBookings = bookings.Where(b => b.Status != "cancelled").ToList();

            // Get unique customers and returning customers
            var customerBookingCounts = bookings
                .GroupBy(b => b.CustomerId)
                .Select(g => new { CustomerId = g.Key, Count = g.Count() })
                .ToList();

            var uniqueCustomers = customerBookingCounts.Count;
            var returningCustomers = customerBookingCounts.Count(c => c.Count > 1);

            return new AdminBookingStatisticsDto
            {
                // Basic Counts
                TotalBookings = bookings.Count,
                PendingBookings = bookings.Count(b => b.Status == "pending"),
                ConfirmedBookings = bookings.Count(b => b.Status == "confirmed"),
                CheckedInBookings = bookings.Count(b => b.Status == "checkedIn"),
                CompletedBookings = bookings.Count(b => b.Status == "completed"),
                CancelledBookings = bookings.Count(b => b.Status == "cancelled"),

                // Financial Statistics
                TotalRevenue = activeBookings.Sum(b => b.TotalAmount),
                PendingRevenue = bookings.Where(b => b.Status == "pending").Sum(b => b.TotalAmount),
                ConfirmedRevenue = bookings.Where(b => b.Status == "confirmed").Sum(b => b.TotalAmount),
                CompletedRevenue = bookings.Where(b => b.Status == "completed").Sum(b => b.TotalAmount),
                CancelledRevenue = bookings.Where(b => b.Status == "cancelled").Sum(b => b.TotalAmount),
                AverageBookingValue = activeBookings.Any() ? activeBookings.Average(b => b.TotalAmount) : 0,

                // Guest Statistics
                TotalGuests = activeBookings.Sum(b => b.Adults + b.Children),
                TotalAdults = activeBookings.Sum(b => b.Adults),
                TotalChildren = activeBookings.Sum(b => b.Children),
                AverageGuestsPerBooking = activeBookings.Any() ? activeBookings.Average(b => b.Adults + b.Children) : 0,

                // Room Statistics
                TotalRoomsBooked = activeBookings.Sum(b => b.RoomsCount),
                AverageRoomsPerBooking = activeBookings.Any() ? activeBookings.Average(b => b.RoomsCount) : 0,
                AverageNights = activeBookings.Any() ? activeBookings.Average(b => b.Nights) : 0,

                // Payment Statistics
                TotalPaid = bookings.Count(b => b.PaymentStatus == "paid"),
                TotalUnpaid = bookings.Count(b => b.PaymentStatus == "unpaid"),
                PaidAmount = bookings.Where(b => b.PaymentStatus == "paid").Sum(b => b.TotalAmount),
                UnpaidAmount = bookings.Where(b => b.PaymentStatus == "unpaid").Sum(b => b.TotalAmount),

                // Refund Statistics
                TotalRefundTickets = bookings.Sum(b => b.RefundTickets.Count),
                PendingRefundTickets = bookings.Sum(b => b.RefundTickets.Count(rt => rt.Status == "pending")),
                ApprovedRefundTickets = bookings.Sum(b => b.RefundTickets.Count(rt => rt.Status == "approved")),
                RejectedRefundTickets = bookings.Sum(b => b.RefundTickets.Count(rt => rt.Status == "rejected")),
                TotalRefundRequested = bookings.SelectMany(b => b.RefundTickets).Sum(rt => rt.RequestedAmount),
                TotalRefunded = bookings.SelectMany(b => b.Refunds).Sum(r => r.RefundedAmount),
                TotalRefundProcessed = bookings.Sum(b => b.Refunds.Count),

                // Source Statistics
                BookingsBySource = activeBookings
                    .GroupBy(b => b.BookingSource ?? "unknown")
                    .ToDictionary(g => g.Key, g => g.Count()),

                RevenueBySource = activeBookings
                    .GroupBy(b => b.BookingSource ?? "unknown")
                    .ToDictionary(g => g.Key, g => g.Sum(b => b.TotalAmount)),

                // Monthly Trends
                BookingsByMonth = bookings
                    .GroupBy(b => b.BookingDate.ToString("yyyy-MM"))
                    .ToDictionary(g => g.Key, g => g.Count()),

                RevenueByMonth = activeBookings
                    .GroupBy(b => b.BookingDate.ToString("yyyy-MM"))
                    .ToDictionary(g => g.Key, g => g.Sum(b => b.TotalAmount)),

                // Property Statistics
                BookingsByProperty = activeBookings
                    .GroupBy(b => new { b.PropertyId, b.Property.Name })
                    .ToDictionary(
                        g => g.Key.PropertyId,
                        g => new PropertyStatsDto
                        {
                            PropertyId = g.Key.PropertyId,
                            PropertyName = g.Key.Name,
                            TotalBookings = g.Count(),
                            TotalRevenue = g.Sum(b => b.TotalAmount),
                            AverageRating = 0 // Can be calculated from reviews if needed
                        }
                    ),

                // Customer Statistics
                UniqueCustomers = uniqueCustomers,
                ReturningCustomers = returningCustomers,
                ReturnRate = uniqueCustomers > 0 ? (double)returningCustomers / uniqueCustomers * 100 : 0
            };
        }

        // Cập nhật method CheckInAsync với ràng buộc thời gian
        public async Task<bool> CheckInAsync(int bookingId, int userId)
        {
            var booking = await _context.Bookings
                .Include(b => b.Property)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
            {
                await _auditLogService.LogActionAsync("CHECKIN_FAILED", "Booking", bookingId, null, "Không tìm thấy đặt phòng");
                return false;
            }

            // Kiểm tra quyền: chỉ host của property mới được check-in
            var isHost = await IsPropertyHostAsync(booking.PropertyId, userId);
            if (!isHost)
            {
                await _auditLogService.LogActionAsync("CHECKIN_FAILED", "Booking", bookingId, null,
                    $"Người dùng {userId} không có quyền check-in cho property {booking.PropertyId}");
                throw new UnauthorizedAccessException("Bạn không có quyền thực hiện check-in cho đặt phòng này");
            }

            if (booking.Status != "confirmed")
            {
                await _auditLogService.LogActionAsync("CHECKIN_FAILED", "Booking", bookingId, null,
                    $"Trạng thái không hợp lệ cho check-in: {booking.Status}");
                throw new InvalidOperationException("Chỉ có thể nhận phòng với đặt phòng đã được xác nhận");
            }

            // Kiểm tra thời gian check-in: không được quá sớm (phải trong ngày check-in)
            var today = DateTime.Now.Date;
            var checkInDate = booking.CheckIn.Date;

            if (today < checkInDate)
            {
                await _auditLogService.LogActionAsync("CHECKIN_FAILED", "Booking", bookingId, null,
                    $"Chưa đến ngày check-in. Ngày check-in: {checkInDate:dd/MM/yyyy}, Ngày hiện tại: {today:dd/MM/yyyy}");
                throw new InvalidOperationException($"Chưa đến ngày check-in ({checkInDate:dd/MM/yyyy}). Không thể nhận phòng trước ngày check-in.");
            }

            // Có thể check-in muộn nhưng cảnh báo nếu quá muộn (sau 3 ngày)
            if (today > checkInDate.AddDays(3))
            {
                await _auditLogService.LogActionAsync("CHECKIN_WARNING", "Booking", bookingId, null,
                    $"Check-in muộn hơn 3 ngày. Ngày check-in dự kiến: {checkInDate:dd/MM/yyyy}");
                // Không throw exception, chỉ log warning
            }

            var bookingForAudit = new
            {
                booking.Id,
                booking.BookingCode,
                booking.Status,
                booking.CheckIn,
                booking.CheckOut,
                booking.GuestName,
                booking.GuestEmail,
                booking.GuestPhone,
                booking.Adults,
                booking.Children,
                booking.RoomsCount,
                booking.TotalAmount,
                PropertyId = booking.Property?.Id,
                PropertyName = booking.Property?.Name,
                RoomTypeId = booking.RoomTypeId,
                booking.BookingDate,
                booking.UpdatedAt
            };

            var oldValues = JsonSerializer.Serialize(bookingForAudit);

            booking.Status = "checkedIn";
            booking.CheckedInAt = DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var newValues = JsonSerializer.Serialize(bookingForAudit);
            await _auditLogService.LogUpdateAsync("Booking", booking.Id, oldValues, newValues);

            return true;
        }

        // Cập nhật method ConfirmBookingAsync với ràng buộc thời gian
        public async Task<bool> ConfirmBookingAsync(int bookingId, int userId)
        {
            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b => b.Id == bookingId && b.CustomerId == userId);

            if (booking == null)
            {
                await _auditLogService.LogActionAsync("CONFIRM_FAILED", "Booking", bookingId, null, "Không tìm thấy đặt phòng");
                return false;
            }

            if (booking.Status != "pending")
            {
                await _auditLogService.LogActionAsync("CONFIRM_FAILED", "Booking", bookingId, null,
                    $"Trạng thái không hợp lệ: {booking.Status}");
                throw new InvalidOperationException("Chỉ có thể xác nhận đặt phòng đang chờ");
            }

            // Kiểm tra ngày check-in còn hợp lệ (không được trong quá khứ)
            if (booking.CheckIn.Date < DateTime.Now.Date)
            {
                await _auditLogService.LogActionAsync("CONFIRM_FAILED", "Booking", bookingId, null,
                    $"Ngày check-in đã qua: {booking.CheckIn:dd/MM/yyyy}");
                throw new InvalidOperationException("Không thể xác nhận đặt phòng có ngày check-in trong quá khứ");
            }

            // Kiểm tra tính khả dụng của phòng một lần nữa
            var isStillAvailable = await CheckRoomAvailabilityAsync(
                booking.PropertyId,
                booking.RoomTypeId,
                booking.CheckIn,
                booking.CheckOut,
                booking.RoomsCount
            );

            if (!isStillAvailable)
            {
                await _auditLogService.LogActionAsync("CONFIRM_FAILED", "Booking", bookingId, null,
                    "Phòng không còn khả dụng khi xác nhận");
                throw new InvalidOperationException("Phòng không còn khả dụng. Vui lòng chọn ngày khác.");
            }

            var oldValues = JsonSerializer.Serialize(booking);

            booking.Status = "confirmed";
            booking.ConfirmedAt = DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var newValues = JsonSerializer.Serialize(booking);
            await _auditLogService.LogUpdateAsync("Booking", booking.Id, oldValues, newValues);

            return true;
        }

        // Cập nhật method CancelBookingAsync với ràng buộc thời gian và phí hủy
        public async Task<bool> CancelBookingAsync(int bookingId, int userId, string? reason = null)
        {
            var booking = await _context.Bookings
                .Include(b => b.Property)
                .Include(b => b.RoomType)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
            {
                await _auditLogService.LogActionAsync("CANCEL_FAILED", "Booking", bookingId, null, "Không tìm thấy đặt phòng");
                return false;
            }

            // Kiểm tra quyền: customer hoặc host của property mới được cancel
            var isCustomer = booking.CustomerId == userId;
            var isHost = await IsPropertyHostAsync(booking.PropertyId, userId);

            if (!isCustomer && !isHost)
            {
                await _auditLogService.LogActionAsync("CANCEL_FAILED", "Booking", bookingId, null,
                    $"Người dùng {userId} không có quyền hủy đặt phòng này");
                throw new UnauthorizedAccessException("Bạn không có quyền hủy đặt phòng này");
            }

            if (booking.Status == "cancelled" || booking.Status == "completed")
            {
                await _auditLogService.LogActionAsync("CANCEL_FAILED", "Booking", bookingId, null,
                    $"Không thể hủy đặt phòng với trạng thái: {booking.Status}");
                throw new InvalidOperationException("Không thể hủy đặt phòng này");
            }

            // Kiểm tra thời gian hủy - không được hủy nếu đã check-in
            if (booking.Status == "checkedIn")
            {
                await _auditLogService.LogActionAsync("CANCEL_FAILED", "Booking", bookingId, null,
                    "Không thể hủy đặt phòng đã check-in");
                throw new InvalidOperationException("Không thể hủy đặt phòng đã nhận phòng");
            }

            // Kiểm tra thời gian hủy cho customer (không được hủy trong ngày check-in nếu đã confirmed)
            if (isCustomer && booking.Status == "confirmed")
            {
                var hoursUntilCheckIn = (booking.CheckIn - DateTime.Now).TotalHours;
                if (hoursUntilCheckIn < 24)
                {
                    await _auditLogService.LogActionAsync("CANCEL_FAILED", "Booking", bookingId, null,
                        $"Hủy quá muộn - còn {hoursUntilCheckIn:F1} giờ đến check-in");
                    throw new InvalidOperationException("Không thể hủy đặt phòng trong vòng 24h trước giờ check-in");
                }
            }

            // Thêm kiểm tra PaymentStatus
            if (booking.PaymentStatus == "paid" && isCustomer)
            {
                await _auditLogService.LogActionAsync("CANCEL_FAILED", "Booking", bookingId, null,
                    "Không thể hủy đặt phòng đã thanh toán - cần liên hệ support");
                throw new InvalidOperationException("Đặt phòng đã thanh toán không thể tự hủy. Vui lòng liên hệ bộ phận hỗ trợ.");
            }

            // Tính toán phí hủy (nếu là customer hủy)
            decimal cancellationFee = 0;
            if (isCustomer && booking.Status == "confirmed")
            {
                var daysUntilCheckIn = (booking.CheckIn.Date - DateTime.Now.Date).Days;
                if (daysUntilCheckIn < 7) // Hủy trong vòng 7 ngày
                {
                    cancellationFee = booking.TotalAmount * 0.1m; // 10% phí hủy
                }
            }

            var bookingForAudit = new
            {
                booking.Id,
                booking.BookingCode,
                booking.Status,
                booking.CheckIn,
                booking.CheckOut,
                booking.GuestName,
                booking.GuestEmail,
                booking.GuestPhone,
                booking.Adults,
                booking.Children,
                booking.RoomsCount,
                booking.TotalAmount,
                PropertyId = booking.Property?.Id,
                PropertyName = booking.Property?.Name,
                RoomTypeId = booking.RoomTypeId,
                booking.BookingDate,
                booking.UpdatedAt
            };

            var oldValues = JsonSerializer.Serialize(bookingForAudit);

            booking.Status = "cancelled";
            booking.CancelledAt = DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var newValues = JsonSerializer.Serialize(new
            {
                bookingForAudit.Id,
                bookingForAudit.BookingCode,
                Status = "cancelled",
                bookingForAudit.CheckIn,
                bookingForAudit.CheckOut,
                bookingForAudit.GuestName,
                bookingForAudit.GuestEmail,
                bookingForAudit.GuestPhone,
                bookingForAudit.Adults,
                bookingForAudit.Children,
                bookingForAudit.RoomsCount,
                bookingForAudit.TotalAmount,
                bookingForAudit.PropertyId,
                bookingForAudit.PropertyName,
                bookingForAudit.RoomTypeId,
                bookingForAudit.BookingDate,
                UpdatedAt = DateTime.UtcNow,
                CancelledAt = DateTime.UtcNow,
                CancelReason = reason,
                CancellationFee = cancellationFee,
                CancelledByCustomer = isCustomer,
                CancelledByHost = isHost
            });

            await _auditLogService.LogUpdateAsync("Booking", booking.Id, oldValues, newValues);

            // Log chi tiết về phí hủy
            if (cancellationFee > 0)
            {
                await _auditLogService.LogActionAsync("CANCELLATION_FEE_APPLIED", "Booking", booking.Id,
                    $"Áp dụng phí hủy {cancellationFee:C} cho booking {booking.BookingCode}");
            }

            // Thêm email vào queue - sử dụng đúng method trong interface
            if (!string.IsNullOrEmpty(booking.GuestEmail))
            {
                var nights = (int)(booking.CheckOut - booking.CheckIn).TotalDays;

                // Tạo lý do hủy chi tiết
                string cancelReasonText = reason ?? "Hủy bởi người dùng";
                if (isCustomer)
                {
                    cancelReasonText = reason ?? "Hủy bởi khách hàng";
                    if (cancellationFee > 0)
                    {
                        cancelReasonText += $" (Phí hủy: {cancellationFee:C})";
                    }
                }
                else if (isHost)
                {
                    cancelReasonText = reason ?? "Hủy bởi chủ nhà";
                }

                var emailData = new
                {
                    GuestName = booking.GuestName,
                    GuestPhone = booking.GuestPhone ?? "",
                    BookingCode = booking.BookingCode,
                    CheckIn = booking.CheckIn.ToString("yyyy-MM-dd"),
                    CheckOut = booking.CheckOut.ToString("yyyy-MM-dd"),
                    Nights = nights,
                    Adults = booking.Adults,
                    Children = booking.Children,
                    RoomsCount = booking.RoomsCount,
                    TotalAmount = booking.TotalAmount,
                    PropertyName = booking.Property?.Name,
                    RoomTypeName = booking.RoomType?.Name,
                    CancelReason = cancelReasonText
                };

                // Sử dụng method có sẵn trong interface
                await _emailQueueService.QueueBookingCancelledAsync(
                    userId,
                    booking.GuestEmail,
                    emailData
                );

                await _auditLogService.LogActionAsync("EMAIL_QUEUED", "Booking", booking.Id,
                    $"Email hủy booking đã được thêm vào queue cho {booking.GuestEmail}");
            }

            return true;
        }
        // Thêm method kiểm tra checkout constraints
        public async Task<bool> CheckOutAsync(int bookingId, int userId)
        {
            var booking = await _context.Bookings
                .Include(b => b.Property)
                .Include(b => b.RoomType)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
            {
                await _auditLogService.LogActionAsync("CHECKOUT_FAILED", "Booking", bookingId, null, "Không tìm thấy đặt phòng");
                return false;
            }

            // Kiểm tra quyền: chỉ host của property mới được check-out
            var isHost = await IsPropertyHostAsync(booking.PropertyId, userId);
            if (!isHost)
            {
                await _auditLogService.LogActionAsync("CHECKOUT_FAILED", "Booking", bookingId, null,
                    $"Người dùng {userId} không có quyền check-out cho property {booking.PropertyId}");
                throw new UnauthorizedAccessException("Bạn không có quyền thực hiện check-out cho đặt phòng này");
            }

            if (booking.Status != "checkedIn")
            {
                await _auditLogService.LogActionAsync("CHECKOUT_FAILED", "Booking", bookingId, null,
                    $"Trạng thái không hợp lệ cho check-out: {booking.Status}");
                throw new InvalidOperationException("Chỉ có thể trả phòng với đặt phòng đã nhận phòng");
            }

            // Kiểm tra thời gian check-out: không được check-out trước ngày check-out dự kiến quá sớm
            var today = DateTime.Now.Date;
            var expectedCheckOutDate = booking.CheckOut.Date;

            // Cho phép early checkout nhưng cảnh báo nếu quá sớm (trước 1 ngày)
            if (today < expectedCheckOutDate.AddDays(-1))
            {
                await _auditLogService.LogActionAsync("CHECKOUT_WARNING", "Booking", bookingId, null,
                    $"Early checkout: {today:dd/MM/yyyy} vs expected {expectedCheckOutDate:dd/MM/yyyy}");
                // Không throw exception, chỉ log warning
            }

            // Cảnh báo nếu checkout quá muộn (sau 1 ngày)
            if (today > expectedCheckOutDate.AddDays(1))
            {
                await _auditLogService.LogActionAsync("CHECKOUT_WARNING", "Booking", bookingId, null,
                    $"Late checkout: {today:dd/MM/yyyy} vs expected {expectedCheckOutDate:dd/MM/yyyy}");
            }

            var bookingForAudit = new
            {
                booking.Id,
                booking.BookingCode,
                booking.Status,
                booking.CheckIn,
                booking.CheckOut,
                booking.GuestName,
                booking.GuestEmail,
                booking.GuestPhone,
                booking.Adults,
                booking.Children,
                booking.RoomsCount,
                booking.TotalAmount,
                PropertyId = booking.Property?.Id,
                PropertyName = booking.Property?.Name,
                RoomTypeId = booking.RoomTypeId,
                RoomTypeName = booking.RoomType?.Name,
                booking.BookingDate,
                booking.UpdatedAt
            };

            var oldValues = JsonSerializer.Serialize(bookingForAudit);

            booking.Status = "completed";
            booking.CheckedOutAt = DateTime.UtcNow;
            booking.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var updatedBookingForAudit = new
            {
                booking.Id,
                booking.BookingCode,
                booking.Status,
                booking.CheckIn,
                booking.CheckOut,
                booking.GuestName,
                booking.GuestEmail,
                booking.GuestPhone,
                booking.Adults,
                booking.Children,
                booking.RoomsCount,
                booking.TotalAmount,
                PropertyId = booking.Property?.Id,
                PropertyName = booking.Property?.Name,
                RoomTypeId = booking.RoomTypeId,
                RoomTypeName = booking.RoomType?.Name,
                booking.BookingDate,
                booking.UpdatedAt,
                booking.CheckedOutAt
            };

            var newValues = JsonSerializer.Serialize(updatedBookingForAudit);
            await _auditLogService.LogUpdateAsync("Booking", booking.Id, oldValues, newValues);

            await _auditLogService.LogActionAsync(
                "CHECKOUT_SUCCESS",
                "Booking",
                booking.Id,
                null,
                $"Checkout thành công cho booking {booking.BookingCode}"
            );

            // Thêm thank you email vào queue
            if (!string.IsNullOrEmpty(booking.GuestEmail))
            {
                var nights = (int)(booking.CheckOut - booking.CheckIn).TotalDays;

                // Tạo review URL (có thể customize theo domain của bạn)
                var reviewUrl = $"https://yourdomain.com/review/{booking.BookingCode}";

                var thankYouData = new
                {
                    GuestName = booking.GuestName,
                    GuestPhone = booking.GuestPhone ?? "",
                    BookingCode = booking.BookingCode,
                    CheckIn = booking.CheckIn.ToString("yyyy-MM-dd"),
                    CheckOut = booking.CheckOut.ToString("yyyy-MM-dd"),
                    Nights = nights,
                    Adults = booking.Adults,
                    Children = booking.Children,
                    RoomsCount = booking.RoomsCount,
                    TotalAmount = booking.TotalAmount,
                    ReviewUrl = reviewUrl,
                    PropertyName = booking.Property?.Name,
                    RoomTypeName = booking.RoomType?.Name
                };

                // Sử dụng method có sẵn trong interface
                await _emailQueueService.QueueThankYouEmailAsync(
                    booking.CustomerId , // userId
                    booking.GuestEmail,
                    thankYouData
                );

                await _auditLogService.LogActionAsync("EMAIL_QUEUED", "Booking", booking.Id,
                    $"Email cảm ơn đã được thêm vào queue cho {booking.GuestEmail}");
            }

            return true;
        }
        public async Task<object?> GetAvailableDatesInMonthAsync(
    int propertyId,
    int roomTypeId,
    int year,
    int month,
    int roomsCount)
        {
            var roomType = await _context.RoomTypes
                .FirstOrDefaultAsync(rt => rt.Id == roomTypeId && rt.PropertyId == propertyId && rt.IsActive);

            if (roomType == null)
                return null;

            // Validate input
            if (year < DateTime.Now.Year || (year == DateTime.Now.Year && month < DateTime.Now.Month))
            {
                throw new ArgumentException("Không thể xem lịch của tháng trong quá khứ");
            }

            if (month < 1 || month > 12)
            {
                throw new ArgumentException("Tháng phải từ 1 đến 12");
            }

            if (roomsCount <= 0 || roomsCount > roomType.TotalRooms)
            {
                throw new ArgumentException($"Số lượng phòng phải từ 1 đến {roomType.TotalRooms}");
            }

            // Get first and last day of month
            var firstDayOfMonth = new DateTime(year, month, 1);
            var lastDayOfMonth = firstDayOfMonth.AddMonths(1).AddDays(-1);

            // Don't show past dates
            var startDate = firstDayOfMonth < DateTime.Now.Date ? DateTime.Now.Date : firstDayOfMonth;

            // Get all bookings in this month for this room type
            var bookingsInMonth = await _context.Bookings
                .Where(b => b.RoomTypeId == roomTypeId
                    && b.Status != "cancelled"
                    && b.CheckIn <= lastDayOfMonth
                    && b.CheckOut >= startDate)
                .Select(b => new
                {
                    b.CheckIn,
                    b.CheckOut,
                    b.RoomsCount
                })
                .ToListAsync();

            // Build calendar
            var calendar = new List<object>();
            var currentDate = startDate;

            while (currentDate <= lastDayOfMonth)
            {
                // Calculate booked rooms for this date
                var bookedRooms = bookingsInMonth
                    .Where(b => b.CheckIn <= currentDate && b.CheckOut > currentDate)
                    .Sum(b => b.RoomsCount);

                var availableRooms = roomType.TotalRooms - bookedRooms;
                var isAvailable = availableRooms >= roomsCount;
                var pricePerNight = GetPriceForDate(roomType, currentDate);
                var priceType = IsHoliday(currentDate) ? "holiday" : (IsWeekend(currentDate) ? "weekend" : "weekday");

                calendar.Add(new
                {
                    Date = currentDate.ToString("yyyy-MM-dd"),
                    DayOfWeek = currentDate.ToString("dddd"),
                    DayOfWeekShort = currentDate.ToString("ddd"),
                    Day = currentDate.Day,
                    IsAvailable = isAvailable,
                    AvailableRooms = availableRooms,
                    BookedRooms = bookedRooms,
                    TotalRooms = roomType.TotalRooms,
                    PricePerRoom = pricePerNight,
                    PriceType = priceType,
                    IsWeekend = IsWeekend(currentDate),
                    IsHoliday = IsHoliday(currentDate),
                    IsToday = currentDate.Date == DateTime.Now.Date,
                    IsPast = currentDate.Date < DateTime.Now.Date
                });

                currentDate = currentDate.AddDays(1);
            }

            // Summary statistics
            var availableDatesCount = calendar.Count(d => ((dynamic)d).IsAvailable);
            var unavailableDatesCount = calendar.Count - availableDatesCount;

            return new
            {
                PropertyId = propertyId,
                RoomTypeId = roomTypeId,
                RoomTypeName = roomType.Name,
                Year = year,
                Month = month,
                MonthName = firstDayOfMonth.ToString("MMMM"),
                RoomsCount = roomsCount,
                TotalRooms = roomType.TotalRooms,

                Summary = new
                {
                    TotalDays = calendar.Count,
                    AvailableDays = availableDatesCount,
                    UnavailableDays = unavailableDatesCount,
                    AvailabilityRate = calendar.Count > 0 ?
                        Math.Round((decimal)availableDatesCount / calendar.Count * 100, 2) : 0
                },

                Calendar = calendar,

                // Quick filters - just the dates
                AvailableDates = calendar
                    .Where(d => ((dynamic)d).IsAvailable)
                    .Select(d => ((dynamic)d).Date)
                    .ToList(),

                UnavailableDates = calendar
                    .Where(d => !((dynamic)d).IsAvailable)
                    .Select(d => ((dynamic)d).Date)
                    .ToList()
            };
        }
        public async Task<object?> CheckRoomAvailabilityDetailedAsync(
    int propertyId,
    int roomTypeId,
    DateTime checkIn,
    DateTime checkOut,
    int roomsCount,
    int adults,
    int children)
        {
            var roomType = await _context.RoomTypes
                .FirstOrDefaultAsync(rt => rt.Id == roomTypeId && rt.PropertyId == propertyId && rt.IsActive);

            if (roomType == null)
                return null;

            // Validate dates
            if (checkIn.Date < DateTime.Now.Date)
            {
                throw new ArgumentException("Ngày nhận phòng không thể là ngày trong quá khứ");
            }

            var nights = (checkOut.Date - checkIn.Date).Days;
            if (nights <= 0)
            {
                throw new ArgumentException("Ngày trả phòng phải sau ngày nhận phòng");
            }

            // Validate guest count
            if (adults <= 0 && children <= 0)
            {
                throw new ArgumentException("Phải có ít nhất 1 khách (người lớn hoặc trẻ em)");
            }

            if (adults > roomType.MaxAdults)
            {
                throw new ArgumentException($"Số lượng người lớn vượt quá giới hạn. Tối đa {roomType.MaxAdults} người lớn cho loại phòng này");
            }

            if (children > roomType.MaxChildren)
            {
                throw new ArgumentException($"Số lượng trẻ em vượt quá giới hạn. Tối đa {roomType.MaxChildren} trẻ em cho loại phòng này");
            }

            var totalGuests = adults + children;
            if (totalGuests > roomType.MaxGuests)
            {
                throw new ArgumentException($"Tổng số khách vượt quá giới hạn. Tối đa {roomType.MaxGuests} khách cho loại phòng này");
            }

            // Validate rooms count
            if (roomsCount <= 0)
            {
                throw new ArgumentException("Số lượng phòng phải lớn hơn 0");
            }

            if (roomsCount > roomType.TotalRooms)
            {
                throw new ArgumentException($"Số lượng phòng yêu cầu vượt quá số phòng có sẵn. Tối đa {roomType.TotalRooms} phòng");
            }

            // Check availability
            var conflictingBookings = await _context.Bookings
                .Where(b => b.RoomTypeId == roomTypeId
                    && b.Status != "cancelled"
                    && ((b.CheckIn < checkOut && b.CheckOut > checkIn)))
                .SumAsync(b => b.RoomsCount);

            var availableRooms = roomType.TotalRooms - conflictingBookings;
            var isAvailable = availableRooms >= roomsCount;

            return new
            {
                Available = isAvailable,
                PropertyId = propertyId,
                RoomTypeId = roomTypeId,
                RoomTypeName = roomType.Name,
                CheckIn = checkIn,
                CheckOut = checkOut,
                Nights = nights,
                RoomsCount = roomsCount,
                Adults = adults,
                Children = children,
                TotalGuests = totalGuests,
                AvailableRooms = availableRooms,
                TotalRooms = roomType.TotalRooms,
                MaxAdults = roomType.MaxAdults,
                MaxChildren = roomType.MaxChildren,
                MaxGuests = roomType.MaxGuests,
                ValidationPassed = isAvailable
            };
        }
        public async Task<bool> CheckRoomAvailabilityAsync(int propertyId, int roomTypeId, DateTime checkIn, DateTime checkOut, int roomsCount)
        {
            var roomType = await _context.RoomTypes
                .FirstOrDefaultAsync(rt => rt.Id == roomTypeId && rt.PropertyId == propertyId);

            if (roomType == null)
                return false;

            var conflictingBookings = await _context.Bookings
                .Where(b => b.RoomTypeId == roomTypeId
                    && b.Status != "cancelled"
                    && ((b.CheckIn < checkOut && b.CheckOut > checkIn)))
                .SumAsync(b => b.RoomsCount);

            var availableRooms = roomType.TotalRooms - conflictingBookings;
            return availableRooms >= roomsCount;
        }
        public async Task<object?> GetPriceQuoteAsync(
    int propertyId,
    int roomTypeId,
    DateTime checkIn,
    DateTime checkOut,
    int roomsCount)
        {
            var roomType = await _context.RoomTypes
                .FirstOrDefaultAsync(rt => rt.Id == roomTypeId && rt.PropertyId == propertyId && rt.IsActive);

            if (roomType == null)
                return null;

            // Validate dates
            if (checkIn.Date < DateTime.Now.Date)
            {
                throw new ArgumentException("Ngày nhận phòng không thể là ngày trong quá khứ");
            }

            var nights = (checkOut.Date - checkIn.Date).Days;
            if (nights <= 0)
            {
                throw new ArgumentException("Ngày trả phòng phải sau ngày nhận phòng");
            }

            // Validate rooms count
            if (roomsCount <= 0)
            {
                throw new ArgumentException("Số lượng phòng phải lớn hơn 0");
            }

            if (roomsCount > roomType.TotalRooms)
            {
                throw new ArgumentException($"Số lượng phòng yêu cầu vượt quá số phòng có sẵn. Tối đa {roomType.TotalRooms} phòng");
            }

            // Calculate pricing (same logic as CreateBooking)
            var roomPrice = CalculateRoomPrice(roomType, checkIn, checkOut, roomsCount);
            var timeBasedDiscountPercent = CalculateTimeBasedDiscount(roomType, nights);
            var timeBasedDiscountAmount = roomPrice * (timeBasedDiscountPercent / 100);

            decimal serverDiscountPercent = 0;
            var serverDiscountAmount = roomPrice * (serverDiscountPercent / 100);

            var totalDiscountPercent = timeBasedDiscountPercent + serverDiscountPercent;
            var totalDiscountAmount = timeBasedDiscountAmount + serverDiscountAmount;
            var subtotal = roomPrice - totalDiscountAmount;

            var serviceFee = CalculateServiceFee(subtotal, roomsCount, nights);
            var taxAmount = subtotal * 0.1m; // 10% tax
            var totalAmount = subtotal + taxAmount + serviceFee;

            // Build daily breakdown
            var dailyBreakdown = new List<object>();
            var currentDate = checkIn.Date;

            while (currentDate < checkOut.Date)
            {
                var pricePerNight = GetPriceForDate(roomType, currentDate);
                var priceType = IsHoliday(currentDate) ? "holiday" : (IsWeekend(currentDate) ? "weekend" : "weekday");

                dailyBreakdown.Add(new
                {
                    Date = currentDate.ToString("yyyy-MM-dd"),
                    DayOfWeek = currentDate.ToString("dddd"),
                    PriceType = priceType,
                    PricePerRoom = pricePerNight,
                    TotalForRooms = pricePerNight * roomsCount
                });

                currentDate = currentDate.AddDays(1);
            }

            return new
            {
                PropertyId = propertyId,
                RoomTypeId = roomTypeId,
                RoomTypeName = roomType.Name,
                CheckIn = checkIn,
                CheckOut = checkOut,
                Nights = nights,
                RoomsCount = roomsCount,

                // Pricing breakdown
                RoomPrice = roomPrice,
                DiscountPercent = totalDiscountPercent,
                DiscountAmount = totalDiscountAmount,
                Subtotal = subtotal,
                TaxAmount = taxAmount,
                TaxPercent = 10m,
                ServiceFee = serviceFee,
                TotalAmount = totalAmount,

                // Discount details
                WeeklyDiscountPercent = nights >= 7 ? roomType.WeeklyDiscountPercent : 0,
                MonthlyDiscountPercent = nights >= 30 ? roomType.MonthlyDiscountPercent : 0,
                AppliedDiscount = timeBasedDiscountPercent > 0 ?
                    (nights >= 30 ? "monthly" : "weekly") : "none",

                // Daily breakdown
                DailyBreakdown = dailyBreakdown,

                // Average price per night
                AveragePricePerNight = roomPrice / nights / roomsCount
            };
        }
        // Thêm vào BookingService class

        public async Task<byte[]> ExportBookingsAsync(
            string? status, DateTime? fromDate, DateTime? toDate,
            int? customerId, int? hostId, int? propertyId, string format)
        {
            var query = _context.Bookings
                .Include(b => b.Customer)
                .Include(b => b.Property)
                .Include(b => b.RoomType)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(status))
                query = query.Where(b => b.Status == status);
            if (fromDate.HasValue)
                query = query.Where(b => b.CheckIn >= fromDate.Value);
            if (toDate.HasValue)
                query = query.Where(b => b.CheckOut <= toDate.Value);
            if (customerId.HasValue)
                query = query.Where(b => b.CustomerId == customerId.Value);
            if (hostId.HasValue)
                query = query.Where(b => b.Property.HostId == hostId.Value);
            if (propertyId.HasValue)
                query = query.Where(b => b.PropertyId == propertyId.Value);

            var bookings = await query.OrderByDescending(b => b.BookingDate).ToListAsync();

            // Generate CSV
            var csv = new StringBuilder();
            csv.AppendLine("Booking Code,Customer,Property,Room Type,Check In,Check Out,Nights,Guests,Rooms,Total Amount,Status,Payment Status,Booking Date");

            foreach (var b in bookings)
            {
                csv.AppendLine($"{b.BookingCode},{b.Customer.FullName},{b.Property.Name},{b.RoomType.Name}," +
                    $"{b.CheckIn:yyyy-MM-dd},{b.CheckOut:yyyy-MM-dd},{b.Nights},{b.Adults + b.Children},{b.RoomsCount}," +
                    $"{b.TotalAmount},{b.Status},{b.PaymentStatus},{b.BookingDate:yyyy-MM-dd HH:mm}");
            }

            return Encoding.UTF8.GetBytes(csv.ToString());
        }

      

        public async Task<bool> UpdateBookingStatusAsync(int bookingId, string newStatus, int adminId, string? note = null)
        {
            var booking = await _context.Bookings.FindAsync(bookingId);
            if (booking == null) return false;

            var validStatuses = new[] { "pending", "confirmed", "checkedIn", "completed", "cancelled" };
            if (!validStatuses.Contains(newStatus))
                throw new InvalidOperationException("Trạng thái không hợp lệ");

            var oldValues = JsonSerializer.Serialize(new { booking.Status, booking.UpdatedAt });

            booking.Status = newStatus;
            booking.UpdatedAt = DateTime.UtcNow;

            if (newStatus == "confirmed" && !booking.ConfirmedAt.HasValue)
                booking.ConfirmedAt = DateTime.UtcNow;
            else if (newStatus == "checkedIn" && !booking.CheckedInAt.HasValue)
                booking.CheckedInAt = DateTime.UtcNow;
            else if (newStatus == "completed" && !booking.CheckedOutAt.HasValue)
                booking.CheckedOutAt = DateTime.UtcNow;
            else if (newStatus == "cancelled" && !booking.CancelledAt.HasValue)
                booking.CancelledAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var newValues = JsonSerializer.Serialize(new { booking.Status, booking.UpdatedAt, AdminNote = note });
            await _auditLogService.LogUpdateAsync("Booking", bookingId, oldValues, newValues);

            return true;
        }

        public async Task<bool> UpdatePaymentStatusAsync(int bookingId, string newPaymentStatus, int adminId, string? note = null)
        {
            var booking = await _context.Bookings.FindAsync(bookingId);
            if (booking == null) return false;

            var validStatuses = new[] { "unpaid", "paid", "refunded", "partial_refund" };
            if (!validStatuses.Contains(newPaymentStatus))
                throw new InvalidOperationException("Trạng thái thanh toán không hợp lệ");

            var oldValues = JsonSerializer.Serialize(new { booking.PaymentStatus, booking.UpdatedAt });

            booking.PaymentStatus = newPaymentStatus;
            booking.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var newValues = JsonSerializer.Serialize(new { booking.PaymentStatus, booking.UpdatedAt, AdminNote = note });
            await _auditLogService.LogUpdateAsync("Booking", bookingId, oldValues, newValues);

            return true;
        }

        public async Task<DashboardOverviewDto> GetDashboardOverviewAsync(DateTime? fromDate, DateTime? toDate)
        {
            var query = _context.Bookings.AsQueryable();

            if (fromDate.HasValue)
                query = query.Where(b => b.BookingDate >= fromDate.Value);
            if (toDate.HasValue)
                query = query.Where(b => b.BookingDate <= toDate.Value);

            var bookings = await query.ToListAsync();

            // Count pending refund tickets
            var pendingRefundTickets = await _context.RefundTickets
                .CountAsync(rt => rt.Status == "pending");

            return new DashboardOverviewDto
            {
                TotalBookings = bookings.Count,
                TotalRevenue = bookings.Where(b => b.Status != "cancelled").Sum(b => b.TotalAmount),
                PendingBookings = bookings.Count(b => b.Status == "pending"),
                ConfirmedBookings = bookings.Count(b => b.Status == "confirmed"),
                CheckedInBookings = bookings.Count(b => b.Status == "checkedIn"),
                CompletedBookings = bookings.Count(b => b.Status == "completed"),
                CancelledBookings = bookings.Count(b => b.Status == "cancelled"),
                PendingRefundTickets = pendingRefundTickets,
                TotalGuests = bookings.Where(b => b.Status != "cancelled").Sum(b => b.Adults + b.Children),
                AverageBookingValue = bookings.Any() ? bookings.Where(b => b.Status != "cancelled").Average(b => b.TotalAmount) : 0,
                OccupancyRate = CalculateOccupancyRate(bookings)
            };
        }

        public async Task<RevenueChartDto> GetRevenueChartAsync(DateTime? fromDate, DateTime? toDate, string groupBy)
        {
            var query = _context.Bookings
                .Where(b => b.Status != "cancelled")
                .AsQueryable();

            if (fromDate.HasValue)
                query = query.Where(b => b.BookingDate >= fromDate.Value);
            if (toDate.HasValue)
                query = query.Where(b => b.BookingDate <= toDate.Value);

            var bookings = await query.ToListAsync();

            var chartData = groupBy.ToLower() switch
            {
                "day" => bookings.GroupBy(b => b.BookingDate.Date)
                    .Select(g => new RevenueDataPoint
                    {
                        Period = g.Key.ToString("yyyy-MM-dd"),
                        Revenue = g.Sum(b => b.TotalAmount),
                        BookingCount = g.Count()
                    }).OrderBy(d => d.Period).ToList(),

                "week" => bookings.GroupBy(b => CultureInfo.CurrentCulture.Calendar.GetWeekOfYear(
                        b.BookingDate, CalendarWeekRule.FirstDay, DayOfWeek.Monday))
                    .Select(g => new RevenueDataPoint
                    {
                        Period = $"Week {g.Key}",
                        Revenue = g.Sum(b => b.TotalAmount),
                        BookingCount = g.Count()
                    }).OrderBy(d => d.Period).ToList(),

                "month" => bookings.GroupBy(b => b.BookingDate.ToString("yyyy-MM"))
                    .Select(g => new RevenueDataPoint
                    {
                        Period = g.Key,
                        Revenue = g.Sum(b => b.TotalAmount),
                        BookingCount = g.Count()
                    }).OrderBy(d => d.Period).ToList(),

                _ => bookings.GroupBy(b => b.BookingDate.ToString("yyyy-MM"))
                    .Select(g => new RevenueDataPoint
                    {
                        Period = g.Key,
                        Revenue = g.Sum(b => b.TotalAmount),
                        BookingCount = g.Count()
                    }).OrderBy(d => d.Period).ToList()
            };

            return new RevenueChartDto
            {
                GroupBy = groupBy,
                Data = chartData,
                TotalRevenue = chartData.Sum(d => d.Revenue),
                TotalBookings = chartData.Sum(d => d.BookingCount)
            };
        }

        public async Task<BookingTrendsDto> GetBookingTrendsAsync(DateTime? fromDate, DateTime? toDate)
        {
            var query = _context.Bookings.AsQueryable();

            if (fromDate.HasValue)
                query = query.Where(b => b.BookingDate >= fromDate.Value);
            if (toDate.HasValue)
                query = query.Where(b => b.BookingDate <= toDate.Value);

            var bookings = await query.ToListAsync();

            var monthlyTrends = bookings
                .GroupBy(b => b.BookingDate.ToString("yyyy-MM"))
                .Select(g => new MonthlyTrendDto
                {
                    Month = g.Key,
                    TotalBookings = g.Count(),
                    Revenue = g.Where(b => b.Status != "cancelled").Sum(b => b.TotalAmount),
                    CancellationRate = g.Any() ? (decimal)g.Count(b => b.Status == "cancelled") / g.Count() * 100 : 0
                })
                .OrderBy(t => t.Month)
                .ToList();

            return new BookingTrendsDto
            {
                MonthlyTrends = monthlyTrends,
                OverallGrowthRate = CalculateGrowthRate(monthlyTrends)
            };
        }

        public async Task<IEnumerable<TopPropertyDto>> GetTopPropertiesAsync(DateTime? fromDate, DateTime? toDate, int top)
        {
            var query = _context.Bookings
                .Include(b => b.Property)
                .Where(b => b.Status != "cancelled")
                .AsQueryable();

            if (fromDate.HasValue)
                query = query.Where(b => b.BookingDate >= fromDate.Value);
            if (toDate.HasValue)
                query = query.Where(b => b.BookingDate <= toDate.Value);

            var topProperties = await query
                .GroupBy(b => new { b.PropertyId, b.Property.Name })
                .Select(g => new TopPropertyDto
                {
                    PropertyId = g.Key.PropertyId,
                    PropertyName = g.Key.Name,
                    TotalBookings = g.Count(),
                    TotalRevenue = g.Sum(b => b.TotalAmount),
                    AverageBookingValue = g.Average(b => b.TotalAmount)
                })
                .OrderByDescending(p => p.TotalRevenue)
                .Take(top)
                .ToListAsync();

            return topProperties;
        }

        public async Task<IEnumerable<TopCustomerDto>> GetTopCustomersAsync(DateTime? fromDate, DateTime? toDate, int top)
        {
            var query = _context.Bookings
                .Include(b => b.Customer)
                .Where(b => b.Status != "cancelled")
                .AsQueryable();

            if (fromDate.HasValue)
                query = query.Where(b => b.BookingDate >= fromDate.Value);
            if (toDate.HasValue)
                query = query.Where(b => b.BookingDate <= toDate.Value);

            var topCustomers = await query
                .GroupBy(b => new { b.CustomerId, b.Customer.FullName, b.Customer.Email })
                .Select(g => new TopCustomerDto
                {
                    CustomerId = g.Key.CustomerId,
                    CustomerName = g.Key.FullName,
                    CustomerEmail = g.Key.Email,
                    TotalBookings = g.Count(),
                    TotalSpent = g.Sum(b => b.TotalAmount),
                    AverageSpent = g.Average(b => b.TotalAmount)
                })
                .OrderByDescending(c => c.TotalSpent)
                .Take(top)
                .ToListAsync();

            return topCustomers;
        }

        public async Task<DashboardAlertsDto> GetDashboardAlertsAsync()
        {
            var today = DateTime.Now.Date;
            var tomorrow = today.AddDays(1);

            var pendingBookings = await _context.Bookings
                .Where(b => b.Status == "pending" && b.CheckIn >= today)
                .CountAsync();

            var checkInsToday = await _context.Bookings
                .Where(b => b.Status == "confirmed" && b.CheckIn.Date == today)
                .CountAsync();

            var checkOutsToday = await _context.Bookings
                .Where(b => b.Status == "checkedIn" && b.CheckOut.Date == today)
                .CountAsync();

            var lateCheckouts = await _context.Bookings
                .Where(b => b.Status == "checkedIn" && b.CheckOut.Date < today)
                .CountAsync();

            var unpaidBookings = await _context.Bookings
                .Where(b => b.PaymentStatus == "unpaid" && b.Status != "cancelled" && b.CheckIn.Date <= tomorrow)
                .CountAsync();

            var pendingRefunds = await _context.RefundTickets
                .CountAsync(rt => rt.Status == "pending");

            return new DashboardAlertsDto
            {
                PendingBookingsCount = pendingBookings,
                CheckInsTodayCount = checkInsToday,
                CheckOutsTodayCount = checkOutsToday,
                LateCheckoutsCount = lateCheckouts,
                UnpaidBookingsCount = unpaidBookings,
                PendingRefundsCount = pendingRefunds,
                TotalAlertsCount = pendingBookings + lateCheckouts + unpaidBookings + pendingRefunds
            };
        }

        private decimal CalculateOccupancyRate(List<Booking> bookings)
        {
            // Simplified calculation - can be enhanced based on actual room availability
            var totalNights = bookings.Where(b => b.Status != "cancelled").Sum(b => b.Nights * b.RoomsCount);
            var totalAvailableNights = _context.RoomTypes.Sum(rt => rt.TotalRooms) * 30; // Assume 30 days
            return totalAvailableNights > 0 ? (decimal)totalNights / totalAvailableNights * 100 : 0;
        }

        private decimal CalculateGrowthRate(List<MonthlyTrendDto> trends)
        {
            if (trends.Count < 2) return 0;
            var first = trends.First().TotalBookings;
            var last = trends.Last().TotalBookings;
            return first > 0 ? ((decimal)(last - first) / first) * 100 : 0;
        }


        public async Task<byte[]> GenerateBookingReceiptPdfAsync(int bookingId)
        {
            var booking = await _context.Bookings
                .Include(b => b.Customer)
                .Include(b => b.Property)
                .Include(b => b.RoomType)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
                throw new InvalidOperationException("Booking not found");

            QuestPDF.Settings.License = LicenseType.Community;

            var pdfBytes = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.DefaultTextStyle(x => x.FontSize(11));

                    page.Header().Column(column =>
                    {
                        column.Item().AlignCenter().Text("HÓA ĐƠN ĐẶT PHÒNG").FontSize(20).Bold();
                        column.Item().AlignCenter().Text($"Mã: {booking.BookingCode}").FontSize(12);
                        column.Item().AlignCenter().Text($"Ngày: {DateTime.Now:dd/MM/yyyy}").FontSize(10);
                    });

                    page.Content().PaddingVertical(1, Unit.Centimetre).Column(column =>
                    {
                        // Customer Info
                        column.Item().Text("THÔNG TIN KHÁCH HÀNG").Bold().FontSize(14);
                        column.Item().PaddingBottom(5).BorderBottom(1).BorderColor(Colors.Grey.Medium);
                        column.Item().PaddingVertical(5).Row(row =>
                        {
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text($"Họ tên: {booking.Customer.FullName}");
                                col.Item().Text($"Email: {booking.Customer.Email}");
                                col.Item().Text($"Điện thoại: {booking.Customer.Phone}");
                            });
                        });

                        column.Item().PaddingTop(10);

                        // Property Info
                        column.Item().Text("THÔNG TIN CHỖ NGHỈ").Bold().FontSize(14);
                        column.Item().PaddingBottom(5).BorderBottom(1).BorderColor(Colors.Grey.Medium);
                        column.Item().PaddingVertical(5).Row(row =>
                        {
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text($"Tên: {booking.Property.Name}");
                                col.Item().Text($"Loại phòng: {booking.RoomType.Name}");
                                col.Item().Text($"Địa chỉ: {booking.Property.AddressDetail}");
                            });
                        });

                        column.Item().PaddingTop(10);

                        // Booking Details
                        var nights = (int)(booking.CheckOut - booking.CheckIn).TotalDays;
                        column.Item().Text("CHI TIẾT ĐẶT PHÒNG").Bold().FontSize(14);
                        column.Item().PaddingBottom(5).BorderBottom(1).BorderColor(Colors.Grey.Medium);

                        column.Item().PaddingVertical(10).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3);
                                columns.RelativeColumn(1);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                            });

                            // Header
                            table.Header(header =>
                            {
                                header.Cell().Background(Colors.Grey.Lighten2).Padding(5).Text("Mô tả").Bold();
                                header.Cell().Background(Colors.Grey.Lighten2).Padding(5).Text("SL").Bold();
                                header.Cell().Background(Colors.Grey.Lighten2).Padding(5).AlignRight().Text("Đơn giá").Bold();
                                header.Cell().Background(Colors.Grey.Lighten2).Padding(5).AlignRight().Text("Thành tiền").Bold();
                            });

                            // Room Price
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(5)
                                .Text($"Phòng ({nights} đêm × {booking.RoomsCount} phòng)");
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(5)
                                .Text($"{nights * booking.RoomsCount}");
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(5)
                                .AlignRight().Text($"{booking.RoomPrice / nights / booking.RoomsCount:N0} ₫");
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(5)
                                .AlignRight().Text($"{booking.RoomPrice:N0} ₫");

                            // Discount
                            if (booking.DiscountAmount > 0)
                            {
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(5).Text("Giảm giá");
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(5).Text("-");
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(5).AlignRight().Text("-");
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(5)
                                    .AlignRight().Text($"-{booking.DiscountAmount:N0} ₫");
                            }

                            // Service Fee
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(5).Text("Phí dịch vụ");
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(5).Text("-");
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(5).AlignRight().Text("-");
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(5)
                                .AlignRight().Text($"{booking.ServiceFee:N0} ₫");

                            // Tax
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(5).Text("Thuế VAT (10%)");
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(5).Text("-");
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(5).AlignRight().Text("-");
                            table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(5)
                                .AlignRight().Text($"{booking.TaxAmount:N0} ₫");

                            // Total
                            table.Cell().ColumnSpan(3).Background(Colors.Grey.Lighten3).Padding(5).Text("TỔNG CỘNG").Bold();
                            table.Cell().Background(Colors.Grey.Lighten3).Padding(5).AlignRight()
                                .Text($"{booking.TotalAmount:N0} ₫").Bold().FontSize(14);
                        });

                        column.Item().PaddingTop(15);

                        // Additional Info
                        column.Item().Row(row =>
                        {
                            row.RelativeItem().Column(col =>
                            {
                                col.Item().Text($"Nhận phòng: {booking.CheckIn:dd/MM/yyyy HH:mm}");
                                col.Item().Text($"Trả phòng: {booking.CheckOut:dd/MM/yyyy HH:mm}");
                                col.Item().Text($"Số khách: {booking.Adults} người lớn, {booking.Children} trẻ em");
                                col.Item().Text($"Trạng thái: {booking.Status}");
                                col.Item().Text($"Thanh toán: {booking.PaymentStatus}");
                            });
                        });
                    });

                    page.Footer().AlignCenter().Text("Cảm ơn quý khách đã sử dụng dịch vụ!");
                });
            }).GeneratePdf();

            await _auditLogService.LogActionAsync("RECEIPT_GENERATED", "Booking", bookingId,
                $"Receipt generated for booking {booking.BookingCode}");

            return pdfBytes;
        }
        #region Private Helper Methods

        private decimal CalculateRoomPrice(RoomType roomType, DateTime checkIn, DateTime checkOut, int roomsCount)
        {
            decimal totalPrice = 0;
            var currentDate = checkIn.Date;

            while (currentDate < checkOut.Date)
            {
                decimal pricePerNight = GetPriceForDate(roomType, currentDate);
                totalPrice += pricePerNight * roomsCount;
                currentDate = currentDate.AddDays(1);
            }

            return totalPrice;
        }

        private decimal GetPriceForDate(RoomType roomType, DateTime date)
        {
            if (IsHoliday(date))
            {
                return roomType.HolidayPrice ?? roomType.WeekendPrice ?? roomType.BasePrice;
            }

            if (IsWeekend(date))
            {
                return roomType.WeekendPrice ?? roomType.BasePrice;
            }

            return roomType.BasePrice;
        }

        private bool IsWeekend(DateTime date)
        {
            return date.DayOfWeek == DayOfWeek.Friday ||
                   date.DayOfWeek == DayOfWeek.Saturday ||
                   date.DayOfWeek == DayOfWeek.Sunday;
        }

        private bool IsHoliday(DateTime date)
        {
            var holidays = new List<DateTime>
            {
                new DateTime(date.Year, 1, 1),   // New Year
                new DateTime(date.Year, 4, 30),  // Liberation Day
                new DateTime(date.Year, 5, 1),   // Labor Day
                new DateTime(date.Year, 9, 2),   // National Day
            };

            return holidays.Any(h => h.Date == date.Date);
        }

        private decimal CalculateTimeBasedDiscount(RoomType roomType, int nights)
        {
            if (nights >= 30)
            {
                return roomType.MonthlyDiscountPercent;
            }

            if (nights >= 7)
            {
                return roomType.WeeklyDiscountPercent;
            }

            return 0;
        }

        private decimal CalculateServiceFee(decimal subtotal, int roomsCount, int nights)
        {
            if (subtotal < 1000000m) // Under 1M VND
            {
                return subtotal * 0.02m; // 2%
            }
            else if (subtotal < 5000000m) // 1M - 5M VND
            {
                return subtotal * 0.03m; // 3%
            }
            else if (subtotal < 10000000m) // 5M - 10M VND
            {
                return subtotal * 0.035m; // 3.5%
            }
            else // Above 10M VND
            {
                return subtotal * 0.04m; // 4%
            }
        }

        private string GenerateBookingCode()
        {
            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            var random = new Random().Next(1000, 9999);
            return $"BK{timestamp}{random}";
        }

        #endregion
    }
}