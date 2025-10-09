using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QBooking.Data;
using QBooking.Models;
using QBooking.Dtos.Response;
using Microsoft.AspNetCore.Authorization;

namespace QBooking.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AndressController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AndressController(ApplicationDbContext context)
        {
            _context = context;
        }
        [HttpGet("properties/map")]
        public async Task<IActionResult> GetPropertiesForMap()
        {
            try
            {
                var data = await _context.Properties
                    .AsNoTracking()
                    .Where(p => p.IsActive
                                && p.Status == "approved"    // chỉ lấy property đã được duyệt
                                && p.Latitude.HasValue
                                && p.Longitude.HasValue)
                    .Select(p => new
                    {
                        p.Id,
                        p.Name,
                        p.Slug, // thêm slug ở đây
                        Latitude = p.Latitude.Value,
                        Longitude = p.Longitude.Value,
                        PrimaryImage = p.Images
                            .Where(img => img.IsPrimary)
                            .OrderBy(img => img.SortOrder)
                            .Select(img => img.ImageUrl)
                            .FirstOrDefault()
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Approved properties retrieved for map successfully",
                    StatusCode = 200,
                    Data = data
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


        // GET: api/address/provinces
        [HttpGet("provinces")]
        public async Task<IActionResult> GetAllProvinces()
        {
            try
            {
                var provinces = await _context.Provinces
                    .AsNoTracking()
                    .Where(p => p.IsActive)
                    .OrderBy(p => p.Name)
                    .Select(p => new ProvinceDto
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Slug = p.Slug,
                        Code = p.Code,
                        Region = p.Region,
                        Type = p.Type
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<List<ProvinceDto>>
                {
                    Success = true,
                    Message = "Provinces retrieved successfully",
                    StatusCode = 200,
                    Data = provinces
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<ProvinceDto>>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
        [HttpGet("admin/provinces")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAllProvincesForAdmin()
        {
            try
            {
                var provinces = await _context.Provinces
                    .AsNoTracking()
                    .OrderBy(p => p.Name)
                    .Select(p => new ProvinceAdminDto
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Slug = p.Slug,
                        Code = p.Code,
                        Region = p.Region,
                        Type = p.Type,
                        IsActive = p.IsActive // cho admin thấy cả trạng thái
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<List<ProvinceAdminDto>>
                {
                    Success = true,
                    Message = "Admin: Provinces retrieved successfully",
                    StatusCode = 200,
                    Data = provinces
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<ProvinceAdminDto>>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // GET: api/address/provinces/search?name=hanoi
        [HttpGet("provinces/search")]
        public async Task<IActionResult> SearchProvinces([FromQuery] string name = "", [FromQuery] string code = "", [FromQuery] string region = "")
        {
            try
            {
                var query = _context.Provinces
                    .AsNoTracking()
                    .Where(p => p.IsActive);

                if (!string.IsNullOrEmpty(name))
                {
                    query = query.Where(p => p.Name.Contains(name) || p.Slug.Contains(name.ToLower()));
                }

                if (!string.IsNullOrEmpty(code))
                {
                    query = query.Where(p => p.Code.Contains(code));
                }

                if (!string.IsNullOrEmpty(region))
                {
                    query = query.Where(p => p.Region.Contains(region));
                }

                var provinces = await query
                    .OrderBy(p => p.Name)
                    .Select(p => new ProvinceDto
                    {
                        Name = p.Name,
                        Slug = p.Slug,
                        Code = p.Code,
                        Region = p.Region,
                        Type = p.Type
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<List<ProvinceDto>>
                {
                    Success = true,
                    Message = $"Found {provinces.Count} provinces",
                    StatusCode = 200,
                    Data = provinces
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<ProvinceDto>>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // GET: api/address/communes?page=1&pageSize=10
        [HttpGet("communes")]
        public async Task<IActionResult> GetAllCommunes([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                // Validate pagination parameters
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;
                if (pageSize > 100) pageSize = 100; // Limit max page size

                var query = _context.Communes
                    .AsNoTracking()
                    .Include(c => c.Province)
                    .Where(c => c.IsActive)
                    .OrderBy(c => c.Name);

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

                var communes = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(c => new CommuneDto
                    {
                        Name = c.Name,
                        Slug = c.Slug,
                        Code = c.Code,
                        Type = c.Type,
                        ProvinceName = c.Province.Name,
                        ProvinceCode = c.Province.Code
                    })
                    .ToListAsync();

                var paginationInfo = new
                {
                    CurrentPage = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = totalPages,
                    HasNextPage = page < totalPages,
                    HasPreviousPage = page > 1
                };

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Communes retrieved successfully",
                    StatusCode = 200,
                    Data = new
                    {
                        Items = communes,
                        Pagination = paginationInfo
                    }
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
        [HttpGet("admin/communes")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAllCommunesForAdmin([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;
                if (pageSize > 100) pageSize = 100;

                var query = _context.Communes
                    .AsNoTracking()
                    .Include(c => c.Province)
                    .OrderBy(c => c.Name); // không filter IsActive

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

                var communes = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(c => new CommuneAdminDto
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Slug = c.Slug,
                        Code = c.Code,
                        Type = c.Type,
                        ProvinceName = c.Province.Name,
                        ProvinceCode = c.Province.Code,
                        IsActive = c.IsActive
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Admin: Communes retrieved successfully",
                    StatusCode = 200,
                    Data = new
                    {
                        Items = communes,
                        Pagination = new
                        {
                            CurrentPage = page,
                            PageSize = pageSize,
                            TotalCount = totalCount,
                            TotalPages = totalPages,
                            HasNextPage = page < totalPages,
                            HasPreviousPage = page > 1
                        }
                    }
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

        // GET: api/address/communes/by-province/{provinceCode}?page=1&pageSize=10
        [HttpGet("communes/by-province/{provinceCode}")]
        public async Task<IActionResult> GetCommunesByProvince(string provinceCode)
        {
            try
            {


                var query = _context.Communes
                    .AsNoTracking()
                    .Include(c => c.Province)
                    .Where(c => c.IsActive && c.Province.Code == provinceCode && c.Province.IsActive)
                    .OrderBy(c => c.Name);

                var totalCount = await query.CountAsync();

                if (totalCount == 0)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "No communes found for the specified province",
                        StatusCode = 404
                    });
                }



                var communes = await query

                    .Select(c => new CommuneDto
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Slug = c.Slug,
                        Code = c.Code,
                        Type = c.Type,
                        ProvinceName = c.Province.Name,
                        ProvinceCode = c.Province.Code
                    })
                    .ToListAsync();



                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Found {totalCount} communes in province )",
                    StatusCode = 200,
                    Data = new
                    {
                        Items = communes,
       
                    }
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

        // GET: api/address/communes/search?name=hanoi&provinceCode=01&page=1&pageSize=10
        [HttpGet("communes/search")]
        public async Task<IActionResult> SearchCommunes([FromQuery] string name = "", [FromQuery] string code = "", [FromQuery] string provinceCode = "", [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                // Validate pagination parameters
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;
                if (pageSize > 100) pageSize = 100; // Limit max page size

                var query = _context.Communes
                    .AsNoTracking()
                    .Include(c => c.Province)
                    .Where(c => c.IsActive);

                if (!string.IsNullOrEmpty(name))
                {
                    query = query.Where(c => c.Name.Contains(name) || c.Slug.Contains(name.ToLower()));
                }

                if (!string.IsNullOrEmpty(code))
                {
                    query = query.Where(c => c.Code.Contains(code));
                }

                if (!string.IsNullOrEmpty(provinceCode))
                {
                    query = query.Where(c => c.Province.Code == provinceCode);
                }

                query = query.OrderBy(c => c.Name);

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

                var communes = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(c => new CommuneDto
                    {
                        Name = c.Name,
                        Slug = c.Slug,
                        Code = c.Code,
                        Type = c.Type,
                        ProvinceName = c.Province.Name,
                        ProvinceCode = c.Province.Code
                    })
                    .ToListAsync();

                var paginationInfo = new
                {
                    CurrentPage = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = totalPages,
                    HasNextPage = page < totalPages,
                    HasPreviousPage = page > 1
                };

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Found {totalCount} communes (showing page {page} of {totalPages})",
                    StatusCode = 200,
                    Data = new
                    {
                        Items = communes,
                        Pagination = paginationInfo
                    }
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
        [HttpGet("provinces/top-properties")]
        public async Task<IActionResult> GetProvincesWithMostProperties([FromQuery] int top = 5)
        {
            try
            {
                if (top < 1) top = 5;

                var result = await _context.Properties
                    .Where(pr => pr.IsActive)
                    .GroupBy(pr => pr.ProvinceId)
                    .Select(g => new
                    {
                        TinhId = g.Key,
                        SoLuongProperty = g.Count(),
                        TenTinh = _context.Provinces
                                        .Where(p => p.Id == g.Key)
                                        .Select(p => p.Name)
                                        .FirstOrDefault()
                    })
                    .OrderByDescending(x => x.SoLuongProperty)
                    .Take(top)
                    .ToListAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Top {top} tỉnh/thành có nhiều bất động sản nhất",
                    StatusCode = 200,
                    Data = result
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
        // Thêm các API sau vào AndressController

        // ============= ADMIN APIs =============

        // GET: api/address/admin/provinces/statistics
        [HttpGet("admin/provinces/statistics")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetProvincesStatistics()
        {
            try
            {
                var statistics = await _context.Provinces
                    .AsNoTracking()
                    .Select(p => new
                    {
                        ProvinceId = p.Id,
                        ProvinceName = p.Name,
                        ProvinceCode = p.Code,
                        Region = p.Region,
                        IsActive = p.IsActive,
                        TotalUsers = _context.Users.Count(u => u.ProvinceId == p.Id),
                        TotalProperties = _context.Properties.Count(pr => pr.ProvinceId == p.Id),
                        ActiveProperties = _context.Properties.Count(pr => pr.ProvinceId == p.Id && pr.IsActive),
                        TotalCommunes = _context.Communes.Count(c => c.ProvinceId == p.Id),
                        TotalBookings = _context.Bookings.Count(b => b.Property.ProvinceId == p.Id)
                    })
                    .OrderByDescending(x => x.TotalProperties)
                    .ToListAsync();

                var summary = new
                {
                    TotalProvinces = statistics.Count,
                    ActiveProvinces = statistics.Count(s => s.IsActive),
                    InactiveProvinces = statistics.Count(s => !s.IsActive),
                    TotalUsersAcrossAllProvinces = statistics.Sum(s => s.TotalUsers),
                    TotalPropertiesAcrossAllProvinces = statistics.Sum(s => s.TotalProperties),
                    ProvinceWithMostUsers = statistics.OrderByDescending(s => s.TotalUsers).FirstOrDefault()?.ProvinceName,
                    ProvinceWithMostProperties = statistics.OrderByDescending(s => s.TotalProperties).FirstOrDefault()?.ProvinceName
                };

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Province statistics retrieved successfully",
                    StatusCode = 200,
                    Data = new
                    {
                        Summary = summary,
                        Details = statistics
                    }
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

        // GET: api/address/admin/provinces/top-users?top=10
        [HttpGet("admin/provinces/top-users")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetProvincesWithMostUsers([FromQuery] int top = 10)
        {
            try
            {
                if (top < 1) top = 10;
                if (top > 100) top = 100;

                var result = await _context.Users
                    .Where(u => u.ProvinceId.HasValue && u.IsActive)
                    .GroupBy(u => u.ProvinceId)
                    .Select(g => new
                    {
                        ProvinceId = g.Key,
                        TotalUsers = g.Count(),
                        ActiveUsers = g.Count(u => u.IsActive),
                        CustomersCount = g.Count(u => u.Role == "customer"),
                        HostsCount = g.Count(u => u.Role == "host"),
                        AdminsCount = g.Count(u => u.Role == "admin"),
                        ProvinceName = _context.Provinces
                            .Where(p => p.Id == g.Key)
                            .Select(p => p.Name)
                            .FirstOrDefault(),
                        ProvinceCode = _context.Provinces
                            .Where(p => p.Id == g.Key)
                            .Select(p => p.Code)
                            .FirstOrDefault(),
                        Region = _context.Provinces
                            .Where(p => p.Id == g.Key)
                            .Select(p => p.Region)
                            .FirstOrDefault()
                    })
                    .OrderByDescending(x => x.TotalUsers)
                    .Take(top)
                    .ToListAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Top {top} provinces with most users",
                    StatusCode = 200,
                    Data = result
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

        // GET: api/address/admin/communes/statistics
        [HttpGet("admin/communes/statistics")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetCommunesStatistics([FromQuery] string? provinceCode = null)
        {
            try
            {
                var query = _context.Communes
     .Include(c => c.Province) 
     .AsQueryable();           


                if (!string.IsNullOrEmpty(provinceCode))
                {
                    query = query.Where(c => c.Province.Code == provinceCode);
                }

                var statistics = await query
                    .Select(c => new
                    {
                        CommuneId = c.Id,
                        CommuneName = c.Name,
                        CommuneCode = c.Code,
                        CommuneType = c.Type,
                        IsActive = c.IsActive,
                        ProvinceName = c.Province.Name,
                        ProvinceCode = c.Province.Code,
                        TotalUsers = _context.Users.Count(u => u.CommuneId == c.Id),
                        TotalProperties = _context.Properties.Count(p => p.CommuneId == c.Id),
                        ActiveProperties = _context.Properties.Count(p => p.CommuneId == c.Id && p.IsActive)
                    })
                    .OrderByDescending(x => x.TotalProperties)
                    .ToListAsync();

                var summary = new
                {
                    TotalCommunes = statistics.Count,
                    ActiveCommunes = statistics.Count(s => s.IsActive),
                    InactiveCommunes = statistics.Count(s => !s.IsActive),
                    TotalUsersInCommunes = statistics.Sum(s => s.TotalUsers),
                    TotalPropertiesInCommunes = statistics.Sum(s => s.TotalProperties),
                    CommuneWithMostUsers = statistics.OrderByDescending(s => s.TotalUsers).FirstOrDefault()?.CommuneName,
                    CommuneWithMostProperties = statistics.OrderByDescending(s => s.TotalProperties).FirstOrDefault()?.CommuneName
                };

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Commune statistics retrieved successfully",
                    StatusCode = 200,
                    Data = new
                    {
                        Summary = summary,
                        Details = statistics
                    }
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

        // GET: api/address/admin/communes/top-properties?top=20
        [HttpGet("admin/communes/top-properties")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetCommunesWithMostProperties([FromQuery] int top = 20)
        {
            try
            {
                if (top < 1) top = 20;
                if (top > 100) top = 100;

                var result = await _context.Properties
                    .Where(p => p.CommuneId.HasValue && p.IsActive)
                    .GroupBy(p => p.CommuneId)
                    .Select(g => new
                    {
                        CommuneId = g.Key,
                        TotalProperties = g.Count(),
                        ActiveProperties = g.Count(p => p.IsActive),
                        ApprovedProperties = g.Count(p => p.Status == "approved"),
                        FeaturedProperties = g.Count(p => p.IsFeatured),
                        TotalBookings = g.Sum(p => p.BookingCount),
                        TotalViews = g.Sum(p => p.ViewCount),
                        CommuneName = _context.Communes
                            .Where(c => c.Id == g.Key)
                            .Select(c => c.Name)
                            .FirstOrDefault(),
                        CommuneCode = _context.Communes
                            .Where(c => c.Id == g.Key)
                            .Select(c => c.Code)
                            .FirstOrDefault(),
                        ProvinceName = _context.Communes
                            .Where(c => c.Id == g.Key)
                            .Select(c => c.Province.Name)
                            .FirstOrDefault()
                    })
                    .OrderByDescending(x => x.TotalProperties)
                    .Take(top)
                    .ToListAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Top {top} communes with most properties",
                    StatusCode = 200,
                    Data = result
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

        // GET: api/address/admin/provinces/{id}/detail
        [HttpGet("admin/provinces/{id}/detail")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetProvinceDetailForAdmin(int id)
        {
            try
            {
                var province = await _context.Provinces
                    .AsNoTracking()
                    .Where(p => p.Id == id)
                    .Select(p => new
                    {
                        p.Id,
                        p.Name,
                        p.Slug,
                        p.Code,
                        p.Region,
                        p.Type,
                        p.IsActive,
                        p.CreatedAt,

                        Statistics = new
                        {
                            TotalCommunes = _context.Communes.Count(c => c.ProvinceId == p.Id),
                            ActiveCommunes = _context.Communes.Count(c => c.ProvinceId == p.Id && c.IsActive),
                            TotalUsers = _context.Users.Count(u => u.ProvinceId == p.Id),
                            ActiveUsers = _context.Users.Count(u => u.ProvinceId == p.Id && u.IsActive),
                            TotalProperties = _context.Properties.Count(pr => pr.ProvinceId == p.Id),
                            ActiveProperties = _context.Properties.Count(pr => pr.ProvinceId == p.Id && pr.IsActive),
                            ApprovedProperties = _context.Properties.Count(pr => pr.ProvinceId == p.Id && pr.Status == "approved"),
                            TotalBookings = _context.Bookings.Count(b => b.Property.ProvinceId == p.Id),
                            TotalReviews = _context.Reviews.Count(r => r.Property.ProvinceId == p.Id)
                        }
                    })
                    .FirstOrDefaultAsync();

                if (province == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Province not found",
                        StatusCode = 404
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Province details retrieved successfully",
                    StatusCode = 200,
                    Data = province
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

        // GET: api/address/admin/dashboard
        [HttpGet("admin/dashboard")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAddressDashboard()
        {
            try
            {
                var totalProvinces = await _context.Provinces.CountAsync();
                var activeProvinces = await _context.Provinces.CountAsync(p => p.IsActive);
                var totalCommunes = await _context.Communes.CountAsync();
                var activeCommunes = await _context.Communes.CountAsync(c => c.IsActive);

                var topProvincesByProperties = await _context.Properties
                    .Where(p => p.IsActive)
                    .GroupBy(p => p.ProvinceId)
                    .Select(g => new
                    {
                        ProvinceId = g.Key,
                        ProvinceName = _context.Provinces
                            .Where(p => p.Id == g.Key)
                            .Select(p => p.Name)
                            .FirstOrDefault(),
                        TotalProperties = g.Count()
                    })
                    .OrderByDescending(x => x.TotalProperties)
                    .Take(5)
                    .ToListAsync();

                var topProvincesByUsers = await _context.Users
                    .Where(u => u.ProvinceId.HasValue && u.IsActive)
                    .GroupBy(u => u.ProvinceId)
                    .Select(g => new
                    {
                        ProvinceId = g.Key,
                        ProvinceName = _context.Provinces
                            .Where(p => p.Id == g.Key)
                            .Select(p => p.Name)
                            .FirstOrDefault(),
                        TotalUsers = g.Count()
                    })
                    .OrderByDescending(x => x.TotalUsers)
                    .Take(5)
                    .ToListAsync();

                var regionDistribution = await _context.Provinces
                    .Where(p => p.IsActive)
                    .GroupBy(p => p.Region)
                    .Select(g => new
                    {
                        Region = g.Key,
                        TotalProvinces = g.Count(),
                        TotalProperties = _context.Properties
                            .Count(pr => pr.IsActive && pr.Province.Region == g.Key),
                        TotalUsers = _context.Users
                            .Count(u => u.IsActive && u.Province.Region == g.Key)
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Address dashboard data retrieved successfully",
                    StatusCode = 200,
                    Data = new
                    {
                        Overview = new
                        {
                            TotalProvinces = totalProvinces,
                            ActiveProvinces = activeProvinces,
                            InactiveProvinces = totalProvinces - activeProvinces,
                            TotalCommunes = totalCommunes,
                            ActiveCommunes = activeCommunes,
                            InactiveCommunes = totalCommunes - activeCommunes
                        },
                        TopProvincesByProperties = topProvincesByProperties,
                        TopProvincesByUsers = topProvincesByUsers,
                        RegionDistribution = regionDistribution
                    }
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

        // PUT: api/address/admin/provinces/{id}/toggle-status
        [HttpPut("admin/provinces/{id}/toggle-status")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ToggleProvinceStatus(int id)
        {
            try
            {
                var province = await _context.Provinces.FindAsync(id);

                if (province == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Province not found",
                        StatusCode = 404
                    });
                }

                province.IsActive = !province.IsActive;


                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Province status updated to {(province.IsActive ? "active" : "inactive")}",
                    StatusCode = 200,
                    Data = new
                    {
                        province.Id,
                        province.Name,
                        province.IsActive
                    }
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

        // PUT: api/address/admin/communes/{id}/toggle-status
        [HttpPut("admin/communes/{id}/toggle-status")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ToggleCommuneStatus(int id)
        {
            try
            {
                var commune = await _context.Communes
                    .Include(c => c.Province)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (commune == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Commune not found",
                        StatusCode = 404
                    });
                }

                commune.IsActive = !commune.IsActive;


                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Commune status updated to {(commune.IsActive ? "active" : "inactive")}",
                    StatusCode = 200,
                    Data = new
                    {
                        commune.Id,
                        commune.Name,
                        commune.IsActive,
                        ProvinceName = commune.Province.Name
                    }
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
    }
}