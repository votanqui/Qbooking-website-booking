using Microsoft.EntityFrameworkCore;
using QBooking.Models;
using QBooking.DTOs.Requests;
using QBooking.DTOs.Responses;
using QBooking.Data;
using QBooking.Dtos.Response;
using Microsoft.AspNetCore.Hosting;
using QBooking.Services.Interfaces;
using System.Linq;

namespace QBooking.Services.Interfaces
{
    public interface IReviewService
    {
        // Customer APIs
        Task<ApiResponse<ReviewResponse>> CreateReviewAsync(int customerId, CreateReviewRequest request);
        Task<ApiResponse<ReviewListResponse>> GetMyReviewsAsync(int customerId, ReviewFilterRequest request);
        Task<ApiResponse<ReviewResponse>> GetMyReviewByIdAsync(int reviewId, int customerId);
        Task<ApiResponse<ReviewResponse>> UpdateReviewAsync(int reviewId, int customerId, UpdateReviewRequest request);
        Task<ApiResponse<bool>> DeleteReviewAsync(int reviewId, int customerId);

        // Host APIs
        Task<ApiResponse<ReviewResponse>> AddHostReplyAsync(int reviewId, int hostId, HostReplyRequest request);
        Task<ApiResponse<ReviewResponse>> UpdateHostReplyAsync(int reviewId, int hostId, HostReplyRequest request);
        Task<ApiResponse<bool>> DeleteHostReplyAsync(int reviewId, int hostId);
        Task<ApiResponse<List<HostPropertyReviewsResponse>>> GetHostPropertiesWithRepliesAsync(int hostId);

        // Public APIs
        Task<ApiResponse<ReviewListResponse>> GetPropertyReviewsAsync(int propertyId, ReviewFilterRequest request);

        // admin apis
        // Admin APIs
        Task<ApiResponse<ReviewListResponse>> GetAllReviewsAsync(AdminReviewFilterRequest request);
        Task<ApiResponse<ReviewResponse>> GetReviewByIdAsync(int reviewId);
        Task<ApiResponse<ReviewResponse>> UpdateReviewStatusAsync(int reviewId, string status);
        Task<ApiResponse<ReviewResponse>> ToggleFeaturedStatusAsync(int reviewId);
        Task<ApiResponse<bool>> DeleteReviewByAdminAsync(int reviewId);
        Task<ApiResponse<bool>> DeleteHostReplyByAdminAsync(int reviewId);

        // Statistics APIs
        Task<ApiResponse<ReviewStatisticsResponse>> GetReviewStatisticsAsync(StatisticsFilterRequest request);
        Task<ApiResponse<List<ReviewTrendResponse>>> GetReviewTrendsAsync(TrendsFilterRequest request);
        Task<ApiResponse<List<TopPropertyResponse>>> GetTopRatedPropertiesAsync(TopPropertiesFilterRequest request);
        Task<ApiResponse<RatingDistributionResponse>> GetRatingDistributionAsync(StatisticsFilterRequest request);
        Task<ApiResponse<HostResponseStatisticsResponse>> GetHostResponseStatisticsAsync(StatisticsFilterRequest request);



    }
}

namespace QBooking.Services
{
    public class ReviewService : IReviewService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ReviewService> _logger;
        private readonly IWebHostEnvironment _environment;

        public ReviewService(
            ApplicationDbContext context,
            ILogger<ReviewService> logger,
            IWebHostEnvironment environment)
        {
            _context = context;
            _logger = logger;
            _environment = environment;
        }

        // CUSTOMER APIs

