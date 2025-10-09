using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using QBooking.Services;
using QBooking.Models;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using QBooking.Dtos.Request;
using QBooking.Dtos.Response;
using QBooking.Data;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly ApplicationDbContext _context;

        public NotificationController(INotificationService notificationService, ApplicationDbContext context)
        {
            _notificationService = notificationService;
            _context = context;
        }

        // GET: api/notification
        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] bool unreadOnly = false)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Người dùng chưa đăng nhập",
                        StatusCode = 401,
                        Data = null,
                        Error = "Unauthorized"
                    });

                var notifications = await _notificationService.GetUserNotificationsAsync(userId.Value, unreadOnly);

                return Ok(new ApiResponse<List<Notification>>
                {
                    Success = true,
                    Message = "Lấy danh sách thông báo thành công",
                    StatusCode = 200,
                    Data = notifications,
                    Error = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi khi lấy danh sách thông báo",
                    StatusCode = 500,
                    Data = null,
                    Error = ex.Message
                });
            }
        }

        // GET: api/notification/unread-count
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Người dùng chưa đăng nhập",
                        StatusCode = 401,
                        Data = null,
                        Error = "Unauthorized"
                    });

                var count = await _notificationService.GetUnreadCountAsync(userId.Value);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Lấy số lượng thông báo chưa đọc thành công",
                    StatusCode = 200,
                    Data = new { count },
                    Error = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi khi lấy số lượng thông báo chưa đọc",
                    StatusCode = 500,
                    Data = null,
                    Error = ex.Message
                });
            }
        }

        // PUT: api/notification/{id}/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Người dùng chưa đăng nhập",
                        StatusCode = 401,
                        Data = null,
                        Error = "Unauthorized"
                    });

                var success = await _notificationService.MarkAsReadAsync(id, userId.Value);

                if (!success)
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy thông báo",
                        StatusCode = 404,
                        Data = null,
                        Error = "NotFound"
                    });

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Đánh dấu thông báo đã đọc thành công",
                    StatusCode = 200,
                    Data = null,
                    Error = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi khi đánh dấu thông báo đã đọc",
                    StatusCode = 500,
                    Data = null,
                    Error = ex.Message
                });
            }
        }

        // POST: api/notification/test
        [HttpPost("test")]
        public async Task<IActionResult> SendTestNotification([FromBody] TestNotificationRequest request)
        {
            try
            {
                var notification = new Notification
                {
                    UserId = request.UserId,
                    Type = "test",
                    Title = request.Title ?? "Thông báo test",
                    Content = request.Content ?? "Đây là thông báo test",
                    Priority = "normal",
                    CreatedAt = DateTime.UtcNow
                };

                await _notificationService.SendNotificationAsync(notification);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Gửi thông báo test thành công",
                    StatusCode = 200,
                    Data = new { notificationId = notification.Id },
                    Error = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi khi gửi thông báo test",
                    StatusCode = 500,
                    Data = null,
                    Error = ex.Message
                });
            }
        }

        // GET: api/notification/admin/statistics
        [HttpGet("admin/statistics")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetStatistics()
        {
            try
            {
                var stats = await _notificationService.GetStatisticsAsync();

                return Ok(new ApiResponse<NotificationStatisticsResponse>
                {
                    Success = true,
                    Message = "Lấy thống kê thành công",
                    StatusCode = 200,
                    Data = stats,
                    Error = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi khi lấy thống kê",
                    StatusCode = 500,
                    Data = null,
                    Error = ex.Message
                });
            }
        }

        // GET: api/notification/admin/user-statistics/{userId}
        [HttpGet("admin/user-statistics/{userId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetUserStatistics(int userId)
        {
            try
            {
                var stats = await _notificationService.GetUserStatisticsAsync(userId);

                if (stats == null)
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng",
                        StatusCode = 404,
                        Data = null,
                        Error = "UserNotFound"
                    });

                return Ok(new ApiResponse<UserNotificationStatisticsResponse>
                {
                    Success = true,
                    Message = "Lấy thống kê người dùng thành công",
                    StatusCode = 200,
                    Data = stats,
                    Error = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi khi lấy thống kê người dùng",
                    StatusCode = 500,
                    Data = null,
                    Error = ex.Message
                });
            }
        }

        // GET: api/notification/admin/report
        [HttpGet("admin/report")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetReport([FromQuery] NotificationReportRequest request)
        {
            try
            {
                if (request.FromDate == default) request.FromDate = DateTime.UtcNow.AddMonths(-1);
                if (request.ToDate == default) request.ToDate = DateTime.UtcNow;

                var report = await _notificationService.GetReportAsync(
                    request.FromDate,
                    request.ToDate,
                    request.GroupBy);

                return Ok(new ApiResponse<List<NotificationReportResponse>>
                {
                    Success = true,
                    Message = "Lấy báo cáo thành công",
                    StatusCode = 200,
                    Data = report,
                    Error = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi khi lấy báo cáo",
                    StatusCode = 500,
                    Data = null,
                    Error = ex.Message
                });
            }
        }

        // GET: api/notification/admin
        [HttpGet("admin")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetNotificationsAdmin([FromQuery] AdminNotificationFilterRequest filter)
        {
            try
            {
                var result = await _notificationService.GetNotificationsWithFilterAsync(filter);

                return Ok(new ApiResponse<PaginatedNotificationsResponse>
                {
                    Success = true,
                    Message = "Lấy danh sách thông báo thành công",
                    StatusCode = 200,
                    Data = result,
                    Error = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi khi lấy danh sách thông báo",
                    StatusCode = 500,
                    Data = null,
                    Error = ex.Message
                });
            }
        }

        // POST: api/notification/admin/send
        [HttpPost("admin/send")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> SendNotification([FromBody] AdminSendNotificationRequest request)
        {
            try
            {
                var user = await _context.Users.FindAsync(request.UserId);
                if (user == null)
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng",
                        StatusCode = 404,
                        Data = null,
                        Error = "UserNotFound"
                    });

                var notification = await _notificationService.SendAdminNotificationAsync(request);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Gửi thông báo thành công",
                    StatusCode = 200,
                    Data = new
                    {
                        notificationId = notification.Id,
                        realtimeSent = true,
                        emailQueued = request.SendEmail
                    },
                    Error = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi khi gửi thông báo",
                    StatusCode = 500,
                    Data = null,
                    Error = ex.Message
                });
            }
        }

        // POST: api/notification/admin/send-all
        [HttpPost("admin/send-all")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> SendNotificationToAll([FromBody] AdminSendToAllNotificationRequest request)
        {
            try
            {
                var notifications = await _notificationService.SendNotificationToAllAsync(request);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Gửi thông báo đến tất cả người dùng thành công",
                    StatusCode = 200,
                    Data = new
                    {
                        totalSent = notifications.Count,
                        realtimeSent = true,
                        emailQueued = request.SendEmail
                    },
                    Error = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi khi gửi thông báo đến tất cả người dùng",
                    StatusCode = 500,
                    Data = null,
                    Error = ex.Message
                });
            }
        }

        // POST: api/notification/admin/broadcast
        [HttpPost("admin/broadcast")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> BroadcastNotification([FromBody] AdminBroadcastNotificationRequest request)
        {
            try
            {
                var notifications = await _notificationService.BroadcastNotificationAsync(request);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Gửi thông báo broadcast thành công",
                    StatusCode = 200,
                    Data = new
                    {
                        totalSent = notifications.Count,
                        realtimeSent = true,
                        emailQueued = request.SendEmail
                    },
                    Error = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi khi gửi thông báo broadcast",
                    StatusCode = 500,
                    Data = null,
                    Error = ex.Message
                });
            }
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
    }
}