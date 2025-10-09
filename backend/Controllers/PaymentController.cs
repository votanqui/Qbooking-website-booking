using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using QBooking.Services;
using QBooking.Dtos.Request;
using QBooking.Dtos.Response;
using System.Security.Claims;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RefundController : ControllerBase
    {
        private readonly IRefundService _refundService;

        public RefundController(IRefundService refundService)
        {
            _refundService = refundService;
        }
        private int? GetCurrentUserId()
        {
            var userIdClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            return null;
        }
        /// <summary>
        /// Tạo yêu cầu hoàn tiền (Customer)
        /// </summary>
        [HttpPost("tickets")]
        public async Task<ActionResult<ApiResponse<RefundTicketResponse>>> CreateRefundTicket([FromBody] CreateRefundTicketRequest request)
        {
            var customerId = GetCurrentUserId();
            if (customerId == null)
            {
                return Unauthorized(new ApiResponse<RefundTicketResponse>
                {
                    Success = false,
                    Message = "Không thể xác thực người dùng",
                    StatusCode = 401
                });
            }

            var result = await _refundService.CreateRefundTicketAsync(customerId.Value, request);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Lấy danh sách yêu cầu hoàn tiền của customer hiện tại
        /// </summary>
        [HttpGet("tickets/my")]
        public async Task<ActionResult<ApiResponse<List<RefundTicketResponse>>>> GetMyRefundTickets()
        {
            var customerId = GetCurrentUserId();
            if (customerId == null)
            {
                return Unauthorized(new ApiResponse<List<RefundTicketResponse>>
                {
                    Success = false,
                    Message = "Không thể xác thực người dùng",
                    StatusCode = 401
                });
            }

            var result = await _refundService.GetCustomerRefundTicketsAsync(customerId.Value);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Lấy chi tiết một ticket của customer (Customer)
        /// </summary>
        [HttpGet("tickets/my/{ticketId}")]
        public async Task<ActionResult<ApiResponse<RefundTicketDetailResponse>>> GetMyRefundTicketDetail(int ticketId)
        {
            var customerId = GetCurrentUserId();
            if (customerId == null)
            {
                return Unauthorized(new ApiResponse<RefundTicketDetailResponse>
                {
                    Success = false,
                    Message = "Không thể xác thực người dùng",
                    StatusCode = 401
                });
            }

            var result = await _refundService.GetRefundTicketDetailAsync(ticketId, customerId.Value);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Hủy yêu cầu hoàn tiền của mình (Customer) - chỉ khi còn pending
        /// </summary>
        [HttpDelete("tickets/{ticketId}")]
        public async Task<ActionResult<ApiResponse<object>>> CancelRefundTicket(int ticketId)
        {
            var customerId = GetCurrentUserId();
            if (customerId == null)
            {
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Không thể xác thực người dùng",
                    StatusCode = 401
                });
            }

            var result = await _refundService.CancelRefundTicketAsync(ticketId, customerId.Value);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Lấy tất cả yêu cầu hoàn tiền (Admin)
        /// </summary>
        [HttpGet("tickets")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<List<RefundTicketResponse>>>> GetAllRefundTickets([FromQuery] string? status = null)
        {
            var result = await _refundService.GetAllRefundTicketsAsync(status);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Lấy chi tiết một ticket (Admin)
        /// </summary>
        [HttpGet("tickets/{ticketId}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<RefundTicketDetailResponse>>> GetRefundTicketDetail(int ticketId)
        {
            var result = await _refundService.GetRefundTicketDetailAsync(ticketId);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Xử lý hoàn tiền - tạo record Refund và cập nhật status của RefundTicket (Admin)
        /// </summary>
        [HttpPost("tickets/{refundTicketId}/process")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<RefundResponse>>> ProcessRefund(int refundTicketId, [FromBody] ProcessRefundRequest request)
        {
            var approvedBy = GetCurrentUserId();
            if (approvedBy == null)
            {
                return Unauthorized(new ApiResponse<RefundResponse>
                {
                    Success = false,
                    Message = "Không thể xác thực người dùng",
                    StatusCode = 401
                });
            }

            request.ApprovedBy = approvedBy.Value;
            var result = await _refundService.ProcessRefundAsync(refundTicketId, request);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Cập nhật trạng thái yêu cầu hoàn tiền (Admin) - reject ticket
        /// </summary>
        [HttpPut("tickets/{refundTicketId}/status")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<RefundTicketResponse>>> UpdateRefundTicketStatus(int refundTicketId, [FromBody] UpdateRefundTicketStatusRequest request)
        {
            var result = await _refundService.UpdateRefundTicketStatusAsync(refundTicketId, request.Status);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Lấy danh sách tất cả các refund đã thực hiện (Admin)
        /// </summary>
        [HttpGet("refunds")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<List<RefundResponse>>>> GetRefunds()
        {
            var result = await _refundService.GetRefundsAsync();
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Host xem danh sách ticket của property mình quản lý
        /// </summary>
        [HttpGet("tickets/host/properties")]
        [Authorize(Roles = "host")]
        public async Task<ActionResult<ApiResponse<List<RefundTicketResponse>>>> GetHostRefundTickets([FromQuery] string? status = null)
        {
            var hostId = GetCurrentUserId();
            if (hostId == null)
            {
                return Unauthorized(new ApiResponse<List<RefundTicketResponse>>
                {
                    Success = false,
                    Message = "Không thể xác thực người dùng",
                    StatusCode = 401
                });
            }

            var result = await _refundService.GetHostRefundTicketsAsync(hostId.Value, status);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Host xem chi tiết ticket của property mình quản lý
        /// </summary>
        [HttpGet("tickets/host/{ticketId}")]
        [Authorize(Roles = "host")]
        public async Task<ActionResult<ApiResponse<RefundTicketDetailResponse>>> GetHostRefundTicketDetail(int ticketId)
        {
            var hostId = GetCurrentUserId();
            if (hostId == null)
            {
                return Unauthorized(new ApiResponse<RefundTicketDetailResponse>
                {
                    Success = false,
                    Message = "Không thể xác thực người dùng",
                    StatusCode = 401
                });
            }

            var result = await _refundService.GetHostRefundTicketDetailAsync(ticketId, hostId.Value);
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Thống kê refund theo khoảng thời gian (Admin)
        /// </summary>
        [HttpGet("statistics")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<RefundStatisticsResponse>>> GetRefundStatistics(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            var result = await _refundService.GetRefundStatisticsAsync(fromDate, toDate);
            return StatusCode(result.StatusCode, result);
        }
    }
}