        public async Task<ApiResponse<ReviewResponse>> CreateReviewAsync(int customerId, CreateReviewRequest request)
        {
            try
            {
                // Validate booking
                var booking = await _context.Bookings
                    .Include(b => b.Property)
                    .FirstOrDefaultAsync(b => b.Id == request.BookingId && b.CustomerId == customerId);

                if (booking == null)
                {
                    return new ApiResponse<ReviewResponse>
                    {
                        Success = false,
                        Message = "Không tìm thấy đặt chỗ hoặc không được phép"
                    };
                }

                if (booking.Status != "completed")
                {
                    return new ApiResponse<ReviewResponse>
                    {
                        Success = false,
                        Message = "Chỉ có thể xem lại các đặt chỗ đã hoàn tất"
                    };
                }

                // Check duplicate review
                var exists = await _context.Reviews
                    .AnyAsync(r => r.BookingId == request.BookingId);

                if (exists)
                {
                    return new ApiResponse<ReviewResponse>
                    {
                        Success = false,
                        Message = "Đã có đánh giá cho đặt phòng này"
                    };
                }

                var review = new Review
                {
                    BookingId = request.BookingId,
                    CustomerId = customerId,
                    PropertyId = request.PropertyId,
                    OverallRating = request.OverallRating,
                    CleanlinessRating = request.CleanlinessRating,
                    LocationRating = request.LocationRating,
                    ServiceRating = request.ServiceRating,
                    ValueRating = request.ValueRating,
                    AmenitiesRating = request.AmenitiesRating,
                    Title = request.Title,
                    ReviewText = request.ReviewText,
                    Pros = request.Pros,
                    Cons = request.Cons,
                    TravelType = request.TravelType,
                    RoomStayed = request.RoomStayed,
                    IsAnonymous = request.IsAnonymous ?? false,
                    IsVerified = true,
                    Status = "published",
                    HelpfulCount = 0,
                    IsFeatured = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Reviews.Add(review);
                await _context.SaveChangesAsync();

                // Upload images if provided
                if (request.Images != null && request.Images.Count > 0)
                {
                    await SaveReviewImagesAsync(review.Id, request.Images);
                }

                var response = await GetReviewResponseAsync(review.Id);
                return new ApiResponse<ReviewResponse>
                {
                    Success = true,
                    Message = "Đánh giá đã được tạo thành công",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo đánh giá");
                return new ApiResponse<ReviewResponse>
                {
                    Success = false,
                    Message = "Lỗi khi tạo đánh giá"
                };
            }
        }

        public async Task<ApiResponse<ReviewListResponse>> GetMyReviewsAsync(int customerId, ReviewFilterRequest request)
        {
            try
            {
                var query = _context.Reviews
                    .Include(r => r.Customer)
                    .Include(r => r.Property)
                    .Include(r => r.ReviewImages)
                    .Where(r => r.CustomerId == customerId)
                    .AsQueryable();

                return await GetReviewsAsync(query, request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer reviews");
                return new ApiResponse<ReviewListResponse>
                {
                    Success = false,
                    Message = "Error retrieving reviews"
                };
            }
        }

        public async Task<ApiResponse<ReviewResponse>> GetMyReviewByIdAsync(int reviewId, int customerId)
        {
            try
            {
                var review = await _context.Reviews
                    .Include(r => r.Customer)
                    .Include(r => r.Property)
                    .Include(r => r.ReviewImages)
                    .FirstOrDefaultAsync(r => r.Id == reviewId && r.CustomerId == customerId);

                if (review == null)
                {
                    return new ApiResponse<ReviewResponse>
                    {
                        Success = false,
                        Message = "Review not found"
                    };
                }

                return new ApiResponse<ReviewResponse>
                {
                    Success = true,
                    Data = MapToReviewResponse(review)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting review");
                return new ApiResponse<ReviewResponse>
                {
                    Success = false,
                    Message = "Error retrieving review"
                };
            }
        }

        public async Task<ApiResponse<ReviewResponse>> UpdateReviewAsync(int reviewId, int customerId, UpdateReviewRequest request)
        {
            try
            {
                var review = await _context.Reviews
                    .Include(r => r.ReviewImages)
                    .FirstOrDefaultAsync(r => r.Id == reviewId && r.CustomerId == customerId);

                if (review == null)
                {
                    return new ApiResponse<ReviewResponse>
                    {
                        Success = false,
                        Message = "Review not found or unauthorized"
                    };
                }

                // Update fields
                if (request.OverallRating.HasValue)
                    review.OverallRating = request.OverallRating.Value;
                if (request.CleanlinessRating.HasValue)
                    review.CleanlinessRating = request.CleanlinessRating;
                if (request.LocationRating.HasValue)
                    review.LocationRating = request.LocationRating;
                if (request.ServiceRating.HasValue)
                    review.ServiceRating = request.ServiceRating;
                if (request.ValueRating.HasValue)
                    review.ValueRating = request.ValueRating;
                if (request.AmenitiesRating.HasValue)
                    review.AmenitiesRating = request.AmenitiesRating;
                if (request.Title != null)
                    review.Title = request.Title;
                if (request.ReviewText != null)
                    review.ReviewText = request.ReviewText;
                if (request.Pros != null)
                    review.Pros = request.Pros;
                if (request.Cons != null)
                    review.Cons = request.Cons;
                if (request.TravelType != null)
                    review.TravelType = request.TravelType;
                if (request.RoomStayed != null)
                    review.RoomStayed = request.RoomStayed;
                if (request.IsAnonymous.HasValue)
                    review.IsAnonymous = request.IsAnonymous;

                review.UpdatedAt = DateTime.UtcNow;

                // Handle image deletions
                if (request.DeleteImageIds != null && request.DeleteImageIds.Count > 0)
                {
                    await DeleteReviewImagesAsync(reviewId, request.DeleteImageIds);
                }

                // Handle new images
                if (request.NewImages != null && request.NewImages.Count > 0)
                {
                    var currentImageCount = review.ReviewImages.Count;
                    if (currentImageCount + request.NewImages.Count > 10)
                    {
                        return new ApiResponse<ReviewResponse>
                        {
                            Success = false,
                            Message = "Maximum 10 images allowed per review"
                        };
                    }
                    await SaveReviewImagesAsync(reviewId, request.NewImages);
                }

                await _context.SaveChangesAsync();

                var response = await GetReviewResponseAsync(reviewId);
                return new ApiResponse<ReviewResponse>
                {
                    Success = true,
                    Message = "Review updated successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating review");
                return new ApiResponse<ReviewResponse>
                {
                    Success = false,
                    Message = "Error updating review"
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteReviewAsync(int reviewId, int customerId)
        {
            try
            {
                var review = await _context.Reviews
                    .Include(r => r.ReviewImages)
                    .FirstOrDefaultAsync(r => r.Id == reviewId && r.CustomerId == customerId);

                if (review == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Review not found or unauthorized"
                    };
                }

                // Delete images from filesystem
                foreach (var image in review.ReviewImages)
                {
                    DeleteImageFile(image.ImageUrl);
                }

                _context.Reviews.Remove(review);
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Review deleted successfully",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting review");
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Error deleting review"
                };
            }
        }

        // HOST APIs

        public async Task<ApiResponse<ReviewResponse>> AddHostReplyAsync(int reviewId, int hostId, HostReplyRequest request)
        {
            try
            {
                var review = await _context.Reviews
                    .Include(r => r.Property)
                    .FirstOrDefaultAsync(r => r.Id == reviewId);

                if (review == null)
                {
                    return new ApiResponse<ReviewResponse>
                    {
                        Success = false,
                        Message = "Review not found"
                    };
                }

                if (review.Property.HostId != hostId)
                {
                    return new ApiResponse<ReviewResponse>
                    {
                        Success = false,
                        Message = "Unauthorized to reply to this review"
                    };
                }

                if (!string.IsNullOrEmpty(review.HostReply))
                {
                    return new ApiResponse<ReviewResponse>
                    {
                        Success = false,
                        Message = "Reply already exists. Use update endpoint to modify."
                    };
                }

                review.HostReply = request.HostReply;
                review.HostRepliedAt = DateTime.UtcNow;
                review.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var response = await GetReviewResponseAsync(reviewId);
                return new ApiResponse<ReviewResponse>
                {
                    Success = true,
                    Message = "Reply added successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding host reply");
                return new ApiResponse<ReviewResponse>
                {
                    Success = false,
                    Message = "Error adding reply"
                };
            }
        }

        public async Task<ApiResponse<ReviewResponse>> UpdateHostReplyAsync(int reviewId, int hostId, HostReplyRequest request)
        {
            try
            {
                var review = await _context.Reviews
                    .Include(r => r.Property)
                    .FirstOrDefaultAsync(r => r.Id == reviewId);

                if (review == null)
                {
                    return new ApiResponse<ReviewResponse>
                    {
                        Success = false,
                        Message = "Review not found"
                    };
                }

                if (review.Property.HostId != hostId)
                {
                    return new ApiResponse<ReviewResponse>
                    {
                        Success = false,
                        Message = "Unauthorized to update this reply"
                    };
                }

                if (string.IsNullOrEmpty(review.HostReply))
                {
                    return new ApiResponse<ReviewResponse>
                    {
                        Success = false,
                        Message = "No reply exists to update"
                    };
                }

                review.HostReply = request.HostReply;
                review.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var response = await GetReviewResponseAsync(reviewId);
                return new ApiResponse<ReviewResponse>
                {
                    Success = true,
                    Message = "Reply updated successfully",
                    Data = response
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating host reply");
                return new ApiResponse<ReviewResponse>
                {
                    Success = false,
                    Message = "Error updating reply"
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteHostReplyAsync(int reviewId, int hostId)
        {
            try
            {
                var review = await _context.Reviews
                    .Include(r => r.Property)
                    .FirstOrDefaultAsync(r => r.Id == reviewId);

                if (review == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Review not found"
                    };
                }

                if (review.Property.HostId != hostId)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Unauthorized to delete this reply"
                    };
                }

                review.HostReply = null;
                review.HostRepliedAt = null;
                review.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Reply deleted successfully",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting host reply");
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Error deleting reply"
                };
            }
        }

        public async Task<ApiResponse<List<HostPropertyReviewsResponse>>> GetHostPropertiesWithRepliesAsync(int hostId)
        {
            try
            {
                var properties = await _context.Properties
                    .Where(p => p.HostId == hostId)
                    .Select(p => new HostPropertyReviewsResponse
                    {
                        PropertyId = p.Id,
                        PropertyName = p.Name,
                        TotalReviews = p.Reviews.Count,
                        ReviewsWithReply = p.Reviews.Count(r => r.HostReply != null),
                        PendingReviews = p.Reviews.Count(r => r.HostReply == null),
                        AverageRating = p.Reviews.Any() ? Math.Round(p.Reviews.Average(r => r.OverallRating), 2) : 0
                    })
                    .ToListAsync();

                return new ApiResponse<List<HostPropertyReviewsResponse>>
                {
                    Success = true,
                    Data = properties
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting host properties");
                return new ApiResponse<List<HostPropertyReviewsResponse>>
                {
                    Success = false,
                    Message = "Error retrieving data"
                };
            }
        }

        // PUBLIC APIs

        public async Task<ApiResponse<ReviewListResponse>> GetPropertyReviewsAsync(int propertyId, ReviewFilterRequest request)
        {
            try
            {
                var query = _context.Reviews
                    .Include(r => r.Customer)
                    .Include(r => r.Property)
                    .Include(r => r.ReviewImages)
                    .Where(r => r.PropertyId == propertyId && r.Status == "published")
                    .AsQueryable();

                // 🟢 Ưu tiên review nổi bật (IsFeatured = true) trước
                query = query
                    .OrderByDescending(r => r.IsFeatured)   // featured lên đầu
                    .ThenByDescending(r => r.CreatedAt);    // sau đó theo ngày mới nhất

                return await GetReviewsAsync(query, request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting property reviews");
                return new ApiResponse<ReviewListResponse>
                {
                    Success = false,
                    Message = "Error retrieving reviews"
                };
            }
        }


        // HELPER METHODS

        private async Task<ApiResponse<ReviewListResponse>> GetReviewsAsync(IQueryable<Review> query, ReviewFilterRequest request)
        {
            // Apply filters
            if (request.PropertyId.HasValue)
                query = query.Where(r => r.PropertyId == request.PropertyId.Value);

            if (request.MinRating.HasValue)
                query = query.Where(r => r.OverallRating >= request.MinRating.Value);

            if (request.MaxRating.HasValue)
                query = query.Where(r => r.OverallRating <= request.MaxRating.Value);

            if (!string.IsNullOrEmpty(request.Status))
                query = query.Where(r => r.Status == request.Status);

            if (request.HasHostReply.HasValue)
            {
                if (request.HasHostReply.Value)
                    query = query.Where(r => r.HostReply != null);
                else
                    query = query.Where(r => r.HostReply == null);
            }

            // Apply sorting
            query = request.SortBy?.ToLower() switch
            {
                "rating" => request.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(r => r.OverallRating)
                    : query.OrderByDescending(r => r.OverallRating),
                _ => request.SortOrder?.ToLower() == "asc"
                    ? query.OrderBy(r => r.CreatedAt)
                    : query.OrderByDescending(r => r.CreatedAt)
            };

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

            var reviews = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var reviewResponses = reviews.Select(MapToReviewResponse).ToList();

            return new ApiResponse<ReviewListResponse>
            {
                Success = true,
                Data = new ReviewListResponse
                {
                    Reviews = reviewResponses,
                    TotalCount = totalCount,
                    Page = request.Page,
                    PageSize = request.PageSize,
                    TotalPages = totalPages,
                    HasNextPage = request.Page < totalPages,
                    HasPreviousPage = request.Page > 1
                }
            };
        }

        private async Task<ReviewResponse> GetReviewResponseAsync(int reviewId)
        {
            var review = await _context.Reviews
                .Include(r => r.Customer)
                .Include(r => r.Property)
                .Include(r => r.ReviewImages)
                .FirstOrDefaultAsync(r => r.Id == reviewId);

            return review != null ? MapToReviewResponse(review) : null;
        }

        private static ReviewResponse MapToReviewResponse(Review review)
        {
            return new ReviewResponse
            {
                Id = review.Id,
                BookingId = review.BookingId,
                CustomerId = review.CustomerId,
                PropertyId = review.PropertyId,
                OverallRating = review.OverallRating,
                CleanlinessRating = review.CleanlinessRating,
                LocationRating = review.LocationRating,
                ServiceRating = review.ServiceRating,
                ValueRating = review.ValueRating,
                AmenitiesRating = review.AmenitiesRating,
                Title = review.Title,
                ReviewText = review.ReviewText,
                Pros = review.Pros,
                Cons = review.Cons,
                TravelType = review.TravelType,
                RoomStayed = review.RoomStayed,
                IsVerified = review.IsVerified,
                IsAnonymous = review.IsAnonymous,
                Status = review.Status,
                HostReply = review.HostReply,
                HostRepliedAt = review.HostRepliedAt,
                IsFeatured = review.IsFeatured,
                HelpfulCount = review.HelpfulCount,
                CreatedAt = review.CreatedAt,
                UpdatedAt = review.UpdatedAt,
                Customer = review.Customer != null ? new CustomerInfo
                {
                    Id = review.Customer.Id,
                    FullName = review.IsAnonymous == true ? "Anonymous" : review.Customer.FullName,
                    Avatar = review.IsAnonymous == true ? null : review.Customer.Avatar
                } : null,
                Property = review.Property != null ? new PropertyInfo
                {
                    Id = review.Property.Id,
                    Name = review.Property.Name,
                    Slug = review.Property.Slug
                } : null,
                Images = review.ReviewImages?
                    .OrderBy(i => i.DisplayOrder)
                    .Select(i => new ReviewImageResponse
                    {
                        Id = i.Id,
                        ImageUrl = i.ImageUrl,
                        DisplayOrder = i.DisplayOrder
                    }).ToList() ?? new List<ReviewImageResponse>()
            };
        }

        private async Task SaveReviewImagesAsync(int reviewId, List<IFormFile> images)
        {
            var reviewFolder = Path.Combine(_environment.WebRootPath, "review");
            if (!Directory.Exists(reviewFolder))
            {
                Directory.CreateDirectory(reviewFolder);
            }

            int displayOrder = await _context.ReviewImages
                .Where(r => r.ReviewId == reviewId)
                .CountAsync();

            foreach (var image in images)
            {
                if (image.Length > 0)
                {
                    var fileName = $"{reviewId}_{Guid.NewGuid()}{Path.GetExtension(image.FileName)}";
                    var filePath = Path.Combine(reviewFolder, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await image.CopyToAsync(stream);
                    }

                    var reviewImage = new ReviewImage
                    {
                        ReviewId = reviewId,
                        ImageUrl = $"/review/{fileName}",
                        DisplayOrder = displayOrder++,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.ReviewImages.Add(reviewImage);
                }
            }

            await _context.SaveChangesAsync();
        }

        private async Task DeleteReviewImagesAsync(int reviewId, List<int> imageIds)
        {
            var images = await _context.ReviewImages
                .Where(i => i.ReviewId == reviewId && imageIds.Contains(i.Id))
                .ToListAsync();

            foreach (var image in images)
            {
                DeleteImageFile(image.ImageUrl);
                _context.ReviewImages.Remove(image);
            }

            await _context.SaveChangesAsync();
        }

        private void DeleteImageFile(string imageUrl)
        {
            try
            {
                if (!string.IsNullOrEmpty(imageUrl))
                {
                    var filePath = Path.Combine(_environment.WebRootPath, imageUrl.TrimStart('/'));
                    if (File.Exists(filePath))
                    {
                        File.Delete(filePath);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image file: {ImageUrl}", imageUrl);
            }
        }
        // ADMIN APIs

        public async Task<ApiResponse<ReviewListResponse>> GetAllReviewsAsync(AdminReviewFilterRequest request)
        {
            try
            {
                var query = _context.Reviews
                    .Include(r => r.Customer)
                    .Include(r => r.Property)
                    .Include(r => r.ReviewImages)
                    .AsQueryable();

                // Apply admin-specific filters
                if (request.CustomerId.HasValue)
                    query = query.Where(r => r.CustomerId == request.CustomerId.Value);

                if (request.PropertyId.HasValue)
                    query = query.Where(r => r.PropertyId == request.PropertyId.Value);

                if (!string.IsNullOrEmpty(request.Status))
                    query = query.Where(r => r.Status == request.Status);

                if (request.MinRating.HasValue)
                    query = query.Where(r => r.OverallRating >= request.MinRating.Value);

                if (request.MaxRating.HasValue)
                    query = query.Where(r => r.OverallRating <= request.MaxRating.Value);

                if (request.HasHostReply.HasValue)
                {
                    if (request.HasHostReply.Value)
                        query = query.Where(r => r.HostReply != null);
                    else
                        query = query.Where(r => r.HostReply == null);
                }

                if (request.IsFeatured.HasValue)
                    query = query.Where(r => r.IsFeatured == request.IsFeatured.Value);

                if (request.IsVerified.HasValue)
                    query = query.Where(r => r.IsVerified == request.IsVerified.Value);

                if (request.FromDate.HasValue)
                    query = query.Where(r => r.CreatedAt >= request.FromDate.Value);

                if (request.ToDate.HasValue)
                    query = query.Where(r => r.CreatedAt <= request.ToDate.Value);

                if (!string.IsNullOrEmpty(request.SearchText))
                {
                    var searchLower = request.SearchText.ToLower();
                    query = query.Where(r =>
                        r.Title.ToLower().Contains(searchLower) ||
                        r.ReviewText.ToLower().Contains(searchLower) ||
                        r.Customer.FullName.ToLower().Contains(searchLower) ||
                        r.Property.Name.ToLower().Contains(searchLower));
                }

                // Apply sorting
                query = request.SortBy?.ToLower() switch
                {
                    "rating" => request.SortOrder?.ToLower() == "asc"
                        ? query.OrderBy(r => r.OverallRating)
                        : query.OrderByDescending(r => r.OverallRating),
                    "helpful" => request.SortOrder?.ToLower() == "asc"
                        ? query.OrderBy(r => r.HelpfulCount)
                        : query.OrderByDescending(r => r.HelpfulCount),
                    _ => request.SortOrder?.ToLower() == "asc"
                        ? query.OrderBy(r => r.CreatedAt)
                        : query.OrderByDescending(r => r.CreatedAt)
                };

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

                var reviews = await query
                    .Skip((request.Page - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToListAsync();

                var reviewResponses = reviews.Select(MapToReviewResponse).ToList();

                return new ApiResponse<ReviewListResponse>
                {
                    Success = true,
                    Data = new ReviewListResponse
                    {
                        Reviews = reviewResponses,
                        TotalCount = totalCount,
                        Page = request.Page,
                        PageSize = request.PageSize,
                        TotalPages = totalPages,
                        HasNextPage = request.Page < totalPages,
                        HasPreviousPage = request.Page > 1
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all reviews");
                return new ApiResponse<ReviewListResponse>
                {
                    Success = false,
                    Message = "Error retrieving reviews"
                };
            }
        }

        public async Task<ApiResponse<ReviewResponse>> GetReviewByIdAsync(int reviewId)
        {
            try
            {
                var review = await _context.Reviews
                    .Include(r => r.Customer)
                    .Include(r => r.Property)
                    .Include(r => r.ReviewImages)
                    .FirstOrDefaultAsync(r => r.Id == reviewId);

                if (review == null)
                {
                    return new ApiResponse<ReviewResponse>
                    {
                        Success = false,
                        Message = "Review not found"
                    };
                }

                return new ApiResponse<ReviewResponse>
                {
                    Success = true,
                    Data = MapToReviewResponse(review)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting review");
                return new ApiResponse<ReviewResponse>
                {
                    Success = false,
                    Message = "Error retrieving review"
                };
            }
        }

        public async Task<ApiResponse<ReviewResponse>> UpdateReviewStatusAsync(int reviewId, string status)
        {
            try
            {
                if (status != "published" && status != "hidden")
                {
                    return new ApiResponse<ReviewResponse>
                    {
                        Success = false,
                        Message = "Invalid status. Must be 'published' or 'hidden'"
                    };
                }

                var review = await _context.Reviews
                    .Include(r => r.Customer)
                    .Include(r => r.Property)
                    .Include(r => r.ReviewImages)
                    .FirstOrDefaultAsync(r => r.Id == reviewId);

                if (review == null)
                {
                    return new ApiResponse<ReviewResponse>
                    {
                        Success = false,
                        Message = "Review not found"
                    };
                }

                review.Status = status;
                review.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return new ApiResponse<ReviewResponse>
                {
                    Success = true,
                    Message = $"Review status updated to {status}",
                    Data = MapToReviewResponse(review)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating review status");
                return new ApiResponse<ReviewResponse>
                {
                    Success = false,
                    Message = "Error updating status"
                };
            }
        }

        public async Task<ApiResponse<ReviewResponse>> ToggleFeaturedStatusAsync(int reviewId)
        {
            try
            {
                var review = await _context.Reviews
                    .Include(r => r.Customer)
                    .Include(r => r.Property)
                    .Include(r => r.ReviewImages)
                    .FirstOrDefaultAsync(r => r.Id == reviewId);

                if (review == null)
                {
                    return new ApiResponse<ReviewResponse>
                    {
                        Success = false,
                        Message = "Review not found"
                    };
                }

                review.IsFeatured = !review.IsFeatured;
                review.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return new ApiResponse<ReviewResponse>
                {
                    Success = true,
                    Message = $"Review featured status: {(review.IsFeatured == true ? "enabled" : "disabled")}",
                    Data = MapToReviewResponse(review)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling featured status");
                return new ApiResponse<ReviewResponse>
                {
                    Success = false,
                    Message = "Error updating featured status"
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteReviewByAdminAsync(int reviewId)
        {
            try
            {
                var review = await _context.Reviews
                    .Include(r => r.ReviewImages)
                    .FirstOrDefaultAsync(r => r.Id == reviewId);

                if (review == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Review not found"
                    };
                }

                // Delete images from filesystem
                foreach (var image in review.ReviewImages)
                {
                    DeleteImageFile(image.ImageUrl);
                }

                _context.Reviews.Remove(review);
                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Review deleted successfully",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting review");
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Error deleting review"
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteHostReplyByAdminAsync(int reviewId)
        {
            try
            {
                var review = await _context.Reviews.FindAsync(reviewId);

                if (review == null)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Review not found"
                    };
                }

                review.HostReply = null;
                review.HostRepliedAt = null;
                review.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Host reply deleted successfully",
                    Data = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting host reply");
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Error deleting reply"
                };
            }
        }

        // STATISTICS APIs

        public async Task<ApiResponse<ReviewStatisticsResponse>> GetReviewStatisticsAsync(StatisticsFilterRequest request)
        {
            try
            {
                var query = _context.Reviews.AsQueryable();

                if (request.FromDate.HasValue)
                    query = query.Where(r => r.CreatedAt >= request.FromDate.Value);

                if (request.ToDate.HasValue)
                    query = query.Where(r => r.CreatedAt <= request.ToDate.Value);

                if (request.PropertyId.HasValue)
                    query = query.Where(r => r.PropertyId == request.PropertyId.Value);

                var totalReviews = await query.CountAsync();
                var publishedReviews = await query.CountAsync(r => r.Status == "published");
                var hiddenReviews = await query.CountAsync(r => r.Status == "hidden");
                var featuredReviews = await query.CountAsync(r => r.IsFeatured == true);
                var reviewsWithReply = await query.CountAsync(r => r.HostReply != null);
                var verifiedReviews = await query.CountAsync(r => r.IsVerified == true);

                var averageOverallRating = await query.AverageAsync(r => (double?)r.OverallRating) ?? 0;
                var averageCleanlinessRating = await query.Where(r => r.CleanlinessRating.HasValue)
                    .AverageAsync(r => (double?)r.CleanlinessRating) ?? 0;
                var averageLocationRating = await query.Where(r => r.LocationRating.HasValue)
                    .AverageAsync(r => (double?)r.LocationRating) ?? 0;
                var averageServiceRating = await query.Where(r => r.ServiceRating.HasValue)
                    .AverageAsync(r => (double?)r.ServiceRating) ?? 0;
                var averageValueRating = await query.Where(r => r.ValueRating.HasValue)
                    .AverageAsync(r => (double?)r.ValueRating) ?? 0;
                var averageAmenitiesRating = await query.Where(r => r.AmenitiesRating.HasValue)
                    .AverageAsync(r => (double?)r.AmenitiesRating) ?? 0;

                var totalHelpfulCount = await query.SumAsync(r => (int?)r.HelpfulCount) ?? 0;
                var reviewsWithImages = await query.CountAsync(r => r.ReviewImages.Any());

                return new ApiResponse<ReviewStatisticsResponse>
                {
                    Success = true,
                    Data = new ReviewStatisticsResponse
                    {
                        TotalReviews = totalReviews,
                        PublishedReviews = publishedReviews,
                        HiddenReviews = hiddenReviews,
                        FeaturedReviews = featuredReviews,
                        ReviewsWithReply = reviewsWithReply,
                        ReviewsWithoutReply = totalReviews - reviewsWithReply,
                        VerifiedReviews = verifiedReviews,
                        AverageOverallRating = Math.Round(averageOverallRating, 2),
                        AverageCleanlinessRating = Math.Round(averageCleanlinessRating, 2),
                        AverageLocationRating = Math.Round(averageLocationRating, 2),
                        AverageServiceRating = Math.Round(averageServiceRating, 2),
                        AverageValueRating = Math.Round(averageValueRating, 2),
                        AverageAmenitiesRating = Math.Round(averageAmenitiesRating, 2),
                        TotalHelpfulCount = totalHelpfulCount,
                        ReviewsWithImages = reviewsWithImages,
                        HostReplyRate = totalReviews > 0 ? Math.Round((double)reviewsWithReply / totalReviews * 100, 2) : 0
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting statistics");
                return new ApiResponse<ReviewStatisticsResponse>
                {
                    Success = false,
                    Message = "Error retrieving statistics"
                };
            }
        }

        public async Task<ApiResponse<List<ReviewTrendResponse>>> GetReviewTrendsAsync(TrendsFilterRequest request)
        {
            try
            {
                var query = _context.Reviews.AsQueryable();

                if (request.FromDate.HasValue)
                    query = query.Where(r => r.CreatedAt >= request.FromDate.Value);

                if (request.ToDate.HasValue)
                    query = query.Where(r => r.CreatedAt <= request.ToDate.Value);

                if (request.PropertyId.HasValue)
                    query = query.Where(r => r.PropertyId == request.PropertyId.Value);

                var groupBy = request.GroupBy?.ToLower() ?? "day";

                var trends = groupBy switch
                {
                    "month" => await query
                        .GroupBy(r => new { r.CreatedAt.Value.Year, r.CreatedAt.Value.Month })
                        .Select(g => new ReviewTrendResponse
                        {
                            Period = $"{g.Key.Year}-{g.Key.Month:D2}",
                            TotalReviews = g.Count(),
                            AverageRating = Math.Round(g.Average(r => r.OverallRating), 2),
                            ReviewsWithReply = g.Count(r => r.HostReply != null)
                        })
                        .OrderBy(t => t.Period)
                        .ToListAsync(),

                    "week" => await query
                        .GroupBy(r => new
                        {
                            Year = r.CreatedAt.Value.Year,
                            Week = (r.CreatedAt.Value.DayOfYear - 1) / 7 + 1
                        })
                        .Select(g => new ReviewTrendResponse
                        {
                            Period = $"{g.Key.Year}-W{g.Key.Week:D2}",
                            TotalReviews = g.Count(),
                            AverageRating = Math.Round(g.Average(r => r.OverallRating), 2),
                            ReviewsWithReply = g.Count(r => r.HostReply != null)
                        })
                        .OrderBy(t => t.Period)
                        .ToListAsync(),

                    _ => await query
                        .GroupBy(r => r.CreatedAt.Value.Date)
                        .Select(g => new ReviewTrendResponse
                        {
                            Period = g.Key.ToString("yyyy-MM-dd"),
                            TotalReviews = g.Count(),
                            AverageRating = Math.Round(g.Average(r => r.OverallRating), 2),
                            ReviewsWithReply = g.Count(r => r.HostReply != null)
                        })
                        .OrderBy(t => t.Period)
                        .ToListAsync()
                };

                return new ApiResponse<List<ReviewTrendResponse>>
                {
                    Success = true,
                    Data = trends
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trends");
                return new ApiResponse<List<ReviewTrendResponse>>
                {
                    Success = false,
                    Message = "Error retrieving trends"
                };
            }
        }

        public async Task<ApiResponse<List<TopPropertyResponse>>> GetTopRatedPropertiesAsync(TopPropertiesFilterRequest request)
        {
            try
            {
                var query = _context.Properties
                    .Where(p => p.Reviews.Any(r => r.Status == "published"));

                if (request.FromDate.HasValue)
                    query = query.Where(p => p.Reviews.Any(r => r.CreatedAt >= request.FromDate.Value));

                if (request.ToDate.HasValue)
                    query = query.Where(p => p.Reviews.Any(r => r.CreatedAt <= request.ToDate.Value));

                if (request.MinReviewCount.HasValue)
                    query = query.Where(p => p.Reviews.Count(r => r.Status == "published") >= request.MinReviewCount.Value);

                var topProperties = await query
                    .Select(p => new TopPropertyResponse
                    {
                        PropertyId = p.Id,
                        PropertyName = p.Name,
                        TotalReviews = p.Reviews.Count(r => r.Status == "published"),
                        AverageRating = Math.Round(p.Reviews.Where(r => r.Status == "published").Average(r => r.OverallRating), 2),
                        FeaturedReviewsCount = p.Reviews.Count(r => r.IsFeatured == true),
                        HostReplyRate = p.Reviews.Count > 0
                            ? Math.Round((double)p.Reviews.Count(r => r.HostReply != null) / p.Reviews.Count * 100, 2)
                            : 0
                    })
                    .OrderByDescending(p => p.AverageRating)
                    .ThenByDescending(p => p.TotalReviews)
                    .Take(request.Limit)
                    .ToListAsync();

                return new ApiResponse<List<TopPropertyResponse>>
                {
                    Success = true,
                    Data = topProperties
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting top properties");
                return new ApiResponse<List<TopPropertyResponse>>
                {
                    Success = false,
                    Message = "Error retrieving top properties"
                };
            }
        }

        public async Task<ApiResponse<RatingDistributionResponse>> GetRatingDistributionAsync(StatisticsFilterRequest request)
        {
            try
            {
                var query = _context.Reviews.AsQueryable();

                if (request.FromDate.HasValue)
                    query = query.Where(r => r.CreatedAt >= request.FromDate.Value);

                if (request.ToDate.HasValue)
                    query = query.Where(r => r.CreatedAt <= request.ToDate.Value);

                if (request.PropertyId.HasValue)
                    query = query.Where(r => r.PropertyId == request.PropertyId.Value);

                var distribution = await query
                    .GroupBy(r => r.OverallRating)
                    .Select(g => new { Rating = g.Key, Count = g.Count() })
                    .ToListAsync();

                var totalReviews = distribution.Sum(d => d.Count);

                return new ApiResponse<RatingDistributionResponse>
                {
                    Success = true,
                    Data = new RatingDistributionResponse
                    {
                        FiveStars = distribution.FirstOrDefault(d => d.Rating == 5)?.Count ?? 0,
                        FourStars = distribution.FirstOrDefault(d => d.Rating == 4)?.Count ?? 0,
                        ThreeStars = distribution.FirstOrDefault(d => d.Rating == 3)?.Count ?? 0,
                        TwoStars = distribution.FirstOrDefault(d => d.Rating == 2)?.Count ?? 0,
                        OneStar = distribution.FirstOrDefault(d => d.Rating == 1)?.Count ?? 0,
                        TotalReviews = totalReviews,
                        FiveStarsPercentage = totalReviews > 0 ? Math.Round((double)(distribution.FirstOrDefault(d => d.Rating == 5)?.Count ?? 0) / totalReviews * 100, 2) : 0,
                        FourStarsPercentage = totalReviews > 0 ? Math.Round((double)(distribution.FirstOrDefault(d => d.Rating == 4)?.Count ?? 0) / totalReviews * 100, 2) : 0,
                        ThreeStarsPercentage = totalReviews > 0 ? Math.Round((double)(distribution.FirstOrDefault(d => d.Rating == 3)?.Count ?? 0) / totalReviews * 100, 2) : 0,
                        TwoStarsPercentage = totalReviews > 0 ? Math.Round((double)(distribution.FirstOrDefault(d => d.Rating == 2)?.Count ?? 0) / totalReviews * 100, 2) : 0,
                        OneStarPercentage = totalReviews > 0 ? Math.Round((double)(distribution.FirstOrDefault(d => d.Rating == 1)?.Count ?? 0) / totalReviews * 100, 2) : 0
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting rating distribution");
                return new ApiResponse<RatingDistributionResponse>
                {
                    Success = false,
                    Message = "Error retrieving rating distribution"
                };
            }
        }

        public async Task<ApiResponse<HostResponseStatisticsResponse>> GetHostResponseStatisticsAsync(StatisticsFilterRequest request)
        {
            try
            {
                var query = _context.Reviews.AsQueryable();

                if (request.FromDate.HasValue)
                    query = query.Where(r => r.CreatedAt >= request.FromDate.Value);

                if (request.ToDate.HasValue)
                    query = query.Where(r => r.CreatedAt <= request.ToDate.Value);

                if (request.PropertyId.HasValue)
                    query = query.Where(r => r.PropertyId == request.PropertyId.Value);

                var totalReviews = await query.CountAsync();
                var reviewsWithReply = await query.CountAsync(r => r.HostReply != null);
                var reviewsWithoutReply = totalReviews - reviewsWithReply;

                // Calculate average response time (in hours)
                var reviewsWithResponseTime = await query
                    .Where(r => r.HostReply != null && r.HostRepliedAt.HasValue && r.CreatedAt.HasValue)
                    .Select(r => new
                    {
                        ResponseTime = (r.HostRepliedAt.Value - r.CreatedAt.Value).TotalHours
                    })
                    .ToListAsync();

                var averageResponseTimeHours = reviewsWithResponseTime.Any()
                    ? Math.Round(reviewsWithResponseTime.Average(r => r.ResponseTime), 2)
                    : 0;

                // Response time breakdown
                var within24Hours = reviewsWithResponseTime.Count(r => r.ResponseTime <= 24);
                var within48Hours = reviewsWithResponseTime.Count(r => r.ResponseTime > 24 && r.ResponseTime <= 48);
                var within7Days = reviewsWithResponseTime.Count(r => r.ResponseTime > 48 && r.ResponseTime <= 168);
                var moreThan7Days = reviewsWithResponseTime.Count(r => r.ResponseTime > 168);

                // Top responding hosts
                var topRespondingHosts = await _context.Properties
                    .Where(p => p.Reviews.Any())
                    .Select(p => new
                    {
                        HostId = p.HostId,
                        HostName = p.Host.FullName,
                        TotalReviews = p.Reviews.Count,
                        RepliedReviews = p.Reviews.Count(r => r.HostReply != null),
                        ReplyRate = p.Reviews.Count > 0
                            ? Math.Round((double)p.Reviews.Count(r => r.HostReply != null) / p.Reviews.Count * 100, 2)
                            : 0
                    })
                    .Where(h => h.TotalReviews >= 5)
                    .OrderByDescending(h => h.ReplyRate)
                    .ThenByDescending(h => h.RepliedReviews)
                    .Take(10)
                    .Select(h => new HostResponseInfo
                    {
                        HostId = h.HostId,
                        HostName = h.HostName,
                        TotalReviews = h.TotalReviews,
                        RepliedReviews = h.RepliedReviews,
                        ReplyRate = h.ReplyRate
                    })
                    .ToListAsync();

                return new ApiResponse<HostResponseStatisticsResponse>
                {
                    Success = true,
                    Data = new HostResponseStatisticsResponse
                    {
                        TotalReviews = totalReviews,
                        ReviewsWithReply = reviewsWithReply,
                        ReviewsWithoutReply = reviewsWithoutReply,
                        OverallReplyRate = totalReviews > 0 ? Math.Round((double)reviewsWithReply / totalReviews * 100, 2) : 0,
                        AverageResponseTimeHours = averageResponseTimeHours,
                        ResponseWithin24Hours = within24Hours,
                        ResponseWithin48Hours = within48Hours,
                        ResponseWithin7Days = within7Days,
                        ResponseMoreThan7Days = moreThan7Days,
                        TopRespondingHosts = topRespondingHosts
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting host response statistics");
                return new ApiResponse<HostResponseStatisticsResponse>
                {
                    Success = false,
                    Message = "Error retrieving host response statistics"
                };
            }
        }

    }
}