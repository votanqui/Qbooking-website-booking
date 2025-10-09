using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QBooking.Data;
using QBooking.Dtos.Response;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin")]
    public class ImageStatisticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public ImageStatisticsController(ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // Tổng quan toàn bộ images
        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
            try
            {
                var propertyImageCount = await _context.PropertyImages.CountAsync();
                var roomImageCount = await _context.RoomImages.CountAsync();
                var reviewImageCount = await _context.ReviewImages.CountAsync();
                var userAvatarCount = await _context.Users.CountAsync(u => !string.IsNullOrEmpty(u.Avatar));

                var propertyImageSize = await _context.PropertyImages
                    .Where(i => i.FileSize.HasValue)
                    .SumAsync(i => (long?)i.FileSize) ?? 0;

                var totalSize = CalculateFolderSize();

                var data = new
                {
                    summary = new
                    {
                        totalImages = propertyImageCount + roomImageCount + reviewImageCount + userAvatarCount,
                        propertyImages = propertyImageCount,
                        roomImages = roomImageCount,
                        reviewImages = reviewImageCount,
                        userAvatars = userAvatarCount
                    },
                    storage = new
                    {
                        totalSizeBytes = totalSize,
                        totalSizeMB = Math.Round(totalSize / 1024.0 / 1024.0, 2),
                        propertyImagesSizeMB = Math.Round(propertyImageSize / 1024.0 / 1024.0, 2),
                        avatarsFolderSizeMB = GetFolderSizeMB("avatars"),
                        imagesFolderSizeMB = GetFolderSizeMB("images"),
                        reviewFolderSizeMB = GetFolderSizeMB("review")
                    }
                };

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Lấy thông tin tổng quan hình ảnh thành công",
                    StatusCode = 200,
                    Data = data
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi lấy thông tin tổng quan",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // Thống kê Property Images
        [HttpGet("property")]
        public async Task<IActionResult> GetPropertyImageStats()
        {
            try
            {
                var stats = await _context.PropertyImages
                    .Include(i => i.Property)
                    .GroupBy(i => i.PropertyId)
                    .Select(g => new
                    {
                        propertyId = g.Key,
                        propertyName = g.First().Property.Name,
                        imageCount = g.Count(),
                        totalSize = g.Sum(i => i.FileSize ?? 0),
                        hasPrimary = g.Any(i => i.IsPrimary),
                        imageTypes = g.GroupBy(i => i.ImageType)
                            .Select(t => new { type = t.Key, count = t.Count() })
                            .ToList()
                    })
                    .OrderByDescending(s => s.imageCount)
                    .ToListAsync();

                var propertyIds = await _context.PropertyImages.Select(p => p.PropertyId).Distinct().ToListAsync();
                var propertiesWithoutImages = await _context.Properties
                    .Where(p => !propertyIds.Contains(p.Id))
                    .Select(p => new { p.Id, p.Name })
                    .ToListAsync();

                var data = new
                {
                    statistics = stats,
                    propertiesWithoutImages = propertiesWithoutImages,
                    totalProperties = await _context.Properties.CountAsync(),
                    propertiesWithImages = stats.Count,
                    averageImagesPerProperty = stats.Any() ? Math.Round(stats.Average(s => s.imageCount), 2) : 0
                };

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Lấy thống kê hình ảnh khách sạn thành công",
                    StatusCode = 200,
                    Data = data
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi lấy thống kê hình ảnh khách sạn",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // Thống kê Room Images
        [HttpGet("room")]
        public async Task<IActionResult> GetRoomImageStats()
        {
            try
            {
                var stats = await _context.RoomImages
                    .Include(i => i.RoomType)
                        .ThenInclude(r => r.Property)
                    .GroupBy(i => i.RoomTypeId)
                    .Select(g => new
                    {
                        roomTypeId = g.Key,
                        roomTypeName = g.First().RoomType.Name,
                        propertyName = g.First().RoomType.Property.Name,
                        imageCount = g.Count(),
                        hasPrimary = g.Any(i => i.IsPrimary)
                    })
                    .OrderByDescending(s => s.imageCount)
                    .ToListAsync();

                var roomTypeIds = await _context.RoomImages.Select(r => r.RoomTypeId).Distinct().ToListAsync();
                var roomTypesWithoutImages = await _context.RoomTypes
                    .Include(r => r.Property)
                    .Where(r => !roomTypeIds.Contains(r.Id))
                    .Select(r => new { r.Id, r.Name, PropertyName = r.Property.Name })
                    .ToListAsync();

                var data = new
                {
                    statistics = stats,
                    roomTypesWithoutImages = roomTypesWithoutImages,
                    totalRoomTypes = await _context.RoomTypes.CountAsync(),
                    roomTypesWithImages = stats.Count,
                    averageImagesPerRoomType = stats.Any() ? Math.Round(stats.Average(s => s.imageCount), 2) : 0
                };

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Lấy thống kê hình ảnh phòng thành công",
                    StatusCode = 200,
                    Data = data
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi lấy thống kê hình ảnh phòng",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // Thống kê Review Images
        [HttpGet("review")]
        public async Task<IActionResult> GetReviewImageStats()
        {
            try
            {
                var stats = await _context.ReviewImages
                    .Include(i => i.Review)
                    .GroupBy(i => i.ReviewId)
                    .Select(g => new
                    {
                        reviewId = g.Key,
                        imageCount = g.Count(),
                        createdAt = g.First().Review.CreatedAt
                    })
                    .OrderByDescending(s => s.imageCount)
                    .Take(50)
                    .ToListAsync();

                // Lấy thêm thông tin user và property cho mỗi review
                var reviewIds = stats.Select(s => s.reviewId).ToList();
                var reviewDetails = await _context.Reviews
                    .Where(r => reviewIds.Contains(r.Id))
                    .Select(r => new
                    {
                        r.Id,
                        r.BookingId,
                        r.CustomerId,
                    })
                    .ToListAsync();

                var userIds = reviewDetails.Select(r => r.CustomerId).Distinct().ToList();
                var users = await _context.Users
                    .Where(u => userIds.Contains(u.Id))
                    .Select(u => new { u.Id, u.FullName })
                    .ToDictionaryAsync(u => u.Id, u => u.FullName);

                var bookingIds = reviewDetails.Select(r => r.BookingId).Distinct().ToList();
                var bookings = await _context.Bookings
                    .Where(b => bookingIds.Contains(b.Id))
                    .Include(b => b.Property)
                    .Select(b => new { b.Id, PropertyName = b.Property.Name })
                    .ToDictionaryAsync(b => b.Id, b => b.PropertyName);

                var enrichedStats = stats.Select(s =>
                {
                    var review = reviewDetails.FirstOrDefault(r => r.Id == s.reviewId);
                    return new
                    {
                        s.reviewId,
                        userName = review != null && users.ContainsKey(review.CustomerId) ? users[review.CustomerId] : "N/A",
                        propertyName = review != null && bookings.ContainsKey(review.BookingId) ? bookings[review.BookingId] : "N/A",
                        s.imageCount,
                        s.createdAt
                    };
                }).ToList();

                var totalReviews = await _context.Reviews.CountAsync();
                var reviewIdsWithImages = await _context.ReviewImages.Select(r => r.ReviewId).Distinct().ToListAsync();
                var reviewsWithImages = reviewIdsWithImages.Count;

                var imagesByMonth = await _context.ReviewImages
                    .Where(i => i.CreatedAt.HasValue && i.CreatedAt.Value.Year >= DateTime.UtcNow.Year)
                    .GroupBy(i => new { i.CreatedAt.Value.Year, i.CreatedAt.Value.Month })
                    .Select(g => new
                    {
                        year = g.Key.Year,
                        month = g.Key.Month,
                        count = g.Count()
                    })
                    .OrderBy(g => g.year).ThenBy(g => g.month)
                    .ToListAsync();

                var data = new
                {
                    statistics = enrichedStats,
                    summary = new
                    {
                        totalReviews,
                        reviewsWithImages,
                        reviewsWithoutImages = totalReviews - reviewsWithImages,
                        percentageWithImages = totalReviews > 0 ? Math.Round((double)reviewsWithImages / totalReviews * 100, 2) : 0
                    },
                    imagesByMonth
                };

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Lấy thống kê hình ảnh đánh giá thành công",
                    StatusCode = 200,
                    Data = data
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi lấy thống kê hình ảnh đánh giá",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // Thống kê User Avatars
        [HttpGet("avatar")]
        public async Task<IActionResult> GetAvatarStats()
        {
            try
            {
                var totalUsers = await _context.Users.CountAsync();
                var usersWithAvatar = await _context.Users.CountAsync(u => !string.IsNullOrEmpty(u.Avatar));
                var usersWithoutAvatar = totalUsers - usersWithAvatar;

                var recentUploads = await _context.Users
                    .Where(u => !string.IsNullOrEmpty(u.Avatar))
                    .OrderByDescending(u => u.UpdatedAt)
                    .Take(20)
                    .Select(u => new
                    {
                        u.Id,
                        u.FullName,
                        u.Email,
                        u.Avatar,
                        uploadedAt = u.UpdatedAt
                    })
                    .ToListAsync();

                var usersByRole = await _context.Users
                    .Where(u => !string.IsNullOrEmpty(u.Avatar))
                    .GroupBy(u => u.Role)
                    .Select(g => new
                    {
                        role = g.Key,
                        count = g.Count()
                    })
                    .ToListAsync();

                var data = new
                {
                    summary = new
                    {
                        totalUsers,
                        usersWithAvatar,
                        usersWithoutAvatar,
                        percentageWithAvatar = totalUsers > 0 ? Math.Round((double)usersWithAvatar / totalUsers * 100, 2) : 0
                    },
                    usersByRole,
                    recentUploads
                };

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Lấy thống kê ảnh đại diện người dùng thành công",
                    StatusCode = 200,
                    Data = data
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi lấy thống kê ảnh đại diện",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // Danh sách images không tồn tại (orphaned)
        [HttpGet("orphaned")]
        public async Task<IActionResult> GetOrphanedImages()
        {
            try
            {
                var orphanedImages = new List<object>();

                // Check property images
                var propertyImages = await _context.PropertyImages.ToListAsync();
                foreach (var img in propertyImages)
                {
                    if (!FileExists(img.ImageUrl))
                    {
                        orphanedImages.Add(new
                        {
                            type = "PropertyImage",
                            id = img.Id,
                            url = img.ImageUrl,
                            propertyId = img.PropertyId
                        });
                    }
                }

                // Check room images
                var roomImages = await _context.RoomImages.ToListAsync();
                foreach (var img in roomImages)
                {
                    if (!FileExists(img.ImageUrl))
                    {
                        orphanedImages.Add(new
                        {
                            type = "RoomImage",
                            id = img.Id,
                            url = img.ImageUrl,
                            roomTypeId = img.RoomTypeId
                        });
                    }
                }

                // Check review images
                var reviewImages = await _context.ReviewImages.ToListAsync();
                foreach (var img in reviewImages)
                {
                    if (!FileExists(img.ImageUrl))
                    {
                        orphanedImages.Add(new
                        {
                            type = "ReviewImage",
                            id = img.Id,
                            url = img.ImageUrl,
                            reviewId = img.ReviewId
                        });
                    }
                }

                // Check avatars
                var users = await _context.Users.Where(u => !string.IsNullOrEmpty(u.Avatar)).ToListAsync();
                foreach (var user in users)
                {
                    if (!FileExists(user.Avatar))
                    {
                        orphanedImages.Add(new
                        {
                            type = "Avatar",
                            id = user.Id,
                            url = user.Avatar,
                            userName = user.FullName
                        });
                    }
                }

                var data = new
                {
                    count = orphanedImages.Count,
                    orphanedImages
                };

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = orphanedImages.Count > 0
                        ? $"Tìm thấy {orphanedImages.Count} hình ảnh không tồn tại"
                        : "Không có hình ảnh nào bị mất",
                    StatusCode = 200,
                    Data = data
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi kiểm tra hình ảnh bị mất",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // Top images lớn nhất
        [HttpGet("largest")]
        public async Task<IActionResult> GetLargestImages([FromQuery] int limit = 20)
        {
            try
            {
                if (limit <= 0 || limit > 100)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Giới hạn phải từ 1 đến 100",
                        StatusCode = 400
                    });
                }

                var largestImages = await _context.PropertyImages
                    .Include(i => i.Property)
                    .Where(i => i.FileSize.HasValue)
                    .OrderByDescending(i => i.FileSize)
                    .Take(limit)
                    .Select(i => new
                    {
                        type = "PropertyImage",
                        i.Id,
                        i.ImageUrl,
                        propertyName = i.Property.Name,
                        fileSizeBytes = i.FileSize,
                        fileSizeMB = Math.Round((i.FileSize ?? 0) / 1024.0 / 1024.0, 2),
                        i.Width,
                        i.Height
                    })
                    .ToListAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Lấy danh sách {largestImages.Count} hình ảnh lớn nhất thành công",
                    StatusCode = 200,
                    Data = largestImages
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi lấy danh sách hình ảnh lớn nhất",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        #region Helper Methods

        private long CalculateFolderSize()
        {
            long totalSize = 0;
            var folders = new[] { "avatars", "images", "review", "settings" };

            foreach (var folder in folders)
            {
                var path = Path.Combine(_environment.WebRootPath, folder);
                if (Directory.Exists(path))
                {
                    var files = Directory.GetFiles(path, "*.*", SearchOption.AllDirectories);
                    totalSize += files.Sum(f => new FileInfo(f).Length);
                }
            }

            return totalSize;
        }

        private double GetFolderSizeMB(string folder)
        {
            var path = Path.Combine(_environment.WebRootPath, folder);
            if (!Directory.Exists(path))
                return 0;

            var files = Directory.GetFiles(path, "*.*", SearchOption.AllDirectories);
            var totalBytes = files.Sum(f => new FileInfo(f).Length);
            return Math.Round(totalBytes / 1024.0 / 1024.0, 2);
        }

        private bool FileExists(string imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl))
                return false;

            var fileName = imageUrl.TrimStart('/');
            var filePath = Path.Combine(_environment.WebRootPath, fileName);
            return System.IO.File.Exists(filePath);
        }

        #endregion
    }
}