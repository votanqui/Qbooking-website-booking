// Cập nhật CreatePropertyRequest
namespace QBooking.Dtos.Request
{
    public class CreatePropertyRequest
    {
        public string Name { get; set; }
        public int ProductTypeId { get; set; } // Thay đổi từ string Type sang int ProductTypeId
        public string Description { get; set; }
        public string ShortDescription { get; set; }
        public string AddressDetail { get; set; }
        public int CommuneId { get; set; }
        public int ProvinceId { get; set; }
        public string PostalCode { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public byte StarRating { get; set; } = 0;
        public int TotalRooms { get; set; } = 0;
        public int? EstablishedYear { get; set; }
        public TimeSpan? CheckInTime { get; set; }
        public TimeSpan? CheckOutTime { get; set; }
        public int MinStayNights { get; set; } = 1;
        public int MaxStayNights { get; set; } = 30;
        public string CancellationPolicy { get; set; } = "moderate";
        public string MetaTitle { get; set; }
        public string MetaDescription { get; set; }
        public string MetaKeywords { get; set; }
        public decimal PriceFrom { get; set; }
        public string Currency { get; set; } = "VND";

        // Danh sách tiện ích
        public List<PropertyAmenityRequest> Amenities { get; set; } = new List<PropertyAmenityRequest>();
    }

    // Cập nhật UpdatePropertyRequest
    public class UpdatePropertyRequest
    {
        public string Name { get; set; }
        public int ProductTypeId { get; set; } // Thay đổi từ string Type sang int ProductTypeId
        public string Description { get; set; }
        public string ShortDescription { get; set; }
        public string AddressDetail { get; set; }
        public int CommuneId { get; set; }
        public int ProvinceId { get; set; }
        public string PostalCode { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public byte StarRating { get; set; } = 0;
        public int TotalRooms { get; set; } = 0;
        public int? EstablishedYear { get; set; }
        public TimeSpan? CheckInTime { get; set; }
        public TimeSpan? CheckOutTime { get; set; }
        public int MinStayNights { get; set; } = 1;
        public int MaxStayNights { get; set; } = 30;
        public string CancellationPolicy { get; set; } = "moderate";
        public string MetaTitle { get; set; }
        public string MetaDescription { get; set; }
        public string MetaKeywords { get; set; }
        public decimal PriceFrom { get; set; }
        public string Currency { get; set; } = "VND";
        public List<PropertyAmenityRequest> Amenities { get; set; } = new List<PropertyAmenityRequest>();
    }

    // Cập nhật PropertyFilterRequest
    public class PropertyFilterRequest
    {
        public string? Name { get; set; }
        public int? ProductTypeId { get; set; } // Thay đổi từ string Type sang int? ProductTypeId
        public int? ProvinceId { get; set; }
        public string? Status { get; set; }
        public bool? IsActive { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
    public class PropertyAppvoredFilterRequest
    {
        public string? Name { get; set; }
        public int? ProductTypeId { get; set; }
        public int? ProvinceId { get; set; }
        public List<int>? AmenityIds { get; set; }
        public decimal? MinRating { get; set; }

        // 🆕 Bộ lọc mới
        public DateTime? CheckIn { get; set; }
        public DateTime? CheckOut { get; set; }
        public int? Adults { get; set; }
        public int? Children { get; set; }

        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    // Các class khác giữ nguyên
    public class PropertyImageRequest
    {
        public string ImageUrl { get; set; }
        public string ImageType { get; set; } = "interior";
        public string? Title { get; set; }
        public string? Description { get; set; }
        public bool? IsPrimary { get; set; } = false;
        public int? SortOrder { get; set; } = 0;
    }

    public class PropertyAmenityRequest
    {
        public int AmenityId { get; set; }
        public bool IsFree { get; set; } = true;
        public string AdditionalInfo { get; set; }
    }

    public class ImageUploadInfo
    {
        public string ImageType { get; set; } = "interior";
        public string? Title { get; set; }
        public string? Description { get; set; }
        public bool? IsPrimary { get; set; } = false;
        public int? SortOrder { get; set; } = 0;
    }

    public class UploadImageRequest
    {
        public List<IFormFile> Files { get; set; } = new List<IFormFile>();
        public List<ImageUploadInfo> ImageInfos { get; set; } = new List<ImageUploadInfo>();
    }

    public class UploadImageRequestAlternative
    {
        public List<IFormFile> Files { get; set; } = new List<IFormFile>();
        public List<string> ImageTypes { get; set; } = new List<string>();
        public List<string> Titles { get; set; } = new List<string>();
        public List<string> Descriptions { get; set; } = new List<string>();
        public List<bool> IsPrimaries { get; set; } = new List<bool>();
        public List<int> SortOrders { get; set; } = new List<int>();
    }
    public class CreateProductTypeDto
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Icon { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
    }

    public class UpdateProductTypeDto
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Icon { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
    }
    public class PropertyHostFilterRequest
    {
        public string? Name { get; set; }
        public int? ProductTypeId { get; set; }
        public int? ProvinceId { get; set; }
        public string? Status { get; set; } // draft, pending, approved, rejected
        public bool? IsActive { get; set; }
        public bool? IsFeatured { get; set; }
        public DateTime? CreatedFrom { get; set; }
        public DateTime? CreatedTo { get; set; }
        public decimal? PriceFrom { get; set; }
        public decimal? PriceTo { get; set; }
        public string? SortBy { get; set; } // name, created, price, views, bookings
        public string? SortOrder { get; set; } // asc, desc
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
    public class PropertyAdminFilterRequest
    {
        public string? Name { get; set; }
        public int? ProductTypeId { get; set; }
        public int? ProvinceId { get; set; }
        public int? HostId { get; set; }
        public string? Status { get; set; } // draft, pending, approved, rejected
        public bool? IsActive { get; set; }
        public bool? IsFeatured { get; set; }
        public DateTime? CreatedFrom { get; set; }
        public DateTime? CreatedTo { get; set; }
        public DateTime? ApprovedFrom { get; set; }
        public DateTime? ApprovedTo { get; set; }
        public decimal? PriceFrom { get; set; }
        public decimal? PriceTo { get; set; }
        public string? SortBy { get; set; } = "created"; // created, name, price, bookings, revenue
        public string? SortOrder { get; set; } = "desc";
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}