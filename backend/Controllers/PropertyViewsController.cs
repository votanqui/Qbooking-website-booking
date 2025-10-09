using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using QBooking.Data;
using QBooking.Models;
using QBooking.Dtos.Response;
using System.Security.Claims;
using QBooking.Dtos.Request;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PropertyViewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PropertyViewsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Helper method để lấy thông tin IP và device
        private (string ipAddress, string userAgent, string referrer) GetClientInfo()
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = Request.Headers["User-Agent"].ToString();
            var referrer = Request.Headers["Referer"].ToString();

            return (ipAddress, userAgent, referrer);
        }

        // POST: api/PropertyViews - Ghi nhận lượt xem property (chỉ 1 lần/ngày/user/property)
        [HttpPost]
        public async Task<ActionResult<ApiResponse<object>>> RecordView([FromBody] RecordViewRequest request)
        {
            try
            {
                var userId = User.Identity?.IsAuthenticated == true
                    ? int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0")
                    : (int?)null;

                var today = DateTime.UtcNow.Date;
                var tomorrow = today.AddDays(1);

                // Kiểm tra xem user đã xem property này trong ngày hôm nay chưa
                bool alreadyViewedToday;

                if (userId.HasValue)
                {
                    // Đối với user đã đăng nhập - check theo userId
                    alreadyViewedToday = await _context.PropertyViews
                        .AnyAsync(pv => pv.PropertyId == request.PropertyId
                                     && pv.UserId == userId
                                     && pv.ViewedAt >= today
                                     && pv.ViewedAt < tomorrow);
                }
                else
                {
                    // Đối với user anonymous - check theo IP address
                    var clientInfo = GetClientInfo();
                    alreadyViewedToday = await _context.PropertyViews
                        .AnyAsync(pv => pv.PropertyId == request.PropertyId
                                     && pv.UserId == null
                                     && pv.IPAddress == clientInfo.ipAddress
                                     && pv.ViewedAt >= today
                                     && pv.ViewedAt < tomorrow);
                }

                if (alreadyViewedToday)
                {
                    return Ok(new ApiResponse<object>
                    {
                        Success = true,
                        Message = "View already recorded today",
                        StatusCode = 200,
                        Data = new { alreadyViewed = true }
                    });
                }

                // Lấy thông tin client
                var (ipAddress, userAgent, referrer) = GetClientInfo();

                // Tạo PropertyView mới
                var propertyView = new PropertyView
                {
                    PropertyId = request.PropertyId,
                    UserId = userId,
                    ViewedAt = DateTime.UtcNow,
                    IPAddress = ipAddress,
                    UserAgent = userAgent,
                    Referrer = referrer
                };

                // Thêm view và cập nhật ViewCount của Property
                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    // Thêm PropertyView
                    _context.PropertyViews.Add(propertyView);

                    // Cập nhật ViewCount của Property
                    var property = await _context.Properties.FindAsync(request.PropertyId);
                    if (property != null)
                    {
                        property.ViewCount += 1;
                        property.UpdatedAt = DateTime.UtcNow;
                        _context.Properties.Update(property);
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new ApiResponse<object>
                    {
                        Success = true,
                        Message = "View recorded successfully",
                        StatusCode = 200,
                        Data = new
                        {
                            viewId = propertyView.Id,
                            newViewCount = property?.ViewCount ?? 0
                        }
                    });
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to record view",
                    StatusCode = 400,
                    Error = ex.Message
                });
            }
        }

        // GET: api/PropertyViews/property/{propertyId} - Lấy lượt xem của 1 property
        [HttpGet("property/{propertyId}")]
        [Authorize(Roles = "admin,host")]
        public async Task<ActionResult<ApiResponse<PropertyViewsResponse>>> GetPropertyViews(int propertyId,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var isAdmin = User.IsInRole("admin");

                // Kiểm tra xem user có phải là host của property này không
                if (!isAdmin)
                {
                    var property = await _context.Properties
                        .Where(p => p.Id == propertyId)
                        .Select(p => new { p.HostId })
                        .FirstOrDefaultAsync();

                    if (property == null)
                    {
                        return NotFound(new ApiResponse<PropertyViewsResponse>
                        {
                            Success = false,
                            Message = "Property not found",
                            StatusCode = 404
                        });
                    }

                    if (property.HostId != currentUserId)
                    {
                        return Forbid();
                    }
                }

                var query = _context.PropertyViews
                    .Where(pv => pv.PropertyId == propertyId)
                    .Include(pv => pv.User)
                    .OrderByDescending(pv => pv.ViewedAt);

                var totalCount = await query.CountAsync();
                var views = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(pv => new PropertyViewDto
                    {
                        Id = pv.Id,
                        PropertyId = pv.PropertyId,
                        UserId = pv.UserId,
                        UserName = pv.User != null ? pv.User.FullName : "Anonymous",
                        ViewedAt = pv.ViewedAt,
                        IPAddress = pv.IPAddress,
                        UserAgent = pv.UserAgent,
                        Referrer = pv.Referrer
                    })
                    .ToListAsync();

                var response = new PropertyViewsResponse
                {
                    Views = views,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                };

                return Ok(new ApiResponse<PropertyViewsResponse>
                {
                    Success = true,
                    Message = "Property views retrieved successfully",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<PropertyViewsResponse>
                {
                    Success = false,
                    Message = "Failed to get property views",
                    StatusCode = 400,
                    Error = ex.Message
                });
            }
        }

        // GET: api/PropertyViews/user/{userId} - Lấy lịch sử xem của user
        [HttpGet("user/{userId}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<UserViewHistoryResponse>>> GetUserViewHistory(int userId,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                // Chỉ cho phép user xem lịch sử của chính mình hoặc admin
                var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var isAdmin = User.IsInRole("admin");

                if (currentUserId != userId && !isAdmin)
                    return Forbid();

                var query = _context.PropertyViews
                    .Where(pv => pv.UserId == userId)
                    .Include(pv => pv.Property)
                    .OrderByDescending(pv => pv.ViewedAt);

                var totalCount = await query.CountAsync();
                var views = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(pv => new UserViewHistoryDto
                    {
                        Id = pv.Id,
                        PropertyId = pv.PropertyId,
                        PropertyTitle = pv.Property.Name,
                        PropertyAddress = pv.Property.AddressDetail,
                        ViewedAt = pv.ViewedAt
                    })
                    .ToListAsync();

                var response = new UserViewHistoryResponse
                {
                    Views = views,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                };

                return Ok(new ApiResponse<UserViewHistoryResponse>
                {
                    Success = true,
                    Message = "User view history retrieved successfully",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<UserViewHistoryResponse>
                {
                    Success = false,
                    Message = "Failed to get user view history",
                    StatusCode = 400,
                    Error = ex.Message
                });
            }
        }

        // GET: api/PropertyViews/statistics - Thống kê tổng quan cho admin
        [HttpGet("statistics")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<PropertyViewStatistics>>> GetViewStatistics(
            [FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
        {
            try
            {
                fromDate ??= DateTime.UtcNow.AddDays(-30);
                toDate ??= DateTime.UtcNow;

                var query = _context.PropertyViews
                    .Where(pv => pv.ViewedAt >= fromDate && pv.ViewedAt <= toDate);

                var totalViews = await query.CountAsync();
                var uniqueUsers = await query.Where(pv => pv.UserId != null).Select(pv => pv.UserId).Distinct().CountAsync();
                var anonymousViews = await query.Where(pv => pv.UserId == null).CountAsync();

                // Top 10 properties có nhiều lượt xem nhất
                var topProperties = await query
                    .GroupBy(pv => new { pv.PropertyId, pv.Property.Name })
                    .Select(g => new PropertyViewCount
                    {
                        PropertyId = g.Key.PropertyId,
                        PropertyTitle = g.Key.Name,
                        ViewCount = g.Count()
                    })
                    .OrderByDescending(p => p.ViewCount)
                    .Take(10)
                    .ToListAsync();

                // Thống kê theo ngày (7 ngày gần nhất)
                var dailyStats = await query
                    .Where(pv => pv.ViewedAt >= DateTime.UtcNow.AddDays(-7))
                    .GroupBy(pv => pv.ViewedAt.Date)
                    .Select(g => new DailyViewStat
                    {
                        Date = g.Key,
                        ViewCount = g.Count(),
                        UniqueUsers = g.Where(pv => pv.UserId != null).Select(pv => pv.UserId).Distinct().Count()
                    })
                    .OrderBy(d => d.Date)
                    .ToListAsync();

                var statistics = new PropertyViewStatistics
                {
                    TotalViews = totalViews,
                    UniqueUsers = uniqueUsers,
                    AnonymousViews = anonymousViews,
                    RegisteredUserViews = totalViews - anonymousViews,
                    TopProperties = topProperties,
                    DailyStats = dailyStats,
                    FromDate = fromDate.Value,
                    ToDate = toDate.Value
                };

                return Ok(new ApiResponse<PropertyViewStatistics>
                {
                    Success = true,
                    Message = "View statistics retrieved successfully",
                    StatusCode = 200,
                    Data = statistics
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<PropertyViewStatistics>
                {
                    Success = false,
                    Message = "Failed to get view statistics",
                    StatusCode = 400,
                    Error = ex.Message
                });
            }
        }

        // GET: api/PropertyViews/popular - Lấy danh sách property phổ biến
        [HttpGet("popular")]
        public async Task<ActionResult<ApiResponse<List<PopularPropertyDto>>>> GetPopularProperties(
            [FromQuery] int days = 30, [FromQuery] int limit = 10)
        {
            try
            {
                var fromDate = DateTime.UtcNow.AddDays(-days);

                var popularProperties = await _context.PropertyViews
                    .Where(pv => pv.ViewedAt >= fromDate)
                    .GroupBy(pv => pv.Property)
                    .Select(g => new PopularPropertyDto
                    {
                        PropertyId = g.Key.Id,
                        Title = g.Key.Name,
                        Address = g.Key.AddressDetail,
                        ViewCount = g.Count(),
                        UniqueViewers = g.Where(pv => pv.UserId != null).Select(pv => pv.UserId).Distinct().Count()
                    })
                    .OrderByDescending(p => p.ViewCount)
                    .Take(limit)
                    .ToListAsync();

                return Ok(new ApiResponse<List<PopularPropertyDto>>
                {
                    Success = true,
                    Message = "Popular properties retrieved successfully",
                    StatusCode = 200,
                    Data = popularProperties
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<List<PopularPropertyDto>>
                {
                    Success = false,
                    Message = "Failed to get popular properties",
                    StatusCode = 400,
                    Error = ex.Message
                });
            }
        }

        // DELETE: api/PropertyViews/cleanup - Xóa dữ liệu cũ (admin only)
        [HttpDelete("cleanup")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<object>>> CleanupOldViews([FromQuery] int olderThanDays = 365)
        {
            try
            {
                var cutoffDate = DateTime.UtcNow.AddDays(-olderThanDays);

                var oldViews = await _context.PropertyViews
                    .Where(pv => pv.ViewedAt < cutoffDate)
                    .ToListAsync();

                _context.PropertyViews.RemoveRange(oldViews);
                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Old views cleaned up successfully",
                    StatusCode = 200,
                    Data = new
                    {
                        deletedCount = oldViews.Count,
                        cutoffDate = cutoffDate
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to cleanup old views",
                    StatusCode = 400,
                    Error = ex.Message
                });
            }
        }
    }
}