using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QBooking.Dtos.Request;
using QBooking.Dtos.Response;
using QBooking.Models;
using QBooking.Services;
using System.Security.Claims;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "host,admin")]
    public class HostPayoutController : ControllerBase
    {
        private readonly IHostPayoutService _payoutService;

        public HostPayoutController(IHostPayoutService payoutService)
        {
            _payoutService = payoutService;
        }

        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        private bool IsAdmin()
        {
            return User.IsInRole("admin");
        }

        // ========== HOST ENDPOINTS ==========

        /// <summary>
        /// GET /api/hostpayout - Danh sách payouts
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<HostPayoutDto>>>> GetMyPayouts()
        {
            var hostId = GetUserId();
            var payouts = await _payoutService.GetPayoutsByHostAsync(hostId);

            return Ok(new ApiResponse<IEnumerable<HostPayoutDto>>
            {
                Success = true,
                Message = "Lấy danh sách payouts thành công",
                StatusCode = 200,
                Data = payouts
            });
        }

        /// <summary>
        /// GET /api/hostpayout/{id} - Chi tiết payout
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<HostPayoutDto>>> GetPayoutById(int id)
        {
            var payout = await _payoutService.GetPayoutByIdAsync(id);
            if (payout == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Payout không tìm thấy",
                    StatusCode = 404,
                    Error = "NOT_FOUND"
                });
            }

            return Ok(new ApiResponse<HostPayoutDto>
            {
                Success = true,
                Message = "Lấy chi tiết payout thành công",
                StatusCode = 200,
                Data = payout
            });
        }

        /// <summary>
        /// GET /api/hostpayout/{id}/earnings - Earnings trong payout
        /// </summary>
        [HttpGet("{id}/earnings")]
        public async Task<ActionResult<ApiResponse<IEnumerable<HostEarningDto>>>> GetPayoutEarnings(int id)
        {
            var earnings = await _payoutService.GetPayoutEarningsAsync(id);

            return Ok(new ApiResponse<IEnumerable<HostEarningDto>>
            {
                Success = true,
                Message = "Lấy danh sách earnings thành công",
                StatusCode = 200,
                Data = earnings
            });
        }

        /// <summary>
        /// PUT /api/hostpayout/{id}/bank-info - Cập nhật thông tin ngân hàng
        /// </summary>
        [HttpPut("{id}/bank-info")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateBankInfo(int id, [FromBody] UpdateBankInfoDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ",
                    StatusCode = 400,
                    Error = "VALIDATION_ERROR"
                });
            }

            var result = await _payoutService.UpdateBankInfoAsync(id, dto.BankName, dto.BankAccountNumber, dto.BankAccountName);

            if (!result)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Không thể cập nhật thông tin ngân hàng",
                    StatusCode = 400,
                    Error = "UPDATE_FAILED"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Cập nhật thông tin ngân hàng thành công",
                StatusCode = 200,
                Data = new { payoutId = id }
            });
        }

        /// <summary>
        /// GET /api/hostpayout/pending-earnings - Earnings chưa thanh toán
        /// </summary>
        [HttpGet("pending-earnings")]
        public async Task<ActionResult<ApiResponse<IEnumerable<HostEarningDto>>>> GetPendingEarnings()
        {
            var hostId = GetUserId();
            var earnings = await _payoutService.GetPendingEarningsAsync(hostId);

            return Ok(new ApiResponse<IEnumerable<HostEarningDto>>
            {
                Success = true,
                Message = "Lấy danh sách earnings chưa thanh toán thành công",
                StatusCode = 200,
                Data = earnings
            });
        }

        // ========== ADMIN ENDPOINTS ==========

        /// <summary>
        /// GET /api/hostpayout/admin/all - Xem tất cả payouts (phân trang)
        /// </summary>
        [HttpGet("admin/all")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<object>>> GetAllPayouts(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var (items, total) = await _payoutService.GetAllPayoutsAsync(page, pageSize);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Lấy danh sách payouts thành công",
                StatusCode = 200,
                Data = new
                {
                    items,
                    total,
                    page,
                    pageSize,
                    totalPages = (total + pageSize - 1) / pageSize
                }
            });
        }

        /// <summary>
        /// POST /api/hostpayout/admin/create-manual - Tạo payout thủ công
        /// </summary>
        [HttpPost("admin/create-manual")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<HostPayoutDto>>> CreateManualPayout([FromBody] CreateManualPayoutDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ",
                    StatusCode = 400,
                    Error = "VALIDATION_ERROR"
                });
            }

            var payout = await _payoutService.CreateManualPayoutAsync(dto.HostId, dto.PayoutPeriodStart, dto.PayoutPeriodEnd);

            if (payout == null)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Không thể tạo payout",
                    StatusCode = 400,
                    Error = "CREATION_FAILED"
                });
            }

            return CreatedAtAction(nameof(GetPayoutById), new { id = payout.Id }, new ApiResponse<HostPayoutDto>
            {
                Success = true,
                Message = "Tạo payout thành công",
                StatusCode = 201,
                Data = payout
            });
        }

        /// <summary>
        /// PUT /api/hostpayout/admin/{id}/process - Xử lý thanh toán
        /// </summary>
        [HttpPut("admin/{id}/process")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<object>>> ProcessPayout(int id, [FromBody] ProcessPayoutDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Dữ liệu không hợp lệ",
                    StatusCode = 400,
                    Error = "VALIDATION_ERROR"
                });
            }

            var adminId = GetUserId();
            var result = await _payoutService.ProcessPayoutAsync(id, dto.TransactionReference, dto.Notes, adminId);

            if (!result)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Không thể xử lý payout",
                    StatusCode = 400,
                    Error = "PROCESSING_FAILED"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Xử lý payout thành công",
                StatusCode = 200,
                Data = new { payoutId = id }
            });
        }

        /// <summary>
        /// PUT /api/hostpayout/admin/{id}/complete - Hoàn thành thanh toán
        /// </summary>
        [HttpPut("admin/{id}/complete")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<object>>> CompletePayout(int id)
        {
            var adminId = GetUserId();
            var result = await _payoutService.CompletePayoutAsync(id, adminId);

            if (!result)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Không thể hoàn thành payout",
                    StatusCode = 400,
                    Error = "COMPLETION_FAILED"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Hoàn thành payout thành công",
                StatusCode = 200,
                Data = new { payoutId = id }
            });
        }

        /// <summary>
        /// PUT /api/hostpayout/admin/{id}/cancel - Hủy thanh toán
        /// </summary>
        [HttpPut("admin/{id}/cancel")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<object>>> CancelPayout(int id)
        {
            var adminId = GetUserId();
            var result = await _payoutService.CancelPayoutAsync(id, adminId);

            if (!result)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Không thể hủy payout",
                    StatusCode = 400,
                    Error = "CANCELLATION_FAILED"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Hủy payout thành công",
                StatusCode = 200,
                Data = new { payoutId = id }
            });
        }

        /// <summary>
        /// GET /api/hostpayout/admin/statistics - Thống kê payouts
        /// </summary>
        [HttpGet("admin/statistics")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<PayoutStatisticsDto>>> GetPayoutStatistics()
        {
            var stats = await _payoutService.GetPayoutStatisticsAsync();

            return Ok(new ApiResponse<PayoutStatisticsDto>
            {
                Success = true,
                Message = "Lấy thống kê payout thành công",
                StatusCode = 200,
                Data = stats
            });
        }
    }
}