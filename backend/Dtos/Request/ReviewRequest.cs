using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace QBooking.DTOs.Requests
{
    // Customer - Create Review
    public class CreateReviewRequest
    {
        [Required]
        public int BookingId { get; set; }

        [Required]
        public int PropertyId { get; set; }

        [Required]
        [Range(1, 5)]
        public byte OverallRating { get; set; }

        [Range(1, 5)]
        public byte? CleanlinessRating { get; set; }

        [Range(1, 5)]
        public byte? LocationRating { get; set; }

        [Range(1, 5)]
        public byte? ServiceRating { get; set; }

        [Range(1, 5)]
        public byte? ValueRating { get; set; }

        [Range(1, 5)]
        public byte? AmenitiesRating { get; set; }

        [StringLength(200)]
        public string? Title { get; set; }

        [StringLength(2000)]
        public string? ReviewText { get; set; }

        [StringLength(1000)]
        public string? Pros { get; set; }

        [StringLength(1000)]
        public string? Cons { get; set; }

        [StringLength(20)]
        public string? TravelType { get; set; }

        [StringLength(100)]
        public string? RoomStayed { get; set; }

        public bool? IsAnonymous { get; set; }

        // Images support up to 10 images
        [MaxLength(10, ErrorMessage = "Maximum 10 images allowed")]
        public List<IFormFile>? Images { get; set; }
    }

    // Customer - Update Review
    public class UpdateReviewRequest
    {
        [Range(1, 5)]
        public byte? OverallRating { get; set; }

        [Range(1, 5)]
        public byte? CleanlinessRating { get; set; }

        [Range(1, 5)]
        public byte? LocationRating { get; set; }

        [Range(1, 5)]
        public byte? ServiceRating { get; set; }

        [Range(1, 5)]
        public byte? ValueRating { get; set; }

        [Range(1, 5)]
        public byte? AmenitiesRating { get; set; }

        [StringLength(200)]
        public string? Title { get; set; }

        [StringLength(2000)]
        public string? ReviewText { get; set; }

        [StringLength(1000)]
        public string? Pros { get; set; }

        [StringLength(1000)]
        public string? Cons { get; set; }

        [StringLength(20)]
        public string? TravelType { get; set; }

        [StringLength(100)]
        public string? RoomStayed { get; set; }

        public bool? IsAnonymous { get; set; }

        // New images to add
        [MaxLength(10, ErrorMessage = "Maximum 10 images total")]
        public List<IFormFile>? NewImages { get; set; }

        // Image IDs to delete
        public List<int>? DeleteImageIds { get; set; }
    }

    // Host - Add/Update Reply
    public class HostReplyRequest
    {
        [Required]
        [StringLength(1000)]
        public string HostReply { get; set; }
    }

    // Filter for getting reviews
    public class ReviewFilterRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public int? PropertyId { get; set; }
        public byte? MinRating { get; set; }
        public byte? MaxRating { get; set; }
        public string? Status { get; set; }
        public bool? HasHostReply { get; set; }
        public string? SortBy { get; set; } = "CreatedAt";
        public string? SortOrder { get; set; } = "desc";
    }// Admin Review Filter
    public class AdminReviewFilterRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public int? CustomerId { get; set; }
        public int? PropertyId { get; set; }
        public byte? MinRating { get; set; }
        public byte? MaxRating { get; set; }
        public string? Status { get; set; }
        public bool? HasHostReply { get; set; }
        public bool? IsFeatured { get; set; }
        public bool? IsVerified { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? SearchText { get; set; }
        public string? SortBy { get; set; } = "CreatedAt";
        public string? SortOrder { get; set; } = "desc";
    }

    // Update Review Status
    public class UpdateReviewStatusRequest
    {
        [Required]
        [RegularExpression("^(published|hidden)$", ErrorMessage = "Status must be 'published' or 'hidden'")]
        public string Status { get; set; }
    }

    // Statistics Filter
    public class StatisticsFilterRequest
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? PropertyId { get; set; }
    }

    // Trends Filter
    public class TrendsFilterRequest
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? PropertyId { get; set; }
        [RegularExpression("^(day|week|month)$")]
        public string? GroupBy { get; set; } = "day";
    }

    // Top Properties Filter
    public class TopPropertiesFilterRequest
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? MinReviewCount { get; set; }
        public int Limit { get; set; } = 10;
    }
}