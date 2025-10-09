using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using QBooking.Data;
using QBooking.Models;
using QBooking.Services;
using QBooking.Dtos.Response;
using QBooking.Dtos.Request;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FavoriteController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AuditLogService _auditLogService;

        public FavoriteController(ApplicationDbContext context, AuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }



        /// <summary>
        /// API lấy tất cả favorites của tất cả người dùng (Admin only)
        /// </summary>
        [HttpGet("admin/all")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<List<AdminFavoriteDto>>>> GetAllFavorites(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var skip = (page - 1) * pageSize;

                var favorites = await _context.Favorites
                    .Include(f => f.User)
                    .Include(f => f.Property)
                        .ThenInclude(p => p.Images)
                    .Include(f => f.Property)
                        .ThenInclude(p => p.Province)
                    .OrderByDescending(f => f.CreatedAt)
                    .Skip(skip)
                    .Take(pageSize)
                    .Select(f => new AdminFavoriteDto
                    {
                        Id = f.Id,
                        UserId = f.UserId,
                        UserName = f.User.FullName,
                        UserEmail = f.User.Email,
                        PropertyId = f.PropertyId,
                        PropertyName = f.Property.Name,
                        PropertySlug = f.Property.Slug,
                        PropertyImage = f.Property.Images
                            .Where(i => i.IsPrimary)
                            .Select(i => i.ImageUrl)
                            .FirstOrDefault() ?? "",
                        ProvinceName = f.Property.Province.Name,
                        CreatedAt = f.CreatedAt
                    })
                    .ToListAsync();

                var total = await _context.Favorites.CountAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Lấy danh sách yêu thích thành công",
                    StatusCode = 200,
                    Data = new
                    {
                        Favorites = favorites,
                        Total = total,
                        Page = page,
                        PageSize = pageSize,
                        TotalPages = (int)Math.Ceiling(total / (double)pageSize)
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<AdminFavoriteDto>>
                {
                    Success = false,
                    Message = "Lỗi máy chủ nội bộ",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// API thống kê tổng quan về favorites (Admin only)
        /// </summary>
        [HttpGet("admin/statistics")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<FavoriteStatisticsDto>>> GetFavoriteStatistics()
        {
            try
            {
                var totalFavorites = await _context.Favorites.CountAsync();
                var totalUsers = await _context.Favorites
                    .Select(f => f.UserId)
                    .Distinct()
                    .CountAsync();
                var totalProperties = await _context.Favorites
                    .Select(f => f.PropertyId)
                    .Distinct()
                    .CountAsync();

                // Số favorites được tạo trong 30 ngày qua
                var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
                var favoritesLast30Days = await _context.Favorites
                    .Where(f => f.CreatedAt >= thirtyDaysAgo)
                    .CountAsync();

                // Số favorites được tạo trong 7 ngày qua
                var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
                var favoritesLast7Days = await _context.Favorites
                    .Where(f => f.CreatedAt >= sevenDaysAgo)
                    .CountAsync();

                // Số favorites được tạo hôm nay
                var today = DateTime.UtcNow.Date;
                var favoritesToday = await _context.Favorites
                    .Where(f => f.CreatedAt.Date == today)
                    .CountAsync();

                // Trung bình số favorites mỗi người dùng
                var avgFavoritesPerUser = totalUsers > 0 ? (double)totalFavorites / totalUsers : 0;

                var statistics = new FavoriteStatisticsDto
                {
                    TotalFavorites = totalFavorites,
                    TotalUsersWithFavorites = totalUsers,
                    TotalPropertiesFavorited = totalProperties,
                    FavoritesLast30Days = favoritesLast30Days,
                    FavoritesLast7Days = favoritesLast7Days,
                    FavoritesToday = favoritesToday,
                    AverageFavoritesPerUser = Math.Round(avgFavoritesPerUser, 2)
                };

                return Ok(new ApiResponse<FavoriteStatisticsDto>
                {
                    Success = true,
                    Message = "Lấy thống kê thành công",
                    StatusCode = 200,
                    Data = statistics
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<FavoriteStatisticsDto>
                {
                    Success = false,
                    Message = "Lỗi máy chủ nội bộ",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// API lấy top bất động sản được yêu thích nhiều nhất (Admin only)
        /// </summary>
        [HttpGet("admin/top-properties")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<List<TopFavoritePropertyDto>>>> GetTopFavoriteProperties(
            [FromQuery] int limit = 10)
        {
            try
            {
                var topProperties = await _context.Favorites
                    .GroupBy(f => f.PropertyId)
                    .Select(g => new
                    {
                        PropertyId = g.Key,
                        FavoriteCount = g.Count()
                    })
                    .OrderByDescending(x => x.FavoriteCount)
                    .Take(limit)
                    .ToListAsync();

                var propertyIds = topProperties.Select(x => x.PropertyId).ToList();

                var properties = await _context.Properties
                    .Include(p => p.Images)
                    .Include(p => p.Province)
                    .Include(p => p.ProductType)
                    .Where(p => propertyIds.Contains(p.Id))
                    .ToListAsync();

                var result = topProperties.Select(tp =>
                {
                    var property = properties.FirstOrDefault(p => p.Id == tp.PropertyId);
                    return new TopFavoritePropertyDto
                    {
                        PropertyId = tp.PropertyId,
                        PropertyName = property?.Name ?? "",
                        PropertySlug = property?.Slug ?? "",
                        PropertyImage = property?.Images
                            .Where(i => i.IsPrimary)
                            .Select(i => i.ImageUrl)
                            .FirstOrDefault() ?? "",
                        ProvinceName = property?.Province?.Name ?? "",
                        ProductTypeName = property?.ProductType?.Name ?? "",
                        FavoriteCount = tp.FavoriteCount
                    };
                }).ToList();

                return Ok(new ApiResponse<List<TopFavoritePropertyDto>>
                {
                    Success = true,
                    Message = "Lấy danh sách bất động sản được yêu thích nhiều nhất thành công",
                    StatusCode = 200,
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<TopFavoritePropertyDto>>
                {
                    Success = false,
                    Message = "Lỗi máy chủ nội bộ",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// API lấy người dùng có nhiều favorites nhất (Admin only)
        /// </summary>
        [HttpGet("admin/top-users")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<List<TopFavoriteUserDto>>>> GetTopFavoriteUsers(
            [FromQuery] int limit = 10)
        {
            try
            {
                var topUsers = await _context.Favorites
                    .GroupBy(f => f.UserId)
                    .Select(g => new
                    {
                        UserId = g.Key,
                        FavoriteCount = g.Count(),
                        LastFavoriteDate = g.Max(f => f.CreatedAt)
                    })
                    .OrderByDescending(x => x.FavoriteCount)
                    .Take(limit)
                    .ToListAsync();

                var userIds = topUsers.Select(x => x.UserId).ToList();

                var users = await _context.Users
                    .Where(u => userIds.Contains(u.Id))
                    .ToListAsync();

                var result = topUsers.Select(tu =>
                {
                    var user = users.FirstOrDefault(u => u.Id == tu.UserId);
                    return new TopFavoriteUserDto
                    {
                        UserId = tu.UserId,
                        UserName = user?.FullName ?? "",
                        UserEmail = user?.Email ?? "",
                        FavoriteCount = tu.FavoriteCount,
                        LastFavoriteDate = tu.LastFavoriteDate
                    };
                }).ToList();

                return Ok(new ApiResponse<List<TopFavoriteUserDto>>
                {
                    Success = true,
                    Message = "Lấy danh sách người dùng có nhiều yêu thích nhất thành công",
                    StatusCode = 200,
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<TopFavoriteUserDto>>
                {
                    Success = false,
                    Message = "Lỗi máy chủ nội bộ",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// API lấy lịch sử favorites theo thời gian (Admin only)
        /// </summary>
        [HttpGet("admin/timeline")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<List<FavoriteTimelineDto>>>> GetFavoriteTimeline(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string groupBy = "day") // day, week, month
        {
            try
            {
                var start = startDate ?? DateTime.UtcNow.AddDays(-30);
                var end = endDate ?? DateTime.UtcNow;

                var favorites = await _context.Favorites
                    .Where(f => f.CreatedAt >= start && f.CreatedAt <= end)
                    .ToListAsync();

                List<FavoriteTimelineDto> timeline;

                switch (groupBy.ToLower())
                {
                    case "week":
                        timeline = favorites
                            .GroupBy(f => new
                            {
                                Year = f.CreatedAt.Year,
                                Week = System.Globalization.CultureInfo.CurrentCulture.Calendar
                                    .GetWeekOfYear(f.CreatedAt,
                                        System.Globalization.CalendarWeekRule.FirstDay,
                                        DayOfWeek.Monday)
                            })
                            .Select(g => new FavoriteTimelineDto
                            {
                                Period = $"Tuần {g.Key.Week}, {g.Key.Year}",
                                Count = g.Count(),
                                Date = g.First().CreatedAt
                            })
                            .OrderBy(x => x.Date)
                            .ToList();
                        break;

                    case "month":
                        timeline = favorites
                            .GroupBy(f => new { f.CreatedAt.Year, f.CreatedAt.Month })
                            .Select(g => new FavoriteTimelineDto
                            {
                                Period = $"Tháng {g.Key.Month}, {g.Key.Year}",
                                Count = g.Count(),
                                Date = new DateTime(g.Key.Year, g.Key.Month, 1)
                            })
                            .OrderBy(x => x.Date)
                            .ToList();
                        break;

                    default: // day
                        timeline = favorites
                            .GroupBy(f => f.CreatedAt.Date)
                            .Select(g => new FavoriteTimelineDto
                            {
                                Period = g.Key.ToString("dd/MM/yyyy"),
                                Count = g.Count(),
                                Date = g.Key
                            })
                            .OrderBy(x => x.Date)
                            .ToList();
                        break;
                }

                return Ok(new ApiResponse<List<FavoriteTimelineDto>>
                {
                    Success = true,
                    Message = "Lấy lịch sử favorites thành công",
                    StatusCode = 200,
                    Data = timeline
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<FavoriteTimelineDto>>
                {
                    Success = false,
                    Message = "Lỗi máy chủ nội bộ",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// API lấy favorites của một người dùng cụ thể (Admin only)
        /// </summary>
        [HttpGet("admin/user/{userId}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<List<FavoriteDto>>>> GetUserFavoritesByAdmin(int userId)
        {
            try
            {
                var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
                if (!userExists)
                {
                    return NotFound(new ApiResponse<List<FavoriteDto>>
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng",
                        StatusCode = 404,
                        Error = "Người dùng được chỉ định không tồn tại"
                    });
                }

                var favorites = await _context.Favorites
                    .Include(f => f.Property)
                        .ThenInclude(p => p.Images)
                    .Include(f => f.Property)
                        .ThenInclude(p => p.Province)
                    .Include(f => f.Property)
                        .ThenInclude(p => p.Commune)
                    .Include(f => f.Property)
                        .ThenInclude(p => p.ProductType)
                    .Where(f => f.UserId == userId)
                    .Select(f => new FavoriteDto
                    {
                        Id = f.Id,
                        PropertyId = f.PropertyId,
                        PropertyName = f.Property.Name,
                        Slug = f.Property.Slug,
                        PropertyImage = f.Property.Images
                            .Where(i => i.IsPrimary)
                            .Select(i => i.ImageUrl)
                            .FirstOrDefault() ?? "",
                        ProvinceName = f.Property.Province.Name,
                        CommuneName = f.Property.Commune.Name,
                        ProductTypeName = f.Property.ProductType.Name,
                        CreatedAt = f.CreatedAt
                    })
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();

                return Ok(new ApiResponse<List<FavoriteDto>>
                {
                    Success = true,
                    Message = "Lấy danh sách yêu thích của người dùng thành công",
                    StatusCode = 200,
                    Data = favorites
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<FavoriteDto>>
                {
                    Success = false,
                    Message = "Lỗi máy chủ nội bộ",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// API xóa favorite của bất kỳ người dùng nào (Admin only)
        /// </summary>
        [HttpDelete("admin/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteFavoriteByAdmin(int id)
        {
            try
            {
                var favorite = await _context.Favorites
                    .FirstOrDefaultAsync(f => f.Id == id);

                if (favorite == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy yêu thích",
                        StatusCode = 404,
                        Error = "Yêu thích được chỉ định không tồn tại"
                    });
                }

                var oldValues = JsonSerializer.Serialize(new
                {
                    favorite.Id,
                    favorite.UserId,
                    favorite.PropertyId,
                    favorite.CreatedAt
                });

                _context.Favorites.Remove(favorite);
                await _context.SaveChangesAsync();

                var adminUserId = GetCurrentUserId();
                await _auditLogService.LogDeleteAsync("Favorite", favorite.Id, oldValues);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Xóa yêu thích thành công",
                    StatusCode = 200,
                    Data = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi máy chủ nội bộ",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }


        /// <summary>
        /// API lấy danh sách tất cả các bất động sản yêu thích của người dùng hiện tại
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<FavoriteDto>>>> GetUserFavorites()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                {
                    return Unauthorized(new ApiResponse<List<FavoriteDto>>
                    {
                        Success = false,
                        Message = "Người dùng chưa được xác thực",
                        StatusCode = 401,
                        Error = "Truy cập không được phép"
                    });
                }

                var favorites = await _context.Favorites
                    .Include(f => f.Property)
                        .ThenInclude(p => p.Images)
                    .Include(f => f.Property)
                        .ThenInclude(p => p.Province)
                    .Include(f => f.Property)
                        .ThenInclude(p => p.Commune)
                    .Include(f => f.Property)
                        .ThenInclude(p => p.ProductType)
                    .Include(f => f.Property)
                        .ThenInclude(p => p.Amenities)
                            .ThenInclude(pa => pa.Amenity)
                    .Where(f => f.UserId == userId.Value)
                    .Select(f => new FavoriteDto
                    {
                        Id = f.Id,
                        PropertyId = f.PropertyId,
                        PropertyName = f.Property.Name,
                        Slug = f.Property.Slug,
                        PropertyImage = f.Property.Images
                                                        .Where(i => i.IsPrimary)
                                                        .Select(i => i.ImageUrl)
                                                        .FirstOrDefault() ?? "",

                        ProvinceName = f.Property.Province.Name,
                        CommuneName = f.Property.Commune.Name,
                        ProductTypeName = f.Property.ProductType.Name,
                        Amenities = f.Property.Amenities.Select(a => new AmenityDto
                        {
                            Id = a.AmenityId,
                            Name = a.Amenity.Name,
                            IsFree = a.IsFree,
                            AdditionalInfo = a.AdditionalInfo
                        }).ToList(),
                        CreatedAt = f.CreatedAt
                    })
                    .OrderByDescending(f => f.CreatedAt)
                    .ToListAsync();

                return Ok(new ApiResponse<List<FavoriteDto>>
                {
                    Success = true,
                    Message = "Lấy danh sách yêu thích thành công",
                    StatusCode = 200,
                    Data = favorites
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<FavoriteDto>>
                {
                    Success = false,
                    Message = "Lỗi máy chủ nội bộ",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }


        /// <summary>
        /// API thêm một bất động sản vào danh sách yêu thích của người dùng
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<FavoriteDto>>> AddToFavorites([FromBody] AddFavoriteRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                {
                    return Unauthorized(new ApiResponse<FavoriteDto>
                    {
                        Success = false,
                        Message = "Người dùng chưa được xác thực",
                        StatusCode = 401,
                        Error = "Truy cập không được phép"
                    });
                }

                // Kiểm tra property có tồn tại không
                var propertyExists = await _context.Properties.AnyAsync(p => p.Id == request.PropertyId);
                if (!propertyExists)
                {
                    return NotFound(new ApiResponse<FavoriteDto>
                    {
                        Success = false,
                        Message = "Không tìm thấy bất động sản",
                        StatusCode = 404,
                        Error = "Bất động sản được chỉ định không tồn tại"
                    });
                }

                // Kiểm tra đã favorite chưa
                var existingFavorite = await _context.Favorites
                    .FirstOrDefaultAsync(f => f.UserId == userId.Value && f.PropertyId == request.PropertyId);

                if (existingFavorite != null)
                {
                    return BadRequest(new ApiResponse<FavoriteDto>
                    {
                        Success = false,
                        Message = "Bất động sản đã có trong danh sách yêu thích",
                        StatusCode = 400,
                        Error = "Bất động sản này đã có trong danh sách yêu thích của bạn"
                    });
                }

                // Tạo favorite mới
                var favorite = new Favorite
                {
                    UserId = userId.Value,
                    PropertyId = request.PropertyId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Favorites.Add(favorite);
                await _context.SaveChangesAsync();

                // Ghi audit log
                var newValues = JsonSerializer.Serialize(new
                {
                    favorite.Id,
                    favorite.UserId,
                    favorite.PropertyId,
                    favorite.CreatedAt
                });
                await _auditLogService.LogInsertAsync("Favorite", favorite.Id, newValues);

                // Lấy thông tin property để trả về
                var property = await _context.Properties
                    .Include(p => p.Images)
                    .FirstOrDefaultAsync(p => p.Id == request.PropertyId);

                var favoriteDto = new FavoriteDto
                {
                    Id = favorite.Id,
                    PropertyId = favorite.PropertyId,
                    PropertyName = property?.Name ?? string.Empty,
                    PropertyImage = property?.Images != null && property.Images.Any() ?
                                   property.Images.First().ImageUrl : string.Empty,
                    CreatedAt = favorite.CreatedAt
                };

                return Ok(new ApiResponse<FavoriteDto>
                {
                    Success = true,
                    Message = "Thêm bất động sản vào danh sách yêu thích thành công",
                    StatusCode = 200,
                    Data = favoriteDto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<FavoriteDto>
                {
                    Success = false,
                    Message = "Lỗi máy chủ nội bộ",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// API xóa một bất động sản khỏi danh sách yêu thích theo ID của favorite
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> RemoveFavorite(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Người dùng chưa được xác thực",
                        StatusCode = 401,
                        Error = "Truy cập không được phép"
                    });
                }

                var favorite = await _context.Favorites
                    .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId.Value);

                if (favorite == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy yêu thích",
                        StatusCode = 404,
                        Error = "Yêu thích được chỉ định không tồn tại hoặc không thuộc về bạn"
                    });
                }

                // Lưu thông tin cũ cho audit log
                var oldValues = JsonSerializer.Serialize(new
                {
                    favorite.Id,
                    favorite.UserId,
                    favorite.PropertyId,
                    favorite.CreatedAt
                });

                _context.Favorites.Remove(favorite);
                await _context.SaveChangesAsync();

                // Ghi audit log
                await _auditLogService.LogDeleteAsync("Favorite", favorite.Id, oldValues);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Xóa yêu thích thành công",
                    StatusCode = 200,
                    Data = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi máy chủ nội bộ",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// API xóa một bất động sản khỏi danh sách yêu thích theo ID của bất động sản
        /// </summary>
        [HttpDelete("property/{propertyId}")]
        public async Task<ActionResult<ApiResponse<object>>> RemoveFavoriteByProperty(int propertyId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Người dùng chưa được xác thực",
                        StatusCode = 401,
                        Error = "Truy cập không được phép"
                    });
                }

                var favorite = await _context.Favorites
                    .FirstOrDefaultAsync(f => f.PropertyId == propertyId && f.UserId == userId.Value);

                if (favorite == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy yêu thích",
                        StatusCode = 404,
                        Error = "Bất động sản này không có trong danh sách yêu thích của bạn"
                    });
                }

                // Lưu thông tin cũ cho audit log
                var oldValues = JsonSerializer.Serialize(new
                {
                    favorite.Id,
                    favorite.UserId,
                    favorite.PropertyId,
                    favorite.CreatedAt
                });

                _context.Favorites.Remove(favorite);
                await _context.SaveChangesAsync();

                // Ghi audit log
                await _auditLogService.LogDeleteAsync("Favorite", favorite.Id, oldValues);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Xóa yêu thích thành công",
                    StatusCode = 200,
                    Data = null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi máy chủ nội bộ",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// API kiểm tra xem một bất động sản có trong danh sách yêu thích của người dùng hay không
        /// </summary>
        [HttpGet("check/{propertyId}")]
        public async Task<ActionResult<ApiResponse<bool>>> CheckIsFavorite(int propertyId)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                {
                    return Unauthorized(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Người dùng chưa được xác thực",
                        StatusCode = 401,
                        Error = "Truy cập không được phép"
                    });
                }

                var isFavorite = await _context.Favorites
                    .AnyAsync(f => f.UserId == userId.Value && f.PropertyId == propertyId);

                return Ok(new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Kiểm tra hoàn tất thành công",
                    StatusCode = 200,
                    Data = isFavorite
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Lỗi máy chủ nội bộ",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// API đếm tổng số bất động sản yêu thích của người dùng hiện tại
        /// </summary>
        [HttpGet("count")]
        public async Task<ActionResult<ApiResponse<int>>> GetFavoriteCount()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (!userId.HasValue)
                {
                    return Unauthorized(new ApiResponse<int>
                    {
                        Success = false,
                        Message = "Người dùng chưa được xác thực",
                        StatusCode = 401,
                        Error = "Truy cập không được phép"
                    });
                }

                var count = await _context.Favorites
                    .CountAsync(f => f.UserId == userId.Value);

                return Ok(new ApiResponse<int>
                {
                    Success = true,
                    Message = "Lấy số lượng thành công",
                    StatusCode = 200,
                    Data = count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<int>
                {
                    Success = false,
                    Message = "Lỗi máy chủ nội bộ",
                    StatusCode = 500,
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