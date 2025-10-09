using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using QBooking.Data;
using QBooking.Models;
using QBooking.Dtos.Response;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class HistoryLoginController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<HistoryLoginController> _logger;

        public HistoryLoginController(ApplicationDbContext context, ILogger<HistoryLoginController> logger)
        {
            _context = context;
            _logger = logger;
        }
        /// <summary>
        /// Lấy lịch sử đăng nhập của một user cụ thể (Admin only)
        /// </summary>
        [HttpGet("user/{userId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetUserLoginHistory(
            int userId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] bool? isSuccess = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                // Kiểm tra user có tồn tại không
                var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
                if (!userExists)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng",
                        StatusCode = 404
                    });
                }

                var query = _context.HistoryLogins
                    .Include(h => h.User)
                    .Where(h => h.UserId == userId);

                // Lọc theo trạng thái đăng nhập
                if (isSuccess.HasValue)
                    query = query.Where(h => h.IsSuccess == isSuccess.Value);

                // Lọc theo thời gian
                if (fromDate.HasValue)
                    query = query.Where(h => h.LoginTime >= fromDate.Value);

                if (toDate.HasValue)
                    query = query.Where(h => h.LoginTime <= toDate.Value);

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

                var histories = await query
                    .OrderByDescending(h => h.LoginTime)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(h => new
                    {
                        h.Id,
                        h.UserId,
                        h.UserName,
                        UserEmail = h.User.Email,
                        h.LoginTime,
                        h.IpAddress,
                        h.DeviceInfo,
                        h.IsSuccess,
                        h.FailureReason,
                        h.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Lấy lịch sử đăng nhập của người dùng thành công",
                    StatusCode = 200,
                    Data = new
                    {
                        userId,
                        userName = histories.FirstOrDefault()?.UserName,
                        userEmail = histories.FirstOrDefault()?.UserEmail,
                        histories,
                        pagination = new
                        {
                            currentPage = page,
                            pageSize,
                            totalCount,
                            totalPages,
                            hasNext = page < totalPages,
                            hasPrevious = page > 1
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting login history for user {UserId}", userId);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
        /// <summary>
        /// Lấy danh sách lịch sử đăng nhập của user hiện tại
        /// </summary>
        [HttpGet("my-history")]
        public async Task<IActionResult> GetMyLoginHistory(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không xác định được người dùng",
                        StatusCode = 401
                    });
                }

                var query = _context.HistoryLogins.Where(h => h.UserId == userId);

                // Lọc theo thời gian nếu có
                if (fromDate.HasValue)
                    query = query.Where(h => h.LoginTime >= fromDate.Value);

                if (toDate.HasValue)
                    query = query.Where(h => h.LoginTime <= toDate.Value);

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

                var histories = await query
                    .OrderByDescending(h => h.LoginTime)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(h => new
                    {
                        h.Id,
                        h.LoginTime,
                        h.IpAddress,
                        h.DeviceInfo,
                        h.IsSuccess,
                        h.FailureReason,
                        h.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Lấy lịch sử đăng nhập thành công",
                    StatusCode = 200,
                    Data = new
                    {
                        histories,
                        pagination = new
                        {
                            currentPage = page,
                            pageSize,
                            totalCount,
                            totalPages,
                            hasNext = page < totalPages,
                            hasPrevious = page > 1
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user login history");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy danh sách lịch sử đăng nhập của tất cả user (Admin only)
        /// </summary>
        [HttpGet("all")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAllLoginHistory(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] bool? isSuccess = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int? userId = null)
        {
            try
            {
                var query = _context.HistoryLogins
                    .Include(h => h.User)
                    .AsQueryable();

                // Lọc theo userId nếu có
                if (userId.HasValue)
                    query = query.Where(h => h.UserId == userId.Value);

                // Tìm kiếm theo tên user hoặc email
                if (!string.IsNullOrEmpty(search))
                {
                    search = search.ToLower();
                    query = query.Where(h => h.UserName.ToLower().Contains(search) ||
                                           h.User.Email.ToLower().Contains(search));
                }

                // Lọc theo trạng thái đăng nhập
                if (isSuccess.HasValue)
                    query = query.Where(h => h.IsSuccess == isSuccess.Value);

                // Lọc theo thời gian
                if (fromDate.HasValue)
                    query = query.Where(h => h.LoginTime >= fromDate.Value);

                if (toDate.HasValue)
                    query = query.Where(h => h.LoginTime <= toDate.Value);

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

                var histories = await query
                    .OrderByDescending(h => h.LoginTime)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(h => new
                    {
                        h.Id,
                        h.UserId,
                        h.UserName,
                        UserEmail = h.User.Email,
                        h.LoginTime,
                        h.IpAddress,
                        h.DeviceInfo,
                        h.IsSuccess,
                        h.FailureReason,
                        h.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Lấy danh sách lịch sử đăng nhập thành công",
                    StatusCode = 200,
                    Data = new
                    {
                        histories,
                        pagination = new
                        {
                            currentPage = page,
                            pageSize,
                            totalCount,
                            totalPages,
                            hasNext = page < totalPages,
                            hasPrevious = page > 1
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all login history");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy thống kê lịch sử đăng nhập (Admin only)
        /// </summary>
        [HttpGet("statistics")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetLoginStatistics(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var query = _context.HistoryLogins.AsQueryable();

                // Lọc theo thời gian nếu có
                if (fromDate.HasValue)
                    query = query.Where(h => h.LoginTime >= fromDate.Value);

                if (toDate.HasValue)
                    query = query.Where(h => h.LoginTime <= toDate.Value);

                var totalLogins = await query.CountAsync();
                var successfulLogins = await query.CountAsync(h => h.IsSuccess);
                var failedLogins = totalLogins - successfulLogins;
                var uniqueUsers = await query.Select(h => h.UserId).Distinct().CountAsync();

                // Top 5 users có nhiều lần đăng nhập nhất
                var topUsers = await query
                    .Where(h => h.IsSuccess)
                    .GroupBy(h => new { h.UserId, h.UserName })
                    .Select(g => new
                    {
                        UserId = g.Key.UserId,
                        UserName = g.Key.UserName,
                        LoginCount = g.Count()
                    })
                    .OrderByDescending(x => x.LoginCount)
                    .Take(5)
                    .ToListAsync();

                // Thống kê theo ngày trong 7 ngày gần nhất
                var last7Days = await query
                    .Where(h => h.LoginTime >= DateTime.UtcNow.AddDays(-7))
                    .GroupBy(h => h.LoginTime.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        TotalLogins = g.Count(),
                        SuccessfulLogins = g.Count(x => x.IsSuccess),
                        FailedLogins = g.Count(x => !x.IsSuccess)
                    })
                    .OrderBy(x => x.Date)
                    .ToListAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Lấy thống kê thành công",
                    StatusCode = 200,
                    Data = new
                    {
                        summary = new
                        {
                            totalLogins,
                            successfulLogins,
                            failedLogins,
                            successRate = totalLogins > 0 ? Math.Round((double)successfulLogins / totalLogins * 100, 2) : 0,
                            uniqueUsers
                        },
                        topUsers,
                        dailyStats = last7Days
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting login statistics");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Xóa lịch sử đăng nhập cũ (Admin only)
        /// </summary>
        [HttpDelete("cleanup")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> CleanupOldHistory([FromQuery] int daysToKeep = 90)
        {
            try
            {
                if (daysToKeep < 1)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Số ngày cần giữ lại phải lớn hơn 0",
                        StatusCode = 400
                    });
                }

                var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);
                var oldRecords = await _context.HistoryLogins
                    .Where(h => h.CreatedAt < cutoffDate)
                    .ToListAsync();

                if (oldRecords.Any())
                {
                    _context.HistoryLogins.RemoveRange(oldRecords);
                    await _context.SaveChangesAsync();
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Đã xóa {oldRecords.Count} bản ghi lịch sử cũ hơn {daysToKeep} ngày",
                    StatusCode = 200,
                    Data = new { deletedCount = oldRecords.Count }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up old login history");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy chi tiết một record lịch sử đăng nhập (Admin only)
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetLoginHistoryDetail(long id)
        {
            try
            {
                var history = await _context.HistoryLogins
                    .Include(h => h.User)
                    .Where(h => h.Id == id)
                    .Select(h => new
                    {
                        h.Id,
                        h.UserId,
                        h.UserName,
                        UserEmail = h.User.Email,
                        UserRole = h.User.Role,
                        h.LoginTime,
                        h.IpAddress,
                        h.DeviceInfo,
                        h.IsSuccess,
                        h.FailureReason,
                        h.CreatedAt
                    })
                    .FirstOrDefaultAsync();

                if (history == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy lịch sử đăng nhập",
                        StatusCode = 404
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Lấy chi tiết lịch sử đăng nhập thành công",
                    StatusCode = 200,
                    Data = history
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting login history detail for ID: {Id}", id);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
    }
}