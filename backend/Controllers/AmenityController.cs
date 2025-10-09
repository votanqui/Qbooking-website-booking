using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QBooking.Data;
using QBooking.Models;
using QBooking.Dtos.Request;
using QBooking.Dtos.Response;
using QBooking.Services;
using Microsoft.AspNetCore.Authorization;
using System.Text.Json;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AmenityController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AuditLogService _auditLogService;

        public AmenityController(ApplicationDbContext context, AuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }
        [HttpPatch("categories/{id}/sort-order")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateCategorySortOrder(int id, [FromBody] UpdateSortOrderRequest request)
        {
            try
            {
                var category = await _context.AmenityCategories.FindAsync(id);
                if (category == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Category not found"
                    });
                }

                var oldValues = JsonSerializer.Serialize(new { Id = category.Id, SortOrder = category.SortOrder });
                category.SortOrder = request.SortOrder;
                await _context.SaveChangesAsync();

                var newValues = JsonSerializer.Serialize(new { Id = category.Id, SortOrder = category.SortOrder });
                await _auditLogService.LogUpdateAsync("AmenityCategories", category.Id, oldValues, newValues);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Category sort order updated successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        [HttpPatch("{id}/sort-order")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateAmenitySortOrder(int id, [FromBody] UpdateSortOrderRequest request)
        {
            try
            {
                var amenity = await _context.Amenities.FindAsync(id);
                if (amenity == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Amenity not found"
                    });
                }

                var oldValues = JsonSerializer.Serialize(new { Id = amenity.Id, SortOrder = amenity.SortOrder });
                amenity.SortOrder = request.SortOrder;
                await _context.SaveChangesAsync();

                var newValues = JsonSerializer.Serialize(new { Id = amenity.Id, SortOrder = amenity.SortOrder });
                await _auditLogService.LogUpdateAsync("Amenities", amenity.Id, oldValues, newValues);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Amenity sort order updated successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        [HttpPatch("{id}/toggle-popular")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<object>>> ToggleAmenityPopular(int id)
        {
            try
            {
                var amenity = await _context.Amenities.FindAsync(id);
                if (amenity == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Amenity not found"
                    });
                }

                var oldValues = JsonSerializer.Serialize(new { Id = amenity.Id, IsPopular = amenity.IsPopular });
                amenity.IsPopular = !amenity.IsPopular;
                await _context.SaveChangesAsync();

                var newValues = JsonSerializer.Serialize(new { Id = amenity.Id, IsPopular = amenity.IsPopular });
                await _auditLogService.LogUpdateAsync("Amenities", amenity.Id, oldValues, newValues);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = $"Amenity is now {(amenity.IsPopular ? "popular" : "not popular")}",
                    Data = new { IsPopular = amenity.IsPopular }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // ============= STATISTICS & REPORTS =============

        [HttpGet("statistics/overview")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<AmenityStatisticsOverview>>> GetStatisticsOverview()
        {
            try
            {
                var totalCategories = await _context.AmenityCategories.CountAsync();
                var totalAmenities = await _context.Amenities.CountAsync();
                var popularAmenities = await _context.Amenities.CountAsync(a => a.IsPopular);
                var totalPropertyAmenities = await _context.PropertyAmenities.CountAsync();

                var categoriesWithCounts = await _context.AmenityCategories
                    .Select(c => new CategoryWithCount
                    {
                        CategoryId = c.Id,
                        CategoryName = c.Name,
                        AmenityCount = c.Amenities.Count,
                        PropertyCount = c.Amenities.SelectMany(a => a.PropertyAmenities).Count()
                    })
                    .OrderByDescending(c => c.PropertyCount)
                    .Take(10)
                    .ToListAsync();

                var response = new AmenityStatisticsOverview
                {
                    TotalCategories = totalCategories,
                    TotalAmenities = totalAmenities,
                    PopularAmenities = popularAmenities,
                    TotalPropertyAmenities = totalPropertyAmenities,
                    TopCategories = categoriesWithCounts
                };

                return Ok(new ApiResponse<AmenityStatisticsOverview>
                {
                    Success = true,
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<AmenityStatisticsOverview>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        [HttpGet("statistics/most-used")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<List<AmenityUsageStatistics>>>> GetMostUsedAmenities(int top = 20)
        {
            try
            {
                var mostUsed = await _context.Amenities
                    .Select(a => new AmenityUsageStatistics
                    {
                        AmenityId = a.Id,
                        AmenityName = a.Name,
                        CategoryName = a.Category.Name,
                        Icon = a.Icon,
                        IsPopular = a.IsPopular,
                        UsageCount = a.PropertyAmenities.Count,
                        PropertyCount = a.PropertyAmenities.Select(pa => pa.PropertyId).Distinct().Count()
                    })
                    .OrderByDescending(a => a.UsageCount)
                    .Take(top)
                    .ToListAsync();

                return Ok(new ApiResponse<List<AmenityUsageStatistics>>
                {
                    Success = true,
                    StatusCode = 200,
                    Data = mostUsed
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<AmenityUsageStatistics>>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        [HttpGet("statistics/unused")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<List<UnusedAmenityResponse>>>> GetUnusedAmenities()
        {
            try
            {
                var unused = await _context.Amenities
                    .Where(a => !a.PropertyAmenities.Any())
                    .Select(a => new UnusedAmenityResponse
                    {
                        Id = a.Id,
                        Name = a.Name,
                        CategoryName = a.Category.Name,
                        Icon = a.Icon,
                        IsPopular = a.IsPopular,
                       
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<List<UnusedAmenityResponse>>
                {
                    Success = true,
                    StatusCode = 200,
                    Data = unused
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<UnusedAmenityResponse>>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        [HttpGet("statistics/by-category")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<List<CategoryStatistics>>>> GetStatisticsByCategory()
        {
            try
            {
                var stats = await _context.AmenityCategories
                    .Select(c => new CategoryStatistics
                    {
                        CategoryId = c.Id,
                        CategoryName = c.Name,
                        Icon = c.Icon,
                        TotalAmenities = c.Amenities.Count,
                        PopularAmenities = c.Amenities.Count(a => a.IsPopular),
                        TotalUsage = c.Amenities.SelectMany(a => a.PropertyAmenities).Count(),
                        UniqueProperties = c.Amenities
                            .SelectMany(a => a.PropertyAmenities)
                            .Select(pa => pa.PropertyId)
                            .Distinct()
                            .Count(),
                        AverageUsagePerAmenity = c.Amenities.Count > 0
                            ? (double)c.Amenities.SelectMany(a => a.PropertyAmenities).Count() / c.Amenities.Count
                            : 0
                    })
                    .OrderByDescending(c => c.TotalUsage)
                    .ToListAsync();

                return Ok(new ApiResponse<List<CategoryStatistics>>
                {
                    Success = true,
                    StatusCode = 200,
                    Data = stats
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<CategoryStatistics>>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // AMENITY CATEGORY ENDPOINTS
        [HttpGet("categories/simple")]
        public async Task<ActionResult<ApiResponse<List<AmenityCategoryResponse>>>> GetCategoriesSimple()
        {
            try
            {
                var categories = await _context.AmenityCategories
                    .OrderBy(c => c.SortOrder)
                    .Select(c => new AmenityCategoryResponse
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Slug = c.Slug,
                        Icon = c.Icon,
                        Description = c.Description,
                        SortOrder = c.SortOrder,
                        Amenities = null // Không load amenities
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<List<AmenityCategoryResponse>>
                {
                    Success = true,
                    StatusCode = 200,
                    Data = categories
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<AmenityCategoryResponse>>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        [HttpGet("categories")]
        public async Task<ActionResult<ApiResponse<List<AmenityCategoryResponse>>>> GetCategories()
        {
            try
            {
                var categories = await _context.AmenityCategories
                    .Include(c => c.Amenities)
                    .OrderBy(c => c.SortOrder)
                    .Select(c => new AmenityCategoryResponse
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Slug = c.Slug,
                        Icon = c.Icon,
                        Description = c.Description,
                        SortOrder = c.SortOrder,
                        Amenities = c.Amenities.Select(a => new AmenityResponse
                        {
                            Id = a.Id,
                            CategoryId = a.CategoryId,
                            Name = a.Name,
                            Slug = a.Slug,
                            Icon = a.Icon,
                            Description = a.Description,
                            IsPopular = a.IsPopular,
                            SortOrder = a.SortOrder,
                            CategoryName = c.Name
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<List<AmenityCategoryResponse>>
                {
                    Success = true,
                    StatusCode = 200,
                    Data = categories
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<AmenityCategoryResponse>>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        [HttpGet("categories/{id}")]
        public async Task<ActionResult<ApiResponse<AmenityCategoryResponse>>> GetCategory(int id)
        {
            try
            {
                var category = await _context.AmenityCategories
                    .Include(c => c.Amenities)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (category == null)
                {
                    return NotFound(new ApiResponse<AmenityCategoryResponse>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Category not found"
                    });
                }

                var response = new AmenityCategoryResponse
                {
                    Id = category.Id,
                    Name = category.Name,
                    Slug = category.Slug,
                    Icon = category.Icon,
                    Description = category.Description,
                    SortOrder = category.SortOrder,
                    Amenities = category.Amenities.Select(a => new AmenityResponse
                    {
                        Id = a.Id,
                        CategoryId = a.CategoryId,
                        Name = a.Name,
                        Slug = a.Slug,
                        Icon = a.Icon,
                        Description = a.Description,
                        IsPopular = a.IsPopular,
                        SortOrder = a.SortOrder,
                        CategoryName = category.Name
                    }).ToList()
                };

                return Ok(new ApiResponse<AmenityCategoryResponse>
                {
                    Success = true,
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<AmenityCategoryResponse>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        [HttpPost("categories")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<AmenityCategoryResponse>>> CreateCategory(CreateAmenityCategoryRequest request)
        {
            try
            {
                var category = new AmenityCategory
                {
                    Name = request.Name,
                    Slug = request.Slug,
                    Icon = request.Icon,
                    Description = request.Description,
                    SortOrder = request.SortOrder
                };

                _context.AmenityCategories.Add(category);
                await _context.SaveChangesAsync();

                // Log audit action
                var newValues = JsonSerializer.Serialize(new
                {
                    Id = category.Id,
                    Name = category.Name,
                    Slug = category.Slug,
                    Icon = category.Icon,
                    Description = category.Description,
                    SortOrder = category.SortOrder
                });
                await _auditLogService.LogInsertAsync("AmenityCategories", category.Id, newValues);

                var response = new AmenityCategoryResponse
                {
                    Id = category.Id,
                    Name = category.Name,
                    Slug = category.Slug,
                    Icon = category.Icon,
                    Description = category.Description,
                    SortOrder = category.SortOrder
                };

                return CreatedAtAction(nameof(GetCategory), new { id = category.Id },
                    new ApiResponse<AmenityCategoryResponse>
                    {
                        Success = true,
                        StatusCode = 201,
                        Data = response,
                        Message = "Category created successfully"
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<AmenityCategoryResponse>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        [HttpPut("categories/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<AmenityCategoryResponse>>> UpdateCategory(int id, UpdateAmenityCategoryRequest request)
        {
            try
            {
                var category = await _context.AmenityCategories.FindAsync(id);
                if (category == null)
                {
                    return NotFound(new ApiResponse<AmenityCategoryResponse>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Category not found"
                    });
                }

                // Capture old values for audit
                var oldValues = JsonSerializer.Serialize(new
                {
                    Id = category.Id,
                    Name = category.Name,
                    Slug = category.Slug,
                    Icon = category.Icon,
                    Description = category.Description,
                    SortOrder = category.SortOrder
                });

                // Update category
                category.Name = request.Name;
                category.Slug = request.Slug;
                category.Icon = request.Icon;
                category.Description = request.Description;
                category.SortOrder = request.SortOrder;

                await _context.SaveChangesAsync();

                // Log audit action
                var newValues = JsonSerializer.Serialize(new
                {
                    Id = category.Id,
                    Name = category.Name,
                    Slug = category.Slug,
                    Icon = category.Icon,
                    Description = category.Description,
                    SortOrder = category.SortOrder
                });
                await _auditLogService.LogUpdateAsync("AmenityCategories", category.Id, oldValues, newValues);

                var response = new AmenityCategoryResponse
                {
                    Id = category.Id,
                    Name = category.Name,
                    Slug = category.Slug,
                    Icon = category.Icon,
                    Description = category.Description,
                    SortOrder = category.SortOrder
                };

                return Ok(new ApiResponse<AmenityCategoryResponse>
                {
                    Success = true,
                    StatusCode = 200,
                    Data = response,
                    Message = "Category updated successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<AmenityCategoryResponse>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        [HttpDelete("categories/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteCategory(int id)
        {
            try
            {
                var category = await _context.AmenityCategories.FindAsync(id);
                if (category == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Category not found"
                    });
                }

                // Capture old values for audit
                var oldValues = JsonSerializer.Serialize(new
                {
                    Id = category.Id,
                    Name = category.Name,
                    Slug = category.Slug,
                    Icon = category.Icon,
                    Description = category.Description,
                    SortOrder = category.SortOrder
                });

                _context.AmenityCategories.Remove(category);
                await _context.SaveChangesAsync();

                // Log audit action
                await _auditLogService.LogDeleteAsync("AmenityCategories", category.Id, oldValues);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Category deleted successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // AMENITY ENDPOINTS

        [HttpGet]
        public async Task<ActionResult<ApiResponse<PaginatedResponse<AmenityResponse>>>> GetAmenities(
            int page = 1, int pageSize = 10, int? categoryId = null, bool? isPopular = null)
        {
            try
            {
                var query = _context.Amenities.Include(a => a.Category).AsQueryable();

                if (categoryId.HasValue)
                    query = query.Where(a => a.CategoryId == categoryId.Value);

                if (isPopular.HasValue)
                    query = query.Where(a => a.IsPopular == isPopular.Value);

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                var amenities = await query
                    .OrderBy(a => a.SortOrder)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(a => new AmenityResponse
                    {
                        Id = a.Id,
                        CategoryId = a.CategoryId,
                        Name = a.Name,
                        Slug = a.Slug,
                        Icon = a.Icon,
                        Description = a.Description,
                        IsPopular = a.IsPopular,
                        SortOrder = a.SortOrder,
                        CategoryName = a.Category.Name
                    })
                    .ToListAsync();

                var paginatedResponse = new PaginatedResponse<AmenityResponse>
                {
                    Items = amenities,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = totalPages,
                    HasNextPage = page < totalPages,
                    HasPrevPage = page > 1
                };

                return Ok(new ApiResponse<PaginatedResponse<AmenityResponse>>
                {
                    Success = true,
                    StatusCode = 200,
                    Data = paginatedResponse
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<PaginatedResponse<AmenityResponse>>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<AmenityResponse>>> GetAmenity(int id)
        {
            try
            {
                var amenity = await _context.Amenities
                    .Include(a => a.Category)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (amenity == null)
                {
                    return NotFound(new ApiResponse<AmenityResponse>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Amenity not found"
                    });
                }

                var response = new AmenityResponse
                {
                    Id = amenity.Id,
                    CategoryId = amenity.CategoryId,
                    Name = amenity.Name,
                    Slug = amenity.Slug,
                    Icon = amenity.Icon,
                    Description = amenity.Description,
                    IsPopular = amenity.IsPopular,
                    SortOrder = amenity.SortOrder,
                    CategoryName = amenity.Category?.Name
                };

                return Ok(new ApiResponse<AmenityResponse>
                {
                    Success = true,
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<AmenityResponse>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<AmenityResponse>>> CreateAmenity(CreateAmenityRequest request)
        {
            try
            {
                var category = await _context.AmenityCategories.FindAsync(request.CategoryId);
                if (category == null)
                {
                    return BadRequest(new ApiResponse<AmenityResponse>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "Invalid category"
                    });
                }

                var amenity = new Amenity
                {
                    CategoryId = request.CategoryId,
                    Name = request.Name,
                    Slug = request.Slug,
                    Icon = request.Icon,
                    Description = request.Description,
                    IsPopular = request.IsPopular,
                    SortOrder = request.SortOrder
                };

                _context.Amenities.Add(amenity);
                await _context.SaveChangesAsync();

                // Log audit action
                var newValues = JsonSerializer.Serialize(new
                {
                    Id = amenity.Id,
                    CategoryId = amenity.CategoryId,
                    Name = amenity.Name,
                    Slug = amenity.Slug,
                    Icon = amenity.Icon,
                    Description = amenity.Description,
                    IsPopular = amenity.IsPopular,
                    SortOrder = amenity.SortOrder
                });
                await _auditLogService.LogInsertAsync("Amenities", amenity.Id, newValues);

                var response = new AmenityResponse
                {
                    Id = amenity.Id,
                    CategoryId = amenity.CategoryId,
                    Name = amenity.Name,
                    Slug = amenity.Slug,
                    Icon = amenity.Icon,
                    Description = amenity.Description,
                    IsPopular = amenity.IsPopular,
                    SortOrder = amenity.SortOrder,
                    CategoryName = category.Name
                };

                return CreatedAtAction(nameof(GetAmenity), new { id = amenity.Id },
                    new ApiResponse<AmenityResponse>
                    {
                        Success = true,
                        StatusCode = 201,
                        Data = response,
                        Message = "Amenity created successfully"
                    });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<AmenityResponse>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<AmenityResponse>>> UpdateAmenity(int id, UpdateAmenityRequest request)
        {
            try
            {
                var amenity = await _context.Amenities.Include(a => a.Category).FirstOrDefaultAsync(a => a.Id == id);
                if (amenity == null)
                {
                    return NotFound(new ApiResponse<AmenityResponse>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Amenity not found"
                    });
                }

                var category = await _context.AmenityCategories.FindAsync(request.CategoryId);
                if (category == null)
                {
                    return BadRequest(new ApiResponse<AmenityResponse>
                    {
                        Success = false,
                        StatusCode = 400,
                        Message = "Invalid category"
                    });
                }

                // Capture old values for audit
                var oldValues = JsonSerializer.Serialize(new
                {
                    Id = amenity.Id,
                    CategoryId = amenity.CategoryId,
                    Name = amenity.Name,
                    Slug = amenity.Slug,
                    Icon = amenity.Icon,
                    Description = amenity.Description,
                    IsPopular = amenity.IsPopular,
                    SortOrder = amenity.SortOrder
                });

                // Update amenity
                amenity.CategoryId = request.CategoryId;
                amenity.Name = request.Name;
                amenity.Slug = request.Slug;
                amenity.Icon = request.Icon;
                amenity.Description = request.Description;
                amenity.IsPopular = request.IsPopular;
                amenity.SortOrder = request.SortOrder;

                await _context.SaveChangesAsync();

                // Log audit action
                var newValues = JsonSerializer.Serialize(new
                {
                    Id = amenity.Id,
                    CategoryId = amenity.CategoryId,
                    Name = amenity.Name,
                    Slug = amenity.Slug,
                    Icon = amenity.Icon,
                    Description = amenity.Description,
                    IsPopular = amenity.IsPopular,
                    SortOrder = amenity.SortOrder
                });
                await _auditLogService.LogUpdateAsync("Amenities", amenity.Id, oldValues, newValues);

                var response = new AmenityResponse
                {
                    Id = amenity.Id,
                    CategoryId = amenity.CategoryId,
                    Name = amenity.Name,
                    Slug = amenity.Slug,
                    Icon = amenity.Icon,
                    Description = amenity.Description,
                    IsPopular = amenity.IsPopular,
                    SortOrder = amenity.SortOrder,
                    CategoryName = category.Name
                };

                return Ok(new ApiResponse<AmenityResponse>
                {
                    Success = true,
                    StatusCode = 200,
                    Data = response,
                    Message = "Amenity updated successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<AmenityResponse>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteAmenity(int id)
        {
            try
            {
                var amenity = await _context.Amenities.FindAsync(id);
                if (amenity == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        StatusCode = 404,
                        Message = "Amenity not found"
                    });
                }

                // Capture old values for audit
                var oldValues = JsonSerializer.Serialize(new
                {
                    Id = amenity.Id,
                    CategoryId = amenity.CategoryId,
                    Name = amenity.Name,
                    Slug = amenity.Slug,
                    Icon = amenity.Icon,
                    Description = amenity.Description,
                    IsPopular = amenity.IsPopular,
                    SortOrder = amenity.SortOrder
                });

                _context.Amenities.Remove(amenity);
                await _context.SaveChangesAsync();

                // Log audit action
                await _auditLogService.LogDeleteAsync("Amenities", amenity.Id, oldValues);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    StatusCode = 200,
                    Message = "Amenity deleted successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
    }
}