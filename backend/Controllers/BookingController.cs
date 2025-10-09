using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QBooking.Dtos.Request;
using QBooking.Dtos.Response;
using QBooking.Services;
using System.Security.Claims;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly IBookingService _bookingService;
        private readonly ILogger<BookingController> _logger;

        public BookingController(
            IBookingService bookingService,
            ILogger<BookingController> logger)
        {
            _bookingService = bookingService;
            _logger = logger;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }

        private string GetUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? "";
        }

        #region Customer Endpoints

        // GET: api/booking/my-bookings
        [HttpGet("my-bookings")]
        [Authorize(Roles = "customer")]
        public async Task<IActionResult> GetMyBookings(
            [FromQuery] string? bookingCode = null,
            [FromQuery] string? propertyName = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string? status = null,
            [FromQuery] string? paymentStatus = null)
        {
            try
            {
                var userId = GetUserId();
                var bookings = await _bookingService.GetBookingsByUserIdAsync(
                    userId, bookingCode, propertyName, fromDate, toDate, status, paymentStatus);

                return Ok(new
                {
                    Success = true,
                    Message = "Lấy danh sách đặt phòng thành công",
                    Data = bookings
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user bookings");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi lấy danh sách đặt phòng"
                });
            }
        }

        // GET: api/booking/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "customer")]
        public async Task<IActionResult> GetBookingDetail(int id)
        {
            try
            {
                var userId = GetUserId();
                var booking = await _bookingService.GetBookingDetailAsync(id, userId);

                if (booking == null)
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Không tìm thấy đặt phòng"
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Message = "Lấy chi tiết đặt phòng thành công",
                    Data = booking
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting booking detail");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi lấy chi tiết đặt phòng"
                });
            }
        }

        // GET: api/booking/code/{bookingCode}
        [HttpGet("code/{bookingCode}")]
        [Authorize(Roles = "customer")]
        public async Task<IActionResult> GetBookingDetailByCode(string bookingCode)
        {
            try
            {
                var userId = GetUserId();
                var booking = await _bookingService.GetBookingDetailByCodeAsync(bookingCode, userId);

                if (booking == null)
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Không tìm thấy đặt phòng"
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Message = "Lấy chi tiết đặt phòng thành công",
                    Data = booking
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting booking by code");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        // POST: api/booking
        [HttpPost]
        [Authorize(Roles = "customer")]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
        {
            try
            {
                var userId = GetUserId();
                var booking = await _bookingService.CreateBookingAsync(request, userId);

                return Ok(new
                {
                    Success = true,
                    Message = "Đặt phòng thành công",
                    Data = booking
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating booking");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi đặt phòng"
                });
            }
        }

        // PUT: api/booking/{id}/confirm
        [HttpPut("{id}/confirm")]
        [Authorize(Roles = "customer")]
        public async Task<IActionResult> ConfirmBooking(int id)
        {
            try
            {
                var userId = GetUserId();
                var result = await _bookingService.ConfirmBookingAsync(id, userId);

                if (!result)
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Không tìm thấy đặt phòng"
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Message = "Xác nhận đặt phòng thành công"
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming booking");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        // PUT: api/booking/{id}/cancel
        [HttpPut("{id}/cancel")]
        [Authorize(Roles = "customer,host")]
        public async Task<IActionResult> CancelBooking(int id, [FromBody] CancelBookingRequest? request = null)
        {
            try
            {
                var userId = GetUserId();
                var result = await _bookingService.CancelBookingAsync(id, userId, request?.Reason);

                if (!result)
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Không tìm thấy đặt phòng"
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Message = "Hủy đặt phòng thành công"
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling booking");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        // GET: api/booking/check-availability
        [HttpGet("check-availability")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckAvailability(
            [FromQuery] int propertyId,
            [FromQuery] int roomTypeId,
            [FromQuery] DateTime checkIn,
            [FromQuery] DateTime checkOut,
            [FromQuery] int roomsCount)
        {
            try
            {
                var isAvailable = await _bookingService.CheckRoomAvailabilityAsync(
                    propertyId, roomTypeId, checkIn, checkOut, roomsCount);

                return Ok(new
                {
                    Success = true,
                    Data = new { Available = isAvailable }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking availability");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        // GET: api/booking/check-availability-detailed
        [HttpGet("check-availability-detailed")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckAvailabilityDetailed(
            [FromQuery] int propertyId,
            [FromQuery] int roomTypeId,
            [FromQuery] DateTime checkIn,
            [FromQuery] DateTime checkOut,
            [FromQuery] int roomsCount,
            [FromQuery] int adults,
            [FromQuery] int children)
        {
            try
            {
                var result = await _bookingService.CheckRoomAvailabilityDetailedAsync(
                    propertyId, roomTypeId, checkIn, checkOut, roomsCount, adults, children);

                if (result == null)
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Không tìm thấy loại phòng"
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Data = result
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking detailed availability");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        // GET: api/booking/available-dates
        [HttpGet("available-dates")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAvailableDates(
            [FromQuery] int propertyId,
            [FromQuery] int roomTypeId,
            [FromQuery] int year,
            [FromQuery] int month,
            [FromQuery] int roomsCount)
        {
            try
            {
                var result = await _bookingService.GetAvailableDatesInMonthAsync(
                    propertyId, roomTypeId, year, month, roomsCount);

                if (result == null)
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Không tìm thấy loại phòng"
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Data = result
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available dates");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        // GET: api/booking/price-quote
        [HttpGet("price-quote")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPriceQuote(
            [FromQuery] int propertyId,
            [FromQuery] int roomTypeId,
            [FromQuery] DateTime checkIn,
            [FromQuery] DateTime checkOut,
            [FromQuery] int roomsCount)
        {
            try
            {
                var result = await _bookingService.GetPriceQuoteAsync(
                    propertyId, roomTypeId, checkIn, checkOut, roomsCount);

                if (result == null)
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Không tìm thấy loại phòng"
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Data = result
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting price quote");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        // GET: api/booking/{id}/receipt
        [HttpGet("{id}/receipt")]
        [Authorize(Roles = "customer")]
        public async Task<IActionResult> GetBookingReceipt(int id)
        {
            try
            {
                var pdfBytes = await _bookingService.GenerateBookingReceiptPdfAsync(id);
                return File(pdfBytes, "application/pdf", $"booking-receipt-{id}.pdf");
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating receipt");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        #endregion

        #region Host Endpoints

        // GET: api/booking/host/bookings
        [HttpGet("host/bookings")]
        [Authorize(Roles = "host,admin")]
        public async Task<IActionResult> GetHostBookings(
            [FromQuery] string? status = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int propertyId = 0)
        {
            try
            {
                var userId = GetUserId();
                var userRole = GetUserRole();
                var bookings = await _bookingService.GetHostBookingsAsync(
                    userId, userRole, status, fromDate, toDate, propertyId);

                return Ok(new
                {
                    Success = true,
                    Message = "Lấy danh sách đặt phòng thành công",
                    Data = bookings
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting host bookings");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        // GET: api/booking/host/{id}/detail
        [HttpGet("host/{id}/detail")]
        [Authorize(Roles = "host,admin")]
        public async Task<IActionResult> GetHostBookingDetail(int id)
        {
            try
            {
                var userId = GetUserId();
                var userRole = GetUserRole();
                var booking = await _bookingService.GetHostBookingDetailAsync(id, userId, userRole);

                if (booking == null)
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Không tìm thấy đặt phòng"
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Data = booking
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting host booking detail");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        // PUT: api/booking/{id}/checkin
        [HttpPut("{id}/checkin")]
        [Authorize(Roles = "host")]
        public async Task<IActionResult> CheckIn(int id)
        {
            try
            {
                var userId = GetUserId();
                var result = await _bookingService.CheckInAsync(id, userId);

                if (!result)
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Không tìm thấy đặt phòng"
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Message = "Check-in thành công"
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking in");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        // PUT: api/booking/{id}/checkout
        [HttpPut("{id}/checkout")]
        [Authorize(Roles = "host")]
        public async Task<IActionResult> CheckOut(int id)
        {
            try
            {
                var userId = GetUserId();
                var result = await _bookingService.CheckOutAsync(id, userId);

                if (!result)
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Không tìm thấy đặt phòng"
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Message = "Check-out thành công"
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking out");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        // GET: api/booking/host/statistics
        [HttpGet("host/statistics")]
        [Authorize(Roles = "host,admin")]
        public async Task<IActionResult> GetHostStatistics(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int? propertyId = null)
        {
            try
            {
                var userId = GetUserId();
                var userRole = GetUserRole();
                var stats = await _bookingService.GetBookingStatisticsAsync(
                    userId, userRole, fromDate, toDate, propertyId);

                return Ok(new
                {
                    Success = true,
                    Data = stats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting host statistics");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        #endregion

        #region Admin Endpoints

        // GET: api/booking/admin/all
        [HttpGet("admin/all")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAllBookingsAdmin(
            [FromQuery] string? status = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int? customerId = null,
            [FromQuery] int? hostId = null,
            [FromQuery] int? propertyId = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                var result = await _bookingService.GetAllBookingsAdminAsync(
                    status, fromDate, toDate, customerId, hostId, propertyId, page, pageSize);

                return Ok(new
                {
                    Success = true,
                    Data = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all bookings");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        // GET: api/booking/{id}/admin-detail
        [HttpGet("{id}/admin-detail")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetBookingDetailAdmin(int id)
        {
            try
            {
                var booking = await _bookingService.GetBookingDetailAdminAsync(id);

                if (booking == null)
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Không tìm thấy đặt phòng"
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Data = booking
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting admin booking detail");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        // GET: api/booking/admin/statistics
        [HttpGet("admin/statistics")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAdminStatistics(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int? propertyId = null,
            [FromQuery] int? hostId = null)
        {
            try
            {
                var stats = await _bookingService.GetBookingStatisticsAdminAsync(
                    fromDate, toDate, propertyId, hostId);

                return Ok(new
                {
                    Success = true,
                    Data = stats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting admin statistics");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        // PUT: api/booking/{id}/admin-cancel
        [HttpPut("{id}/admin-cancel")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> AdminCancelBooking(
            int id,
            [FromBody] AdminCancelBookingRequest request)
        {
            try
            {
                var adminId = GetUserId();
                var result = await _bookingService.AdminCancelBookingAsync(
                    id, adminId, request.Reason, request.RefundAmount);

                if (!result)
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Không tìm thấy đặt phòng"
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Message = "Hủy đặt phòng thành công"
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error admin cancelling booking");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        // PUT: api/booking/admin/{id}/update-status
        [HttpPut("admin/{id}/update-status")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateBookingStatus(
            int id,
            [FromBody] UpdateBookingStatusRequest request)
        {
            try
            {
                var adminId = GetUserId();
                var result = await _bookingService.UpdateBookingStatusAsync(
                    id, request.Status, adminId, request.Note);

                if (!result)
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Không tìm thấy đặt phòng"
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Message = "Cập nhật trạng thái thành công"
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating booking status");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        // PUT: api/booking/admin/{id}/update-payment-status
        [HttpPut("admin/{id}/update-payment-status")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdatePaymentStatus(
            int id,
            [FromBody] UpdatePaymentStatusRequest request)
        {
            try
            {
                var adminId = GetUserId();
                var result = await _bookingService.UpdatePaymentStatusAsync(
                    id, request.PaymentStatus, adminId, request.Note);

                if (!result)
                {
                    return NotFound(new
                    {
                        Success = false,
                        Message = "Không tìm thấy đặt phòng"
                    });
                }

                return Ok(new
                {
                    Success = true,
                    Message = "Cập nhật trạng thái thanh toán thành công"
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating payment status");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi"
                });
            }
        }

        // GET: api/booking/admin/export
        [HttpGet("admin/export")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ExportBookings(
            [FromQuery] string? status = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int? customerId = null,
            [FromQuery] int? hostId = null,
            [FromQuery] int? propertyId = null,
            [FromQuery] string format = "csv")
        {
            try
            {
                var fileBytes = await _bookingService.ExportBookingsAsync(
                    status, fromDate, toDate, customerId, hostId, propertyId, format);

                var contentType = format.ToLower() == "excel" ?
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" :
                    "text/csv";
                var fileName = $"bookings-export-{DateTime.Now:yyyyMMdd}.{(format.ToLower() == "excel" ? "xlsx" : "csv")}";

                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting bookings");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "Đã xảy ra lỗi khi xuất dữ liệu"
                });
            }
        }

        #endregion

        #region Dashboard Endpoints

        // GET: api/booking/admin/dashboard/overview
        [HttpGet("admin/dashboard/overview")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetDashboardOverview(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var overview = await _bookingService.GetDashboardOverviewAsync(fromDate, toDate);
                return Ok(new { Success = true, Data = overview });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard overview");
                return StatusCode(500, new { Success = false, Message = "Đã xảy ra lỗi" });
            }
        }

        // GET: api/booking/admin/dashboard/revenue-chart
        [HttpGet("admin/dashboard/revenue-chart")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetRevenueChart(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string groupBy = "month")
        {
            try
            {
                var chart = await _bookingService.GetRevenueChartAsync(fromDate, toDate, groupBy);
                return Ok(new { Success = true, Data = chart });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting revenue chart");
                return StatusCode(500, new { Success = false, Message = "Đã xảy ra lỗi" });
            }
        }

        // GET: api/booking/admin/dashboard/booking-trends
        [HttpGet("admin/dashboard/booking-trends")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetBookingTrends(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var trends = await _bookingService.GetBookingTrendsAsync(fromDate, toDate);
                return Ok(new { Success = true, Data = trends });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting booking trends");
                return StatusCode(500, new { Success = false, Message = "Đã xảy ra lỗi" });
            }
        }

        // GET: api/booking/admin/dashboard/top-properties
        [HttpGet("admin/dashboard/top-properties")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetTopProperties(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int top = 10)
        {
            try
            {
                var properties = await _bookingService.GetTopPropertiesAsync(fromDate, toDate, top);
                return Ok(new { Success = true, Data = properties });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting top properties");
                return StatusCode(500, new { Success = false, Message = "Đã xảy ra lỗi" });
            }
        }

        // GET: api/booking/admin/dashboard/top-customers
        [HttpGet("admin/dashboard/top-customers")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetTopCustomers(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int top = 10)
        {
            try
            {
                var customers = await _bookingService.GetTopCustomersAsync(fromDate, toDate, top);
                return Ok(new { Success = true, Data = customers });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting top customers");
                return StatusCode(500, new { Success = false, Message = "Đã xảy ra lỗi" });
            }
        }

        // GET: api/booking/admin/dashboard/alerts
        [HttpGet("admin/dashboard/alerts")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetDashboardAlerts()
        {
            try
            {
                var alerts = await _bookingService.GetDashboardAlertsAsync();
                return Ok(new { Success = true, Data = alerts });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard alerts");
                return StatusCode(500, new { Success = false, Message = "Đã xảy ra lỗi" });
            }
        }

        #endregion
    }
}