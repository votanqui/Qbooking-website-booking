namespace QBooking.DTOs.Responses
{
    public class ReviewResponse
    {
        public int Id { get; set; }
        public int BookingId { get; set; }
        public int CustomerId { get; set; }
        public int PropertyId { get; set; }
        public byte OverallRating { get; set; }
        public byte? CleanlinessRating { get; set; }
        public byte? LocationRating { get; set; }
        public byte? ServiceRating { get; set; }
        public byte? ValueRating { get; set; }
        public byte? AmenitiesRating { get; set; }
        public string? Title { get; set; }
        public string? ReviewText { get; set; }
        public string? Pros { get; set; }
        public string? Cons { get; set; }
        public string? TravelType { get; set; }
        public string? RoomStayed { get; set; }
        public bool? IsVerified { get; set; }
        public bool? IsAnonymous { get; set; }
        public string? Status { get; set; }
        public string? HostReply { get; set; }
        public DateTime? HostRepliedAt { get; set; }
        public bool? IsFeatured { get; set; }
        public int? HelpfulCount { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public CustomerInfo? Customer { get; set; }
        public PropertyInfo? Property { get; set; }
        public List<ReviewImageResponse> Images { get; set; } = new List<ReviewImageResponse>();
    }

    public class ReviewImageResponse
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; }
        public int? DisplayOrder { get; set; }
    }

    public class CustomerInfo
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string? Avatar { get; set; }
    }

    public class PropertyInfo
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Slug { get; set; }
    }

    public class ReviewListResponse
    {
        public List<ReviewResponse> Reviews { get; set; } = new List<ReviewResponse>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    public class HostPropertyReviewsResponse
    {
        public int PropertyId { get; set; }
        public string PropertyName { get; set; }
        public int TotalReviews { get; set; }
        public int ReviewsWithReply { get; set; }
        public int PendingReviews { get; set; }
        public double AverageRating { get; set; }
    }
    // Review Statistics
    public class ReviewStatisticsResponse
    {
        public int TotalReviews { get; set; }
        public int PublishedReviews { get; set; }
        public int HiddenReviews { get; set; }
        public int FeaturedReviews { get; set; }
        public int ReviewsWithReply { get; set; }
        public int ReviewsWithoutReply { get; set; }
        public int VerifiedReviews { get; set; }
        public double AverageOverallRating { get; set; }
        public double AverageCleanlinessRating { get; set; }
        public double AverageLocationRating { get; set; }
        public double AverageServiceRating { get; set; }
        public double AverageValueRating { get; set; }
        public double AverageAmenitiesRating { get; set; }
        public int TotalHelpfulCount { get; set; }
        public int ReviewsWithImages { get; set; }
        public double HostReplyRate { get; set; }
    }

    // Review Trends
    public class ReviewTrendResponse
    {
        public string Period { get; set; }
        public int TotalReviews { get; set; }
        public double AverageRating { get; set; }
        public int ReviewsWithReply { get; set; }
    }

    // Top Property
    public class TopPropertyResponse
    {
        public int PropertyId { get; set; }
        public string PropertyName { get; set; }
        public int TotalReviews { get; set; }
        public double AverageRating { get; set; }
        public int FeaturedReviewsCount { get; set; }
        public double HostReplyRate { get; set; }
    }

    // Rating Distribution
    public class RatingDistributionResponse
    {
        public int FiveStars { get; set; }
        public int FourStars { get; set; }
        public int ThreeStars { get; set; }
        public int TwoStars { get; set; }
        public int OneStar { get; set; }
        public int TotalReviews { get; set; }
        public double FiveStarsPercentage { get; set; }
        public double FourStarsPercentage { get; set; }
        public double ThreeStarsPercentage { get; set; }
        public double TwoStarsPercentage { get; set; }
        public double OneStarPercentage { get; set; }
    }

    // Host Response Statistics
    public class HostResponseStatisticsResponse
    {
        public int TotalReviews { get; set; }
        public int ReviewsWithReply { get; set; }
        public int ReviewsWithoutReply { get; set; }
        public double OverallReplyRate { get; set; }
        public double AverageResponseTimeHours { get; set; }
        public int ResponseWithin24Hours { get; set; }
        public int ResponseWithin48Hours { get; set; }
        public int ResponseWithin7Days { get; set; }
        public int ResponseMoreThan7Days { get; set; }
        public List<HostResponseInfo> TopRespondingHosts { get; set; } = new List<HostResponseInfo>();
    }

    public class HostResponseInfo
    {
        public int HostId { get; set; }
        public string HostName { get; set; }
        public int TotalReviews { get; set; }
        public int RepliedReviews { get; set; }
        public double ReplyRate { get; set; }
    }
}