using Microsoft.AspNetCore.Mvc;

using Microsoft.Extensions.Configuration;
using System.Text.Json;
using QBooking.Dtos.Request;
using QBooking.Dtos.Response;
using QBooking.Services;
using Microsoft.EntityFrameworkCore;
using QBooking.Data;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SePayController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ISePayWebhookService _sePayService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SePayController> _logger;

        public SePayController(
            ISePayWebhookService sePayService,
            IConfiguration configuration,
            ILogger<SePayController> logger,
             ApplicationDbContext context)
        {
            _sePayService = sePayService;
            _configuration = configuration;
            _logger = logger;
            _context = context;
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> HandleWebhook([FromBody] SePayWebhookRequest request)
        {
            try
            {
                // Log webhook request
                _logger.LogInformation($"Received SePay webhook: {JsonSerializer.Serialize(request)}");

                // Validate API Key from header
                var apiKeyFromHeader = Request.Headers["Authorization"].FirstOrDefault()?.Replace("Apikey ", "");
                var expectedApiKey = _configuration["SePay:ApiKey"];

                if (string.IsNullOrEmpty(apiKeyFromHeader) || apiKeyFromHeader != expectedApiKey)
                {
                    _logger.LogWarning("Invalid API Key in webhook request");
                    return Unauthorized(new SePayWebhookResponse
                    {
                        Success = false,
                        Message = "Invalid API Key"
                    });
                }

                // Validate webhook data
                if (!ModelState.IsValid)
                {
                    return BadRequest(new SePayWebhookResponse
                    {
                        Success = false,
                        Message = "Invalid webhook data"
                    });
                }

                // Process webhook
                var result = await _sePayService.ProcessWebhookAsync(request);

                if (result.Success)
                {
                    return StatusCode(201, new SePayWebhookResponse
                    {
                        Success = true,
                        Message = "Payment processed successfully",
                        Data = result.Data
                    });
                }
                else
                {
                    return BadRequest(new SePayWebhookResponse
                    {
                        Success = false,
                        Message = result.Message
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing SePay webhook");
                return StatusCode(500, new SePayWebhookResponse
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }
        [HttpGet("qr-code/{bookingCode}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> GetQRCode(string bookingCode)
        {
            try
            {
                // 1️⃣ Lấy user hiện tại từ token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int currentUserId))
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ",
                        StatusCode = 401,
                        Data = null,
                        Error = "Không tìm thấy hoặc parse được Claim NameIdentifier"
                    });
                }

                // 2️⃣ Tìm booking theo code
                var booking = await _context.Bookings
                    .Include(b => b.Property)
                    .Include(b => b.RoomType)
                    .FirstOrDefaultAsync(b => b.BookingCode == bookingCode);

                if (booking == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy booking",
                        StatusCode = 404,
                        Data = null,
                        Error = "Booking code không tồn tại"
                    });
                }

                // 3️⃣ Kiểm tra quyền truy cập booking
                if (booking.CustomerId != currentUserId)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Bạn không có quyền truy cập booking này",
                        StatusCode = 401,
                        Data = null,
                        Error = "Không phải chủ sở hữu booking"
                    });
                }

                // 4️⃣ Lấy thông tin ngân hàng từ WebsiteSetting
                var websiteSetting = await _context.WebsiteSettings.FirstOrDefaultAsync();
                if (websiteSetting == null || string.IsNullOrEmpty(websiteSetting.BankAccountNumber))
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Chưa cấu hình thông tin ngân hàng",
                        StatusCode = 404,
                        Data = null,
                        Error = "Thiếu thông tin ngân hàng trong WebsiteSettings"
                    });
                }

                // 5️⃣ Tạo URL QR động từ dữ liệu thực tế
                var bankAcc = websiteSetting.BankAccountNumber;
                var bankName = websiteSetting.BankName ?? "MBBank"; // fallback nếu chưa nhập
                var qrUrl = $"https://qr.sepay.vn/img?acc={bankAcc}&bank={bankName}&amount={booking.TotalAmount}&des={bookingCode}";

                // 6️⃣ Trả kết quả
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Lấy QR code thành công",
                    StatusCode = 200,
                    Data = new
                    {
                        QrCodeUrl = qrUrl,
                        BookingCode = booking.BookingCode,
                        Amount = booking.TotalAmount,
                        GuestName = booking.GuestName,
                        GuestEmail = booking.GuestEmail,
                        CheckIn = booking.CheckIn,
                        CheckOut = booking.CheckOut,
                        PropertyName = booking.Property?.Name,
                        RoomTypeName = booking.RoomType?.Name,
                        Status = booking.Status,
                        PaymentStatus = booking.PaymentStatus,
                        BankAccountName = websiteSetting.BankAccountName,
                        BankAccountNumber = websiteSetting.BankAccountNumber,
                        BankName = websiteSetting.BankName
                    },
                    Error = null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting QR code for booking: {bookingCode}");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi máy chủ nội bộ",
                    StatusCode = 500,
                    Data = null,
                    Error = ex.Message
                });
            }
        }


        [HttpGet("booking-status/{bookingId}")]
        public async Task<IActionResult> GetBookingPaymentStatus(int bookingId)
        {
            try
            {
                var status = await _sePayService.GetBookingPaymentStatusAsync(bookingId);

                if (status == null)
                {
                    return NotFound(new { Success = false, Message = "Booking not found" });
                }

                return Ok(new { Success = true, Data = status });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting booking status for ID: {bookingId}");
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }
        [HttpGet("booking-status-by-code/{bookingCode}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<BookingStatusChangedNotification>>> GetBookingPaymentStatusByCode(string bookingCode)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int currentUserId))
                {
                    return Unauthorized(new ApiResponse<BookingStatusChangedNotification>
                    {
                        Success = false,
                        Message = "Token không hợp lệ",
                        StatusCode = 401,
                        Data = null,
                        Error = "Không tìm thấy hoặc parse được Claim NameIdentifier"
                    });
                }

                var status = await _sePayService.GetBookingPaymentStatusByCodeAsync(bookingCode);

                if (status == null)
                {
                    return NotFound(new ApiResponse<BookingStatusChangedNotification>
                    {
                        Success = false,
                        Message = "Booking không tồn tại",
                        StatusCode = 404,
                        Data = null,
                        Error = "BookingCode không hợp lệ"
                    });
                }

                // Lấy booking để kiểm tra quyền
                var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.BookingCode == bookingCode);
                if (booking.CustomerId != currentUserId)
                {
                    return Unauthorized(new ApiResponse<BookingStatusChangedNotification>
                    {
                        Success = false,
                        Message = "Bạn không có quyền truy cập booking này",
                        StatusCode = 401,
                        Data = null,
                        Error = "Không phải chủ sở hữu booking"
                    });
                }

                return Ok(new ApiResponse<BookingStatusChangedNotification>
                {
                    Success = true,
                    Message = "Lấy trạng thái thanh toán thành công",
                    StatusCode = 200,
                    Data = status,
                    Error = null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting booking status for code: {bookingCode}");
                return StatusCode(500, new ApiResponse<BookingStatusChangedNotification>
                {
                    Success = false,
                    Message = "Lỗi máy chủ nội bộ",
                    StatusCode = 500,
                    Data = null,
                    Error = ex.Message
                });
            }
        }

        [HttpGet("payment-history/{bookingCode}")]
        public async Task<IActionResult> GetPaymentHistory(string bookingCode)
        {
            try
            {
                var history = await _sePayService.GetPaymentHistoryByBookingCodeAsync(bookingCode);
                return Ok(new { Success = true, Data = history });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting payment history for booking: {bookingCode}");
                return StatusCode(500, new { Success = false, Message = "Internal server error" });
            }
        }
    }
}