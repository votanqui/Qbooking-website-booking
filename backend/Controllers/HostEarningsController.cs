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
    [Authorize(Roles = "host,admin")]
    public class HostEarningsController : ControllerBase
    {
        private readonly IHostEarningsService _earningsService;

        public HostEarningsController(IHostEarningsService earningsService)
        {
            _earningsService = earningsService;
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
        /// GET /api/hostearnings - Danh sách earnings với filter
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<HostEarningDto>>>> GetMyEarnings(
            [FromQuery] string status = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            var userId = GetUserId();
            var earnings = await _earningsService.GetEarningsByHostAsync(userId, status, fromDate, toDate);

            return Ok(new ApiResponse<IEnumerable<HostEarningDto>>
            {
                Success = true,
                Message = "Lấy danh sách earnings thành công",
                StatusCode = 200,
                Data = earnings
            });
        }

        /// <summary>
        /// GET /api/hostearnings/statistics - Thống kê tổng quan
        /// </summary>
        [HttpGet("statistics")]
        public async Task<ActionResult<ApiResponse<HostEarningsStatisticsDto>>> GetStatistics(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            var userId = GetUserId();
            var stats = await _earningsService.GetEarningsStatisticsAsync(userId, fromDate, toDate);

            return Ok(new ApiResponse<HostEarningsStatisticsDto>
            {
                Success = true,
                Message = "Lấy thống kê thành công",
                StatusCode = 200,
                Data = stats
            });
        }

        /// <summary>
        /// GET /api/hostearnings/{id} - Chi tiết một earning
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<HostEarningDto>>> GetEarningById(int id)
        {
            var earning = await _earningsService.GetEarningByIdAsync(id);
            if (earning == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Earning không tìm thấy",
                    StatusCode = 404,
                    Error = "NOT_FOUND"
                });
            }

            return Ok(new ApiResponse<HostEarningDto>
            {
                Success = true,
                Message = "Lấy chi tiết earning thành công",
                StatusCode = 200,
                Data = earning
            });
        }

        /// <summary>
        /// GET /api/hostearnings/summary - Tổng quan theo tháng/năm
        /// </summary>
        [HttpGet("summary")]
        public async Task<ActionResult<ApiResponse<IEnumerable<HostEarningsSummaryDto>>>> GetSummary(
            [FromQuery] int year = -1)
        {
            var userId = GetUserId();
            var year_value = year == -1 ? DateTime.UtcNow.Year : year;
            var summary = await _earningsService.GetEarningsSummaryAsync(userId, year_value);

            return Ok(new ApiResponse<IEnumerable<HostEarningsSummaryDto>>
            {
                Success = true,
                Message = "Lấy tổng quan thành công",
                StatusCode = 200,
                Data = summary
            });
        }

        // ========== ADMIN ENDPOINTS ==========

        /// <summary>
        /// GET /api/hostearnings/admin/all - Xem tất cả earnings (phân trang)
        /// </summary>
        [HttpGet("admin/all")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<object>>> GetAllEarnings(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string status = null)
        {
            var (items, total) = await _earningsService.GetAllEarningsAsync(page, pageSize, status);

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Lấy danh sách earnings thành công",
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
        /// PUT /api/hostearnings/admin/{id}/approve - Duyệt earning
        /// </summary>
        [HttpPut("admin/{id}/approve")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<object>>> ApproveEarning(int id)
        {
            var adminId = GetUserId();
            var result = await _earningsService.ApproveEarningAsync(id, adminId);

            if (!result)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Không thể duyệt earning",
                    StatusCode = 400,
                    Error = "APPROVAL_FAILED"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Duyệt earning thành công",
                StatusCode = 200,
                Data = new { earningId = id }
            });
        }

        /// <summary>
        /// PUT /api/hostearnings/admin/{id}/reject - Từ chối earning
        /// </summary>
        [HttpPut("admin/{id}/reject")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<object>>> RejectEarning(int id)
        {
            var adminId = GetUserId();
            var result = await _earningsService.RejectEarningAsync(id, adminId);

            if (!result)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Không thể từ chối earning",
                    StatusCode = 400,
                    Error = "REJECTION_FAILED"
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Từ chối earning thành công",
                StatusCode = 200,
                Data = new { earningId = id }
            });
        }

        /// <summary>
        /// GET /api/hostearnings/admin/statistics - Thống kê toàn hệ thống
        /// </summary>
        [HttpGet("admin/statistics")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<PayoutStatisticsDto>>> GetAdminStatistics()
        {
            var stats = await _earningsService.GetAdminStatisticsAsync();

            return Ok(new ApiResponse<PayoutStatisticsDto>
            {
                Success = true,
                Message = "Lấy thống kê hệ thống thành công",
                StatusCode = 200,
                Data = stats
            });
        }
    }
}