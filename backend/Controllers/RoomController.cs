using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QBooking.Data;
using QBooking.Dtos.Request;
using QBooking.Dtos.Response;
using QBooking.Models;
using QBooking.Services;
using System.Security.Claims;
using System.Text.Json;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoomController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<RoomController> _logger;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly AuditLogService _auditLogService;
        public RoomController(ApplicationDbContext context, ILogger<RoomController> logger, IWebHostEnvironment webHostEnvironment, AuditLogService auditLogService)
        {
            _context = context;
            _logger = logger;
            _webHostEnvironment = webHostEnvironment;
            _auditLogService = auditLogService;
        }

        // CREATE
        [HttpPost("create")]
        [Authorize(Roles = "host")]
        public async Task<IActionResult> CreateSingle([FromBody] CreateSingleRoomTypeRequest request)
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

                int hostId = int.Parse(userIdClaim.Value);

                // Kiểm tra property có tồn tại và thuộc về host không
                var property = await _context.Properties
                    .FirstOrDefaultAsync(p => p.Id == request.PropertyId && p.HostId == hostId);

                if (property == null)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Property không tồn tại hoặc bạn không có quyền.",
                        StatusCode = 400
                    });
                }

                // Validation
                var validationResult = await ValidateCreateRoomTypeRequest(request);
                if (validationResult != null)
                {
                    return BadRequest(validationResult);
                }

                string baseSlug = GenerateSlug(request.Name);
                string uniqueSlug = await EnsureUniqueSlug(baseSlug);

                // Tạo room type
                var roomType = new RoomType
                {
                    PropertyId = request.PropertyId,
                    Name = request.Name,
                    Slug = uniqueSlug,
                    Description = request.Description,
                    ShortDescription = request.ShortDescription,
                    MaxAdults = request.MaxAdults,
                    MaxChildren = request.MaxChildren,
                    MaxGuests = request.MaxGuests,
                    BedType = request.BedType,
                    RoomSize = request.RoomSize,
                    BasePrice = request.BasePrice,
                    WeekendPrice = request.WeekendPrice,
                    HolidayPrice = request.HolidayPrice,
                    WeeklyDiscountPercent = request.WeeklyDiscountPercent,
                    MonthlyDiscountPercent = request.MonthlyDiscountPercent,
                    TotalRooms = request.TotalRooms,
                    MetaTitle = request.MetaTitle,
                    MetaDescription = request.MetaDescription,
                    IsActive = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                // Thêm tiện ích phòng
                if (request.Amenities != null && request.Amenities.Any())
                {
                    foreach (var amenity in request.Amenities)
                    {
                        roomType.RoomAmenities.Add(new RoomAmenity
                        {
                            AmenityId = amenity.AmenityId,
                            Quantity = amenity.Quantity
                        });
                    }
                }

                _context.RoomTypes.Add(roomType);
                await _context.SaveChangesAsync();

                var newRoomTypeData = System.Text.Json.JsonSerializer.Serialize(new
                {
                    roomType.Id,
                    roomType.PropertyId,
                    roomType.Name,
                    roomType.Slug,
                    roomType.MaxAdults,
                    roomType.MaxChildren,
                    roomType.MaxGuests,
                    roomType.BasePrice,
                    roomType.WeekendPrice,
                    roomType.HolidayPrice,
                    roomType.TotalRooms,
                    roomType.RoomSize,
                    roomType.BedType,
                    AmenitiesCount = request.Amenities?.Count ?? 0
                });

                await _auditLogService.LogInsertAsync("RoomType", roomType.Id, newRoomTypeData);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Tạo loại phòng thành công",
                    StatusCode = 200,
                    Data = new
                    {
                        roomType.Id,
                        roomType.Name,
                        roomType.Slug,
                        roomType.PropertyId,
                        AmenitiesCount = request.Amenities?.Count ?? 0
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating room type");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // API tạo nhiều room types
        [HttpPost("create-multiple")]
        [Authorize(Roles = "host")]
        public async Task<IActionResult> CreateMultiple([FromBody] CreateMultipleRoomTypesRequest request)
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

                int hostId = int.Parse(userIdClaim.Value);

                // Kiểm tra property có tồn tại và thuộc về host không
                var property = await _context.Properties
                    .FirstOrDefaultAsync(p => p.Id == request.PropertyId && p.HostId == hostId);

                if (property == null)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Property không tồn tại hoặc bạn không có quyền.",
                        StatusCode = 400
                    });
                }

                // Validation
                if (request.RoomTypes == null || !request.RoomTypes.Any())
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Danh sách loại phòng không được để trống.",
                        StatusCode = 400
                    });
                }

                var createdRoomTypes = new List<object>();
                var failedRoomTypes = new List<object>();

                // Sử dụng transaction để đảm bảo tính nhất quán
                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    foreach (var roomTypeData in request.RoomTypes)
                    {
                        try
                        {
                            // Validation cho từng room type
                            var validationResult = await ValidateRoomTypeData(roomTypeData);
                            if (validationResult != null)
                            {
                                failedRoomTypes.Add(new
                                {
                                    Name = roomTypeData.Name,
                                    Error = validationResult.Message
                                });
                                continue;
                            }

                            string baseSlug = GenerateSlug(roomTypeData.Name);
                            string uniqueSlug = await EnsureUniqueSlug(baseSlug);

                            // Tạo room type
                            var roomType = new RoomType
                            {
                                PropertyId = request.PropertyId,
                                Name = roomTypeData.Name,
                                Slug = uniqueSlug,
                                Description = roomTypeData.Description,
                                ShortDescription = roomTypeData.ShortDescription,
                                MaxAdults = roomTypeData.MaxAdults,
                                MaxChildren = roomTypeData.MaxChildren,
                                MaxGuests = roomTypeData.MaxGuests,
                                BedType = roomTypeData.BedType,
                                RoomSize = roomTypeData.RoomSize,
                                BasePrice = roomTypeData.BasePrice,
                                WeekendPrice = roomTypeData.WeekendPrice,
                                HolidayPrice = roomTypeData.HolidayPrice,
                                WeeklyDiscountPercent = roomTypeData.WeeklyDiscountPercent,
                                MonthlyDiscountPercent = roomTypeData.MonthlyDiscountPercent,
                                TotalRooms = roomTypeData.TotalRooms,
                                MetaTitle = roomTypeData.MetaTitle,
                                MetaDescription = roomTypeData.MetaDescription,
                                IsActive = true,
                                CreatedAt = DateTime.Now,
                                UpdatedAt = DateTime.Now
                            };

                            // Thêm tiện ích phòng
                            if (roomTypeData.Amenities != null && roomTypeData.Amenities.Any())
                            {
                                foreach (var amenity in roomTypeData.Amenities)
                                {
                                    roomType.RoomAmenities.Add(new RoomAmenity
                                    {
                                        AmenityId = amenity.AmenityId,
                                        Quantity = amenity.Quantity
                                    });
                                }
                            }

                            _context.RoomTypes.Add(roomType);
                            await _context.SaveChangesAsync();

                            createdRoomTypes.Add(new
                            {
                                roomType.Id,
                                roomType.Name,
                                roomType.Slug,
                                roomType.PropertyId,
                                AmenitiesCount = roomTypeData.Amenities?.Count ?? 0
                            });

                            // Log audit
                            var newRoomTypeData = System.Text.Json.JsonSerializer.Serialize(new
                            {
                                roomType.Id,
                                roomType.PropertyId,
                                roomType.Name,
                                roomType.Slug,
                                roomType.MaxAdults,
                                roomType.MaxChildren,
                                roomType.MaxGuests,
                                roomType.BasePrice,
                                roomType.WeekendPrice,
                                roomType.HolidayPrice,
                                roomType.TotalRooms,
                                roomType.RoomSize,
                                roomType.BedType,
                                AmenitiesCount = roomTypeData.Amenities?.Count ?? 0
                            });

                            await _auditLogService.LogInsertAsync("RoomType", roomType.Id, newRoomTypeData);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error creating room type: {RoomTypeName}", roomTypeData.Name);
                            failedRoomTypes.Add(new
                            {
                                Name = roomTypeData.Name,
                                Error = "Lỗi khi tạo loại phòng"
                            });
                        }
                    }

                    await transaction.CommitAsync();

                    return Ok(new ApiResponse<object>
                    {
                        Success = true,
                        Message = $"Tạo thành công {createdRoomTypes.Count} loại phòng",
                        StatusCode = 200,
                        Data = new
                        {
                            CreatedCount = createdRoomTypes.Count,
                            FailedCount = failedRoomTypes.Count,
                            CreatedRoomTypes = createdRoomTypes,
                            FailedRoomTypes = failedRoomTypes
                        }
                    });
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating multiple room types");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
        private async Task<ApiResponse<object>> ValidateRoomTypeData(RoomTypeData roomTypeData)
        {
            if (string.IsNullOrEmpty(roomTypeData.Name))
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Tên loại phòng không được để trống.",
                    StatusCode = 400
                };
            }

            if (roomTypeData.BasePrice <= 0)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Giá cơ bản phải lớn hơn 0.",
                    StatusCode = 400
                };
            }

            if (roomTypeData.MaxAdults < 1)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Số người lớn tối đa phải ít nhất là 1.",
                    StatusCode = 400
                };
            }

            if (roomTypeData.MaxGuests < 1)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Số khách tối đa phải ít nhất là 1.",
                    StatusCode = 400
                };
            }

            if (roomTypeData.TotalRooms < 1)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Số lượng phòng phải ít nhất là 1.",
                    StatusCode = 400
                };
            }

            return null; // Validation passed
        }
        private async Task<ApiResponse<object>> ValidateCreateRoomTypeRequest(CreateSingleRoomTypeRequest request)
        {
            // Check duplicate name within the same property
            var duplicate = await _context.RoomTypes
                .AnyAsync(rt => rt.PropertyId == request.PropertyId && rt.Name == request.Name);

            if (duplicate)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Tên loại phòng đã tồn tại trong property này.",
                    StatusCode = 400
                };
            }

            // Validate guest capacity
            if (request.MaxAdults <= 0)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Số người lớn tối đa phải lớn hơn 0.",
                    StatusCode = 400
                };
            }

            if (request.MaxChildren < 0)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Số trẻ em tối đa không được âm.",
                    StatusCode = 400
                };
            }

            if (request.MaxGuests <= 0)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Tổng số khách tối đa phải lớn hơn 0.",
                    StatusCode = 400
                };
            }

            if (request.MaxGuests < request.MaxAdults)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Tổng số khách phải lớn hơn hoặc bằng số người lớn tối đa.",
                    StatusCode = 400
                };
            }

            // Validate pricing
            if (request.BasePrice <= 0)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Giá cơ bản phải lớn hơn 0.",
                    StatusCode = 400
                };
            }

            if (request.WeekendPrice.HasValue && request.WeekendPrice <= 0)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Giá cuối tuần phải lớn hơn 0.",
                    StatusCode = 400
                };
            }

            if (request.HolidayPrice.HasValue && request.HolidayPrice <= 0)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Giá ngày lễ phải lớn hơn 0.",
                    StatusCode = 400
                };
            }

            // Validate discount percentages
            if (request.WeeklyDiscountPercent < 0 || request.WeeklyDiscountPercent > 100)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Giảm giá hàng tuần phải từ 0% đến 100%.",
                    StatusCode = 400
                };
            }

            if (request.MonthlyDiscountPercent < 0 || request.MonthlyDiscountPercent > 100)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Giảm giá hàng tháng phải từ 0% đến 100%.",
                    StatusCode = 400
                };
            }

            // Validate room details
            if (request.TotalRooms <= 0)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Tổng số phòng phải lớn hơn 0.",
                    StatusCode = 400
                };
            }

            if (request.RoomSize.HasValue && request.RoomSize <= 0)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Diện tích phòng phải lớn hơn 0.",
                    StatusCode = 400
                };
            }

            // Validate Amenities if provided
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
                    return new ApiResponse<object>
                    {
                        Success = false,
                        Message = $"Các amenity không tồn tại: {string.Join(", ", invalidAmenityIds)}",
                        StatusCode = 400
                    };
                }

                // Check for duplicate amenities in request
                var duplicateAmenities = amenityIds.GroupBy(x => x).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
                if (duplicateAmenities.Any())
                {
                    return new ApiResponse<object>
                    {
                        Success = false,
                        Message = $"Amenity bị trùng lặp: {string.Join(", ", duplicateAmenities)}",
                        StatusCode = 400
                    };
                }

                // Validate amenity quantities
                foreach (var amenity in request.Amenities)
                {
                    if (amenity.Quantity <= 0)
                    {
                        return new ApiResponse<object>
                        {
                            Success = false,
                            Message = $"Số lượng amenity (ID: {amenity.AmenityId}) phải lớn hơn 0.",
                            StatusCode = 400
                        };
                    }
                }
            }

            return null; // No validation errors
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
                result = System.Text.RegularExpressions.Regex.Replace(result, item.Key, item.Value);
            }

            result = System.Text.RegularExpressions.Regex.Replace(result, @"[^a-z0-9\s-]", "");
            result = System.Text.RegularExpressions.Regex.Replace(result, @"[\s-]+", "-");
            result = result.Trim('-');

            if (result.Length > 100)
            {
                result = result.Substring(0, 100).TrimEnd('-');
            }

            return result;
        }

        private async Task<string> EnsureUniqueSlug(string baseSlug)
        {
            string uniqueSlug = baseSlug;
            int counter = 1;

            while (await _context.RoomTypes.AnyAsync(rt => rt.Slug == uniqueSlug))
            {
                uniqueSlug = $"{baseSlug}-{counter}";
                counter++;
            }

            return uniqueSlug;
        }

        private async Task<string> EnsureUniqueSlugForUpdate(string baseSlug, int currentRoomTypeId)
        {
            string uniqueSlug = baseSlug;
            int counter = 1;

            while (await _context.RoomTypes.AnyAsync(rt => rt.Slug == uniqueSlug && rt.Id != currentRoomTypeId))
            {
                uniqueSlug = $"{baseSlug}-{counter}";
                counter++;
            }

            return uniqueSlug;
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
        [HttpGet("property/{propertyId}")]
        public async Task<IActionResult> GetRoomTypesByProperty(int propertyId)
        {
            try
            {
                // Lấy thông tin user hiện tại từ JWT token
                var currentUserId = GetCurrentUserId(); // Bạn cần implement method này
                if (currentUserId == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Người dùng chưa được xác thực",
                        StatusCode = 401
                    });
                }

                // Kiểm tra property có tồn tại không
                var property = await _context.Properties
                    .FirstOrDefaultAsync(p => p.Id == propertyId);

                if (property == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không tìm thấy property",
                        StatusCode = 404
                    });
                }

                // Kiểm tra xem user hiện tại có phải là host của property này không
                if (property.HostId != currentUserId)
                {
                    return StatusCode(403, new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Bạn không có quyền truy cập property này",
                        StatusCode = 403
                    });
                }

                // Query room types của property này
                var roomTypes = await _context.RoomTypes
                    .Include(rt => rt.Property)
                    .Include(rt => rt.Images)
                    .Include(rt => rt.RoomAmenities).ThenInclude(ra => ra.Amenity).ThenInclude(a => a.Category)
                    .Where(rt => rt.PropertyId == propertyId)
                    .Select(rt => new HostRoomTypeDetailResponse
                    {
                        Id = rt.Id,
                        PropertyId = rt.PropertyId,
                        PropertyName = rt.Property.Name,
                        Name = rt.Name,
                        Slug = rt.Slug,
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
                        TotalRooms = rt.TotalRooms,
                        IsActive = rt.IsActive,
                        CreatedAt = rt.CreatedAt,
                        Images = rt.Images.Where(img => img.IsPrimary).Select(img => img.ImageUrl).ToList(),
                        Amenities = rt.RoomAmenities.Select(ra => new RoomAmenityDetailResponse
                        {
                            Id = ra.Amenity.Id,
                            Name = ra.Amenity.Name,
                            Slug = ra.Amenity.Slug,
                            Icon = ra.Amenity.Icon,
                            Description = ra.Amenity.Description,
                            IsPopular = ra.Amenity.IsPopular,
                            CategoryName = ra.Amenity.Category.Name
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Lấy danh sách phòng của property thành công",
                    StatusCode = 200,
                    Data = new
                    {
                        PropertyId = propertyId,
                        PropertyName = property.Name,
                        RoomTypes = roomTypes,
                        TotalCount = roomTypes.Count
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting room types for property {PropertyId}", propertyId);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
        // READ - Get All Room Types
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] RoomTypeFilterRequest filter)
        {
            try
            {
                // ====== Tính tổng khách ======
                var requestedAdults = filter.Adults ?? 1;
                var requestedChildren = filter.Children ?? 0;
                var totalGuests = requestedAdults + requestedChildren;
                const int requestedRooms = 1;

                // ====== Query cơ bản - chỉ lấy room active ======
                var baseQuery = _context.RoomTypes
                    .Where(rt => rt.IsActive)
                    .AsQueryable();

                // ====== Apply filters early ======
                if (!string.IsNullOrEmpty(filter.Name))
                    baseQuery = baseQuery.Where(rt => rt.Name.Contains(filter.Name));

                if (!string.IsNullOrEmpty(filter.BedType))
                    baseQuery = baseQuery.Where(rt => rt.BedType == filter.BedType);

                // ====== Lọc theo số khách (luôn áp dụng) ======
                baseQuery = baseQuery.Where(rt =>
                    rt.MaxAdults >= requestedAdults &&
                    rt.MaxChildren >= requestedChildren &&
                    rt.MaxGuests >= totalGuests
                );

                // ====== Lọc theo khoảng giá ======
                if (filter.MinPrice.HasValue)
                    baseQuery = baseQuery.Where(rt => rt.BasePrice >= filter.MinPrice);

                if (filter.MaxPrice.HasValue)
                    baseQuery = baseQuery.Where(rt => rt.BasePrice <= filter.MaxPrice);

                // ====== Lọc theo tỉnh/thành (từ Property) ======
                if (filter.ProvinceId.HasValue)
                    baseQuery = baseQuery.Where(rt => rt.Property.ProvinceId == filter.ProvinceId);

                // ====== Lọc theo tiện nghi (EXISTS pattern) ======
                if (filter.AmenityIds != null && filter.AmenityIds.Any())
                {
                    baseQuery = baseQuery.Where(rt =>
                        _context.RoomAmenities.Any(ra =>
                            ra.RoomTypeId == rt.Id && filter.AmenityIds.Contains(ra.AmenityId)));
                }

                // ====== Nếu có ngày thì kiểm tra còn phòng trống ======
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

                    baseQuery = baseQuery.Where(rt =>
                        rt.TotalRooms -
                        (bookedRoomsQuery
                            .Where(br => br.RoomTypeId == rt.Id)
                            .Select(br => (int?)br.BookedRooms)
                            .FirstOrDefault() ?? 0)
                        >= requestedRooms
                    );
                }

                // ====== Get total count trước pagination ======
                var totalCount = await baseQuery.CountAsync();
                if (totalCount == 0)
                {
                    return Ok(new ApiResponse<object>
                    {
                        Success = true,
                        Message = "Không tìm thấy phòng phù hợp",
                        StatusCode = 200,
                        Data = new
                        {
                            RoomTypes = new List<RoomTypeResponse>(),
                            TotalCount = 0,
                            Page = filter.Page,
                            PageSize = filter.PageSize,
                            TotalPages = 0
                        }
                    });
                }

                // ====== Lấy IDs với pagination ======
                var roomTypeIds = await baseQuery
                    .Skip((filter.Page - 1) * filter.PageSize)
                    .Take(filter.PageSize)
                    .Select(rt => rt.Id)
                    .ToListAsync();

                // ====== Query chi tiết cho các room đã chọn ======
                var detailedRoomTypes = await _context.RoomTypes
                    .Include(rt => rt.Property).ThenInclude(p => p.Province)
                    .Include(rt => rt.Property).ThenInclude(p => p.Commune)
                    .Include(rt => rt.Images.Where(img => img.IsPrimary))
                    .Include(rt => rt.RoomAmenities).ThenInclude(ra => ra.Amenity)
                    .Where(rt => roomTypeIds.Contains(rt.Id))
                    .ToListAsync();

                // ====== Batch query statistics (chỉ booking) ======
                var statisticsQuery = await (
                    from rt in _context.RoomTypes
                    where roomTypeIds.Contains(rt.Id)
                    select new
                    {
                        RoomTypeId = rt.Id,
                        BookingCount = _context.Bookings.Count(b => b.RoomTypeId == rt.Id)
                    }).ToListAsync();

                // ====== Sort theo business logic ======
                var sortedStatistics = statisticsQuery
                    .Join(detailedRoomTypes, s => s.RoomTypeId, rt => rt.Id, (s, rt) => new { Stats = s, RoomType = rt })
                    .OrderByDescending(x => x.Stats.BookingCount)
                    .ThenBy(x => x.RoomType.BasePrice) // Giá thấp trước
                    .ThenByDescending(x => x.RoomType.CreatedAt) // Mới nhất
                    .ToList();

                // ====== Build response ======
                var roomTypeResponses = sortedStatistics.Select(x => new RoomTypeResponse
                {
                    Id = x.RoomType.Id,
                    PropertyId = x.RoomType.PropertyId,
                    PropertyName = x.RoomType.Property.Name,
                    PropertySlug = x.RoomType.Property.Slug,
                    Province = x.RoomType.Property.Province.Name,
                    Commune = x.RoomType.Property.Commune?.Name,
                    Name = x.RoomType.Name,
                    Slug = x.RoomType.Slug,
                    Description = x.RoomType.Description,
                    ShortDescription = x.RoomType.ShortDescription,
                    MaxAdults = x.RoomType.MaxAdults,
                    MaxChildren = x.RoomType.MaxChildren,
                    MaxGuests = x.RoomType.MaxGuests,
                    BedType = x.RoomType.BedType,
                    RoomSize = x.RoomType.RoomSize,
                    BasePrice = x.RoomType.BasePrice,
                    WeekendPrice = x.RoomType.WeekendPrice,
                    HolidayPrice = x.RoomType.HolidayPrice,
                    TotalRooms = x.RoomType.TotalRooms,
                    IsActive = x.RoomType.IsActive,
                    CreatedAt = x.RoomType.CreatedAt,
                    Images = x.RoomType.Images.Select(img => img.ImageUrl).ToList(),
                    Amenities = x.RoomType.RoomAmenities.Select(ra => ra.Amenity.Name).ToList(),
                    AmenityCount = x.RoomType.RoomAmenities.Count(),
                    TotalBookings = x.Stats.BookingCount
                }).ToList();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Lấy danh sách phòng thành công",
                    StatusCode = 200,
                    Data = new
                    {
                        RoomTypes = roomTypeResponses,
                        TotalCount = totalCount,
                        Page = filter.Page,
                        PageSize = filter.PageSize,
                        TotalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize)
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting room types");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // READ - Get Room Type by Slug
        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(slug))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Slug không được để trống",
                        StatusCode = 400
                    });
                }

                var roomType = await _context.RoomTypes
                    .Include(rt => rt.Property)
                    .Include(rt => rt.Images)
                    .Include(rt => rt.RoomAmenities).ThenInclude(ra => ra.Amenity)
                    .FirstOrDefaultAsync(rt => rt.Slug == slug);

                if (roomType == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Loại phòng không tồn tại",
                        StatusCode = 404
                    });
                }

                var response = new RoomTypeDetailResponse
                {
                    Id = roomType.Id,
                    PropertyId = roomType.PropertyId,
                    PropertyName = roomType.Property.Name,
                    Name = roomType.Name,
                    Slug = roomType.Slug,
                    Description = roomType.Description,
                    ShortDescription = roomType.ShortDescription,
                    MaxAdults = roomType.MaxAdults,
                    MaxChildren = roomType.MaxChildren,
                    MaxGuests = roomType.MaxGuests,
                    BedType = roomType.BedType,
                    RoomSize = roomType.RoomSize,
                    BasePrice = roomType.BasePrice,
                    WeekendPrice = roomType.WeekendPrice,
                    HolidayPrice = roomType.HolidayPrice,
                    WeeklyDiscountPercent = roomType.WeeklyDiscountPercent,
                    MonthlyDiscountPercent = roomType.MonthlyDiscountPercent,
                    TotalRooms = roomType.TotalRooms,
                    MetaTitle = roomType.MetaTitle,
                    MetaDescription = roomType.MetaDescription,
                    IsActive = roomType.IsActive,
                    CreatedAt = roomType.CreatedAt,
                    UpdatedAt = roomType.UpdatedAt,
                    Images = roomType.Images.Select(img => new RoomImageResponse
                    {
                        Id = img.Id,
                        ImageUrl = img.ImageUrl,
                        Title = img.Title,
                        Description = img.Description,
                        IsPrimary = img.IsPrimary,
                        SortOrder = img.SortOrder
                    }).ToList(),
                    Amenities = roomType.RoomAmenities.Select(ra => new RoomAmenityResponse
                    {
                        Id = ra.AmenityId,
                        Name = ra.Amenity.Name,
                        Quantity = ra.Quantity
                    }).ToList()
                };

                return Ok(new ApiResponse<RoomTypeDetailResponse>
                {
                    Success = true,
                    Message = "Lấy thông tin loại phòng thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting room type by slug: {Slug}", slug);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // UPDATE
        [HttpPut("{id}")]
        [Authorize(Roles = "host")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateRoomTypeRequest request)
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

                int hostId = int.Parse(userIdClaim.Value);

                var roomType = await _context.RoomTypes
                    .Include(rt => rt.Property)
                    .Include(rt => rt.Images)
                    .Include(rt => rt.RoomAmenities)
                        .ThenInclude(ra => ra.Amenity)
                    .FirstOrDefaultAsync(rt => rt.Id == id && rt.Property.HostId == hostId);

                if (roomType == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Loại phòng không tồn tại hoặc bạn không có quyền sửa",
                        StatusCode = 404
                    });
                }

                // Capture old values for audit log
                var oldValues = new
                {
                    roomType.Name,
                    roomType.Description,
                    roomType.ShortDescription,
                    roomType.MaxAdults,
                    roomType.MaxChildren,
                    roomType.MaxGuests,
                    roomType.BedType,
                    roomType.RoomSize,
                    roomType.BasePrice,
                    roomType.WeekendPrice,
                    roomType.HolidayPrice,
                    roomType.WeeklyDiscountPercent,
                    roomType.MonthlyDiscountPercent,
                    roomType.TotalRooms,
                    roomType.MetaTitle,
                    roomType.MetaDescription,
                    AmenitiesCount = roomType.RoomAmenities.Count
                };

                // Validate request
                var validationError = await ValidateUpdateRoomTypeRequest(request, id, roomType.PropertyId);
                if (validationError != null)
                {
                    return BadRequest(validationError);
                }

                // Generate unique slug
                string baseSlug = GenerateSlug(request.Name);
                string uniqueSlug = await EnsureUniqueSlugForUpdate(baseSlug, id);

                // Update basic properties
                roomType.Name = request.Name;
                roomType.Slug = uniqueSlug;
                roomType.Description = request.Description;
                roomType.ShortDescription = request.ShortDescription;
                roomType.MaxAdults = request.MaxAdults;
                roomType.MaxChildren = request.MaxChildren;
                roomType.MaxGuests = request.MaxGuests;
                roomType.BedType = request.BedType;
                roomType.RoomSize = request.RoomSize;
                roomType.BasePrice = request.BasePrice;
                roomType.WeekendPrice = request.WeekendPrice;
                roomType.HolidayPrice = request.HolidayPrice;
                roomType.WeeklyDiscountPercent = request.WeeklyDiscountPercent;
                roomType.MonthlyDiscountPercent = request.MonthlyDiscountPercent;
                roomType.TotalRooms = request.TotalRooms;
                roomType.MetaTitle = request.MetaTitle;
                roomType.MetaDescription = request.MetaDescription;
                roomType.UpdatedAt = DateTime.Now;

                // Update Amenities nếu có trong request
                if (request.Amenities != null)
                {
                    // Xóa tất cả amenities hiện tại
                    _context.RoomAmenities.RemoveRange(roomType.RoomAmenities);

                    // Thêm amenities mới
                    foreach (var amenityRequest in request.Amenities)
                    {
                        var roomAmenity = new RoomAmenity
                        {
                            RoomTypeId = roomType.Id,
                            AmenityId = amenityRequest.AmenityId,
                            Quantity = amenityRequest.Quantity
                        };

                        _context.RoomAmenities.Add(roomAmenity);
                    }
                }

                await _context.SaveChangesAsync();

                // Capture new values for audit log
                var newAmenities = request.Amenities?
                    .Select(a => new { a.AmenityId, a.Quantity })
                    .Cast<object>()
                    .ToList();
                var newValues = new
                {
                    roomType.Name,
                    roomType.Description,
                    roomType.ShortDescription,
                    roomType.MaxAdults,
                    roomType.MaxChildren,
                    roomType.MaxGuests,
                    roomType.BedType,
                    roomType.RoomSize,
                    roomType.BasePrice,
                    roomType.WeekendPrice,
                    roomType.HolidayPrice,
                    roomType.WeeklyDiscountPercent,
                    roomType.MonthlyDiscountPercent,
                    roomType.TotalRooms,
                    roomType.MetaTitle,
                    roomType.MetaDescription,
                    Amenities = newAmenities ?? new List<object>()
                };

                // Log the update action
                await _auditLogService.LogUpdateAsync(
                    "RoomType",
                    roomType.Id,
                    JsonSerializer.Serialize(oldValues, new JsonSerializerOptions { WriteIndented = false }),
                    JsonSerializer.Serialize(newValues, new JsonSerializerOptions { WriteIndented = false })
                );

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Cập nhật loại phòng thành công",
                    StatusCode = 200,
                    Data = new
                    {
                        roomType.Id,
                        roomType.Name,
                        roomType.Slug,
                        roomType.PropertyId,
                        AmenitiesCount = request.Amenities?.Count ?? 0
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating room type");

                // Log the failed update attempt
                try
                {
                    await _auditLogService.LogActionAsync("UPDATE_FAILED", "RoomType", id, null,
                        $"Failed to update room type: {ex.Message}");
                }
                catch (Exception auditEx)
                {
                    _logger.LogError(auditEx, "Failed to log audit entry for failed room type update");
                }

                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        private async Task<ApiResponse<object>> ValidateUpdateRoomTypeRequest(UpdateRoomTypeRequest request, int excludeId, int propertyId)
        {
            // Check duplicate name within the same property
            var duplicate = await _context.RoomTypes
                .AnyAsync(rt => rt.Id != excludeId && rt.PropertyId == propertyId && rt.Name == request.Name);

            if (duplicate)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Tên loại phòng đã tồn tại trong property này.",
                    StatusCode = 400
                };
            }

            // Validate guest capacity
            if (request.MaxAdults <= 0)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Số người lớn tối đa phải lớn hơn 0.",
                    StatusCode = 400
                };
            }

            if (request.MaxChildren < 0)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Số trẻ em tối đa không được âm.",
                    StatusCode = 400
                };
            }

            if (request.MaxGuests <= 0)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Tổng số khách tối đa phải lớn hơn 0.",
                    StatusCode = 400
                };
            }

            if (request.MaxGuests < request.MaxAdults)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Tổng số khách phải lớn hơn hoặc bằng số người lớn tối đa.",
                    StatusCode = 400
                };
            }

            // Validate pricing
            if (request.BasePrice <= 0)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Giá cơ bản phải lớn hơn 0.",
                    StatusCode = 400
                };
            }

            if (request.WeekendPrice.HasValue && request.WeekendPrice <= 0)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Giá cuối tuần phải lớn hơn 0.",
                    StatusCode = 400
                };
            }

            if (request.HolidayPrice.HasValue && request.HolidayPrice <= 0)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Giá ngày lễ phải lớn hơn 0.",
                    StatusCode = 400
                };
            }

            // Validate discount percentages
            if (request.WeeklyDiscountPercent < 0 || request.WeeklyDiscountPercent > 100)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Giảm giá hàng tuần phải từ 0% đến 100%.",
                    StatusCode = 400
                };
            }

            if (request.MonthlyDiscountPercent < 0 || request.MonthlyDiscountPercent > 100)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Giảm giá hàng tháng phải từ 0% đến 100%.",
                    StatusCode = 400
                };
            }

            // Validate room details
            if (request.TotalRooms <= 0)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Tổng số phòng phải lớn hơn 0.",
                    StatusCode = 400
                };
            }

            if (request.RoomSize.HasValue && request.RoomSize <= 0)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Diện tích phòng phải lớn hơn 0.",
                    StatusCode = 400
                };
            }

            // Validate Amenities if provided
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
                    return new ApiResponse<object>
                    {
                        Success = false,
                        Message = $"Các amenity không tồn tại: {string.Join(", ", invalidAmenityIds)}",
                        StatusCode = 400
                    };
                }

                var duplicateAmenities = amenityIds.GroupBy(x => x).Where(g => g.Count() > 1).Select(g => g.Key).ToList();
                if (duplicateAmenities.Any())
                {
                    return new ApiResponse<object>
                    {
                        Success = false,
                        Message = $"Amenity bị trùng lặp: {string.Join(", ", duplicateAmenities)}",
                        StatusCode = 400
                    };
                }

                foreach (var amenity in request.Amenities)
                {
                    if (amenity.Quantity <= 0)
                    {
                        return new ApiResponse<object>
                        {
                            Success = false,
                            Message = $"Số lượng amenity (ID: {amenity.AmenityId}) phải lớn hơn 0.",
                            StatusCode = 400
                        };
                    }
                }
            }

            return null; // No validation errors
        }
        // DELETE
        [HttpDelete("{id}")]
        [Authorize(Roles = "host")]
        public async Task<IActionResult> Delete(int id)
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

                int hostId = int.Parse(userIdClaim.Value);

                var roomType = await _context.RoomTypes
                    .Include(rt => rt.Property)
                    .Include(rt => rt.Images)
                    .FirstOrDefaultAsync(rt => rt.Id == id && rt.Property.HostId == hostId);

                if (roomType == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Loại phòng không tồn tại hoặc bạn không có quyền xóa",
                        StatusCode = 404
                    });
                }

                // Xóa ảnh từ wwwroot
                foreach (var image in roomType.Images)
                {
                    DeleteImageFile(image.ImageUrl);
                }

                _context.RoomTypes.Remove(roomType);
                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Xóa loại phòng thành công",
                    StatusCode = 200
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting room type");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // UPLOAD IMAGE
        [HttpPost("{id}/upload-images")]
        [Authorize(Roles = "host")]
        public async Task<IActionResult> UploadImages(int id, [FromForm] UploadRoomImageRequestAlternative request)
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

                int hostId = int.Parse(userIdClaim.Value);

                var roomType = await _context.RoomTypes
                    .Include(rt => rt.Property)
                    .FirstOrDefaultAsync(rt => rt.Id == id && rt.Property.HostId == hostId);

                if (roomType == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Loại phòng không tồn tại hoặc bạn không có quyền",
                        StatusCode = 404
                    });
                }

                if (request.Files == null || !request.Files.Any())
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không có file ảnh nào được chọn",
                        StatusCode = 400
                    });
                }

                // Validate maximum number of files
                if (request.Files.Count > 10)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Chỉ được upload tối đa 10 ảnh cùng lúc",
                        StatusCode = 400
                    });
                }

                // Validate that metadata arrays match file count
                var fileCount = request.Files.Count;
                if (request.Titles.Count != fileCount ||
                    request.Descriptions.Count != fileCount ||
                    request.IsPrimaries.Count != fileCount ||
                    request.SortOrders.Count != fileCount)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Số lượng thông tin metadata không khớp với số file",
                        StatusCode = 400
                    });
                }

                // Check if room type already has a primary image
                var existingPrimaryImage = await _context.RoomImages
                    .FirstOrDefaultAsync(ri => ri.RoomTypeId == id && ri.IsPrimary == true);

                var primaryCountInRequest = request.IsPrimaries.Count(p => p);

                // Validation logic for primary image
                if (existingPrimaryImage == null)
                {
                    if (primaryCountInRequest != 1)
                    {
                        return BadRequest(new ApiResponse<object>
                        {
                            Success = false,
                            Message = "Loại phòng chưa có ảnh chính. Bạn phải chọn đúng 1 ảnh làm ảnh chính.",
                            StatusCode = 400
                        });
                    }
                }
                else
                {
                    if (primaryCountInRequest > 1)
                    {
                        return BadRequest(new ApiResponse<object>
                        {
                            Success = false,
                            Message = "Loại phòng đã có ảnh chính. Chỉ được chọn tối đa 1 ảnh làm ảnh chính.",
                            StatusCode = 400
                        });
                    }

                    if (primaryCountInRequest == 1)
                    {
                        existingPrimaryImage.IsPrimary = false;
                        _context.RoomImages.Update(existingPrimaryImage);
                    }
                }

                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
                var uploadResults = new List<object>();
                var roomImages = new List<RoomImage>();

                // Create directory if not exists
                var uploadsFolder = Path.Combine(_webHostEnvironment.WebRootPath, "images", "rooms", id.ToString());
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Process each file with its corresponding metadata
                for (int i = 0; i < request.Files.Count; i++)
                {
                    var file = request.Files[i];
                    var title = request.Titles[i];
                    var description = request.Descriptions[i];
                    var isPrimary = request.IsPrimaries[i];
                    var sortOrder = request.SortOrders[i];

                    // Validate individual file
                    if (file == null || file.Length == 0)
                    {
                        uploadResults.Add(new
                        {
                            Index = i,
                            Success = false,
                            Message = "File rỗng",
                            FileName = file?.FileName,
                            Title = title
                        });
                        continue;
                    }

                    // Validate file type
                    if (!allowedTypes.Contains(file.ContentType.ToLower()))
                    {
                        uploadResults.Add(new
                        {
                            Index = i,
                            Success = false,
                            Message = "Chỉ chấp nhận file ảnh (JPEG, JPG, PNG, GIF)",
                            FileName = file.FileName,
                            Title = title
                        });
                        continue;
                    }

                    // Validate file size (5MB per file)
                    if (file.Length > 5 * 1024 * 1024)
                    {
                        uploadResults.Add(new
                        {
                            Index = i,
                            Success = false,
                            Message = "File ảnh không được vượt quá 5MB",
                            FileName = file.FileName,
                            Title = title
                        });
                        continue;
                    }

                    try
                    {
                        // Generate unique filename
                        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                        var filePath = Path.Combine(uploadsFolder, fileName);

                        // Save file
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        // Create URL
                        var imageUrl = $"/images/rooms/{id}/{fileName}";

                        // Create RoomImage object with individual metadata
                        var roomImage = new RoomImage
                        {
                            RoomTypeId = id,
                            ImageUrl = imageUrl,
                            Title = title,
                            Description = description,
                            IsPrimary = isPrimary,
                            SortOrder = sortOrder,
                            CreatedAt = DateTime.Now
                        };

                        roomImages.Add(roomImage);

                        uploadResults.Add(new
                        {
                            Index = i,
                            Success = true,
                            Message = "Upload thành công",
                            FileName = fileName,
                            ImageUrl = imageUrl,
                            OriginalFileName = file.FileName,
                            Title = title,
                            Description = description,
                            IsPrimary = isPrimary,
                            SortOrder = sortOrder
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
                            Title = title,
                            Error = fileEx.Message
                        });
                    }
                }

                // Save all successful uploads to database
                if (roomImages.Any())
                {
                    _context.RoomImages.AddRange(roomImages);
                    await _context.SaveChangesAsync();

                    // AUDIT LOG - Log successful image uploads
                    foreach (var roomImage in roomImages)
                    {
                        var imageData = System.Text.Json.JsonSerializer.Serialize(new
                        {
                            roomImage.Id,
                            roomImage.RoomTypeId,
                            roomImage.ImageUrl,
                            roomImage.Title,
                            roomImage.Description,
                            roomImage.IsPrimary,
                            roomImage.SortOrder
                        });

                        await _auditLogService.LogInsertAsync("RoomImage", roomImage.Id, imageData);
                    }
                }


                var successCount = uploadResults.Count(r => (bool)((dynamic)r).Success);
                var failCount = uploadResults.Count - successCount;

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Hoàn thành upload: {successCount} thành công, {failCount} thất bại",
                    StatusCode = 200,
                    Data = new
                    {
                        TotalFiles = request.Files.Count,
                        SuccessCount = successCount,
                        FailCount = failCount,
                        Results = uploadResults,
                        RoomImages = roomImages.Select(ri => new
                        {
                            Id = ri.Id,
                            ImageUrl = ri.ImageUrl,
                            Title = ri.Title,
                            Description = ri.Description,
                            IsPrimary = ri.IsPrimary,
                            SortOrder = ri.SortOrder
                        }).ToList(),
                        HasExistingPrimary = existingPrimaryImage != null,
                        PrimaryImageUpdated = existingPrimaryImage != null && primaryCountInRequest == 1
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading room images");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // DELETE IMAGE
        [HttpDelete("image/{imageId}")]
        [Authorize(Roles = "host")]
        public async Task<IActionResult> DeleteImage(int imageId)
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

                int hostId = int.Parse(userIdClaim.Value);

                var image = await _context.RoomImages
                    .Include(img => img.RoomType).ThenInclude(rt => rt.Property)
                    .FirstOrDefaultAsync(img => img.Id == imageId && img.RoomType.Property.HostId == hostId);

                if (image == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Ảnh không tồn tại hoặc bạn không có quyền xóa",
                        StatusCode = 404
                    });
                }

                // Get all images for this room type
                var allRoomImages = await _context.RoomImages
                    .Where(ri => ri.RoomTypeId == image.RoomTypeId)
                    .ToListAsync();

                var totalImageCount = allRoomImages.Count;
                var primaryImagesCount = allRoomImages.Count(ri => ri.IsPrimary);
                var isImageToBePrimary = image.IsPrimary;

                // Validation rules
                if (totalImageCount <= 1)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không thể xóa ảnh cuối cùng. Loại phòng phải có ít nhất 1 ảnh.",
                        StatusCode = 400
                    });
                }

                if (isImageToBePrimary && primaryImagesCount == 1)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không thể xóa ảnh chính duy nhất. Vui lòng chọn ảnh khác làm ảnh chính trước khi xóa.",
                        StatusCode = 400
                    });
                }

                if (isImageToBePrimary && totalImageCount > 1)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không thể xóa ảnh chính. Hãy đặt một ảnh khác làm ảnh chính trước khi xóa ảnh này.",
                        StatusCode = 400
                    });
                }
                var imageDataToDelete = System.Text.Json.JsonSerializer.Serialize(new
                {
                    image.Id,
                    image.RoomTypeId,
                    image.ImageUrl,
                    image.Title,
                    image.Description,
                    image.IsPrimary,
                    image.SortOrder,
                    image.CreatedAt
                });

                // Delete file from wwwroot
                DeleteImageFile(image.ImageUrl);

                // Delete from database
                _context.RoomImages.Remove(image);
                await _context.SaveChangesAsync();

                await _auditLogService.LogDeleteAsync("RoomImage", imageId, imageDataToDelete);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Xóa ảnh thành công",
                    StatusCode = 200,
                    Data = new
                    {
                        DeletedImageId = imageId,
                        RemainingImagesCount = totalImageCount - 1,
                        WasPrimaryImage = isImageToBePrimary,
                        RoomTypeId = image.RoomTypeId
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting room image");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // SET PRIMARY IMAGE
        [HttpPut("image/{imageId}/set-primary")]
        [Authorize(Roles = "host")]
        public async Task<IActionResult> SetPrimaryImage(int imageId)
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

                int hostId = int.Parse(userIdClaim.Value);

                var image = await _context.RoomImages
                    .Include(img => img.RoomType).ThenInclude(rt => rt.Property)
                    .FirstOrDefaultAsync(img => img.Id == imageId && img.RoomType.Property.HostId == hostId);

                if (image == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Ảnh không tồn tại hoặc bạn không có quyền",
                        StatusCode = 404
                    });
                }

                if (image.IsPrimary)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Ảnh này đã là ảnh chính",
                        StatusCode = 400
                    });
                }

                // Find current primary image and set to false
                var currentPrimaryImage = await _context.RoomImages
                    .FirstOrDefaultAsync(ri => ri.RoomTypeId == image.RoomTypeId && ri.IsPrimary == true);

                // AUDIT LOG - Log primary image changes
                if (currentPrimaryImage != null)
                {
                    var oldPrimaryData = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        currentPrimaryImage.Id,
                        currentPrimaryImage.ImageUrl,
                        currentPrimaryImage.Title,
                        IsPrimary = true
                    });

                    currentPrimaryImage.IsPrimary = false;
                    _context.RoomImages.Update(currentPrimaryImage);

                    await _auditLogService.LogUpdateAsync("RoomImage", currentPrimaryImage.Id,
                        oldPrimaryData,
                        System.Text.Json.JsonSerializer.Serialize(new
                        {
                            currentPrimaryImage.Id,
                            currentPrimaryImage.ImageUrl,
                            currentPrimaryImage.Title,
                            IsPrimary = false
                        }));
                }

                // Set new primary image
                var oldImageData = System.Text.Json.JsonSerializer.Serialize(new
                {
                    image.Id,
                    image.ImageUrl,
                    image.Title,
                    IsPrimary = false
                });

                image.IsPrimary = true;
                _context.RoomImages.Update(image);

                await _context.SaveChangesAsync();

                // Log new primary image
                var newImageData = System.Text.Json.JsonSerializer.Serialize(new
                {
                    image.Id,
                    image.ImageUrl,
                    image.Title,
                    IsPrimary = true
                });

                await _auditLogService.LogUpdateAsync("RoomImage", imageId, oldImageData, newImageData);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Đã đặt làm ảnh chính thành công",
                    StatusCode = 200,
                    Data = new
                    {
                        NewPrimaryImageId = imageId,
                        PreviousPrimaryImageId = currentPrimaryImage?.Id,
                        RoomTypeId = image.RoomTypeId
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting primary room image");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // Helper method to delete image file
        private void DeleteImageFile(string imageUrl)
        {
            try
            {
                if (!string.IsNullOrEmpty(imageUrl))
                {
                    var filePath = Path.Combine(_webHostEnvironment.WebRootPath, imageUrl.TrimStart('/'));
                    if (System.IO.File.Exists(filePath))
                    {
                        System.IO.File.Delete(filePath);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"Could not delete room image file: {imageUrl}");
            }
        }
    }
}