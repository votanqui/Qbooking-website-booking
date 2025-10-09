namespace QBooking.DTOs.Response
{
  

    public class UserProfileResponse
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string Phone { get; set; }
        public string Role { get; set; }
        public string Avatar { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string Gender { get; set; }
        public string AddressDetail { get; set; }
        public string Province { get; set; }
        public string Commune { get; set; }
        public bool IsEmailVerified { get; set; }
        public bool IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class PropertySummaryResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Type { get; set; } // Tên ProductType để hiển thị
        public int ProductTypeId { get; set; } // Thêm ProductTypeId
        public string ProductTypeCode { get; set; } // Thêm ProductType code
        public string Description { get; set; }
        public string ShortDescription { get; set; }
        public string AddressDetail { get; set; }
        public string Province { get; set; }
        public string Commune { get; set; }
        public byte StarRating { get; set; }
        public int TotalRooms { get; set; }
        public decimal? PriceFrom { get; set; }
        public string Currency { get; set; }
        public string Status { get; set; }
        public bool IsActive { get; set; }
        public bool IsFeatured { get; set; }
        public int ViewCount { get; set; }
        public int BookingCount { get; set; }
        public string PrimaryImage { get; set; }
        public int ImageCount { get; set; }
        public int RoomTypeCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class GetUserPropertiesResponse
    {
        public List<PropertySummaryResponse> Properties { get; set; } = new List<PropertySummaryResponse>();
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    public class UpdateProfileResponse
    {
        public DateTime UpdatedAt { get; set; }
    }

    public class UploadAvatarResponse
    {
        public string AvatarUrl { get; set; }
        public string FileName { get; set; }
        public long FileSize { get; set; }
        public DateTime UploadedAt { get; set; }
    }

    public class RemoveAvatarResponse
    {
        public DateTime RemovedAt { get; set; }
    }

    public class UserStatisticsResponse
    {
        public int TotalProperties { get; set; }
        public int ActiveProperties { get; set; }
        public int TotalBookings { get; set; }
        public int TotalViews { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class LoginResponse
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public DateTime ExpiresAt { get; set; }
        public UserProfileResponse User { get; set; }
    }

    public class RegisterResponse
    {
        public int UserId { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public bool IsEmailVerified { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ChangePasswordResponse
    {
        public DateTime ChangedAt { get; set; }
    }

    public class ForgotPasswordResponse
    {
        public string Message { get; set; }
        public DateTime RequestedAt { get; set; }
    }

    public class ResetPasswordResponse
    {
        public DateTime ResetAt { get; set; }
    }

    public class VerifyEmailResponse
    {
        public DateTime VerifiedAt { get; set; }
    }

    public class ResendVerificationEmailResponse
    {
        public string Message { get; set; }
        public DateTime SentAt { get; set; }
    }

    public class RefreshTokenResponse
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    public class LogoutResponse
    {
        public DateTime LogoutAt { get; set; }
    }

    // Property related responses
    public class PropertyDetailResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Type { get; set; }
        public string Description { get; set; }
        public string ShortDescription { get; set; }
        public string AddressDetail { get; set; }
        public string Province { get; set; }
        public string Commune { get; set; }
        public string PostalCode { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public byte StarRating { get; set; }
        public int TotalRooms { get; set; }
        public int? EstablishedYear { get; set; }
        public TimeSpan? CheckInTime { get; set; }
        public TimeSpan? CheckOutTime { get; set; }
        public int MinStayNights { get; set; }
        public int MaxStayNights { get; set; }
        public string CancellationPolicy { get; set; }
        public string MetaTitle { get; set; }
        public string MetaDescription { get; set; }
        public string MetaKeywords { get; set; }
        public decimal? PriceFrom { get; set; }
        public string Currency { get; set; }
        public string Status { get; set; }
        public bool IsActive { get; set; }
        public bool IsFeatured { get; set; }
        public int ViewCount { get; set; }
        public int BookingCount { get; set; }
        public List<PropertyImageResponse> Images { get; set; } = new List<PropertyImageResponse>();
        public List<PropertyAmenityResponse> Amenities { get; set; } = new List<PropertyAmenityResponse>();
        public List<RoomTypeResponse> RoomTypes { get; set; } = new List<RoomTypeResponse>();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class PropertyImageResponse
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; }
        public string ImageType { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public bool IsPrimary { get; set; }
        public int SortOrder { get; set; }
        public int? FileSize { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PropertyAmenityResponse
    {
        public int AmenityId { get; set; }
        public string Name { get; set; }
        public string Icon { get; set; }
        public string Category { get; set; }
        public bool IsFree { get; set; }
        public string AdditionalInfo { get; set; }
    }

    public class RoomTypeResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal BasePrice { get; set; }
        public int MaxGuests { get; set; }
        public int RoomCount { get; set; }
        public decimal? RoomSize { get; set; }
        public string BedConfiguration { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // Error response
    public class ErrorResponse
    {
        public string Type { get; set; }
        public string Title { get; set; }
        public int Status { get; set; }
        public string Detail { get; set; }
        public Dictionary<string, string[]> Errors { get; set; }
        public string TraceId { get; set; }
    }

    // Pagination metadata
    public class PaginationMetadata
    {
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }
    public class UserDetailResponse
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string? Phone { get; set; }
        public string Role { get; set; }
        public string? Avatar { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? AddressDetail { get; set; }
        public string? Province { get; set; }
        public string? Commune { get; set; }
        public bool IsEmailVerified { get; set; }
        public bool IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class GetUsersResponse
    {
        public List<UserDetailResponse> Users { get; set; } = new List<UserDetailResponse>();
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    // Response cho GetUserById
    public class UserFullDetailResponse
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string? Phone { get; set; }
        public string Role { get; set; }
        public string? Avatar { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? AddressDetail { get; set; }
        public string? Province { get; set; }
        public string? Commune { get; set; }
        public int? ProvinceId { get; set; }
        public int? CommuneId { get; set; }
        public bool IsEmailVerified { get; set; }
        public bool IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public PropertyStatsResponse? PropertyStats { get; set; }
        public BookingStatsResponse BookingStats { get; set; }
        public List<SearchHistoryResponseUser> RecentSearches { get; set; } = new List<SearchHistoryResponseUser>();
    }

    public class PropertyStatsResponse
    {
        public int TotalProperties { get; set; }
        public int ActiveProperties { get; set; }
        public int PendingProperties { get; set; }
        public int RejectedProperties { get; set; }
        public int TotalViews { get; set; }
    }

    public class BookingStatsResponse
    {
        public int TotalBookings { get; set; }
        public int PendingBookings { get; set; }
        public int ConfirmedBookings { get; set; }
        public int CompletedBookings { get; set; }
        public int CancelledBookings { get; set; }
        public decimal TotalSpent { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalHostBookings { get; set; }
    }

    public class SearchHistoryResponseUser
    {
        public int Id { get; set; }
        public string? SearchKeyword { get; set; }
        public string? PropertyType { get; set; }
        public int? ProvinceId { get; set; }
        public DateTime? CheckIn { get; set; }
        public DateTime? CheckOut { get; set; }
        public int ResultCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // Response cho GetUserBookings
    public class BookingResponse
    {
        public int Id { get; set; }
        public string BookingCode { get; set; }
        public string PropertyName { get; set; }
        public string RoomTypeName { get; set; }
        public DateTime CheckIn { get; set; }
        public DateTime CheckOut { get; set; }
        public int Nights { get; set; }
        public int Adults { get; set; }
        public int Children { get; set; }
        public int RoomsCount { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public string PaymentStatus { get; set; }
        public DateTime BookingDate { get; set; }
    }

    public class GetUserBookingsResponse
    {
        public List<BookingResponse> Bookings { get; set; } = new List<BookingResponse>();
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
    }

    // Response cho GetUsersStatistics
    public class UsersStatisticsResponse
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int InactiveUsers { get; set; }
        public int VerifiedUsers { get; set; }
        public int UnverifiedUsers { get; set; }
        public int CustomerCount { get; set; }
        public int HostCount { get; set; }
        public int AdminCount { get; set; }
        public int NewUsersLast30Days { get; set; }
    }
}