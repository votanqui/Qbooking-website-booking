// Cập nhật PropertyDetailResponse để thêm ProductType thông tin
namespace QBooking.Dtos.Response
{
    public class PropertyResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Type { get; set; } // Vẫn giữ Type để hiển thị tên ProductType
        public string Description { get; set; }
        public string AddressDetail { get; set; }
        public string Province { get; set; }
        public string Commune { get; set; }
        public decimal? PriceFrom { get; set; }
        public string Currency { get; set; }
        public string Status { get; set; }
        public bool IsFeatured { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TotalViews { get; set; } = 0;
        public int TotalReviews { get; set; } = 0;
        public decimal? AverageRating { get; set; }
        public List<string> Images { get; set; } = new();
        public List<string> Amenities { get; set; } = new();
    }

// Updated PropertyDetailResponse class
public class PropertyDetailResponse
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Slug { get; set; }
    public string Type { get; set; } // Vẫn giữ Type để hiển thị tên ProductType
    public ProductTypeInfo ProductType { get; set; } // Thêm thông tin chi tiết ProductType
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
    public decimal? PriceFrom { get; set; }
    public string Currency { get; set; }
    public string Status { get; set; }
    public bool IsActive { get; set; }

    public string MetaTitle { get; set; }
    public string MetaDescription { get; set; }
    public string MetaKeywords { get; set; }
    public DateTime CreatedAt { get; set; }

        public HostInfo Host { get; set; }
    public List<PropertyImageResponse> Images { get; set; } = new();
    public List<PropertyAmenityResponse> Amenities { get; set; } = new();
    public List<PropertyRoomTypeInfo> RoomTypes { get; set; } = new(); // Added room types with unique name
    }
    public class HostInfo
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string? Phone { get; set; }
        public string? Avatar { get; set; }
    }
    // Property-specific room type response model to avoid naming conflicts
    public class PropertyRoomTypeInfo
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public int MaxAdults { get; set; }
        public int MaxChildren { get; set; }
        public int MaxGuests { get; set; }
        public string BedType { get; set; }
        public decimal? RoomSize { get; set; }
        public decimal BasePrice { get; set; }
        public int TotalRooms { get; set; }
        public List<PropertyRoomImageInfo> Images { get; set; } = new();
    }

    // Property-specific room image response model
    public class PropertyRoomImageInfo
    {
        public string ImageUrl { get; set; }
        public bool IsPrimary { get; set; }
    }



    // Thêm class mới cho ProductType info
    public class ProductTypeInfo
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Code { get; set; }
        public string Description { get; set; }
        public string Icon { get; set; }
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
    }

    public class PropertyAmenityResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public bool IsFree { get; set; }
        public string AdditionalInfo { get; set; }
    }

    // Response cho upload ảnh thành công
    public class ImageUploadResponse
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; }
        public string FileName { get; set; }
        public string FullUrl { get; set; } // URL đầy đủ bao gồm domain
    }
    public class PropertyForEditResponse
    {
        public int Id { get; set; }

        // Các field theo đúng PUT API Property
        public string Name { get; set; }
        public int ProductTypeId { get; set; }
        public string Description { get; set; }
        public string ShortDescription { get; set; }
        public string AddressDetail { get; set; }
        public int? CommuneId { get; set; }
        public int ProvinceId { get; set; }
        public string PostalCode { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public byte StarRating { get; set; }
        public int TotalRooms { get; set; }
        public int? EstablishedYear { get; set; }
        public string CheckInTime { get; set; }
        public string CheckOutTime { get; set; }
        public int MinStayNights { get; set; }
        public int MaxStayNights { get; set; }
        public string CancellationPolicy { get; set; }
        public string MetaTitle { get; set; }
        public string MetaDescription { get; set; }
        public string MetaKeywords { get; set; }
        public decimal? PriceFrom { get; set; }
        public string Currency { get; set; }

        public List<PropertyImageForEdit> Images { get; set; } = new();
        public List<PropertyAmenityForEdit> Amenities { get; set; } = new();
        public List<RoomTypeForEditResponse> RoomTypes { get; set; } = new();
    }

    // Property Image cho Edit
    public class PropertyImageForEdit
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; }
        public string ImageType { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public bool IsPrimary { get; set; }
        public int SortOrder { get; set; }
    }

    // Property Amenity theo format PUT API
    public class PropertyAmenityForEdit
    {
        public int AmenityId { get; set; }
        public bool IsFree { get; set; }
        public string AdditionalInfo { get; set; }
    }

    // Room Type cho Edit
    public class RoomTypeForEditResponse
    {
        public int Id { get; set; }

        // Các field theo đúng PUT API Room
        public string Name { get; set; }
        public string Description { get; set; }
        public string ShortDescription { get; set; }
        public int MaxAdults { get; set; }
        public int MaxChildren { get; set; }
        public int MaxGuests { get; set; }
        public string BedType { get; set; }
        public decimal? RoomSize { get; set; }
        public decimal BasePrice { get; set; }
        public decimal? WeekendPrice { get; set; }
        public decimal? HolidayPrice { get; set; }
        public decimal WeeklyDiscountPercent { get; set; }
        public decimal MonthlyDiscountPercent { get; set; }
        public int TotalRooms { get; set; }
        public string MetaTitle { get; set; }
        public string MetaDescription { get; set; }

        public List<RoomImageForEdit> Images { get; set; } = new();
        public List<RoomAmenityForEdit> Amenities { get; set; } = new();
    }

    // Room Image cho Edit
    public class RoomImageForEdit
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public bool IsPrimary { get; set; }
        public int SortOrder { get; set; }
    }

    // Room Amenity theo format PUT API
    public class RoomAmenityForEdit
    {
        public int AmenityId { get; set; }
        public int Quantity { get; set; }
    }
    public class PropertyForBookingResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string AddressDetail { get; set; }
        public string Province { get; set; }
        public string Commune { get; set; }
        public string CheckInTime { get; set; }
        public string CheckOutTime { get; set; }
        public byte StarRating { get; set; }

        public string MainImage { get; set; }
        public List<RoomTypeForBooking> RoomTypes { get; set; } = new();
    }

    public class RoomTypeForBooking
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int MaxAdults { get; set; }
        public int MaxChildren { get; set; }
        public int MaxGuests { get; set; }
        public string BedType { get; set; }
        public decimal BasePrice { get; set; }
        public string RoomImage { get; set; }
    }
}