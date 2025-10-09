using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using QBooking.Data;
using QBooking.Dtos.Request;
using QBooking.Dtos.Response;
using QBooking.Models;
using QBooking.Services;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace QBooking.Services
{
    public interface IPropertyService
    {
        Task<(bool Success, string Message, object Data)> CreatePropertyAsync(CreatePropertyRequest request, int hostId);
        Task<(bool Success, string Message, object Data)> GetPropertiesAsync(PropertyFilterRequest filter);
        Task<(bool Success, string Message, PropertyDetailResponse Data)> GetPropertyBySlugAsync(string slug);
        Task<(bool Success, string Message, object Data)> UpdatePropertyAsync(int id, UpdatePropertyRequest request, int hostId);
        Task<(bool Success, string Message)> DeletePropertyAsync(int id, int hostId, string webRootPath);
        Task<(bool Success, string Message, object Data)> UploadImagesAsync(int id, UploadImageRequestAlternative request, int hostId, string webRootPath);
        Task<(bool Success, string Message, object Data)> DeleteImageAsync(int imageId, int hostId, string webRootPath);
        Task<(bool Success, string Message, object Data)> SetPrimaryImageAsync(int imageId, int hostId);
        Task<List<ProductType>> GetProductTypesAsync(bool includeInactive = false, string search = null);
        Task<ProductType> GetProductTypeByIdAsync(int id, bool includeProperties = false);
        Task<ProductType> GetProductTypeByCodeAsync(string code);
        Task<ProductType> CreateProductTypeAsync(CreateProductTypeDto createDto);
        Task<ProductType> UpdateProductTypeAsync(int id, UpdateProductTypeDto updateDto);
        Task<bool> DeleteProductTypeAsync(int id, bool forceDelete = false);
        Task<bool> ToggleProductTypeActiveStatusAsync(int id);
        Task<int> GetActiveProductTypesCountAsync();

        Task<(bool Success, string Message, object Data)> GetSimilarPropertiesAsync(int propertyId, int limit = 10);
        Task<(bool Success, string Message, object Data)> GetMostViewedPropertiesAsync(int limit = 10);
        Task<(bool Success, string Message, object Data)> GetMostBookedPropertiesAsync(int limit = 10);



        Task<(bool Success, string Message, PropertyForEditResponse Data)> GetPropertyForEditAsync(int id, int hostId);
        Task<(bool Success, string Message, PropertyForBookingResponse Data)> GetPropertyForBookingAsync(int id);
        Task<(bool Success, string Message, object Data)> GetHostPropertiesAsync(PropertyHostFilterRequest filter, int hostId);

        Task<(bool Success, string Message, object Data)> GetApprovedPropertiesSortedAsync(PropertyAppvoredFilterRequest filter);
        Task<(bool Success, string Message, object Data)> GetFeaturedPropertiesAsync(PropertyFilterRequest filter);
        Task<(bool Success, string Message, object Data)> SubmitPropertyForReviewAsync(int id, int hostId);
        Task<(bool Success, string Message, object Data)> ApprovePropertyAsync(int id, int approverId);
        Task<(bool Success, string Message, object Data)> ToggleFeaturedStatusAsync(int id, int adminId);


       //---------------------------------FOR ADMIN----------------------------------------

        Task<(bool Success, string Message, object Data)> GetAllPropertiesForAdminAsync(PropertyAdminFilterRequest filter);
        Task<(bool Success, string Message, object Data)> GetPropertyDetailForAdminAsync(int id);
        Task<(bool Success, string Message, object Data)> RejectPropertyAsync(int id, int adminId, string reason);
        Task<(bool Success, string Message, object Data)> DeactivatePropertyAsync(int id, int adminId, string reason);
        Task<(bool Success, string Message, object Data)> ActivatePropertyAsync(int id, int adminId);
        Task<(bool Success, string Message, object Data)> GetPropertyStatisticsAsync();
        Task<(bool Success, string Message, object Data)> GetPropertiesByStatusAsync(string status, int page, int pageSize);

    }

    public class PropertyService : IPropertyService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PropertyService> _logger;
        private readonly AuditLogService _auditLogService;
        private readonly IWebHostEnvironment _webHostEnvironment;
        public PropertyService(ApplicationDbContext context, ILogger<PropertyService> logger, AuditLogService auditLogService, IWebHostEnvironment webHostEnvironment)
        {
            _context = context;
            _logger = logger;
            _auditLogService = auditLogService;
            _webHostEnvironment = webHostEnvironment;
        }
        public async Task<(bool Success, string Message, object Data)> GetHostPropertiesAsync(PropertyHostFilterRequest filter, int hostId)
        {
            try
            {
                // Base query chỉ lấy property của host
                var query = _context.Properties
                    .Include(p => p.Images)
                    .Include(p => p.Amenities).ThenInclude(pa => pa.Amenity)
                    .Include(p => p.Province)
                    .Include(p => p.Commune)
                    .Include(p => p.ProductType)
                    .Include(p => p.RoomTypes)
                    .Where(p => p.HostId == hostId)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(filter.Name))
                {
                    query = query.Where(p => p.Name.Contains(filter.Name) ||
                                            p.Slug.Contains(filter.Name));
                }

                if (filter.ProductTypeId.HasValue)
                {
                    query = query.Where(p => p.ProductTypeId == filter.ProductTypeId);
                }

                if (filter.ProvinceId.HasValue)
                {
                    query = query.Where(p => p.ProvinceId == filter.ProvinceId);
                }

                if (!string.IsNullOrEmpty(filter.Status))
                {
                    var statuses = filter.Status.Split(',').Select(s => s.Trim().ToLower()).ToList();
                    query = query.Where(p => statuses.Contains(p.Status.ToLower()));
                }

                if (filter.IsActive.HasValue)
                {
                    query = query.Where(p => p.IsActive == filter.IsActive);
                }

                if (filter.IsFeatured.HasValue)
                {
                    query = query.Where(p => p.IsFeatured == filter.IsFeatured);
                }

                if (filter.CreatedFrom.HasValue)
                {
                    query = query.Where(p => p.CreatedAt >= filter.CreatedFrom.Value);
                }

                if (filter.CreatedTo.HasValue)
                {
                    query = query.Where(p => p.CreatedAt <= filter.CreatedTo.Value);
                }

                if (filter.PriceFrom.HasValue)
                {
                    query = query.Where(p => p.PriceFrom >= filter.PriceFrom.Value);
                }

                if (filter.PriceTo.HasValue)
                {
                    query = query.Where(p => p.PriceFrom <= filter.PriceTo.Value);
                }

                // Apply sorting
                var sortBy = filter.SortBy?.ToLower() ?? "created";
                var sortOrder = filter.SortOrder?.ToLower() ?? "desc";

                query = sortBy switch
                {
                    "name" => sortOrder == "asc"
                        ? query.OrderBy(p => p.Name)
                        : query.OrderByDescending(p => p.Name),

                    "price" => sortOrder == "asc"
                        ? query.OrderBy(p => p.PriceFrom)
                        : query.OrderByDescending(p => p.PriceFrom),

                    "views" => sortOrder == "asc"
                        ? query.OrderBy(p => _context.PropertyViews.Count(pv => pv.PropertyId == p.Id))
                        : query.OrderByDescending(p => _context.PropertyViews.Count(pv => pv.PropertyId == p.Id)),

                    "bookings" => sortOrder == "asc"
                        ? query.OrderBy(p => _context.Bookings.Count(b => b.PropertyId == p.Id))
                        : query.OrderByDescending(p => _context.Bookings.Count(b => b.PropertyId == p.Id)),

                    _ => sortOrder == "asc"
                        ? query.OrderBy(p => p.CreatedAt)
                        : query.OrderByDescending(p => p.CreatedAt)
                };

                // Get total count
                var totalCount = await query.CountAsync();

                // Get paginated properties
                var properties = await query
                    .Skip((filter.Page - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .Select(p => new
                    {
                        Property = p,
                        TotalViews = _context.PropertyViews.Count(pv => pv.PropertyId == p.Id),
                        TotalBookings = _context.Bookings.Count(b => b.PropertyId == p.Id),
                        TotalReviews = _context.Reviews.Count(r => r.PropertyId == p.Id),
                        AverageRating = _context.Reviews
                            .Where(r => r.PropertyId == p.Id)
                            .Select(r => (decimal?)r.OverallRating)
                            .Average(),
                        TotalRevenue = _context.Bookings
                            .Where(b => b.PropertyId == p.Id && b.Status == "confirmed")
                            .Sum(b => (decimal?)b.TotalAmount) ?? 0
                    })
                    .ToListAsync();

                // Build response
                var propertyResponses = properties.Select(x => new
                {
                    Id = x.Property.Id,
                    Name = x.Property.Name,
                    Slug = x.Property.Slug,
                    Type = x.Property.ProductType.Name,
                    Description = x.Property.Description,
                    ShortDescription = x.Property.ShortDescription,
                    AddressDetail = x.Property.AddressDetail,
                    Province = x.Property.Province.Name,
                    Commune = x.Property.Commune.Name,
                    PriceFrom = x.Property.PriceFrom,
                    Currency = x.Property.Currency,
                    Status = x.Property.Status,
                    IsActive = x.Property.IsActive,
                    IsFeatured = x.Property.IsFeatured,
                    CreatedAt = x.Property.CreatedAt,
                    UpdatedAt = x.Property.UpdatedAt,

                    // Images
                    TotalImages = x.Property.Images.Count,
                    PrimaryImage = x.Property.Images
                        .Where(img => img.IsPrimary)
                        .Select(img => img.ImageUrl)
                        .FirstOrDefault(),
                    AllImages = x.Property.Images
                        .OrderByDescending(img => img.IsPrimary)
                        .ThenBy(img => img.SortOrder)
                        .Select(img => new
                        {
                            Id = img.Id,
                            ImageUrl = img.ImageUrl,
                            ImageType = img.ImageType,
                            IsPrimary = img.IsPrimary
                        })
                        .ToList(),

                    // Room types
                    TotalRoomTypes = x.Property.RoomTypes.Count,
                    ActiveRoomTypes = x.Property.RoomTypes.Count(rt => rt.IsActive),
                    RoomTypes = x.Property.RoomTypes
                        .OrderBy(rt => rt.Name)
                        .Select(rt => new
                        {
                            Id = rt.Id,
                            Name = rt.Name,
                            Slug = rt.Slug,
                            BasePrice = rt.BasePrice,
                            TotalRooms = rt.TotalRooms,
                            IsActive = rt.IsActive
                        })
                        .ToList(),

                    // Amenities
                    TotalAmenities = x.Property.Amenities.Count,
                    Amenities = x.Property.Amenities
                        .Select(pa => pa.Amenity.Name)
                        .ToList(),

                    // Statistics
                    Statistics = new
                    {
                        TotalViews = x.TotalViews,
                        TotalBookings = x.TotalBookings,
                        TotalReviews = x.TotalReviews,
                        AverageRating = x.AverageRating,
                        TotalRevenue = x.TotalRevenue
                    }
                }).ToList();

                // Summary statistics
                var summary = new
                {
                    TotalProperties = totalCount,
                    ByStatus = await _context.Properties
                        .Where(p => p.HostId == hostId)
                        .GroupBy(p => p.Status)
                        .Select(g => new { Status = g.Key, Count = g.Count() })
                        .ToListAsync(),
                    TotalActive = await _context.Properties
                        .CountAsync(p => p.HostId == hostId && p.IsActive),
                    TotalFeatured = await _context.Properties
                        .CountAsync(p => p.HostId == hostId && p.IsFeatured),
                    TotalViews = await _context.PropertyViews
                        .CountAsync(pv => pv.Property.HostId == hostId),
                    TotalBookings = await _context.Bookings
                        .CountAsync(b => b.Property.HostId == hostId),
                    TotalRevenue = await _context.Bookings
                        .Where(b => b.Property.HostId == hostId && b.Status == "confirmed")
                        .SumAsync(b => (decimal?)b.TotalAmount) ?? 0
                };

                var result = new
                {
                    Properties = propertyResponses,
                    Summary = summary,
                    Pagination = new
                    {
                        TotalCount = totalCount,
                        Page = filter.Page,
                        PageSize = filter.PageSize,
                        TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
                    },
                    AppliedFilters = new
                    {
                        filter.Name,
                        filter.ProductTypeId,
                        filter.ProvinceId,
                        filter.Status,
                        filter.IsActive,
                        filter.IsFeatured,
                        filter.CreatedFrom,
                        filter.CreatedTo,
                        filter.PriceFrom,
                        filter.PriceTo,
                        filter.SortBy,
                        filter.SortOrder
                    }
                };

                return (true, "Lấy danh sách property của host thành công", result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting host properties");
                throw;
            }
        }
        public async Task<(bool Success, string Message, object Data)> CreatePropertyAsync(CreatePropertyRequest request, int hostId)
        {
            try
            {
                // Validate request
                var validationResult = await ValidateCreateRequestAsync(request);
                if (!validationResult.IsValid)
                {
                    return (false, validationResult.ErrorMessage, null);
                }

                // Generate unique slug
                string baseSlug = GenerateSlug(request.Name);
                string uniqueSlug = await EnsureUniqueSlugAsync(baseSlug);

                // Create property
                var property = new Property
                {
                    HostId = hostId,
                    Name = request.Name,
                    Slug = uniqueSlug,
                    ProductTypeId = request.ProductTypeId,
                    Description = request.Description,
                    ShortDescription = request.ShortDescription,
                    AddressDetail = request.AddressDetail,
                    CommuneId = request.CommuneId,
                    ProvinceId = request.ProvinceId,
                    PostalCode = request.PostalCode,
                    Latitude = request.Latitude,
                    Longitude = request.Longitude,
                    StarRating = request.StarRating,
                    TotalRooms = request.TotalRooms,
                    EstablishedYear = request.EstablishedYear,
                    CheckInTime = request.CheckInTime,
                    CheckOutTime = request.CheckOutTime,
                    MinStayNights = request.MinStayNights,
                    MaxStayNights = request.MaxStayNights,
                    CancellationPolicy = request.CancellationPolicy,
                    MetaTitle = request.MetaTitle,
                    MetaDescription = request.MetaDescription,
                    MetaKeywords = request.MetaKeywords,
                    PriceFrom = request.PriceFrom,
                    Currency = request.Currency,
                    Status = "draft",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                // Add amenities
                if (request.Amenities != null && request.Amenities.Any())
                {
                    foreach (var amenity in request.Amenities)
                    {
                        property.Amenities.Add(new PropertyAmenity
                        {
                            AmenityId = amenity.AmenityId,
                            IsFree = amenity.IsFree,
                            AdditionalInfo = amenity.AdditionalInfo
                        });
                    }
                }

                _context.Properties.Add(property);
                await _context.SaveChangesAsync();

                // Log audit action
                var newValues = JsonSerializer.Serialize(new
                {
                    Id = property.Id,
                    HostId = property.HostId,
                    Name = property.Name,
                    Slug = property.Slug,
                    ProductTypeId = property.ProductTypeId,
                    Description = property.Description,
                    Status = property.Status,
                    PriceFrom = property.PriceFrom,
                    Currency = property.Currency,
                    CommuneId = property.CommuneId,
                    ProvinceId = property.ProvinceId,
                    AmenitiesCount = request.Amenities?.Count ?? 0,
                    CreatedAt = property.CreatedAt
                });
                await _auditLogService.LogInsertAsync("Properties", property.Id, newValues);

                return (true, "Tạo property thành công", new { property.Id, property.Name, property.Status });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating property");
                throw;
            }
        }

        public async Task<(bool Success, string Message, object Data)> GetPropertiesAsync(PropertyFilterRequest filter)
        {
            try
            {
                var query = _context.Properties
                    .Include(p => p.Images)
                    .Include(p => p.Amenities).ThenInclude(pa => pa.Amenity)
                    .Include(p => p.Province)
                    .Include(p => p.Commune)
                    .Include(p => p.ProductType)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(filter.Name))
                    query = query.Where(p => p.Name.Contains(filter.Name));

                if (filter.ProductTypeId.HasValue)
                    query = query.Where(p => p.ProductTypeId == filter.ProductTypeId);

                if (filter.ProvinceId.HasValue)
                    query = query.Where(p => p.ProvinceId == filter.ProvinceId);

                if (!string.IsNullOrEmpty(filter.Status))
                    query = query.Where(p => p.Status == filter.Status);

                if (filter.IsActive.HasValue)
                    query = query.Where(p => p.IsActive == filter.IsActive);

                // Pagination with statistics
                var totalCount = await query.CountAsync();
                var properties = await query
                    .Skip((filter.Page - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .Select(p => new PropertyResponse
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Slug = p.Slug,
                        Type = p.ProductType.Name,
                        Description = p.Description,
                        AddressDetail = p.AddressDetail,
                        Province = p.Province.Name,
                        Commune = p.Commune.Name,
                        PriceFrom = p.PriceFrom,
                        Currency = p.Currency,
                        Status = p.Status,
                        IsActive = p.IsActive,
                        CreatedAt = p.CreatedAt,
                        Images = p.Images.Where(img => img.IsPrimary).Select(img => img.ImageUrl).ToList(),
                        Amenities = p.Amenities.Select(pa => pa.Amenity.Name).ToList(),
                        TotalViews = _context.PropertyViews.Count(pv => pv.PropertyId == p.Id),
                        TotalReviews = _context.Reviews.Count(r => r.PropertyId == p.Id),
                        AverageRating = _context.Reviews.Where(r => r.PropertyId == p.Id).Any()
                            ? _context.Reviews.Where(r => r.PropertyId == p.Id).Average(r => (decimal)r.OverallRating)
                            : (decimal?)null
                    })
                    .ToListAsync();

                var result = new
                {
                    Properties = properties,
                    TotalCount = totalCount,
                    Page = filter.Page,
                    PageSize = filter.PageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
                };

                return (true, "Lấy danh sách property thành công", result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting properties");
                throw;
            }
        }


        // Updated GetPropertyBySlugAsync method to include rooms
        public async Task<(bool Success, string Message, PropertyDetailResponse Data)> GetPropertyBySlugAsync(string slug)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(slug))
                {
                    return (false, "Slug không được để trống", null);
                }

                var property = await _context.Properties
                    .Include(p => p.Images)
                    .Include(p => p.Amenities).ThenInclude(pa => pa.Amenity)
                    .Include(p => p.Province)
                    .Include(p => p.Commune)
                    .Include(p => p.ProductType)
                     .Include(p => p.Host)
                    .Include(p => p.RoomTypes)
                        .ThenInclude(rt => rt.Images)
                    .Include(p => p.RoomTypes)
                        .ThenInclude(rt => rt.RoomAmenities)
                        .ThenInclude(ra => ra.Amenity)
                    .FirstOrDefaultAsync(p => p.Slug == slug);

                if (property == null)
                {
                    return (false, "Property không tồn tại", null);
                }

                var response = new PropertyDetailResponse
                {
                    Id = property.Id,
                    Name = property.Name,
                    Slug = property.Slug,
                    Type = property.ProductType.Name,
                    ProductType = new ProductTypeInfo
                    {
                        Id = property.ProductType.Id,
                        Name = property.ProductType.Name,
                        Code = property.ProductType.Code,
                        Description = property.ProductType.Description,
                        Icon = property.ProductType.Icon
                    },
                    Description = property.Description,
                    ShortDescription = property.ShortDescription,
                    AddressDetail = property.AddressDetail,
                    Province = property.Province.Name,
                    Commune = property.Commune.Name,
                    PostalCode = property.PostalCode,
                    Latitude = property.Latitude,
                    Longitude = property.Longitude,
                    StarRating = property.StarRating,
                    TotalRooms = property.TotalRooms,
                    EstablishedYear = property.EstablishedYear,
                    CheckInTime = property.CheckInTime,
                    CheckOutTime = property.CheckOutTime,
                    MinStayNights = property.MinStayNights,
                    MaxStayNights = property.MaxStayNights,
                    CancellationPolicy = property.CancellationPolicy,
                    PriceFrom = property.PriceFrom,
                    Currency = property.Currency,
                    Status = property.Status,
                    IsActive = property.IsActive,
                    CreatedAt = property.CreatedAt,
                    MetaTitle = property.MetaTitle,
                    MetaDescription = property.MetaDescription,
                    MetaKeywords = property.MetaKeywords,
                    Host = new HostInfo
                    {
                        Id = property.Host.Id,
                        FullName = property.Host.FullName,
                        Email = property.Host.Email,
                        Phone = property.Host.Phone,
                        Avatar = property.Host.Avatar
                    },
                    Images = property.Images.Select(img => new PropertyImageResponse
                    {
                        Id = img.Id,
                        ImageUrl = img.ImageUrl,
                        ImageType = img.ImageType,
                        Title = img.Title,
                        Description = img.Description,
                        IsPrimary = img.IsPrimary,
                        SortOrder = img.SortOrder
                    }).ToList(),
                    Amenities = property.Amenities.Select(pa => new PropertyAmenityResponse
                    {
                        Id = pa.AmenityId,
                        Name = pa.Amenity.Name,
                        IsFree = pa.IsFree,
                        AdditionalInfo = pa.AdditionalInfo
                    }).ToList(),
                    RoomTypes = property.RoomTypes
                .Where(rt => rt.IsActive)
                .Select(rt => new PropertyRoomTypeInfo
                {
                    Id = rt.Id,
                    Name = rt.Name,
                    Slug = rt.Slug,
                    MaxAdults = rt.MaxAdults,
                    MaxChildren = rt.MaxChildren,
                    MaxGuests = rt.MaxGuests,
                    BedType = rt.BedType,
                    RoomSize = rt.RoomSize,
                    BasePrice = rt.BasePrice,
                    TotalRooms = rt.TotalRooms,
                    Images = rt.Images
                        .OrderBy(img => img.SortOrder)
                        .Select(img => new PropertyRoomImageInfo
                        {
                            ImageUrl = img.ImageUrl,
                            IsPrimary = img.IsPrimary
                        }).ToList()
                })
                .OrderBy(rt => rt.Name)
                .ToList()
                };

                return (true, "Lấy thông tin property thành công", response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting property by slug: {Slug}", slug);
                throw;
            }
        }
        public async Task<(bool Success, string Message, PropertyForEditResponse Data)> GetPropertyForEditAsync(int id, int hostId)
        {
            try
            {

                if (id <= 0)
                {
                    return (false, "ID không hợp lệ", null);
                }

                var property = await _context.Properties
                    .Include(p => p.Images) // Thêm Images
                    .Include(p => p.Amenities)
                        .ThenInclude(pa => pa.Amenity)
                    .Include(p => p.ProductType)
                    .Include(p => p.Province)
                    .Include(p => p.Commune)
                    .Include(p => p.RoomTypes)
                        .ThenInclude(rt => rt.Images) // Thêm Room Images
                    .Include(p => p.RoomTypes)
                        .ThenInclude(rt => rt.RoomAmenities)
                .ThenInclude(ra => ra.Amenity)
                    .FirstOrDefaultAsync(p => p.Id == id && p.HostId == hostId);

                if (property == null)
                {
                    return (false, "Property không tồn tại hoặc bạn không có quyền truy cập", null);
                }

                var response = new PropertyForEditResponse
                {
                    Id = property.Id,
                    Name = property.Name,
                    ProductTypeId = property.ProductTypeId,
                    Description = property.Description,
                    ShortDescription = property.ShortDescription,
                    AddressDetail = property.AddressDetail,
                    CommuneId = property.CommuneId,
                    ProvinceId = property.ProvinceId,
                    PostalCode = property.PostalCode,
                    Latitude = property.Latitude,
                    Longitude = property.Longitude,
                    StarRating = property.StarRating,
                    TotalRooms = property.TotalRooms,
                    EstablishedYear = property.EstablishedYear,
                    CheckInTime = property.CheckInTime?.ToString(@"hh\:mm"),
                    CheckOutTime = property.CheckOutTime?.ToString(@"hh\:mm"),
                    MinStayNights = property.MinStayNights,
                    MaxStayNights = property.MaxStayNights,
                    CancellationPolicy = property.CancellationPolicy,
                    MetaTitle = property.MetaTitle,
                    MetaDescription = property.MetaDescription,
                    MetaKeywords = property.MetaKeywords,
                    PriceFrom = property.PriceFrom,
                    Currency = property.Currency,

                    // Images để quản lý hình ảnh
                    Images = property.Images
                        .OrderBy(img => img.SortOrder)
                        .ThenByDescending(img => img.IsPrimary)
                        .Select(img => new PropertyImageForEdit
                        {
                            Id = img.Id,
                            ImageUrl = img.ImageUrl,
                            ImageType = img.ImageType,
                            Title = img.Title,
                            Description = img.Description,
                            IsPrimary = img.IsPrimary,
                            SortOrder = img.SortOrder
                        }).ToList(),

                    // Amenities theo đúng format PUT API
                    Amenities = property.Amenities
                        .Select(pa => new PropertyAmenityForEdit
                        {
                            AmenityId = pa.AmenityId,
                            IsFree = pa.IsFree,
                            AdditionalInfo = pa.AdditionalInfo
                        }).ToList(),

                    // Room Types để edit
                    RoomTypes = property.RoomTypes
                        .Select(rt => new RoomTypeForEditResponse
                        {
                            Id = rt.Id,
                            Name = rt.Name,
                            Description = rt.Description,
                            ShortDescription = rt.ShortDescription,
                            MaxAdults = rt.MaxAdults,
                            MaxChildren = rt.MaxChildren,
                            MaxGuests = rt.MaxGuests,
                            BedType = rt.BedType,
                            RoomSize = rt.RoomSize,
                            BasePrice = rt.BasePrice,
                            WeekendPrice = rt.WeekendPrice,
                            HolidayPrice = rt.HolidayPrice,
                            WeeklyDiscountPercent = rt.WeeklyDiscountPercent,
                            MonthlyDiscountPercent = rt.MonthlyDiscountPercent,
                            TotalRooms = rt.TotalRooms,
                            MetaTitle = rt.MetaTitle,
                            MetaDescription = rt.MetaDescription,

                            // Images để quản lý hình ảnh room
                            Images = rt.Images
                                .OrderBy(img => img.SortOrder)
                                .ThenByDescending(img => img.IsPrimary)
                                .Select(img => new RoomImageForEdit
                                {
                                    Id = img.Id,
                                    ImageUrl = img.ImageUrl,
                                    Title = img.Title,
                                    Description = img.Description,
                                    IsPrimary = img.IsPrimary,
                                    SortOrder = img.SortOrder
                                }).ToList(),

                            // Amenities theo đúng format PUT API Room
                            Amenities = rt.RoomAmenities
                                .Select(ra => new RoomAmenityForEdit
                                {
                                    AmenityId = ra.AmenityId,
                                    Quantity = ra.Quantity
                                }).ToList()
                        }).ToList()
                };

                return (true, "Lấy thông tin property để edit thành công", response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting property for edit by id: {Id}", id);
                throw;
            }
        }
        public async Task<(bool Success, string Message, PropertyForBookingResponse Data)> GetPropertyForBookingAsync(int id)
        {
            if (id <= 0)
                return (false, "ID không hợp lệ", null);

            var property = await _context.Properties
                .Include(p => p.Images)
                .Include(p => p.Province)
                .Include(p => p.Commune)
                .Include(p => p.RoomTypes)
                    .ThenInclude(rt => rt.Images)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive && p.Status == "approved");

            if (property == null)
                return (false, "Property không tồn tại", null);

            var response = new PropertyForBookingResponse
            {
                Id = property.Id,
                Name = property.Name,
                AddressDetail = property.AddressDetail,
                Province = property.Province?.Name,
                Commune = property.Commune?.Name,
                CheckInTime = property.CheckInTime?.ToString(@"hh\:mm"),
                CheckOutTime = property.CheckOutTime?.ToString(@"hh\:mm"),
                StarRating = property.StarRating,

                // Chỉ lấy ảnh chính
                MainImage = property.Images
                    .FirstOrDefault(img => img.IsPrimary)?.ImageUrl ??
                    property.Images.FirstOrDefault()?.ImageUrl,

                // Room types available
                RoomTypes = property.RoomTypes
                    .Where(rt => rt.IsActive && rt.TotalRooms > 0)
                    .Select(rt => new RoomTypeForBooking
                    {
                        Id = rt.Id,
                        Name = rt.Name,
                        MaxAdults = rt.MaxAdults,
                        MaxChildren = rt.MaxChildren,
                        MaxGuests = rt.MaxGuests,
                        BedType = rt.BedType,
                        BasePrice = rt.BasePrice,
                        RoomImage = rt.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl ??
                                   rt.Images.FirstOrDefault()?.ImageUrl
                    }).ToList()
            };

            return (true, "Thành công", response);
        }
        public async Task<(bool Success, string Message, object Data)> UpdatePropertyAsync(int id, UpdatePropertyRequest request, int hostId)
        {
            try
            {
                var property = await _context.Properties
                    .Include(p => p.Images)
                    .Include(p => p.Amenities)
                    .FirstOrDefaultAsync(p => p.Id == id && p.HostId == hostId);

                if (property == null)
                {
                    return (false, "Property không tồn tại hoặc bạn không có quyền sửa", null);
                }

                // Capture old values for audit
                var oldValues = JsonSerializer.Serialize(new
                {
                    Id = property.Id,
                    HostId = property.HostId,
                    Name = property.Name,
                    Slug = property.Slug,
                    ProductTypeId = property.ProductTypeId,
                    Description = property.Description,
                    Status = property.Status,
                    PriceFrom = property.PriceFrom,
                    Currency = property.Currency,
                    CommuneId = property.CommuneId,
                    ProvinceId = property.ProvinceId,
                    AmenitiesCount = property.Amenities?.Count ?? 0,
                    UpdatedAt = property.UpdatedAt
                });

                // Validate request
                var validationResult = await ValidateUpdateRequestAsync(request, id);
                if (!validationResult.IsValid)
                {
                    return (false, validationResult.ErrorMessage, null);
                }

                // Generate unique slug
                string baseSlug = GenerateSlug(request.Name);
                string uniqueSlug = await EnsureUniqueSlugForUpdateAsync(baseSlug, id);

                // Update basic properties
                property.Name = request.Name;
                property.Slug = uniqueSlug;
                property.ProductTypeId = request.ProductTypeId;
                property.Description = request.Description;
                property.ShortDescription = request.ShortDescription;
                property.AddressDetail = request.AddressDetail;
                property.CommuneId = request.CommuneId;
                property.ProvinceId = request.ProvinceId;
                property.PostalCode = request.PostalCode;
                property.Latitude = request.Latitude;
                property.Longitude = request.Longitude;
                property.StarRating = request.StarRating;
                property.TotalRooms = request.TotalRooms;
                property.EstablishedYear = request.EstablishedYear;
                property.CheckInTime = request.CheckInTime;
                property.CheckOutTime = request.CheckOutTime;
                property.MinStayNights = request.MinStayNights;
                property.MaxStayNights = request.MaxStayNights;
                property.CancellationPolicy = request.CancellationPolicy;
                property.MetaTitle = request.MetaTitle;
                property.MetaDescription = request.MetaDescription;
                property.MetaKeywords = request.MetaKeywords;
                property.PriceFrom = request.PriceFrom;
                property.Currency = request.Currency;
                property.UpdatedAt = DateTime.Now;

                // Update Amenities if provided
                if (request.Amenities != null)
                {
                    _context.PropertyAmenities.RemoveRange(property.Amenities);

                    foreach (var amenityRequest in request.Amenities)
                    {
                        var propertyAmenity = new PropertyAmenity
                        {
                            PropertyId = property.Id,
                            AmenityId = amenityRequest.AmenityId,
                            IsFree = amenityRequest.IsFree,
                            AdditionalInfo = amenityRequest.AdditionalInfo,
                        };

                        _context.PropertyAmenities.Add(propertyAmenity);
                    }
                }

                await _context.SaveChangesAsync();

                // Log audit action
                var newValues = JsonSerializer.Serialize(new
                {
                    Id = property.Id,
                    HostId = property.HostId,
                    Name = property.Name,
                    Slug = property.Slug,
                    ProductTypeId = property.ProductTypeId,
                    Description = property.Description,
                    Status = property.Status,
                    PriceFrom = property.PriceFrom,
                    Currency = property.Currency,
                    CommuneId = property.CommuneId,
                    ProvinceId = property.ProvinceId,
                    AmenitiesCount = request.Amenities?.Count ?? 0,
                    UpdatedAt = property.UpdatedAt
                });
                await _auditLogService.LogUpdateAsync("Properties", property.Id, oldValues, newValues);

                return (true, "Cập nhật property thành công", new
                {
                    property.Id,
                    property.Name,
                    property.Slug,
                    property.Status,
                    AmenitiesCount = request.Amenities?.Count ?? 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating property");
                throw;
            }
        }

        public async Task<(bool Success, string Message)> DeletePropertyAsync(int id, int hostId, string webRootPath)
        {
            try
            {
                var property = await _context.Properties
                    .Include(p => p.Images)
                    .Include(p => p.RoomTypes)
                        .ThenInclude(rt => rt.Images)
                    .Include(p => p.RoomTypes)
                        .ThenInclude(rt => rt.RoomAmenities)
                    .Include(p => p.Amenities)
                    .FirstOrDefaultAsync(p => p.Id == id && p.HostId == hostId);

                if (property == null)
                {
                    return (false, "Property không tồn tại hoặc bạn không có quyền xóa");
                }

                // Check for existing bookings
                var hasBookings = await _context.Bookings
                    .AnyAsync(b => property.RoomTypes.Select(rt => rt.Id).Contains(b.RoomTypeId));

                if (hasBookings)
                {
                    return (false, "Không thể xóa Property vì vẫn còn Booking tham chiếu.");
                }

                // Create audit log data before deletion
                var propertyData = new
                {
                    Id = property.Id,
                    Name = property.Name,
                    Address = property.AddressDetail,
                    HostId = property.HostId,
                    ImageCount = property.Images.Count,
                    ImageUrls = property.Images.Select(img => img.ImageUrl).ToList(),
                    RoomTypesCount = property.RoomTypes.Count,
                    RoomTypes = property.RoomTypes.Select(rt => new
                    {
                        Id = rt.Id,
                        Name = rt.Name,
                        ImageCount = rt.Images.Count,
                        ImageUrls = rt.Images.Select(img => img.ImageUrl).ToList()
                    }).ToList()
                };
                var oldValues = JsonSerializer.Serialize(propertyData);

                // Delete property image files
                foreach (var image in property.Images)
                {
                    DeleteImageFile(image.ImageUrl, webRootPath);
                }

                // Delete room type image files
                foreach (var roomType in property.RoomTypes)
                {
                    foreach (var image in roomType.Images)
                    {
                        DeleteImageFile(image.ImageUrl, webRootPath);
                    }
                }

                // Delete related data
                var favorites = _context.Favorites.Where(f => f.PropertyId == property.Id);
                _context.Favorites.RemoveRange(favorites);

                foreach (var roomType in property.RoomTypes)
                {
                    _context.RoomAmenities.RemoveRange(roomType.RoomAmenities);
                }

                _context.PropertyAmenities.RemoveRange(property.Amenities);
                _context.RoomTypes.RemoveRange(property.RoomTypes);
                _context.Properties.Remove(property);

                await _context.SaveChangesAsync();
                await _auditLogService.LogDeleteAsync("Properties", id, oldValues);

                return (true, "Xóa property và tất cả dữ liệu liên quan thành công");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting property");
                throw;
            }
        }

        // Cải tiến method UploadImagesAsync để tích hợp với background service
        public async Task<(bool Success, string Message, object Data)> UploadImagesAsync(int id, UploadImageRequestAlternative request, int hostId, string webRootPath)
        {
            try
            {
                var property = await _context.Properties
                    .FirstOrDefaultAsync(p => p.Id == id && p.HostId == hostId);

                if (property == null)
                {
                    return (false, "Property không tồn tại hoặc bạn không có quyền", null);
                }

                // Validation
                var validationResult = await ValidateUploadImagesRequestAsync(request, id);
                if (!validationResult.IsValid)
                {
                    return (false, validationResult.ErrorMessage, null);
                }

                // Check existing primary image
                var existingPrimaryImage = await _context.PropertyImages
                    .FirstOrDefaultAsync(pi => pi.PropertyId == id && pi.IsPrimary == true);

                var primaryCountInRequest = request.IsPrimaries.Count(p => p);

                // Handle primary image update if needed
                if (existingPrimaryImage != null && primaryCountInRequest == 1)
                {
                    var oldPrimaryData = new { Id = existingPrimaryImage.Id, IsPrimary = true };
                    var newPrimaryData = new { Id = existingPrimaryImage.Id, IsPrimary = false };
                    await _auditLogService.LogUpdateAsync("PropertyImages", existingPrimaryImage.Id,
                        JsonSerializer.Serialize(oldPrimaryData),
                        JsonSerializer.Serialize(newPrimaryData));

                    existingPrimaryImage.IsPrimary = false;
                    _context.PropertyImages.Update(existingPrimaryImage);
                }

                var uploadResults = new List<object>();
                var propertyImages = new List<PropertyImage>();

                // Create directory if not exists
                var uploadsFolder = Path.Combine(webRootPath, "images", "properties", id.ToString());
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Process each file
                for (int i = 0; i < request.Files.Count; i++)
                {
                    var file = request.Files[i];
                    var imageType = request.ImageTypes[i]?.ToLower() ?? "interior";
                    var title = request.Titles[i];
                    var description = request.Descriptions[i];
                    var isPrimary = request.IsPrimaries[i];
                    var sortOrder = request.SortOrders[i];

                    try
                    {
                        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                        var filePath = Path.Combine(uploadsFolder, fileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        var imageUrl = $"/images/properties/{id}/{fileName}";

                        // Tạo PropertyImage với metadata được thu thập ngay lập tức
                        var propertyImage = new PropertyImage
                        {
                            PropertyId = id,
                            ImageUrl = imageUrl,
                            ImageType = imageType,
                            Title = title,
                            Description = description,
                            IsPrimary = isPrimary,
                            SortOrder = sortOrder,
                            CreatedAt = DateTime.Now
                        };

                        // Cố gắng lấy metadata ngay lập tức, nếu không được thì để background service xử lý
                        try
                        {
                            var fileInfo = new FileInfo(filePath);
                            propertyImage.FileSize = (int)fileInfo.Length;

                            using (var img = System.Drawing.Image.FromFile(filePath))
                            {
                                propertyImage.Width = img.Width;
                                propertyImage.Height = img.Height;
                            }

                            _logger.LogDebug($"Captured metadata immediately for {fileName}: {propertyImage.Width}x{propertyImage.Height}, {propertyImage.FileSize} bytes");
                        }
                        catch (Exception metaEx)
                        {
                            _logger.LogWarning(metaEx, $"Could not capture metadata immediately for {fileName}, background service will handle it");
                            // Để null, background service sẽ xử lý sau
                        }

                        propertyImages.Add(propertyImage);

                        uploadResults.Add(new
                        {
                            Index = i,
                            Success = true,
                            Message = "Upload thành công",
                            FileName = fileName,
                            ImageUrl = imageUrl,
                            OriginalFileName = file.FileName,
                            ImageType = imageType,
                            Title = title,
                            Description = description,
                            IsPrimary = isPrimary,
                            SortOrder = sortOrder,
                            FileSize = propertyImage.FileSize,
                            Width = propertyImage.Width,
                            Height = propertyImage.Height,
                            MetadataCaptured = propertyImage.FileSize.HasValue && propertyImage.Width.HasValue && propertyImage.Height.HasValue
                        });
                    }
                    catch (Exception fileEx)
                    {
                        _logger.LogError(fileEx, $"Error uploading file {file.FileName}");
                        uploadResults.Add(new
                        {
                            Index = i,
                            Success = false,
                            Message = "Lỗi khi lưu file",
                            FileName = file.FileName,
                            ImageType = imageType,
                            Title = title,
                            Error = fileEx.Message
                        });
                    }
                }

                // Save successful uploads to database
                if (propertyImages.Any())
                {
                    _context.PropertyImages.AddRange(propertyImages);
                    await _context.SaveChangesAsync();

                    // Log audit for each uploaded image
                    foreach (var propertyImage in propertyImages)
                    {
                        var newImageData = new
                        {
                            Id = propertyImage.Id,
                            PropertyId = propertyImage.PropertyId,
                            ImageUrl = propertyImage.ImageUrl,
                            ImageType = propertyImage.ImageType,
                            Title = propertyImage.Title,
                            Description = propertyImage.Description,
                            IsPrimary = propertyImage.IsPrimary,
                            SortOrder = propertyImage.SortOrder,
                            FileSize = propertyImage.FileSize,
                            Width = propertyImage.Width,
                            Height = propertyImage.Height
                        };
                        await _auditLogService.LogInsertAsync("PropertyImages", propertyImage.Id,
                            JsonSerializer.Serialize(newImageData));
                    }
                }

                var successCount = uploadResults.Count(r => (bool)((dynamic)r).Success);
                var failCount = uploadResults.Count - successCount;
                var metadataCount = uploadResults.Count(r => r is { } obj && ((dynamic)obj).MetadataCaptured == true);

                var result = new
                {
                    TotalFiles = request.Files.Count,
                    SuccessCount = successCount,
                    FailCount = failCount,
                    MetadataCapturedCount = metadataCount,
                    Results = uploadResults,
                    PropertyImages = propertyImages.Select(pi => new
                    {
                        Id = pi.Id,
                        ImageUrl = pi.ImageUrl,
                        ImageType = pi.ImageType,
                        Title = pi.Title,
                        Description = pi.Description,
                        IsPrimary = pi.IsPrimary,
                        SortOrder = pi.SortOrder,
                        FileSize = pi.FileSize,
                        Width = pi.Width,
                        Height = pi.Height,
                        MetadataPending = !pi.FileSize.HasValue || !pi.Width.HasValue || !pi.Height.HasValue
                    }).ToList()
                };

                var message = metadataCount < successCount
                    ? $"Hoàn thành upload: {successCount} thành công, {failCount} thất bại. {successCount - metadataCount} ảnh sẽ được xử lý metadata bởi background service"
                    : $"Hoàn thành upload: {successCount} thành công, {failCount} thất bại";

                return (true, message, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading images");
                throw;
            }
        }

        public async Task<(bool Success, string Message, object Data)> DeleteImageAsync(int imageId, int hostId, string webRootPath)
        {
            try
            {
                var image = await _context.PropertyImages
                    .Include(img => img.Property)
                    .FirstOrDefaultAsync(img => img.Id == imageId && img.Property.HostId == hostId);

                if (image == null)
                {
                    return (false, "Ảnh không tồn tại hoặc bạn không có quyền xóa", null);
                }

                // Validation
                var validationResult = await ValidateImageDeletionAsync(image);
                if (!validationResult.IsValid)
                {
                    return (false, validationResult.ErrorMessage, null);
                }

                // Create audit log data
                var imageData = new
                {
                    Id = image.Id,
                    PropertyId = image.PropertyId,
                    ImageUrl = image.ImageUrl,
                    ImageType = image.ImageType,
                    Title = image.Title,
                    Description = image.Description,
                    IsPrimary = image.IsPrimary,
                    SortOrder = image.SortOrder,
                    CreatedAt = image.CreatedAt
                };
                var oldValues = JsonSerializer.Serialize(imageData);

                // Delete file
                DeleteImageFile(image.ImageUrl, webRootPath);

                // Delete from database
                _context.PropertyImages.Remove(image);
                await _context.SaveChangesAsync();

                await _auditLogService.LogDeleteAsync("PropertyImages", imageId, oldValues);

                var result = new
                {
                    DeletedImageId = imageId,
                    PropertyId = image.PropertyId
                };

                return (true, "Xóa ảnh thành công", result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image");
                throw;
            }
        }

        public async Task<(bool Success, string Message, object Data)> SetPrimaryImageAsync(int imageId, int hostId)
        {
            try
            {
                var image = await _context.PropertyImages
                    .Include(img => img.Property)
                    .FirstOrDefaultAsync(img => img.Id == imageId && img.Property.HostId == hostId);

                if (image == null)
                {
                    return (false, "Ảnh không tồn tại hoặc bạn không có quyền", null);
                }

                if (image.IsPrimary)
                {
                    return (false, "Ảnh này đã là ảnh chính", null);
                }

                // Find and update current primary image
                var currentPrimaryImage = await _context.PropertyImages
                    .FirstOrDefaultAsync(pi => pi.PropertyId == image.PropertyId && pi.IsPrimary == true);

                if (currentPrimaryImage != null)
                {
                    var currentPrimaryOldData = new { Id = currentPrimaryImage.Id, IsPrimary = true };
                    var currentPrimaryNewData = new { Id = currentPrimaryImage.Id, IsPrimary = false };

                    currentPrimaryImage.IsPrimary = false;
                    _context.PropertyImages.Update(currentPrimaryImage);

                    await _auditLogService.LogUpdateAsync("PropertyImages", currentPrimaryImage.Id,
                        JsonSerializer.Serialize(currentPrimaryOldData),
                        JsonSerializer.Serialize(currentPrimaryNewData));
                }

                // Set new primary image
                var newImageOldData = new { Id = image.Id, IsPrimary = false };
                var newImageNewData = new { Id = image.Id, IsPrimary = true };

                image.IsPrimary = true;
                _context.PropertyImages.Update(image);

                await _context.SaveChangesAsync();

                await _auditLogService.LogUpdateAsync("PropertyImages", imageId,
                    JsonSerializer.Serialize(newImageOldData),
                    JsonSerializer.Serialize(newImageNewData));

                var result = new
                {
                    NewPrimaryImageId = imageId,
                    PreviousPrimaryImageId = currentPrimaryImage?.Id,
                    PropertyId = image.PropertyId
                };

                return (true, "Đã đặt làm ảnh chính thành công", result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting primary image");
                throw;
            }
        }

        // Product Type methods
        public async Task<List<ProductType>> GetProductTypesAsync(bool includeInactive = false, string search = null)
        {
            var query = _context.ProductTypes.AsQueryable();

            if (!includeInactive)
            {
                query = query.Where(pt => pt.IsActive);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(pt => pt.Name.Contains(search) ||
                                        pt.Code.Contains(search) ||
                                        pt.Description.Contains(search));
            }

            query = query.OrderBy(pt => pt.SortOrder).ThenBy(pt => pt.Name);

            return await query.ToListAsync();
        }

        public async Task<ProductType> GetProductTypeByIdAsync(int id, bool includeProperties = false)
        {
            var query = _context.ProductTypes.AsQueryable();

            if (includeProperties)
            {
                query = query.Include(pt => pt.Properties);
            }

            return await query.FirstOrDefaultAsync(pt => pt.Id == id);
        }

        public async Task<ProductType> GetProductTypeByCodeAsync(string code)
        {
            return await _context.ProductTypes
                .FirstOrDefaultAsync(pt => pt.Code == code && pt.IsActive);
        }

        public async Task<ProductType> CreateProductTypeAsync(CreateProductTypeDto createDto)
        {
            if (string.IsNullOrWhiteSpace(createDto.Name))
            {
                throw new ArgumentException("Tên loại sản phẩm là bắt buộc");
            }

            if (string.IsNullOrWhiteSpace(createDto.Code))
            {
                throw new ArgumentException("Mã loại sản phẩm là bắt buộc");
            }

            var existingProductType = await _context.ProductTypes
                .FirstOrDefaultAsync(pt => pt.Code == createDto.Code);

            if (existingProductType != null)
            {
                throw new InvalidOperationException($"Mã loại sản phẩm '{createDto.Code}' đã tồn tại");
            }

            var productType = new ProductType
            {
                Name = createDto.Name.Trim(),
                Code = createDto.Code.Trim().ToLower(),
                Description = createDto.Description?.Trim(),
                Icon = createDto.Icon?.Trim(),
                IsActive = createDto.IsActive,
                SortOrder = createDto.SortOrder,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ProductTypes.Add(productType);
            await _context.SaveChangesAsync();

            return productType;
        }

        public async Task<ProductType> UpdateProductTypeAsync(int id, UpdateProductTypeDto updateDto)
        {
            var productType = await _context.ProductTypes.FindAsync(id);

            if (productType == null)
            {
                throw new ArgumentException($"Không tìm thấy loại sản phẩm với ID {id}");
            }

            if (string.IsNullOrWhiteSpace(updateDto.Name))
            {
                throw new ArgumentException("Tên loại sản phẩm là bắt buộc");
            }

            if (string.IsNullOrWhiteSpace(updateDto.Code))
            {
                throw new ArgumentException("Mã loại sản phẩm là bắt buộc");
            }

            var existingProductType = await _context.ProductTypes
                .FirstOrDefaultAsync(pt => pt.Code == updateDto.Code && pt.Id != id);

            if (existingProductType != null)
            {
                throw new InvalidOperationException($"Mã loại sản phẩm '{updateDto.Code}' đã tồn tại");
            }

            productType.Name = updateDto.Name.Trim();
            productType.Code = updateDto.Code.Trim().ToLower();
            productType.Description = updateDto.Description?.Trim();
            productType.Icon = updateDto.Icon?.Trim();
            productType.IsActive = updateDto.IsActive;
            productType.SortOrder = updateDto.SortOrder;
            productType.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return productType;
        }

        public async Task<bool> DeleteProductTypeAsync(int id, bool forceDelete = false)
        {
            var productType = await _context.ProductTypes
                .Include(pt => pt.Properties)
                .FirstOrDefaultAsync(pt => pt.Id == id);

            if (productType == null)
            {
                throw new ArgumentException($"Không tìm thấy loại sản phẩm với ID {id}");
            }

            if (productType.Properties.Any() && !forceDelete)
            {
                throw new InvalidOperationException("Không thể xóa loại sản phẩm này vì đang có các bất động sản liên quan");
            }

            _context.ProductTypes.Remove(productType);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ToggleProductTypeActiveStatusAsync(int id)
        {
            var productType = await _context.ProductTypes.FindAsync(id);

            if (productType == null)
            {
                throw new ArgumentException($"Không tìm thấy loại sản phẩm với ID {id}");
            }

            productType.IsActive = !productType.IsActive;
            productType.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return productType.IsActive;
        }

        public async Task<int> GetActiveProductTypesCountAsync()
        {
            return await _context.ProductTypes.CountAsync(pt => pt.IsActive);
        }

        // Private helper methods
        private async Task<(bool IsValid, string ErrorMessage)> ValidateCreateRequestAsync(CreatePropertyRequest request)
        {
            var duplicate = await _context.Properties.AnyAsync(p => p.Name == request.Name);
            if (duplicate)
            {
                return (false, "Tên đã tồn tại, vui lòng chọn giá trị khác.");
            }

            var productType = await _context.ProductTypes.FindAsync(request.ProductTypeId);
            if (productType == null)
            {
                return (false, "Loại sản phẩm không tồn tại.");
            }

            var province = await _context.Provinces.FindAsync(request.ProvinceId);
            if (province == null)
            {
                return (false, "Tỉnh/Thành phố không tồn tại.");
            }

            var commune = await _context.Communes.FindAsync(request.CommuneId);
            if (commune == null)
            {
                return (false, "Xã/Phường không tồn tại.");
            }

            if (commune.ProvinceId != request.ProvinceId)
            {
                return (false, "Xã/Phường không thuộc Tỉnh/Thành phố đã chọn.");
            }

            var validPolicies = new[] { "flexible", "moderate", "strict" };
            if (!validPolicies.Contains(request.CancellationPolicy))
            {
                return (false, "Chính sách hủy phòng không hợp lệ. Chỉ chấp nhận: flexible, moderate, strict.");
            }

            if (request.StarRating < 1 || request.StarRating > 5)
            {
                return (false, "Xếp hạng sao phải từ 1 đến 5.");
            }

            if (request.TotalRooms <= 0)
            {
                return (false, "Tổng số phòng phải lớn hơn 0.");
            }

            if (request.MinStayNights <= 0)
            {
                return (false, "Số đêm ở tối thiểu phải lớn hơn 0.");
            }

            if (request.MaxStayNights > 0 && request.MaxStayNights < request.MinStayNights)
            {
                return (false, "Số đêm ở tối đa phải lớn hơn hoặc bằng số đêm tối thiểu.");
            }

            if (!request.CheckInTime.HasValue)
            {
                return (false, "Thời gian check-in là bắt buộc.");
            }

            if (!request.CheckOutTime.HasValue)
            {
                return (false, "Thời gian check-out là bắt buộc.");
            }

            if (request.PriceFrom <= 0)
            {
                return (false, "Giá phải lớn hơn 0.");
            }

            var validCurrencies = new[] { "VND", "USD", "EUR" };
            if (!validCurrencies.Contains(request.Currency))
            {
                return (false, "Loại tiền tệ không hợp lệ. Chỉ chấp nhận: VND, USD, EUR.");
            }

            if (request.Amenities != null && request.Amenities.Any())
            {
                var amenityIds = request.Amenities.Select(a => a.AmenityId).ToList();
                var validAmenityIds = await _context.Amenities
                    .Where(a => amenityIds.Contains(a.Id))
                    .Select(a => a.Id)
                    .ToListAsync();

                var invalidAmenityIds = amenityIds.Except(validAmenityIds).ToList();
                if (invalidAmenityIds.Any())
                {
                    return (false, $"Các amenity không tồn tại: {string.Join(", ", invalidAmenityIds)}");
                }

                var duplicateAmenities = amenityIds.GroupBy(x => x).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
                if (duplicateAmenities.Any())
                {
                    return (false, $"Amenity bị trùng lặp: {string.Join(", ", duplicateAmenities)}");
                }
            }

            return (true, string.Empty);
        }

        private async Task<(bool IsValid, string ErrorMessage)> ValidateUpdateRequestAsync(UpdatePropertyRequest request, int excludeId)
        {
            var duplicate = await _context.Properties
                .AnyAsync(p => p.Id != excludeId && p.Name == request.Name);
            if (duplicate)
            {
                return (false, "Tên đã tồn tại, vui lòng chọn giá trị khác.");
            }

            var productType = await _context.ProductTypes.FindAsync(request.ProductTypeId);
            if (productType == null)
            {
                return (false, "Loại sản phẩm không tồn tại.");
            }

            var province = await _context.Provinces.FindAsync(request.ProvinceId);
            if (province == null)
            {
                return (false, "Tỉnh/Thành phố không tồn tại.");
            }

            var commune = await _context.Communes.FindAsync(request.CommuneId);
            if (commune == null)
            {
                return (false, "Xã/Phường không tồn tại.");
            }

            if (commune.ProvinceId != request.ProvinceId)
            {
                return (false, "Xã/Phường không thuộc Tỉnh/Thành phố đã chọn.");
            }

            var validPolicies = new[] { "flexible", "moderate", "strict" };
            if (!validPolicies.Contains(request.CancellationPolicy))
            {
                return (false, "Chính sách hủy phòng không hợp lệ. Chỉ chấp nhận: flexible, moderate, strict.");
            }

            if (request.StarRating < 1 || request.StarRating > 5)
            {
                return (false, "Xếp hạng sao phải từ 1 đến 5.");
            }

            if (request.TotalRooms <= 0)
            {
                return (false, "Tổng số phòng phải lớn hơn 0.");
            }

            if (request.MinStayNights <= 0)
            {
                return (false, "Số đêm ở tối thiểu phải lớn hơn 0.");
            }

            if (request.MaxStayNights > 0 && request.MaxStayNights < request.MinStayNights)
            {
                return (false, "Số đêm ở tối đa phải lớn hơn hoặc bằng số đêm tối thiểu.");
            }

            if (!request.CheckInTime.HasValue)
            {
                return (false, "Thời gian check-in không đúng định dạng. Định dạng yêu cầu: HH:mm:ss (ví dụ: 14:00:00)");
            }

            if (!request.CheckOutTime.HasValue)
            {
                return (false, "Thời gian check-out không hợp lệ. Định dạng yêu cầu: HH:mm:ss (ví dụ: 11:00:00)");
            }

            if (request.PriceFrom <= 0)
            {
                return (false, "Giá phải lớn hơn 0.");
            }

            var validCurrencies = new[] { "VND", "USD", "EUR" };
            if (!validCurrencies.Contains(request.Currency))
            {
                return (false, "Loại tiền tệ không hợp lệ. Chỉ chấp nhận: VND, USD, EUR.");
            }

            if (request.Amenities != null && request.Amenities.Any())
            {
                var amenityIds = request.Amenities.Select(a => a.AmenityId).ToList();
                var validAmenityIds = await _context.Amenities
                    .Where(a => amenityIds.Contains(a.Id))
                    .Select(a => a.Id)
                    .ToListAsync();

                var invalidAmenityIds = amenityIds.Except(validAmenityIds).ToList();
                if (invalidAmenityIds.Any())
                {
                    return (false, $"Các amenity không tồn tại: {string.Join(", ", invalidAmenityIds)}");
                }

                var duplicateAmenities = amenityIds.GroupBy(x => x).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
                if (duplicateAmenities.Any())
                {
                    return (false, $"Amenity bị trùng lặp: {string.Join(", ", duplicateAmenities)}");
                }
            }

            return (true, string.Empty);
        }

        private async Task<(bool IsValid, string ErrorMessage)> ValidateUploadImagesRequestAsync(UploadImageRequestAlternative request, int propertyId)
        {
            if (request.Files == null || !request.Files.Any())
            {
                return (false, "Không có file ảnh nào được chọn");
            }

            if (request.Files.Count > 10)
            {
                return (false, "Chỉ được upload tối đa 10 ảnh cùng lúc");
            }

            var fileCount = request.Files.Count;
            if (request.ImageTypes.Count != fileCount ||
                request.Titles.Count != fileCount ||
                request.Descriptions.Count != fileCount ||
                request.IsPrimaries.Count != fileCount ||
                request.SortOrders.Count != fileCount)
            {
                return (false, "Số lượng thông tin metadata không khớp với số file");
            }

            var allowedImageTypes = new[] { "view", "amenity", "room", "interior", "exterior", "main" };
            for (int i = 0; i < request.ImageTypes.Count; i++)
            {
                var imageType = request.ImageTypes[i]?.ToLower();
                if (string.IsNullOrEmpty(imageType))
                {
                    return (false, $"ImageType không được để trống ở vị trí {i + 1}");
                }

                if (!allowedImageTypes.Contains(imageType))
                {
                    return (false, $"ImageType '{imageType}' không hợp lệ ở vị trí {i + 1}. Chỉ chấp nhận: {string.Join(", ", allowedImageTypes)}");
                }
            }

            var existingPrimaryImage = await _context.PropertyImages
                .FirstOrDefaultAsync(pi => pi.PropertyId == propertyId && pi.IsPrimary == true);

            var primaryCountInRequest = request.IsPrimaries.Count(p => p);

            if (existingPrimaryImage == null)
            {
                if (primaryCountInRequest != 1)
                {
                    return (false, "Property chưa có ảnh chính. Bạn phải chọn đúng 1 ảnh làm ảnh chính.");
                }
            }
            else
            {
                if (primaryCountInRequest > 1)
                {
                    return (false, "Property đã có ảnh chính. Chỉ được chọn tối đa 1 ảnh làm ảnh chính.");
                }
            }

            var allowedFileTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
            for (int i = 0; i < request.Files.Count; i++)
            {
                var file = request.Files[i];

                if (file == null || file.Length == 0)
                {
                    return (false, $"File ở vị trí {i + 1} rỗng hoặc không hợp lệ");
                }

                if (!allowedFileTypes.Contains(file.ContentType.ToLower()))
                {
                    return (false, $"File '{file.FileName}' ở vị trí {i + 1} không đúng định dạng. Chỉ chấp nhận file ảnh (JPEG, JPG, PNG, GIF)");
                }

                if (file.Length > 5 * 1024 * 1024)
                {
                    return (false, $"File '{file.FileName}' ở vị trí {i + 1} không được vượt quá 5MB");
                }
            }

            for (int i = 0; i < request.SortOrders.Count; i++)
            {
                if (request.SortOrders[i] < 0)
                {
                    return (false, $"Thứ tự sắp xếp ở vị trí {i + 1} phải lớn hơn hoặc bằng 0");
                }
            }

            return (true, string.Empty);
        }

        private async Task<(bool IsValid, string ErrorMessage)> ValidateImageDeletionAsync(PropertyImage image)
        {
            var allPropertyImages = await _context.PropertyImages
                .Where(pi => pi.PropertyId == image.PropertyId)
                .ToListAsync();

            var totalImageCount = allPropertyImages.Count;
            var primaryImagesCount = allPropertyImages.Count(pi => pi.IsPrimary);
            var isImageToBePrimary = image.IsPrimary;

            if (totalImageCount <= 1)
            {
                return (false, "Không thể xóa ảnh cuối cùng. Property phải có ít nhất 1 ảnh.");
            }

            if (isImageToBePrimary && primaryImagesCount == 1)
            {
                return (false, "Không thể xóa ảnh chính duy nhất. Vui lòng chọn ảnh khác làm ảnh chính trước khi xóa.");
            }

            if (isImageToBePrimary && totalImageCount > 1)
            {
                return (false, "Không thể xóa ảnh chính. Hãy đặt một ảnh khác làm ảnh chính trước khi xóa ảnh này.");
            }

            return (true, string.Empty);
        }

        private string GenerateSlug(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            var vietnameseMap = new Dictionary<string, string>
            {
                {"à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ", "a"},
                {"è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ", "e"},
                {"ì|í|ị|ỉ|ĩ", "i"},
                {"ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ", "o"},
                {"ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ", "u"},
                {"ỳ|ý|ỵ|ỷ|ỹ", "y"},
                {"đ", "d"},
                {"À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ", "A"},
                {"È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ", "E"},
                {"Ì|Í|Ị|Ỉ|Ĩ", "I"},
                {"Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ", "O"},
                {"Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ", "U"},
                {"Ỳ|Ý|Ỵ|Ỷ|Ỹ", "Y"},
                {"Đ", "D"}
            };

            string result = text.ToLower();

            foreach (var item in vietnameseMap)
            {
                result = Regex.Replace(result, item.Key, item.Value);
            }

            result = Regex.Replace(result, @"[^a-z0-9\s-]", "");
            result = Regex.Replace(result, @"[\s-]+", "-");
            result = result.Trim('-');

            if (result.Length > 100)
            {
                result = result.Substring(0, 100).TrimEnd('-');
            }

            return result;
        }

        private async Task<string> EnsureUniqueSlugAsync(string baseSlug)
        {
            string uniqueSlug = baseSlug;
            int counter = 1;

            while (await _context.Properties.AnyAsync(p => p.Slug == uniqueSlug))
            {
                uniqueSlug = $"{baseSlug}-{counter}";
                counter++;
            }

            return uniqueSlug;
        }

        private async Task<string> EnsureUniqueSlugForUpdateAsync(string baseSlug, int currentPropertyId)
        {
            string uniqueSlug = baseSlug;
            int counter = 1;

            while (await _context.Properties.AnyAsync(p => p.Slug == uniqueSlug && p.Id != currentPropertyId))
            {
                uniqueSlug = $"{baseSlug}-{counter}";
                counter++;
            }

            return uniqueSlug;
        }

        private void DeleteImageFile(string imageUrl, string webRootPath)
        {
            try
            {
                if (!string.IsNullOrEmpty(imageUrl))
                {
                    var filePath = Path.Combine(webRootPath, imageUrl.TrimStart('/'));
                    if (File.Exists(filePath))
                    {
                        File.Delete(filePath);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Could not delete image file: {imageUrl}");
            }
        }
        public async Task<(bool Success, string Message, object Data)>
     GetApprovedPropertiesSortedAsync(PropertyAppvoredFilterRequest filter)
        {
            try
            {
                // ====== Tính tổng khách ======
                var totalGuests = (filter.Adults ?? 1) + (filter.Children ?? 0);
                const int requestedRooms = 1;

                // ====== Query cơ bản với index hints ======
                var baseQuery = _context.Properties
                    .Where(p => p.Status == "approved" && p.IsActive);

                // ====== Apply filters early để giảm dataset ======
                if (!string.IsNullOrEmpty(filter.Name))
                    baseQuery = baseQuery.Where(p => p.Name.Contains(filter.Name));

                if (filter.ProductTypeId.HasValue)
                    baseQuery = baseQuery.Where(p => p.ProductTypeId == filter.ProductTypeId);

                if (filter.ProvinceId.HasValue)
                    baseQuery = baseQuery.Where(p => p.ProvinceId == filter.ProvinceId);

                // ====== Lọc amenities (tối ưu với EXISTS) ======
                if (filter.AmenityIds != null && filter.AmenityIds.Any())
                {
                    baseQuery = baseQuery.Where(p =>
                        _context.PropertyAmenities.Any(pa =>
                            pa.PropertyId == p.Id && filter.AmenityIds.Contains(pa.AmenityId)));
                }
                // ====== Luôn lọc theo tổng khách ======
                int requestedAdults = filter.Adults ?? 0;
                int requestedChildren = filter.Children ?? 0;

                baseQuery = baseQuery.Where(p =>
                    p.RoomTypes.Any(rt =>
                        rt.IsActive &&
                        rt.MaxAdults >= requestedAdults &&
                        rt.MaxChildren >= requestedChildren &&
                        rt.MaxGuests >= (requestedAdults + requestedChildren)
                    )
                );

                // ====== Nếu có ngày thì lọc thêm còn phòng ======
                if (filter.CheckIn.HasValue && filter.CheckOut.HasValue)
                {
                    var checkIn = filter.CheckIn.Value.Date;
                    var checkOut = filter.CheckOut.Value.Date;

                    var bookedRoomsQuery = _context.Bookings
                        .Where(b => b.CheckIn < checkOut &&
                                    b.CheckOut > checkIn &&
                                    b.Status == "confirmed")
                        .GroupBy(b => b.RoomTypeId)
                        .Select(g => new { RoomTypeId = g.Key, BookedRooms = g.Sum(x => x.RoomsCount) });

                    baseQuery = baseQuery.Where(p =>
                        p.RoomTypes.Any(rt =>
                            rt.IsActive &&
                            rt.MaxAdults >= requestedAdults &&
                            rt.MaxChildren >= requestedChildren &&
                            rt.MaxGuests >= (requestedAdults + requestedChildren) &&
                            rt.TotalRooms -
                            (bookedRoomsQuery
                                .Where(br => br.RoomTypeId == rt.Id)
                                .Select(br => (int?)br.BookedRooms)
                                .FirstOrDefault() ?? 0)
                            >= requestedRooms
                        )
                    );
                }


                // ====== Get total count trước khi apply pagination ======
                var totalCount = await baseQuery.CountAsync();
                if (totalCount == 0)
                {
                    return (true, "Không tìm thấy property phù hợp", new
                    {
                        Properties = new List<PropertyResponse>(),
                        TotalCount = 0,
                        Page = filter.Page,
                        PageSize = filter.PageSize,
                        TotalPages = 0
                    });
                }

                // ====== Lấy IDs trước, sau đó query chi tiết ======
                var propertyIds = await baseQuery
                    .OrderByDescending(p => p.IsFeatured)
                    .ThenByDescending(p => p.CreatedAt) // Tạm thời sort theo CreatedAt để đơn giản
                    .Skip((filter.Page - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .Select(p => p.Id)
                    .ToListAsync();

                // ====== Query chi tiết cho các properties đã chọn ======
                var detailedProperties = await _context.Properties
                    .Include(p => p.Images.Where(img => img.IsPrimary))
                    .Include(p => p.Amenities).ThenInclude(pa => pa.Amenity)
                    .Include(p => p.Province)
                    .Include(p => p.Commune)
                    .Include(p => p.ProductType)
                    .Where(p => propertyIds.Contains(p.Id))
                    .ToListAsync();

                // ====== Batch query statistics ======
                var statisticsQuery = await (
                    from p in _context.Properties
                    where propertyIds.Contains(p.Id)
                    select new
                    {
                        PropertyId = p.Id,
                        BookingCount = _context.Bookings.Count(b => b.PropertyId == p.Id),
                        ReviewCount = _context.Reviews.Count(r => r.PropertyId == p.Id),
                        ViewCount = _context.PropertyViews.Count(v => v.PropertyId == p.Id),
                        AverageRating = _context.Reviews
                            .Where(rv => rv.PropertyId == p.Id)
                            .Select(rv => (decimal?)rv.OverallRating)
                            .Average()
                    }).ToListAsync();

                // ====== Apply rating filter sau khi có statistics ======
                var validStatistics = statisticsQuery;
                if (filter.MinRating.HasValue)
                {
                    validStatistics = statisticsQuery
                        .Where(s => s.AverageRating.HasValue && s.AverageRating.Value >= filter.MinRating.Value)
                        .ToList();
                }

                // ====== Sort lại theo business logic ======
                var sortedStatistics = validStatistics
                    .Join(detailedProperties, s => s.PropertyId, p => p.Id, (s, p) => new { Stats = s, Property = p })
                    .OrderByDescending(x => x.Property.IsFeatured)
                    .ThenByDescending(x => x.Stats.BookingCount)
                    .ThenByDescending(x => x.Stats.ReviewCount)
                    .ThenByDescending(x => x.Stats.ViewCount)
                    .ThenByDescending(x => x.Property.CreatedAt)
                    .ToList();

                // ====== Build response ======
                var propertyResponses = sortedStatistics.Select(x => new PropertyResponse
                {
                    Id = x.Property.Id,
                    Name = x.Property.Name,
                    Slug = x.Property.Slug,
                    Type = x.Property.ProductType.Name,
                    Description = x.Property.Description,
                    AddressDetail = x.Property.AddressDetail,
                    Province = x.Property.Province.Name,
                    Commune = x.Property.Commune.Name,
                    PriceFrom = x.Property.PriceFrom,
                    Currency = x.Property.Currency,
                    Status = x.Property.Status,
                    IsActive = x.Property.IsActive,
                    IsFeatured = x.Property.IsFeatured,
                    CreatedAt = x.Property.CreatedAt,
                    Images = x.Property.Images.Select(img => img.ImageUrl).ToList(),
                    Amenities = x.Property.Amenities.Select(pa => pa.Amenity.Name).ToList(),
                    TotalViews = x.Stats.ViewCount,
                    TotalReviews = x.Stats.ReviewCount,
                    AverageRating = x.Stats.AverageRating
                }).ToList();

                var result = new
                {
                    Properties = propertyResponses,
                    TotalCount = totalCount,
                    Page = filter.Page,
                    PageSize = filter.PageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
                };

                return (true, "Lấy danh sách property thành công", result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting approved properties");
                throw;
            }
        }


        // Updated GetFeaturedPropertiesAsync method
        public async Task<(bool Success, string Message, object Data)> GetFeaturedPropertiesAsync(PropertyFilterRequest filter)
        {
            try
            {
                var query = _context.Properties
                    .Include(p => p.Images)
                    .Include(p => p.Amenities).ThenInclude(pa => pa.Amenity)
                    .Include(p => p.Province)
                    .Include(p => p.Commune)
                    .Include(p => p.ProductType)
                    .Where(p => p.IsFeatured && p.Status == "approved" && p.IsActive)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(filter.Name))
                    query = query.Where(p => p.Name.Contains(filter.Name));

                if (filter.ProductTypeId.HasValue)
                    query = query.Where(p => p.ProductTypeId == filter.ProductTypeId);

                if (filter.ProvinceId.HasValue)
                    query = query.Where(p => p.ProvinceId == filter.ProvinceId);

                var totalCount = await query.CountAsync();

                var properties = await query
                    .Select(p => new
                    {
                        Property = p,
                        BookingCount = _context.Bookings.Count(b => b.PropertyId == p.Id),
                        ReviewCount = _context.Reviews.Count(r => r.PropertyId == p.Id),
                        AverageRating = _context.Reviews.Where(r => r.PropertyId == p.Id).Any()
                            ? _context.Reviews.Where(r => r.PropertyId == p.Id).Average(r => (decimal)r.OverallRating)
                            : (decimal?)null
                    })
                    .OrderByDescending(x => x.Property.IsFeatured)   // tất cả đều featured, vẫn giữ để nhất quán
                    .ThenByDescending(x => x.BookingCount)
                    .ThenByDescending(x => x.ReviewCount)
                    .ThenByDescending(x => x.Property.CreatedAt)     // bỏ ViewCount ở đây
                    .Skip((filter.Page - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .ToListAsync();

                var propertyResponses = properties.Select(x => new PropertyResponse
                {
                    Id = x.Property.Id,
                    Name = x.Property.Name,
                    Slug = x.Property.Slug,
                    Type = x.Property.ProductType.Name,
                    Description = x.Property.Description,
                    AddressDetail = x.Property.AddressDetail,
                    Province = x.Property.Province.Name,
                    Commune = x.Property.Commune.Name,
                    PriceFrom = x.Property.PriceFrom,
                    Currency = x.Property.Currency,
                    Status = x.Property.Status,
                    IsActive = x.Property.IsActive,
                    IsFeatured = x.Property.IsFeatured,
                    CreatedAt = x.Property.CreatedAt,
                    Images = x.Property.Images.Where(img => img.IsPrimary).Select(img => img.ImageUrl).ToList(),
                    Amenities = x.Property.Amenities.Select(pa => pa.Amenity.Name).ToList(),
                    TotalReviews = x.ReviewCount,
                    AverageRating = x.AverageRating
                    // Không cần TotalViews nữa
                }).ToList();

                var result = new
                {
                    Properties = propertyResponses,
                    TotalCount = totalCount,
                    Page = filter.Page,
                    PageSize = filter.PageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
                };

                return (true, "Lấy danh sách property nổi bật thành công", result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting featured properties");
                throw;
            }
        }



        public async Task<(bool Success, string Message, object Data)> SubmitPropertyForReviewAsync(int id, int hostId)
        {
            try
            {
                var property = await _context.Properties
                    .FirstOrDefaultAsync(p => p.Id == id && p.HostId == hostId);

                if (property == null)
                {
                    return (false, "Property không tồn tại hoặc bạn không có quyền", null);
                }

                if (property.Status != "draft")
                {
                    return (false, $"Property đang ở trạng thái '{property.Status}', chỉ có thể submit property ở trạng thái 'draft'", null);
                }

                // Kiểm tra property có đủ thông tin để submit không
                var validationResult = await ValidatePropertyForSubmissionAsync(property);
                if (!validationResult.IsValid)
                {
                    return (false, validationResult.ErrorMessage, null);
                }

                // Capture old values for audit
                var oldValues = JsonSerializer.Serialize(new
                {
                    Id = property.Id,
                    Status = property.Status,
                    UpdatedAt = property.UpdatedAt
                });

                property.Status = "pending";
                property.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                // Log audit action
                var newValues = JsonSerializer.Serialize(new
                {
                    Id = property.Id,
                    Status = property.Status,
                    UpdatedAt = property.UpdatedAt
                });
                await _auditLogService.LogUpdateAsync("Properties", property.Id, oldValues, newValues);

                return (true, "Property đã được gửi để xét duyệt", new
                {
                    property.Id,
                    property.Name,
                    Status = property.Status,
                    SubmittedAt = property.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting property for review");
                throw;
            }
        }

        public async Task<(bool Success, string Message, object Data)> ApprovePropertyAsync(int id, int approverId)
        {
            try
            {
                var property = await _context.Properties
                    .Include(p => p.Host)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (property == null)
                {
                    return (false, "Property không tồn tại", null);
                }

                if (property.Status != "pending")
                {
                    return (false, $"Property đang ở trạng thái '{property.Status}', chỉ có thể approve property ở trạng thái 'pending'", null);
                }

                // Capture old values for audit
                var oldValues = JsonSerializer.Serialize(new
                {
                    Id = property.Id,
                    Status = property.Status,
                    UpdatedAt = property.UpdatedAt
                });

                property.Status = "approved";
                property.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                // Log audit action
                var newValues = JsonSerializer.Serialize(new
                {
                    Id = property.Id,
                    Status = property.Status,
                    UpdatedAt = property.UpdatedAt
                });
                await _auditLogService.LogUpdateAsync("Properties", property.Id, oldValues, newValues);

                return (true, "Property đã được duyệt thành công", new
                {
                    property.Id,
                    property.Name,
                    Status = property.Status,
                    ApprovedAt = property.UpdatedAt,
                    HostName = property.Host.FullName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving property");
                throw;
            }
        }

        public async Task<(bool Success, string Message, object Data)> ToggleFeaturedStatusAsync(int id, int adminId)
        {
            try
            {
                var property = await _context.Properties
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (property == null)
                {
                    return (false, "Property không tồn tại", null);
                }

                if (property.Status != "approved")
                {
                    return (false, "Chỉ có thể đặt featured cho property đã được duyệt", null);
                }

                // Capture old values for audit
                var oldValues = JsonSerializer.Serialize(new
                {
                    Id = property.Id,
                    IsFeatured = property.IsFeatured,
                    UpdatedAt = property.UpdatedAt
                });

                property.IsFeatured = !property.IsFeatured;
                property.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                // Log audit action
                var newValues = JsonSerializer.Serialize(new
                {
                    Id = property.Id,
                    IsFeatured = property.IsFeatured,
                    UpdatedAt = property.UpdatedAt
                });
                await _auditLogService.LogUpdateAsync("Properties", property.Id, oldValues, newValues);

                var status = property.IsFeatured ? "nổi bật" : "bình thường";
                return (true, $"Đã chuyển property thành {status}", new
                {
                    property.Id,
                    property.Name,
                    IsFeatured = property.IsFeatured,
                    UpdatedAt = property.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling featured status");
                throw;
            }
        }

        // Helper method để validate property trước khi submit
        private async Task<(bool IsValid, string ErrorMessage)> ValidatePropertyForSubmissionAsync(Property property)
        {
            // Kiểm tra property có đủ thông tin cơ bản
            if (string.IsNullOrWhiteSpace(property.Name))
            {
                return (false, "Tên property là bắt buộc");
            }

            if (string.IsNullOrWhiteSpace(property.Description))
            {
                return (false, "Mô tả property là bắt buộc");
            }

            if (string.IsNullOrWhiteSpace(property.AddressDetail))
            {
                return (false, "Địa chỉ chi tiết là bắt buộc");
            }

            // Kiểm tra có ít nhất 1 ảnh
            var hasImages = await _context.PropertyImages
                .AnyAsync(pi => pi.PropertyId == property.Id);

            if (!hasImages)
            {
                return (false, "Property phải có ít nhất 1 ảnh trước khi submit");
            }

            // Kiểm tra có ảnh chính
            var hasPrimaryImage = await _context.PropertyImages
                .AnyAsync(pi => pi.PropertyId == property.Id && pi.IsPrimary);

            if (!hasPrimaryImage)
            {
                return (false, "Property phải có ảnh chính trước khi submit");
            }

            // Kiểm tra có thông tin giá
            if (property.PriceFrom <= 0)
            {
                return (false, "Giá property phải lớn hơn 0");
            }

            // Kiểm tra có room type nào không
            var hasRoomTypes = await _context.RoomTypes
                .AnyAsync(rt => rt.PropertyId == property.Id && rt.IsActive);

            if (!hasRoomTypes)
            {
                return (false, "Property phải có ít nhất 1 loại phòng hoạt động trước khi submit");
            }

            return (true, string.Empty);
        }
        public async Task<(bool Success, string Message, object Data)> GetAllPropertiesForAdminAsync(PropertyAdminFilterRequest filter)
        {
            try
            {
                var query = _context.Properties
                    .Include(p => p.Host)
                    .Include(p => p.Images)
                    .Include(p => p.Province)
                    .Include(p => p.ProductType)
                    .Include(p => p.RoomTypes)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(filter.Name))
                    query = query.Where(p => p.Name.Contains(filter.Name) || p.Slug.Contains(filter.Name));

                if (filter.ProductTypeId.HasValue)
                    query = query.Where(p => p.ProductTypeId == filter.ProductTypeId);

                if (filter.ProvinceId.HasValue)
                    query = query.Where(p => p.ProvinceId == filter.ProvinceId);

                if (filter.HostId.HasValue)
                    query = query.Where(p => p.HostId == filter.HostId);

                if (!string.IsNullOrEmpty(filter.Status))
                {
                    var statuses = filter.Status.Split(',').Select(s => s.Trim().ToLower()).ToList();
                    query = query.Where(p => statuses.Contains(p.Status.ToLower()));
                }

                if (filter.IsActive.HasValue)
                    query = query.Where(p => p.IsActive == filter.IsActive);

                if (filter.IsFeatured.HasValue)
                    query = query.Where(p => p.IsFeatured == filter.IsFeatured);

                if (filter.CreatedFrom.HasValue)
                    query = query.Where(p => p.CreatedAt >= filter.CreatedFrom.Value);

                if (filter.CreatedTo.HasValue)
                    query = query.Where(p => p.CreatedAt <= filter.CreatedTo.Value);

                if (filter.PriceFrom.HasValue)
                    query = query.Where(p => p.PriceFrom >= filter.PriceFrom.Value);

                if (filter.PriceTo.HasValue)
                    query = query.Where(p => p.PriceFrom <= filter.PriceTo.Value);

                // Apply sorting
                query = (filter.SortBy?.ToLower(), filter.SortOrder?.ToLower()) switch
                {
                    ("name", "asc") => query.OrderBy(p => p.Name),
                    ("name", _) => query.OrderByDescending(p => p.Name),
                    ("price", "asc") => query.OrderBy(p => p.PriceFrom),
                    ("price", _) => query.OrderByDescending(p => p.PriceFrom),
                    ("bookings", "asc") => query.OrderBy(p => _context.Bookings.Count(b => b.PropertyId == p.Id)),
                    ("bookings", _) => query.OrderByDescending(p => _context.Bookings.Count(b => b.PropertyId == p.Id)),
                    ("revenue", "asc") => query.OrderBy(p => _context.Bookings.Where(b => b.PropertyId == p.Id && b.Status == "confirmed").Sum(b => (decimal?)b.TotalAmount) ?? 0),
                    ("revenue", _) => query.OrderByDescending(p => _context.Bookings.Where(b => b.PropertyId == p.Id && b.Status == "confirmed").Sum(b => (decimal?)b.TotalAmount) ?? 0),
                    (_, "asc") => query.OrderBy(p => p.CreatedAt),
                    _ => query.OrderByDescending(p => p.CreatedAt)
                };

                var totalCount = await query.CountAsync();

                var properties = await query
                    .Skip((filter.Page - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .Select(p => new
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Slug = p.Slug,
                        Host = new { Id = p.Host.Id, Name = p.Host.FullName, Email = p.Host.Email },
                        ProductType = p.ProductType.Name,
                        Province = p.Province.Name,
                        Status = p.Status,
                        IsActive = p.IsActive,
                        IsFeatured = p.IsFeatured,
                        PriceFrom = p.PriceFrom,
                        Currency = p.Currency,
                        TotalRoomTypes = p.RoomTypes.Count,
                        CreatedAt = p.CreatedAt,
                        UpdatedAt = p.UpdatedAt,
                        PrimaryImage = p.Images.FirstOrDefault(img => img.IsPrimary).ImageUrl,
                        TotalBookings = _context.Bookings.Count(b => b.PropertyId == p.Id),
                        TotalRevenue = _context.Bookings
    .Where(b => b.PropertyId == p.Id
             && b.Status == "completed"
             && b.PaymentStatus == "paid")
    .Sum(b => (decimal?)b.TotalAmount) ?? 0,

                        TotalReviews = _context.Reviews.Count(r => r.PropertyId == p.Id),
                        AverageRating = _context.Reviews.Where(r => r.PropertyId == p.Id).Average(r => (decimal?)r.OverallRating)
                    })
                    .ToListAsync();

                var result = new
                {
                    Properties = properties,
                    Pagination = new
                    {
                        TotalCount = totalCount,
                        Page = filter.Page,
                        PageSize = filter.PageSize,
                        TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
                    }
                };

                return (true, "Lấy danh sách property thành công", result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting properties for admin");
                throw;
            }
        }

        public async Task<(bool Success, string Message, object Data)> GetPropertyDetailForAdminAsync(int id)
        {
            try
            {
                var property = await _context.Properties
                    .Include(p => p.Host)
                    .Include(p => p.Images)
                    .Include(p => p.Amenities).ThenInclude(pa => pa.Amenity)
                    .Include(p => p.Province)
                    .Include(p => p.Commune)
                    .Include(p => p.ProductType)
                    .Include(p => p.RoomTypes).ThenInclude(rt => rt.Images)
                    .Include(p => p.RoomTypes).ThenInclude(rt => rt.RoomAmenities).ThenInclude(ra => ra.Amenity)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (property == null)
                    return (false, "Property không tồn tại", null);

                var bookings = await _context.Bookings
            .Where(b => b.PropertyId == id && b.Status == "completed" && b.PaymentStatus == "paid")
            .GroupBy(b => b.Status)
            .Select(g => new
            {
                Status = g.Key,
                Count = g.Count(),
                TotalAmount = g.Sum(b => (decimal?)b.TotalAmount) ?? 0
            })
            .ToListAsync();


                var reviews = await _context.Reviews
                    .Where(r => r.PropertyId == id)
                    .Select(r => new
                    {
                        r.Id,
                        r.Customer,
                        GuestName = r.Customer.FullName,
                        r.OverallRating,
                        r.ReviewText,
                        r.CreatedAt
                    })
                    .OrderByDescending(r => r.CreatedAt)
                    .Take(10)
                    .ToListAsync();

                var result = new
                {
                    Property = new
                    {
                        property.Id,
                        property.Name,
                        property.Slug,
                        Host = new { property.Host.Id, property.Host.FullName, property.Host.Email, property.Host.Phone },
                        ProductType = new { property.ProductType.Id, property.ProductType.Name },
                        property.Description,
                        property.ShortDescription,
                        property.AddressDetail,
                        Province = property.Province.Name,
                        Commune = property.Commune.Name,
                        property.Status,
                        property.IsActive,
                        property.IsFeatured,
                        property.PriceFrom,
                        property.Currency,
                        property.StarRating,
                        property.TotalRooms,
                        property.CreatedAt,
                        property.UpdatedAt,
                        Images = property.Images.OrderBy(i => i.SortOrder).Select(i => new
                        {
                            i.Id,
                            i.ImageUrl,
                            i.IsPrimary,
                            i.ImageType
                        }),
                        Amenities = property.Amenities.Select(pa => new
                        {
                            pa.Amenity.Id,
                            pa.Amenity.Name,
                            pa.IsFree
                        }),
                        RoomTypes = property.RoomTypes.Select(rt => new
                        {
                            rt.Id,
                            rt.Name,
                            rt.BasePrice,
                            rt.TotalRooms,
                            rt.IsActive,
                            Images = rt.Images.Select(i => i.ImageUrl)
                        })
                    },
                    Statistics = new
                    {
                        TotalBookings = bookings.Sum(b => b.Count),
                        BookingsByStatus = bookings,
                        TotalRevenue = bookings.Sum(b => b.TotalAmount),
                TotalReviews = reviews.Count,
                        AverageRating = reviews.Any()
    ? (decimal?)reviews.Average(r => (decimal)r.OverallRating)
    : (decimal?)null,
                RecentReviews = reviews
                    }
                };

                return (true, "Lấy chi tiết property thành công", result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting property detail for admin");
                throw;
            }
        }

        public async Task<(bool Success, string Message, object Data)> RejectPropertyAsync(int id, int adminId, string reason)
        {
            try
            {
                var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == id);

                if (property == null)
                    return (false, "Property không tồn tại", null);

                if (property.Status != "pending")
                    return (false, $"Chỉ có thể reject property ở trạng thái pending", null);

                var oldValues = JsonSerializer.Serialize(new { property.Id, property.Status });

                property.Status = "rejected";
                property.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                var newValues = JsonSerializer.Serialize(new { property.Id, property.Status, Reason = reason });
                await _auditLogService.LogUpdateAsync("Properties", property.Id, oldValues, newValues);

                return (true, "Property đã bị từ chối", new { property.Id, property.Status, Reason = reason });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting property");
                throw;
            }
        }

        public async Task<(bool Success, string Message, object Data)> DeactivatePropertyAsync(int id, int adminId, string reason)
        {
            try
            {
                var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == id);

                if (property == null)
                    return (false, "Property không tồn tại", null);

                if (!property.IsActive)
                    return (false, "Property đã ở trạng thái inactive", null);

                var oldValues = JsonSerializer.Serialize(new { property.Id, property.IsActive });

                property.IsActive = false;
                property.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                var newValues = JsonSerializer.Serialize(new { property.Id, property.IsActive, Reason = reason });
                await _auditLogService.LogUpdateAsync("Properties", property.Id, oldValues, newValues);

                return (true, "Property đã được vô hiệu hóa", new { property.Id, property.IsActive, Reason = reason });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deactivating property");
                throw;
            }
        }

        public async Task<(bool Success, string Message, object Data)> ActivatePropertyAsync(int id, int adminId)
        {
            try
            {
                var property = await _context.Properties.FirstOrDefaultAsync(p => p.Id == id);

                if (property == null)
                    return (false, "Property không tồn tại", null);

                if (property.IsActive)
                    return (false, "Property đã ở trạng thái active", null);

                if (property.Status != "approved")
                    return (false, "Chỉ có thể activate property đã được approved", null);

                var oldValues = JsonSerializer.Serialize(new { property.Id, property.IsActive });

                property.IsActive = true;
                property.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                var newValues = JsonSerializer.Serialize(new { property.Id, property.IsActive });
                await _auditLogService.LogUpdateAsync("Properties", property.Id, oldValues, newValues);

                return (true, "Property đã được kích hoạt", new { property.Id, property.IsActive });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error activating property");
                throw;
            }
        }

        public async Task<(bool Success, string Message, object Data)> GetPropertyStatisticsAsync()
        {
            try
            {
                var totalProperties = await _context.Properties.CountAsync();
                var byStatus = await _context.Properties
                    .GroupBy(p => p.Status)
                    .Select(g => new { Status = g.Key, Count = g.Count() })
                    .ToListAsync();

                var byProductType = await _context.Properties
                    .GroupBy(p => p.ProductType.Name)
                    .Select(g => new { Type = g.Key, Count = g.Count() })
                    .ToListAsync();

                var topProvinces = await _context.Properties
                    .GroupBy(p => p.Province.Name)
                    .Select(g => new { Province = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(10)
                    .ToListAsync();

                // 🔹 Chỉ tính revenue với booking completed + paid
                var totalRevenue = await _context.Bookings
                    .Where(b => b.Status == "completed" && b.PaymentStatus == "paid")
                    .SumAsync(b => (decimal?)b.TotalAmount) ?? 0;

                var totalBookings = await _context.Bookings
                    .CountAsync(b => b.Status == "completed" && b.PaymentStatus == "paid");

                var result = new
                {
                    TotalProperties = totalProperties,
                    ActiveProperties = await _context.Properties.CountAsync(p => p.IsActive),
                    FeaturedProperties = await _context.Properties.CountAsync(p => p.IsFeatured),
                    ByStatus = byStatus,
                    ByProductType = byProductType,
                    TopProvinces = topProvinces,
                    TotalRevenue = totalRevenue,
                    TotalBookings = totalBookings,
                    AveragePropertyPrice = await _context.Properties.AverageAsync(p => (decimal?)p.PriceFrom) ?? 0
                };

                return (true, "Lấy thống kê thành công", result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting property statistics");
                throw;
            }
        }


        public async Task<(bool Success, string Message, object Data)> GetPropertiesByStatusAsync(string status, int page, int pageSize)
        {
            try
            {
                var query = _context.Properties
                    .Include(p => p.Host)
                    .Include(p => p.ProductType)
                    .Include(p => p.Province)
                    .Where(p => p.Status == status);

                var totalCount = await query.CountAsync();

                var properties = await query
                    .OrderByDescending(p => p.UpdatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new
                    {
                        p.Id,
                        p.Name,
                        HostName = p.Host.FullName,
                        ProductType = p.ProductType.Name,
                        Province = p.Province.Name,
                        p.CreatedAt,
                        p.UpdatedAt
                    })
                    .ToListAsync();

                var result = new
                {
                    Properties = properties,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                };

                return (true, "Lấy danh sách thành công", result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting properties by status");
                throw;
            }
        }
        public async Task<(bool Success, string Message, object Data)> GetSimilarPropertiesAsync(int propertyId, int limit = 10)
        {
            try
            {
                var property = await _context.Properties
                    .Include(p => p.ProductType)
                    .FirstOrDefaultAsync(p => p.Id == propertyId && p.Status == "approved" && p.IsActive);

                if (property == null)
                    return (false, "Property không tồn tại", null);

                if (!property.Latitude.HasValue || !property.Longitude.HasValue)
                    return (false, "Property không có thông tin tọa độ", null);

                // Lấy tất cả properties cùng ProductType (trừ chính nó)
                var candidates = await _context.Properties
                    .Include(p => p.Images)
                    .Include(p => p.Province)
                    .Include(p => p.ProductType)
                    .Where(p => p.Id != propertyId
                        && p.ProductTypeId == property.ProductTypeId
                        && p.Status == "approved"
                        && p.IsActive
                        && p.Latitude.HasValue
                        && p.Longitude.HasValue)
                    .ToListAsync();

                // Tính khoảng cách và sắp xếp
                var similarProperties = candidates
                    .Select(p => new
                    {
                        Property = p,
                        Distance = CalculateDistance(
                            property.Latitude.Value, property.Longitude.Value,
                            p.Latitude.Value, p.Longitude.Value
                        ),
                        PriceDiff = Math.Abs((p.PriceFrom ?? 0) - (property.PriceFrom ?? 0))
                    })
                    .OrderBy(x => x.Distance)
                    .ThenBy(x => x.PriceDiff)
                    .Take(limit)
                    .Select(x => new PropertyResponse
                    {
                        Id = x.Property.Id,
                        Name = x.Property.Name,
                        Slug = x.Property.Slug,
                        Type = x.Property.ProductType.Name,
                        Description = x.Property.Description,
                        AddressDetail = x.Property.AddressDetail,
                        Province = x.Property.Province.Name,
                        PriceFrom = x.Property.PriceFrom,
                        Currency = x.Property.Currency,
                        Status = x.Property.Status,
                        IsActive = x.Property.IsActive,
                        IsFeatured = x.Property.IsFeatured,
                        CreatedAt = x.Property.CreatedAt,
                        Images = x.Property.Images.Where(img => img.IsPrimary).Select(img => img.ImageUrl).ToList(),
                        TotalReviews = _context.Reviews.Count(r => r.PropertyId == x.Property.Id),
                        AverageRating = _context.Reviews.Where(r => r.PropertyId == x.Property.Id).Any()
                            ? _context.Reviews.Where(r => r.PropertyId == x.Property.Id).Average(r => (decimal)r.OverallRating)
                            : (decimal?)null
                    })
                    .ToList();

                return (true, "Lấy danh sách sản phẩm tương tự thành công", new { Properties = similarProperties });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting similar properties");
                throw;
            }
        }

        public async Task<(bool Success, string Message, object Data)> GetMostViewedPropertiesAsync(int limit = 10)
        {
            try
            {
                var propertyViews = await _context.PropertyViews
                    .GroupBy(pv => pv.PropertyId)
                    .Select(g => new { PropertyId = g.Key, ViewCount = g.Count() })
                    .OrderByDescending(x => x.ViewCount)
                    .Take(limit)
                    .ToListAsync();

                var propertyIds = propertyViews.Select(pv => pv.PropertyId).ToList();

                var properties = await _context.Properties
                    .Include(p => p.Images)
                    .Include(p => p.Province)
                    .Include(p => p.ProductType)
                    .Where(p => propertyIds.Contains(p.Id) && p.Status == "approved" && p.IsActive)
                    .ToListAsync();

                var result = propertyViews
                    .Join(properties, pv => pv.PropertyId, p => p.Id, (pv, p) => new
                    {
                        Property = p,
                        ViewCount = pv.ViewCount
                    })
                    .Select(x => new PropertyResponse
                    {
                        Id = x.Property.Id,
                        Name = x.Property.Name,
                        Slug = x.Property.Slug,
                        Type = x.Property.ProductType.Name,
                        Description = x.Property.Description,
                        AddressDetail = x.Property.AddressDetail,
                        Province = x.Property.Province.Name,
                        PriceFrom = x.Property.PriceFrom,
                        Currency = x.Property.Currency,
                        Status = x.Property.Status,
                        IsActive = x.Property.IsActive,
                        IsFeatured = x.Property.IsFeatured,
                        CreatedAt = x.Property.CreatedAt,
                        TotalViews = x.ViewCount,
                        Images = x.Property.Images.Where(img => img.IsPrimary).Select(img => img.ImageUrl).ToList(),
                        TotalReviews = _context.Reviews.Count(r => r.PropertyId == x.Property.Id),
                        AverageRating = _context.Reviews.Where(r => r.PropertyId == x.Property.Id).Any()
                            ? _context.Reviews.Where(r => r.PropertyId == x.Property.Id).Average(r => (decimal)r.OverallRating)
                            : (decimal?)null
                    })
                    .ToList();

                return (true, "Lấy danh sách sản phẩm xem nhiều nhất thành công", new { Properties = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting most viewed properties");
                throw;
            }
        }

        public async Task<(bool Success, string Message, object Data)> GetMostBookedPropertiesAsync(int limit = 10)
        {
            try
            {
                var propertyBookings = await _context.Bookings
                    .Where(b => b.Status == "completed" && b.PaymentStatus == "paid")
                    .GroupBy(b => b.PropertyId)
                    .Select(g => new { PropertyId = g.Key, BookingCount = g.Count() })
                    .OrderByDescending(x => x.BookingCount)
                    .Take(limit)
                    .ToListAsync();

                var propertyIds = propertyBookings.Select(pb => pb.PropertyId).ToList();

                var properties = await _context.Properties
                    .Include(p => p.Images)
                    .Include(p => p.Province)
                    .Include(p => p.ProductType)
                    .Where(p => propertyIds.Contains(p.Id) && p.Status == "approved" && p.IsActive)
                    .ToListAsync();

                var result = propertyBookings
                    .Join(properties, pb => pb.PropertyId, p => p.Id, (pb, p) => new
                    {
                        Property = p,
                        BookingCount = pb.BookingCount
                    })
                    .Select(x => new PropertyResponse
                    {
                        Id = x.Property.Id,
                        Name = x.Property.Name,
                        Slug = x.Property.Slug,
                        Type = x.Property.ProductType.Name,
                        Description = x.Property.Description,
                        AddressDetail = x.Property.AddressDetail,
                        Province = x.Property.Province.Name,
                        PriceFrom = x.Property.PriceFrom,
                        Currency = x.Property.Currency,
                        Status = x.Property.Status,
                        IsActive = x.Property.IsActive,
                        IsFeatured = x.Property.IsFeatured,
                        CreatedAt = x.Property.CreatedAt,
                        Images = x.Property.Images.Where(img => img.IsPrimary).Select(img => img.ImageUrl).ToList(),
                        TotalReviews = _context.Reviews.Count(r => r.PropertyId == x.Property.Id),
                        AverageRating = _context.Reviews.Where(r => r.PropertyId == x.Property.Id).Any()
                            ? _context.Reviews.Where(r => r.PropertyId == x.Property.Id).Average(r => (decimal)r.OverallRating)
                            : (decimal?)null
                    })
                    .ToList();

                return (true, "Lấy danh sách sản phẩm được đặt nhiều nhất thành công", new { Properties = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting most booked properties");
                throw;
            }
        }

        // Helper method để tính khoảng cách giữa 2 điểm (Haversine formula)
        private double CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
        {
            const double R = 6371; // Bán kính Trái Đất (km)

            var dLat = ToRadians((double)(lat2 - lat1));
            var dLon = ToRadians((double)(lon2 - lon1));

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians((double)lat1)) * Math.Cos(ToRadians((double)lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return R * c;
        }

        private double ToRadians(double degrees)
        {
            return degrees * Math.PI / 180;
        }
    }
}