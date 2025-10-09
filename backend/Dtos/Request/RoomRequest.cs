namespace QBooking.Dtos.Request
{
    // Request cho tạo một room type
    public class CreateSingleRoomTypeRequest
    {
        public int PropertyId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string ShortDescription { get; set; }
        public int MaxAdults { get; set; } = 2;
        public int MaxChildren { get; set; } = 1;
        public int MaxGuests { get; set; } = 2;
        public string BedType { get; set; }
        public decimal? RoomSize { get; set; }
        public decimal BasePrice { get; set; }
        public decimal? WeekendPrice { get; set; }
        public decimal? HolidayPrice { get; set; }
        public decimal WeeklyDiscountPercent { get; set; } = 0;
        public decimal MonthlyDiscountPercent { get; set; } = 0;
        public int TotalRooms { get; set; } = 1;
        public string MetaTitle { get; set; }
        public string MetaDescription { get; set; }

        // Danh sách tiện ích phòng
        public List<RoomAmenityRequest> Amenities { get; set; } = new List<RoomAmenityRequest>();
    }

    // Request cho tạo nhiều room types
    public class CreateMultipleRoomTypesRequest
    {
        public int PropertyId { get; set; }
        public List<RoomTypeData> RoomTypes { get; set; } = new List<RoomTypeData>();
    }

    public class RoomTypeData
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string ShortDescription { get; set; }
        public int MaxAdults { get; set; } = 2;
        public int MaxChildren { get; set; } = 1;
        public int MaxGuests { get; set; } = 2;
        public string BedType { get; set; }
        public decimal? RoomSize { get; set; }
        public decimal BasePrice { get; set; }
        public decimal? WeekendPrice { get; set; }
        public decimal? HolidayPrice { get; set; }
        public decimal WeeklyDiscountPercent { get; set; } = 0;
        public decimal MonthlyDiscountPercent { get; set; } = 0;
        public int TotalRooms { get; set; } = 1;
        public string MetaTitle { get; set; }
        public string MetaDescription { get; set; }

        // Danh sách tiện ích phòng
        public List<RoomAmenityRequest> Amenities { get; set; } = new List<RoomAmenityRequest>();
    }

    public class UpdateRoomTypeRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string ShortDescription { get; set; }
        public int MaxAdults { get; set; } = 2;
        public int MaxChildren { get; set; } = 1;
        public int MaxGuests { get; set; } = 2;
        public string BedType { get; set; }
        public decimal? RoomSize { get; set; }
        public decimal BasePrice { get; set; }
        public decimal? WeekendPrice { get; set; }
        public decimal? HolidayPrice { get; set; }
        public decimal WeeklyDiscountPercent { get; set; } = 0;
        public decimal MonthlyDiscountPercent { get; set; } = 0;
        public int TotalRooms { get; set; } = 1;
        public string MetaTitle { get; set; }
        public string MetaDescription { get; set; }

        // Danh sách tiện ích phòng
        public List<RoomAmenityRequest> Amenities { get; set; } = new List<RoomAmenityRequest>();
    }

    public class RoomAmenityRequest
    {
        public int AmenityId { get; set; }
        public int Quantity { get; set; } = 1;
    }

    public class RoomTypeFilterRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 12;

        // Basic filters
        public string? Name { get; set; }
        public string? BedType { get; set; }

        // Guest filters
        public int? Adults { get; set; } = 1;
        public int? Children { get; set; } = 0;

        // Price filters
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }

        // Location filters
        public int? ProvinceId { get; set; }

        // Date filters (để check availability)
        public DateTime? CheckIn { get; set; }
        public DateTime? CheckOut { get; set; }

        // Amenity filters
        public List<int>? AmenityIds { get; set; }
    }

    public class RoomImageUploadInfo
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public bool IsPrimary { get; set; } = false;
        public int SortOrder { get; set; } = 0;
    }

    public class UploadRoomImageRequest
    {
        public List<IFormFile> Files { get; set; } = new List<IFormFile>();
        public List<RoomImageUploadInfo> ImageInfos { get; set; } = new List<RoomImageUploadInfo>();
    }

    public class UploadRoomImageRequestAlternative
    {
        public List<IFormFile> Files { get; set; } = new List<IFormFile>();
        public List<string> Titles { get; set; } = new List<string>();
        public List<string> Descriptions { get; set; } = new List<string>();
        public List<bool> IsPrimaries { get; set; } = new List<bool>();
        public List<int> SortOrders { get; set; } = new List<int>();
    }
}
