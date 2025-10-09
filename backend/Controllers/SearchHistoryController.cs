using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QBooking.Data;
using QBooking.Models;
using QBooking.Dtos.Request;
using QBooking.Dtos.Response;
using QBooking.Services;
using System.Text.Json;
using System.Security.Claims;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SearchHistoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AuditLogService _auditLogService;

        public SearchHistoryController(ApplicationDbContext context, AuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
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
        // GET: api/SearchHistory
        [HttpGet]
        public async Task<ActionResult<ApiResponse<SearchHistoryListResponse>>> GetSearchHistories(
            [FromQuery] SearchHistoryFilterRequest request)
        {
            try
            {
                var query = _context.SearchHistories
                    .Include(sh => sh.User)
                    .Include(sh => sh.Province)
                    .Include(sh => sh.Commune)
                    .AsQueryable();

                // Apply filters
                if (request.UserId.HasValue)
                    query = query.Where(sh => sh.UserId == request.UserId.Value);

                if (!string.IsNullOrEmpty(request.SessionId))
                    query = query.Where(sh => sh.SessionId == request.SessionId);

                if (request.FromDate.HasValue)
                    query = query.Where(sh => sh.CreatedAt >= request.FromDate.Value);

                if (request.ToDate.HasValue)
                    query = query.Where(sh => sh.CreatedAt <= request.ToDate.Value);

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

                var searchHistories = await query
                    .OrderByDescending(sh => sh.CreatedAt)
                    .Skip((request.Page - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(sh => new SearchHistoryResponse
                    {
                        Id = sh.Id,
                        UserId = sh.UserId,
                        SessionId = sh.SessionId,
                        SearchKeyword = sh.SearchKeyword,
                        ProvinceId = sh.ProvinceId,
                        CommuneId = sh.CommuneId,
                        PropertyType = sh.PropertyType,
                        CheckIn = sh.CheckIn,
                        CheckOut = sh.CheckOut,
                        Adults = sh.Adults,
                        Children = sh.Children,
                        PriceMin = sh.PriceMin,
                        PriceMax = sh.PriceMax,
                        StarRating = sh.StarRating,
                        ResultCount = sh.ResultCount,
                        IPAddress = sh.IPAddress,
                        UserAgent = sh.UserAgent,
                        CreatedAt = sh.CreatedAt,
                        User = sh.User != null ? new UserResponse
                        {
                            Id = sh.User.Id,
                            Name = sh.User.FullName,
                            Email = sh.User.Email
                        } : null,
                        Province = sh.Province != null ? new ProvinceResponse
                        {
                            Id = sh.Province.Id,
                            Name = sh.Province.Name,
                            Code = sh.Province.Code
                        } : null,
                        Commune = sh.Commune != null ? new CommuneResponse
                        {
                            Id = sh.Commune.Id,
                            Name = sh.Commune.Name,
                            Code = sh.Commune.Code
                        } : null
                    })
                    .ToListAsync();

                var response = new SearchHistoryListResponse
                {
                    Items = searchHistories,
                    TotalCount = totalCount,
                    Page = request.Page,
                    PageSize = request.PageSize,
                    TotalPages = totalPages
                };

                return Ok(new ApiResponse<SearchHistoryListResponse>
                {
                    Success = true,
                    Message = "Search histories retrieved successfully",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<SearchHistoryListResponse>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // GET: api/SearchHistory/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<SearchHistoryResponse>>> GetSearchHistory(int id)
        {
            try
            {
                var searchHistory = await _context.SearchHistories
                    .Include(sh => sh.User)
                    .Include(sh => sh.Province)
                    .Include(sh => sh.Commune)
                    .Where(sh => sh.Id == id)
                    .Select(sh => new SearchHistoryResponse
                    {
                        Id = sh.Id,
                        UserId = sh.UserId,
                        SessionId = sh.SessionId,
                        SearchKeyword = sh.SearchKeyword,
                        ProvinceId = sh.ProvinceId,
                        CommuneId = sh.CommuneId,
                        PropertyType = sh.PropertyType,
                        CheckIn = sh.CheckIn,
                        CheckOut = sh.CheckOut,
                        Adults = sh.Adults,
                        Children = sh.Children,
                        PriceMin = sh.PriceMin,
                        PriceMax = sh.PriceMax,
                        StarRating = sh.StarRating,
                        ResultCount = sh.ResultCount,
                        IPAddress = sh.IPAddress,
                        UserAgent = sh.UserAgent,
                        CreatedAt = sh.CreatedAt,
                        User = sh.User != null ? new UserResponse
                        {
                            Id = sh.User.Id,
                            Name = sh.User.FullName,
                            Email = sh.User.Email
                        } : null,
                        Province = sh.Province != null ? new ProvinceResponse
                        {
                            Id = sh.Province.Id,
                            Name = sh.Province.Name,
                            Code = sh.Province.Code
                        } : null,
                        Commune = sh.Commune != null ? new CommuneResponse
                        {
                            Id = sh.Commune.Id,
                            Name = sh.Commune.Name,
                            Code = sh.Commune.Code
                        } : null
                    })
                    .FirstOrDefaultAsync();

                if (searchHistory == null)
                {
                    return NotFound(new ApiResponse<SearchHistoryResponse>
                    {
                        Success = false,
                        Message = "Search history not found",
                        StatusCode = 404
                    });
                }

                return Ok(new ApiResponse<SearchHistoryResponse>
                {
                    Success = true,
                    Message = "Search history retrieved successfully",
                    StatusCode = 200,
                    Data = searchHistory
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<SearchHistoryResponse>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // POST: api/SearchHistory
        [HttpPost]
        public async Task<ActionResult<ApiResponse<SearchHistoryResponse>>> CreateSearchHistory(CreateSearchHistoryRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();

                // Validate Province (nếu có chọn)
                if (request.ProvinceId.HasValue && request.ProvinceId > 0)
                {
                    var provinceExists = await _context.Provinces.AnyAsync(p => p.Id == request.ProvinceId);
                    if (!provinceExists)
                    {
                        return BadRequest(new ApiResponse<SearchHistoryResponse>
                        {
                            Success = false,
                            Message = $"ProvinceId {request.ProvinceId} không tồn tại",
                            StatusCode = 400
                        });
                    }
                }

                // Validate Commune (nếu có chọn)
                if (request.CommuneId.HasValue && request.CommuneId > 0)
                {
                    var commune = await _context.Communes.FindAsync(request.CommuneId);
                    if (commune == null)
                    {
                        return BadRequest(new ApiResponse<SearchHistoryResponse>
                        {
                            Success = false,
                            Message = $"CommuneId {request.CommuneId} không tồn tại",
                            StatusCode = 400
                        });
                    }

                    // Nếu có cả ProvinceId thì kiểm tra xã có thuộc tỉnh không
                    if (request.ProvinceId.HasValue && request.ProvinceId > 0 && commune.ProvinceId != request.ProvinceId)
                    {
                        return BadRequest(new ApiResponse<SearchHistoryResponse>
                        {
                            Success = false,
                            Message = $"CommuneId {request.CommuneId} không thuộc ProvinceId {request.ProvinceId}",
                            StatusCode = 400
                        });
                    }
                }

                // Tự động lấy SessionId từ Cookie hoặc Header
                var sessionId = HttpContext.Session.Id; // Nếu dùng Session
                                                        // Hoặc: var sessionId = Request.Cookies["SessionId"] ?? Guid.NewGuid().ToString();

                // Tự động lấy IP Address
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
                                ?? HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()
                                ?? "Unknown";

                // Tự động lấy User Agent
                var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();

                var searchHistory = new SearchHistory
                {
                    UserId = userId,
                    SessionId = sessionId,  // Tự động từ backend
                    SearchKeyword = request.SearchKeyword,
                    ProvinceId = request.ProvinceId > 0 ? request.ProvinceId : null,
                    CommuneId = request.CommuneId > 0 ? request.CommuneId : null,
                    PropertyType = request.PropertyType,
                    CheckIn = request.CheckIn,
                    CheckOut = request.CheckOut,
                    Adults = request.Adults,
                    Children = request.Children,
                    PriceMin = request.PriceMin,
                    PriceMax = request.PriceMax,
                    StarRating = request.StarRating,
                    ResultCount = request.ResultCount ?? 0,
                    IPAddress = ipAddress,     // Tự động từ backend
                    UserAgent = userAgent,      // Tự động từ backend
                    CreatedAt = DateTime.UtcNow
                };

                _context.SearchHistories.Add(searchHistory);
                await _context.SaveChangesAsync();

                // Audit log
                var newValues = JsonSerializer.Serialize(searchHistory);
                await _auditLogService.LogInsertAsync("SearchHistory", searchHistory.Id, newValues);

                // Lấy lại dữ liệu vừa insert kèm navigation properties
                var createdSearchHistory = await _context.SearchHistories
                    .Include(sh => sh.User)
                    .Include(sh => sh.Province)
                    .Include(sh => sh.Commune)
                    .Where(sh => sh.Id == searchHistory.Id)
                    .Select(sh => new SearchHistoryResponse
                    {
                        Id = sh.Id,
                        UserId = sh.UserId,
                        SessionId = sh.SessionId,
                        SearchKeyword = sh.SearchKeyword,
                        ProvinceId = sh.ProvinceId,
                        CommuneId = sh.CommuneId,
                        PropertyType = sh.PropertyType,
                        CheckIn = sh.CheckIn,
                        CheckOut = sh.CheckOut,
                        Adults = sh.Adults,
                        Children = sh.Children,
                        PriceMin = sh.PriceMin,
                        PriceMax = sh.PriceMax,
                        StarRating = sh.StarRating,
                        ResultCount = sh.ResultCount,
                        IPAddress = sh.IPAddress,
                        UserAgent = sh.UserAgent,
                        CreatedAt = sh.CreatedAt,
                        User = sh.User != null ? new UserResponse
                        {
                            Id = sh.User.Id,
                            Name = sh.User.FullName,
                            Email = sh.User.Email
                        } : null,
                        Province = sh.Province != null ? new ProvinceResponse
                        {
                            Id = sh.Province.Id,
                            Name = sh.Province.Name,
                            Code = sh.Province.Code
                        } : null,
                        Commune = sh.Commune != null ? new CommuneResponse
                        {
                            Id = sh.Commune.Id,
                            Name = sh.Commune.Name,
                            Code = sh.Commune.Code
                        } : null
                    })
                    .FirstOrDefaultAsync();

                return CreatedAtAction(nameof(GetSearchHistory), new { id = searchHistory.Id },
                    new ApiResponse<SearchHistoryResponse>
                    {
                        Success = true,
                        Message = "Search history created successfully",
                        StatusCode = 201,
                        Data = createdSearchHistory
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<SearchHistoryResponse>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // PUT: api/SearchHistory/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<SearchHistoryResponse>>> UpdateSearchHistory(int id, UpdateSearchHistoryRequest request)
        {
            try
            {
                var existingSearchHistory = await _context.SearchHistories.FindAsync(id);
                if (existingSearchHistory == null)
                {
                    return NotFound(new ApiResponse<SearchHistoryResponse>
                    {
                        Success = false,
                        Message = "Search history not found",
                        StatusCode = 404
                    });
                }
                var userId = GetCurrentUserId();
                // Store old values for audit
                var oldValues = JsonSerializer.Serialize(existingSearchHistory);

                // Update properties
                existingSearchHistory.UserId = userId;
                existingSearchHistory.SessionId = request.SessionId;
                existingSearchHistory.SearchKeyword = request.SearchKeyword;
                existingSearchHistory.ProvinceId = request.ProvinceId;
                existingSearchHistory.CommuneId = request.CommuneId;
                existingSearchHistory.PropertyType = request.PropertyType;
                existingSearchHistory.CheckIn = request.CheckIn;
                existingSearchHistory.CheckOut = request.CheckOut;
                existingSearchHistory.Adults = request.Adults;
                existingSearchHistory.Children = request.Children;
                existingSearchHistory.PriceMin = request.PriceMin;
                existingSearchHistory.PriceMax = request.PriceMax;
                existingSearchHistory.StarRating = request.StarRating;
                existingSearchHistory.ResultCount = request.ResultCount;
                existingSearchHistory.IPAddress = request.IPAddress;
                existingSearchHistory.UserAgent = request.UserAgent;

                await _context.SaveChangesAsync();

                // Log audit
                var newValues = JsonSerializer.Serialize(existingSearchHistory);
                await _auditLogService.LogUpdateAsync("SearchHistory", id, oldValues, newValues);

                // Retrieve updated entity with navigation properties
                var updatedSearchHistory = await _context.SearchHistories
                    .Include(sh => sh.User)
                    .Include(sh => sh.Province)
                    .Include(sh => sh.Commune)
                    .Where(sh => sh.Id == id)
                    .Select(sh => new SearchHistoryResponse
                    {
                        Id = sh.Id,
                        UserId = sh.UserId,
                        SessionId = sh.SessionId,
                        SearchKeyword = sh.SearchKeyword,
                        ProvinceId = sh.ProvinceId,
                        CommuneId = sh.CommuneId,
                        PropertyType = sh.PropertyType,
                        CheckIn = sh.CheckIn,
                        CheckOut = sh.CheckOut,
                        Adults = sh.Adults,
                        Children = sh.Children,
                        PriceMin = sh.PriceMin,
                        PriceMax = sh.PriceMax,
                        StarRating = sh.StarRating,
                        ResultCount = sh.ResultCount,
                        IPAddress = sh.IPAddress,
                        UserAgent = sh.UserAgent,
                        CreatedAt = sh.CreatedAt,
                        User = sh.User != null ? new UserResponse
                        {
                            Id = sh.User.Id,
                            Name = sh.User.FullName,
                            Email = sh.User.Email
                        } : null,
                        Province = sh.Province != null ? new ProvinceResponse
                        {
                            Id = sh.Province.Id,
                            Name = sh.Province.Name,
                            Code = sh.Province.Code
                        } : null,
                        Commune = sh.Commune != null ? new CommuneResponse
                        {
                            Id = sh.Commune.Id,
                            Name = sh.Commune.Name,
                            Code = sh.Commune.Code
                        } : null
                    })
                    .FirstOrDefaultAsync();

                return Ok(new ApiResponse<SearchHistoryResponse>
                {
                    Success = true,
                    Message = "Search history updated successfully",
                    StatusCode = 200,
                    Data = updatedSearchHistory
                });
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SearchHistoryExists(id))
                {
                    return NotFound(new ApiResponse<SearchHistoryResponse>
                    {
                        Success = false,
                        Message = "Search history not found",
                        StatusCode = 404
                    });
                }
                throw;
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<SearchHistoryResponse>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // DELETE: api/SearchHistory/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteSearchHistory(int id)
        {
            try
            {
                var searchHistory = await _context.SearchHistories.FindAsync(id);
                if (searchHistory == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Search history not found",
                        StatusCode = 404
                    });
                }

                // Store old values for audit
                var oldValues = JsonSerializer.Serialize(searchHistory);

                _context.SearchHistories.Remove(searchHistory);
                await _context.SaveChangesAsync();

                // Log audit
                await _auditLogService.LogDeleteAsync("SearchHistory", id, oldValues);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Search history deleted successfully",
                    StatusCode = 200
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // GET: api/SearchHistory/user/{userId}/stats
        [HttpGet("user/{userId}/stats")]
        public async Task<ActionResult<ApiResponse<UserSearchStatsResponse>>> GetUserSearchStats(int userId)
        {
            try
            {
                var totalSearches = await _context.SearchHistories
                    .Where(sh => sh.UserId == userId)
                    .CountAsync();

                var topSearchKeywords = await _context.SearchHistories
                    .Where(sh => sh.UserId == userId && !string.IsNullOrEmpty(sh.SearchKeyword))
                    .GroupBy(sh => sh.SearchKeyword)
                    .Select(g => new TopSearchKeywordResponse { Keyword = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(5)
                    .ToListAsync();

                var topProvinces = await _context.SearchHistories
                    .Where(sh => sh.UserId == userId && sh.ProvinceId.HasValue)
                    .Include(sh => sh.Province)
                    .GroupBy(sh => new { sh.ProvinceId, sh.Province.Name })
                    .Select(g => new TopProvinceResponse
                    {
                        ProvinceId = g.Key.ProvinceId,
                        ProvinceName = g.Key.Name,
                        Count = g.Count()
                    })
                    .OrderByDescending(x => x.Count)
                    .Take(5)
                    .ToListAsync();

                var stats = new UserSearchStatsResponse
                {
                    TotalSearches = totalSearches,
                    TopSearchKeywords = topSearchKeywords,
                    TopProvinces = topProvinces
                };

                return Ok(new ApiResponse<UserSearchStatsResponse>
                {
                    Success = true,
                    Message = "User search statistics retrieved successfully",
                    StatusCode = 200,
                    Data = stats
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<UserSearchStatsResponse>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // GET: api/SearchHistory/popular-searches
        [HttpGet("popular-searches")]
        public async Task<ActionResult<ApiResponse<List<PopularSearchResponse>>>> GetPopularSearches(
            [FromQuery] PopularSearchesRequest request)
        {
            try
            {
                var query = _context.SearchHistories.AsQueryable();

                if (request.FromDate.HasValue)
                    query = query.Where(sh => sh.CreatedAt >= request.FromDate.Value);

                if (request.ToDate.HasValue)
                    query = query.Where(sh => sh.CreatedAt <= request.ToDate.Value);

                var popularSearches = await query
                    .Where(sh => !string.IsNullOrEmpty(sh.SearchKeyword))
                    .GroupBy(sh => sh.SearchKeyword)
                    .Select(g => new PopularSearchResponse { Keyword = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(request.Limit)
                    .ToListAsync();

                return Ok(new ApiResponse<List<PopularSearchResponse>>
                {
                    Success = true,
                    Message = "Popular searches retrieved successfully",
                    StatusCode = 200,
                    Data = popularSearches
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<PopularSearchResponse>>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        private bool SearchHistoryExists(int id)
        {
            return _context.SearchHistories.Any(e => e.Id == id);
        }
    }
}