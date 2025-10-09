using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QBooking.Data;
using QBooking.Dtos.Response;
using QBooking.DTOs.Request;
using QBooking.DTOs.Response;
using QBooking.Models;
using QBooking.Services;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;

namespace QBooking.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UserController> _logger;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly AuditLogService _auditLogService;

        public UserController(
            ApplicationDbContext context,
            ILogger<UserController> logger,
            IWebHostEnvironment webHostEnvironment,
            AuditLogService auditLogService)
        {
            _context = context;
            _logger = logger;
            _webHostEnvironment = webHostEnvironment;
            _auditLogService = auditLogService;
        }
        // Thêm vào UserController.cs

        // 1. Lấy danh sách tất cả users với filtering và pagination
        [HttpGet("admin/users")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAllUsers([FromQuery] GetUsersRequest request)
        {
            try
            {
                var query = _context.Users
                    .Include(u => u.Province)
                    .Include(u => u.Commune)
                    .AsQueryable();

                // Filters
                if (!string.IsNullOrWhiteSpace(request.Role))
                {
                    query = query.Where(u => u.Role.ToLower() == request.Role.ToLower());
                }

                if (request.IsActive.HasValue)
                {
                    query = query.Where(u => u.IsActive == request.IsActive.Value);
                }

                if (request.IsEmailVerified.HasValue)
                {
                    query = query.Where(u => u.IsEmailVerified == request.IsEmailVerified.Value);
                }

                if (request.ProvinceId.HasValue)
                {
                    query = query.Where(u => u.ProvinceId == request.ProvinceId.Value);
                }

                // Search
                if (!string.IsNullOrWhiteSpace(request.Search))
                {
                    var searchTerm = request.Search.ToLower();
                    query = query.Where(u =>
                        u.FullName.ToLower().Contains(searchTerm) ||
                        u.Email.ToLower().Contains(searchTerm) ||
                        (u.Phone != null && u.Phone.Contains(searchTerm)));
                }

                // Date range filter
                if (request.CreatedFrom.HasValue)
                {
                    query = query.Where(u => u.CreatedAt >= request.CreatedFrom.Value);
                }

                if (request.CreatedTo.HasValue)
                {
                    query = query.Where(u => u.CreatedAt <= request.CreatedTo.Value);
                }

                // Sorting
                query = request.SortBy?.ToLower() switch
                {
                    "name" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(u => u.FullName)
                        : query.OrderBy(u => u.FullName),
                    "email" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(u => u.Email)
                        : query.OrderBy(u => u.Email),
                    "created" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(u => u.CreatedAt)
                        : query.OrderBy(u => u.CreatedAt),
                    "role" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(u => u.Role)
                        : query.OrderBy(u => u.Role),
                    _ => query.OrderByDescending(u => u.CreatedAt)
                };

                // Pagination
                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

                var users = await query
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(u => new UserDetailResponse
                    {
                        Id = u.Id,
                        Email = u.Email,
                        FullName = u.FullName,
                        Phone = u.Phone,
                        Role = u.Role,
                        Avatar = u.Avatar,
                        DateOfBirth = u.DateOfBirth,
                        Gender = u.Gender,
                        AddressDetail = u.AddressDetail,
                        Province = u.Province != null ? u.Province.Name : null,
                        Commune = u.Commune != null ? u.Commune.Name : null,
                        IsEmailVerified = u.IsEmailVerified,
                        IsActive = u.IsActive,
                        CreatedAt = u.CreatedAt,
                        UpdatedAt = u.UpdatedAt ?? DateTime.UtcNow,
                    })
                    .ToListAsync();

                var response = new GetUsersResponse
                {
                    Users = users,
                    TotalCount = totalCount,
                    TotalPages = totalPages,
                    CurrentPage = request.PageNumber,
                    PageSize = request.PageSize,
                    HasNextPage = request.PageNumber < totalPages,
                    HasPreviousPage = request.PageNumber > 1
                };

                return Ok(new ApiResponse<GetUsersResponse>
                {
                    Success = true,
                    Message = "Lấy danh sách người dùng thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all users");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }

        // 2. Lấy chi tiết user với thông tin đầy đủ
        [HttpGet("admin/users/{userId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetUserById(int userId)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Province)
                    .Include(u => u.Commune)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng",
                        StatusCode = 404
                    });
                }

                // Lấy thống kê properties nếu là host
                var propertyStats = new PropertyStatsResponse();
                if (user.Role?.ToLower() == "host")
                {
                    propertyStats.TotalProperties = await _context.Properties
                        .Where(p => p.HostId == userId)
                        .CountAsync();

                    propertyStats.ActiveProperties = await _context.Properties
                        .Where(p => p.HostId == userId && p.IsActive && p.Status == "approved")
                        .CountAsync();

                    propertyStats.PendingProperties = await _context.Properties
                        .Where(p => p.HostId == userId && p.Status == "pending")
                        .CountAsync();

                    propertyStats.RejectedProperties = await _context.Properties
                        .Where(p => p.HostId == userId && p.Status == "rejected")
                        .CountAsync();

                    propertyStats.TotalViews = await _context.Properties
                        .Where(p => p.HostId == userId)
                        .SumAsync(p => p.ViewCount);
                }

                // Lấy thống kê bookings
                var bookingStats = new BookingStatsResponse
                {
                    TotalBookings = await _context.Bookings
                        .Where(b => b.CustomerId == userId)
                        .CountAsync(),

                    PendingBookings = await _context.Bookings
                        .Where(b => b.CustomerId == userId && b.Status == "pending")
                        .CountAsync(),

                    ConfirmedBookings = await _context.Bookings
                        .Where(b => b.CustomerId == userId && b.Status == "confirmed")
                        .CountAsync(),

                    CompletedBookings = await _context.Bookings
                        .Where(b => b.CustomerId == userId && b.Status == "completed")
                        .CountAsync(),

                    CancelledBookings = await _context.Bookings
                        .Where(b => b.CustomerId == userId && b.Status == "cancelled")
                        .CountAsync(),

                    TotalSpent = await _context.Bookings
                        .Where(b => b.CustomerId == userId && b.PaymentStatus == "paid")
                        .SumAsync(b => b.TotalAmount)
                };

                // Nếu là host, lấy thêm thống kê doanh thu
                if (user.Role?.ToLower() == "host")
                {
                    bookingStats.TotalRevenue = await _context.Bookings
                        .Where(b => b.Property.HostId == userId && b.Status == "completed")
                        .SumAsync(b => b.TotalAmount);

                    bookingStats.TotalHostBookings = await _context.Bookings
                        .Where(b => b.Property.HostId == userId)
                        .CountAsync();
                }

                // Lấy search history gần đây
                var recentSearches = await _context.SearchHistories
                    .Where(s => s.UserId == userId)
                    .OrderByDescending(s => s.CreatedAt)
                    .Take(10)
                    .Select(s => new SearchHistoryResponseUser
                    {
                        Id = s.Id,
                        SearchKeyword = s.SearchKeyword,
                        PropertyType = s.PropertyType,
                        ProvinceId = s.ProvinceId,
                        CheckIn = s.CheckIn,
                        CheckOut = s.CheckOut,
                        ResultCount = s.ResultCount,
                        CreatedAt = s.CreatedAt
                    })
                    .ToListAsync();

                var response = new UserFullDetailResponse
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    Phone = user.Phone,
                    Role = user.Role,
                    Avatar = user.Avatar,
                    DateOfBirth = user.DateOfBirth,
                    Gender = user.Gender,
                    AddressDetail = user.AddressDetail,
                    Province = user.Province?.Name,
                    Commune = user.Commune?.Name,
                    ProvinceId = user.ProvinceId,
                    CommuneId = user.CommuneId,
                    IsEmailVerified = user.IsEmailVerified,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt ?? DateTime.UtcNow,
                    PropertyStats = user.Role?.ToLower() == "host" ? propertyStats : null,
                    BookingStats = bookingStats,
                    RecentSearches = recentSearches
                };

                return Ok(new ApiResponse<UserFullDetailResponse>
                {
                    Success = true,
                    Message = "Lấy thông tin người dùng thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by id");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }

        // 3. Cập nhật trạng thái user (active/inactive)
        [HttpPut("admin/users/{userId}/status")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateUserStatus(int userId, [FromBody] UpdateUserStatusRequest request)
        {
            try
            {
                var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                var adminId = int.Parse(adminIdClaim.Value);

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng",
                        StatusCode = 404
                    });
                }

                // Không cho phép tự khóa tài khoản admin của mình
                if (userId == adminId)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không thể thay đổi trạng thái tài khoản của chính mình",
                        StatusCode = 400
                    });
                }

                var oldStatus = user.IsActive;
                user.IsActive = request.IsActive;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await _auditLogService.LogUpdateAsync(
                    "User",
                    userId,
                    JsonSerializer.Serialize(new { IsActive = oldStatus }),
                    JsonSerializer.Serialize(new { IsActive = user.IsActive, Reason = request.Reason, UpdatedBy = adminId })
                );

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Cập nhật trạng thái người dùng thành công",
                    StatusCode = 200,
                    Data = new { IsActive = user.IsActive, UpdatedAt = user.UpdatedAt }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user status");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }

        // 4. Cập nhật role user
        [HttpPut("admin/users/{userId}/role")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateUserRole(int userId, [FromBody] UpdateUserRoleRequest request)
        {
            try
            {
                var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                var adminId = int.Parse(adminIdClaim.Value);

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng",
                        StatusCode = 404
                    });
                }

                var allowedRoles = new[] { "customer", "host", "admin" };
                if (!allowedRoles.Contains(request.Role.ToLower()))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Role không hợp lệ. Chỉ chấp nhận: customer, host, admin",
                        StatusCode = 400
                    });
                }
                if (userId == adminId || user.Role == "admin")
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Bạn không thể thay đổi role của chính mình hoặc của admin khác",
                        StatusCode = 400
                    });
                }


                var oldRole = user.Role;
                user.Role = request.Role.ToLower();
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await _auditLogService.LogUpdateAsync(
                    "User",
                    userId,
                    JsonSerializer.Serialize(new { Role = oldRole }),
                    JsonSerializer.Serialize(new { Role = user.Role, Reason = request.Reason, UpdatedBy = adminId })
                );

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Cập nhật role người dùng thành công",
                    StatusCode = 200,
                    Data = new { Role = user.Role, UpdatedAt = user.UpdatedAt }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user role");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }

        // 5. Lấy bookings của user
        [HttpGet("admin/users/{userId}/bookings")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetUserBookings(int userId, [FromQuery] GetUserBookingsRequest request)
        {
            try
            {
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

                var query = _context.Bookings
                    .Include(b => b.Property)
                    .Include(b => b.RoomType)
                    .Where(b => b.CustomerId == userId);

                // Filters
                if (!string.IsNullOrWhiteSpace(request.Status))
                {
                    query = query.Where(b => b.Status.ToLower() == request.Status.ToLower());
                }

                if (!string.IsNullOrWhiteSpace(request.PaymentStatus))
                {
                    query = query.Where(b => b.PaymentStatus.ToLower() == request.PaymentStatus.ToLower());
                }

                if (request.DateFrom.HasValue)
                {
                    query = query.Where(b => b.BookingDate >= request.DateFrom.Value);
                }

                if (request.DateTo.HasValue)
                {
                    query = query.Where(b => b.BookingDate <= request.DateTo.Value);
                }

                // Sorting
                query = request.SortBy?.ToLower() switch
                {
                    "date" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(b => b.BookingDate)
                        : query.OrderBy(b => b.BookingDate),
                    "amount" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(b => b.TotalAmount)
                        : query.OrderBy(b => b.TotalAmount),
                    "checkin" => request.SortOrder?.ToLower() == "desc"
                        ? query.OrderByDescending(b => b.CheckIn)
                        : query.OrderBy(b => b.CheckIn),
                    _ => query.OrderByDescending(b => b.BookingDate)
                };

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

                var bookings = await query
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(b => new BookingResponse
                    {
                        Id = b.Id,
                        BookingCode = b.BookingCode,
                        PropertyName = b.Property.Name,
                        RoomTypeName = b.RoomType.Name,
                        CheckIn = b.CheckIn,
                        CheckOut = b.CheckOut,
                        Nights = b.Nights,
                        Adults = b.Adults,
                        Children = b.Children,
                        RoomsCount = b.RoomsCount,
                        TotalAmount = b.TotalAmount,
                        Status = b.Status,
                        PaymentStatus = b.PaymentStatus,
                        BookingDate = b.BookingDate
                    })
                    .ToListAsync();

                var response = new GetUserBookingsResponse
                {
                    Bookings = bookings,
                    TotalCount = totalCount,
                    TotalPages = totalPages,
                    CurrentPage = request.PageNumber,
                    PageSize = request.PageSize
                };

                return Ok(new ApiResponse<GetUserBookingsResponse>
                {
                    Success = true,
                    Message = "Lấy danh sách booking thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user bookings");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }

        // 7. Reset password cho user
        [HttpGet("admin/users/statistics")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetUsersStatistics()
        {
            try
            {
                var totalUsers = await _context.Users.CountAsync();
                var activeUsers = await _context.Users.Where(u => u.IsActive).CountAsync();
                var verifiedUsers = await _context.Users.Where(u => u.IsEmailVerified).CountAsync();

                var usersByRole = await _context.Users
                    .GroupBy(u => u.Role)
                    .Select(g => new { Role = g.Key, Count = g.Count() })
                    .ToListAsync();

                var newUsersLast30Days = await _context.Users
                    .Where(u => u.CreatedAt >= DateTime.UtcNow.AddDays(-30))
                    .CountAsync();

                var response = new UsersStatisticsResponse
                {
                    TotalUsers = totalUsers,
                    ActiveUsers = activeUsers,
                    InactiveUsers = totalUsers - activeUsers,
                    VerifiedUsers = verifiedUsers,
                    UnverifiedUsers = totalUsers - verifiedUsers,
                    CustomerCount = usersByRole.FirstOrDefault(r => r.Role == "customer")?.Count ?? 0,
                    HostCount = usersByRole.FirstOrDefault(r => r.Role == "host")?.Count ?? 0,
                    AdminCount = usersByRole.FirstOrDefault(r => r.Role == "admin")?.Count ?? 0,
                    NewUsersLast30Days = newUsersLast30Days
                };

                return Ok(new ApiResponse<UsersStatisticsResponse>
                {
                    Success = true,
                    Message = "Lấy thống kê người dùng thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users statistics");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }

        // 8. Reset password cho user
        [HttpPost("admin/users/{userId}/reset-password")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> AdminResetPassword(int userId, [FromBody] AdminResetPasswordRequest request)
        {
            try
            {
                var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                var adminId = int.Parse(adminIdClaim.Value);

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng",
                        StatusCode = 404
                    });
                }

                if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Mật khẩu mới phải có ít nhất 6 ký tự",
                        StatusCode = 400
                    });
                }

                var hasher = new PasswordHasher<User>();
                user.PasswordHash = hasher.HashPassword(user, request.NewPassword);
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await _auditLogService.LogUpdateAsync(
                    "User",
                    userId,
                    JsonSerializer.Serialize(new { Action = "AdminResetPassword" }),
                    JsonSerializer.Serialize(new { UpdatedAt = user.UpdatedAt, ResetBy = adminId, Reason = request.Reason })
                );

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Reset mật khẩu thành công",
                    StatusCode = 200
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting user password");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }
        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                var userId = int.Parse(userIdClaim.Value);
                var user = await _context.Users
                    .Include(u => u.Province)
                    .Include(u => u.Commune)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng.",
                        StatusCode = 404
                    });
                }

                var profile = new UserProfileResponse
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    Phone = user.Phone,
                    Role = user.Role,
                    Avatar = user.Avatar,
                    DateOfBirth = user.DateOfBirth,
                    Gender = user.Gender,
                    AddressDetail = user.AddressDetail,
                    Province = user.Province?.Name,
                    Commune = user.Commune?.Name,
                    IsEmailVerified = user.IsEmailVerified,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt,
                };

                return Ok(new ApiResponse<UserProfileResponse>
                {
                    Success = true,
                    Message = "Lấy thông tin người dùng thành công",
                    StatusCode = 200,
                    Data = profile
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user profile");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Data = null
                });
            }
        }

        [HttpGet("properties")]
        [Authorize]
        public async Task<IActionResult> GetUserProperties([FromQuery] GetUserPropertiesRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                var userId = int.Parse(userIdClaim.Value);

                var query = _context.Properties
                    .Include(p => p.Province)
                    .Include(p => p.Commune)
                    .Include(p => p.Images)
                    .Include(p => p.RoomTypes)
                    .Include(p => p.ProductType) // Thêm include ProductType
                    .Where(p => p.HostId == userId);

                // Apply filters only if values are provided (not null or empty)
                if (!string.IsNullOrWhiteSpace(request.Status))
                {
                    query = query.Where(p => p.Status.ToLower() == request.Status.ToLower());
                }

                // Thay đổi từ Type sang ProductTypeId
                if (request.ProductTypeId.HasValue)
                {
                    query = query.Where(p => p.ProductTypeId == request.ProductTypeId.Value);
                }

                if (request.IsActive.HasValue)
                {
                    query = query.Where(p => p.IsActive == request.IsActive.Value);
                }

                if (request.IsFeatured.HasValue)
                {
                    query = query.Where(p => p.IsFeatured == request.IsFeatured.Value);
                }

                // Apply search filter if provided
                if (!string.IsNullOrWhiteSpace(request.Search))
                {
                    var searchTerm = request.Search.ToLower();
                    query = query.Where(p =>
                        p.Name.ToLower().Contains(searchTerm) ||
                        p.Description.ToLower().Contains(searchTerm) ||
                        p.ShortDescription.ToLower().Contains(searchTerm) ||
                        p.AddressDetail.ToLower().Contains(searchTerm) ||
                        p.ProductType.Name.ToLower().Contains(searchTerm)); // Thêm search theo ProductType name
                }

                // Apply sorting
                switch (request.SortBy?.ToLower())
                {
                    case "name":
                        query = request.SortOrder?.ToLower() == "desc"
                            ? query.OrderByDescending(p => p.Name)
                            : query.OrderBy(p => p.Name);
                        break;
                    case "type": // Thêm sort theo ProductType
                        query = request.SortOrder?.ToLower() == "desc"
                            ? query.OrderByDescending(p => p.ProductType.Name)
                            : query.OrderBy(p => p.ProductType.Name);
                        break;
                    case "created":
                        query = request.SortOrder?.ToLower() == "desc"
                            ? query.OrderByDescending(p => p.CreatedAt)
                            : query.OrderBy(p => p.CreatedAt);
                        break;
                    case "updated":
                        query = request.SortOrder?.ToLower() == "desc"
                            ? query.OrderByDescending(p => p.UpdatedAt)
                            : query.OrderBy(p => p.UpdatedAt);
                        break;
                    case "bookings":
                        query = request.SortOrder?.ToLower() == "desc"
                            ? query.OrderByDescending(p => p.BookingCount)
                            : query.OrderBy(p => p.BookingCount);
                        break;
                    default:
                        query = query.OrderByDescending(p => p.CreatedAt);
                        break;
                }

                // Pagination
                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

                var properties = await query
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(p => new PropertySummaryResponse
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Slug = p.Slug,
                        Type = p.ProductType.Name, // Lấy từ ProductType.Name
                        ProductTypeId = p.ProductTypeId, // Thêm ProductTypeId cho response
                        ProductTypeCode = p.ProductType.Code, // Thêm ProductType code
                        Description = p.Description,
                        ShortDescription = p.ShortDescription,
                        AddressDetail = p.AddressDetail,
                        Province = p.Province.Name,
                        Commune = p.Commune != null ? p.Commune.Name : null,
                        StarRating = p.StarRating,
                        TotalRooms = p.TotalRooms,
                        PriceFrom = p.PriceFrom,
                        Currency = p.Currency,
                        Status = p.Status,
                        IsActive = p.IsActive,
                        IsFeatured = p.IsFeatured,
                        ViewCount = p.ViewCount,
                        BookingCount = p.BookingCount,
                        PrimaryImage = p.Images.FirstOrDefault(i => i.IsPrimary) != null
                            ? p.Images.FirstOrDefault(i => i.IsPrimary).ImageUrl
                            : p.Images.FirstOrDefault() != null
                                ? p.Images.FirstOrDefault().ImageUrl
                                : null,
                        ImageCount = p.Images.Count,
                        RoomTypeCount = p.RoomTypes.Count,
                        CreatedAt = p.CreatedAt,
                        UpdatedAt = p.UpdatedAt
                    })
                    .ToListAsync();

                var response = new GetUserPropertiesResponse
                {
                    Properties = properties,
                    TotalCount = totalCount,
                    TotalPages = totalPages,
                    CurrentPage = request.PageNumber,
                    PageSize = request.PageSize,
                    HasNextPage = request.PageNumber < totalPages,
                    HasPreviousPage = request.PageNumber > 1
                };

                return Ok(new ApiResponse<GetUserPropertiesResponse>
                {
                    Success = true,
                    Message = "Lấy danh sách bất động sản thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user properties");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                var userId = int.Parse(userIdClaim.Value);
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng.",
                        StatusCode = 404
                    });
                }

                // Validate model
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .SelectMany(x => x.Value.Errors)
                        .Select(x => x.ErrorMessage);

                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = string.Join("; ", errors),
                        StatusCode = 400
                    });
                }

                // Check if phone number already exists (if provided and different from current)
                if (!string.IsNullOrEmpty(request.Phone) && request.Phone != user.Phone)
                {
                    var phoneExists = await _context.Users
                        .AnyAsync(u => u.Id != userId && u.Phone == request.Phone);

                    if (phoneExists)
                    {
                        return BadRequest(new ApiResponse<object>
                        {
                            Success = false,
                            Message = "Số điện thoại đã được sử dụng.",
                            StatusCode = 400
                        });
                    }
                }

                // Store old values for audit log
                var oldValues = new
                {
                    FullName = user.FullName,
                    Phone = user.Phone,
                    DateOfBirth = user.DateOfBirth,
                    Gender = user.Gender,
                    AddressDetail = user.AddressDetail,
                    CommuneId = user.CommuneId,
                    ProvinceId = user.ProvinceId
                };

                // Update user information
                if (!string.IsNullOrEmpty(request.FullName))
                    user.FullName = request.FullName;

                if (!string.IsNullOrEmpty(request.Phone))
                    user.Phone = request.Phone;

                if (request.DateOfBirth.HasValue)
                    user.DateOfBirth = request.DateOfBirth;

                if (!string.IsNullOrEmpty(request.Gender))
                    user.Gender = request.Gender;

                if (!string.IsNullOrEmpty(request.AddressDetail))
                    user.AddressDetail = request.AddressDetail;

                if (request.CommuneId.HasValue)
                    user.CommuneId = request.CommuneId;

                if (request.ProvinceId.HasValue)
                    user.ProvinceId = request.ProvinceId;

                user.UpdatedAt = DateTime.UtcNow;

                // Store new values for audit log
                var newValues = new
                {
                    FullName = user.FullName,
                    Phone = user.Phone,
                    DateOfBirth = user.DateOfBirth,
                    Gender = user.Gender,
                    AddressDetail = user.AddressDetail,
                    CommuneId = user.CommuneId,
                    ProvinceId = user.ProvinceId
                };

                await _context.SaveChangesAsync();

                // Log the profile update
                await _auditLogService.LogUpdateAsync(
                    "User",
                    userId,
                    JsonSerializer.Serialize(oldValues),
                    JsonSerializer.Serialize(newValues)
                );

                return Ok(new ApiResponse<UpdateProfileResponse>
                {
                    Success = true,
                    Message = "Cập nhật thông tin thành công",
                    StatusCode = 200,
                    Data = new UpdateProfileResponse
                    {
                        UpdatedAt = user.UpdatedAt.Value
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user profile");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }

        [HttpPost("upload-avatar")]
        [Authorize]
        public async Task<IActionResult> UploadAvatar([FromForm] UploadAvatarRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                var userId = int.Parse(userIdClaim.Value);
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng.",
                        StatusCode = 404
                    });
                }

                if (request.Avatar == null || request.Avatar.Length == 0)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Vui lòng chọn file ảnh",
                        StatusCode = 400
                    });
                }

                // Validate file type
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
                if (!allowedTypes.Contains(request.Avatar.ContentType.ToLower()))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Chỉ chấp nhận file ảnh (JPEG, JPG, PNG, GIF)",
                        StatusCode = 400
                    });
                }

                // Validate file size (5MB max)
                if (request.Avatar.Length > 5 * 1024 * 1024)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Kích thước file không được vượt quá 5MB",
                        StatusCode = 400
                    });
                }

                // Store old avatar for audit log
                var oldAvatar = user.Avatar;

                // Delete old avatar if exists
                if (!string.IsNullOrEmpty(user.Avatar))
                {
                    var oldAvatarPath = Path.Combine(_webHostEnvironment.WebRootPath, user.Avatar.TrimStart('/'));
                    if (System.IO.File.Exists(oldAvatarPath))
                    {
                        try
                        {
                            System.IO.File.Delete(oldAvatarPath);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Could not delete old avatar file: {FilePath}", oldAvatarPath);
                        }
                    }
                }

                // Create user-specific avatar directory if not exists
                var userAvatarDir = Path.Combine(_webHostEnvironment.WebRootPath, "avatars", userId.ToString());
                if (!Directory.Exists(userAvatarDir))
                {
                    Directory.CreateDirectory(userAvatarDir);
                }

                // Generate unique filename
                var fileExtension = Path.GetExtension(request.Avatar.FileName);
                var fileName = $"avatar_{DateTime.UtcNow.Ticks}{fileExtension}";
                var filePath = Path.Combine(userAvatarDir, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await request.Avatar.CopyToAsync(stream);
                }

                // Update user avatar path
                var avatarUrl = $"/avatars/{userId}/{fileName}";
                user.Avatar = avatarUrl;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Log the avatar upload
                await _auditLogService.LogUpdateAsync(
                    "User",
                    userId,
                    JsonSerializer.Serialize(new { Avatar = oldAvatar }),
                    JsonSerializer.Serialize(new { Avatar = avatarUrl, FileName = fileName, FileSize = request.Avatar.Length })
                );

                return Ok(new ApiResponse<UploadAvatarResponse>
                {
                    Success = true,
                    Message = "Upload avatar thành công",
                    StatusCode = 200,
                    Data = new UploadAvatarResponse
                    {
                        AvatarUrl = avatarUrl,
                        FileName = fileName,
                        FileSize = request.Avatar.Length,
                        UploadedAt = DateTime.UtcNow
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading avatar");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }

        [HttpDelete("remove-avatar")]
        [Authorize]
        public async Task<IActionResult> RemoveAvatar()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                var userId = int.Parse(userIdClaim.Value);
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng.",
                        StatusCode = 404
                    });
                }

                if (string.IsNullOrEmpty(user.Avatar))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Người dùng chưa có avatar",
                        StatusCode = 400
                    });
                }

                // Store old avatar for audit log
                var oldAvatar = user.Avatar;

                // Delete avatar file
                var avatarPath = Path.Combine(_webHostEnvironment.WebRootPath, user.Avatar.TrimStart('/'));
                if (System.IO.File.Exists(avatarPath))
                {
                    try
                    {
                        System.IO.File.Delete(avatarPath);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Could not delete avatar file: {FilePath}", avatarPath);
                    }
                }

                // Remove avatar from database
                user.Avatar = null;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Log the avatar removal
                await _auditLogService.LogUpdateAsync(
                    "User",
                    userId,
                    JsonSerializer.Serialize(new { Avatar = oldAvatar }),
                    JsonSerializer.Serialize(new { Avatar = (string?)null })
                );

                return Ok(new ApiResponse<RemoveAvatarResponse>
                {
                    Success = true,
                    Message = "Xóa avatar thành công",
                    StatusCode = 200,
                    Data = new RemoveAvatarResponse
                    {
                        RemovedAt = DateTime.UtcNow
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing avatar");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }
        [HttpPost("upgrade-to-host")]
        [Authorize(Roles = "customer")] // chỉ cho phép customer gọi
        public async Task<IActionResult> UpgradeToHost()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                var userId = int.Parse(userIdClaim.Value);
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng.",
                        StatusCode = 404
                    });
                }

                if (user.Role?.ToLower() == "host")
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Tài khoản đã là Host.",
                        StatusCode = 400
                    });
                }

                // Lưu giá trị cũ cho audit log
                var oldValues = new { Role = user.Role };

                user.Role = "host";
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Ghi log
                await _auditLogService.LogUpdateAsync(
                    "User",
                    userId,
                    JsonSerializer.Serialize(oldValues),
                    JsonSerializer.Serialize(new { Role = user.Role })
                );

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Nâng cấp tài khoản lên Host thành công.",
                    StatusCode = 200
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error upgrading user role to host");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                var userId = int.Parse(userIdClaim.Value);
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy người dùng.",
                        StatusCode = 404
                    });
                }

                // Kiểm tra mật khẩu hiện tại
                var hasher = new PasswordHasher<User>();
                var verify = hasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword);
                if (verify == PasswordVerificationResult.Failed)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Mật khẩu hiện tại không chính xác.",
                        StatusCode = 400
                    });
                }

                // Kiểm tra mật khẩu mới tối thiểu 6 ký tự, tùy bạn bổ sung regex/điều kiện khác
                if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Mật khẩu mới phải có ít nhất 6 ký tự.",
                        StatusCode = 400
                    });
                }

                // Cập nhật mật khẩu
                user.PasswordHash = hasher.HashPassword(user, request.NewPassword);
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Log audit
                await _auditLogService.LogUpdateAsync(
                    "User",
                    userId,
                    JsonSerializer.Serialize(new { Action = "ChangePassword" }),
                    JsonSerializer.Serialize(new { UpdatedAt = user.UpdatedAt })
                );

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Đổi mật khẩu thành công.",
                    StatusCode = 200
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }
        [HttpGet("statistics")]
        [Authorize]
        public async Task<IActionResult> GetUserStatistics()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                var userId = int.Parse(userIdClaim.Value);

                var totalProperties = await _context.Properties
                    .Where(p => p.HostId == userId)
                    .CountAsync();

                var activeProperties = await _context.Properties
                    .Where(p => p.HostId == userId && p.IsActive && p.Status == "approved")
                    .CountAsync();

                var totalBookings = await _context.Bookings
                    .Where(b => b.Property.HostId == userId)
                    .CountAsync();

                var totalViews = await _context.Properties
                    .Where(p => p.HostId == userId)
                    .SumAsync(p => p.ViewCount);

                var totalRevenue = await _context.Bookings
                    .Where(b => b.Property.HostId == userId && b.Status == "completed")
                    .SumAsync(b => b.TotalAmount);

                return Ok(new ApiResponse<UserStatisticsResponse>
                {
                    Success = true,
                    Message = "Lấy thống kê thành công",
                    StatusCode = 200,
                    Data = new UserStatisticsResponse
                    {
                        TotalProperties = totalProperties,
                        ActiveProperties = activeProperties,
                        TotalBookings = totalBookings,
                        TotalViews = totalViews,
                        TotalRevenue = totalRevenue
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user statistics");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }
    }
}