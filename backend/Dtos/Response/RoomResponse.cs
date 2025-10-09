namespace QBooking.Dtos.Response
{
    public class RoomTypeResponse
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public string PropertyName { get; set; }
        public string PropertySlug { get; set; }
        public string Province { get; set; }
        public string? Commune { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
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
        public int TotalRooms { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<string> Images { get; set; }
        public List<string> Amenities { get; set; }
        public int AmenityCount { get; set; }

        // Statistics
        public int TotalBookings { get; set; }
    }
    public class HostRoomTypeDetailResponse
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public string PropertyName { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
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
        public int TotalRooms { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<string> Images { get; set; } = new List<string>();
        public List<RoomAmenityDetailResponse> Amenities { get; set; } = new List<RoomAmenityDetailResponse>();
    }
    public class RoomAmenityDetailResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Icon { get; set; }
        public string Description { get; set; }
        public bool IsPopular { get; set; }
        public string CategoryName { get; set; }
    }
    /* -----------------------------Võ Tấn Qui-------------------------------------- */

    public class RoomTypeDetailResponse
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public string PropertyName { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
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
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public List<RoomImageResponse> Images { get; set; } = new();
        public List<RoomAmenityResponse> Amenities { get; set; } = new();
    }



    /* -----------------------------Võ Tấn Qui-------------------------------------- */

    public class RoomImageResponse
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public bool IsPrimary { get; set; }
        public int SortOrder { get; set; }
    }

    /* -----------------------------Võ Tấn Qui-------------------------------------- */


    public class RoomAmenityResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int Quantity { get; set; }
    }

    /* -----------------------------Võ Tấn Qui-------------------------------------- */


    // Response cho upload ảnh phòng thành công
    public class RoomImageUploadResponse
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; }
        public string FileName { get; set; }
        public string FullUrl { get; set; } // URL đầy đủ bao gồm domain
    }


    /* -----------------------------Võ Tấn Qui-------------------------------------- */

    // Response for room type availability (for future booking system)
    public class RoomTypeAvailabilityResponse
    {
        public int RoomTypeId { get; set; }
        public string RoomTypeName { get; set; }
        public int TotalRooms { get; set; }
        public int AvailableRooms { get; set; }
        public int BookedRooms { get; set; }
        public decimal CurrentPrice { get; set; }
        public bool IsAvailable { get; set; }
        public DateTime CheckDate { get; set; }
    }


    /* -----------------------------Võ Tấn Qui-------------------------------------- */


    // Response for room type pricing (for dynamic pricing)
    public class RoomTypePricingResponse
    {
        public int RoomTypeId { get; set; }
        public string RoomTypeName { get; set; }
        public decimal BasePrice { get; set; }
        public decimal? WeekendPrice { get; set; }
        public decimal? HolidayPrice { get; set; }
        public decimal WeeklyDiscountPercent { get; set; }
        public decimal MonthlyDiscountPercent { get; set; }
        public decimal FinalPrice { get; set; }
        public string PriceType { get; set; } // "base", "weekend", "holiday"
        public bool IsDiscounted { get; set; }
        public decimal? DiscountAmount { get; set; }
        public DateTime PriceDate { get; set; }
    }

    /* -----------------------------Võ Tấn Qui-------------------------------------- */


    // Response for room search with filters
    public class RoomSearchResponse
    {
        public int TotalRoomTypes { get; set; }
        public int TotalAvailableRooms { get; set; }
        public decimal MinPrice { get; set; }
        public decimal MaxPrice { get; set; }
        public List<RoomTypeResponse> RoomTypes { get; set; } = new();
        public List<string> AvailableBedTypes { get; set; } = new();
        public List<RoomAmenityCountResponse> PopularAmenities { get; set; } = new();
    }



    /* -----------------------------Võ Tấn Qui-------------------------------------- */


    public class RoomAmenityCountResponse
    {
        public int AmenityId { get; set; }
        public string AmenityName { get; set; }
        public int RoomCount { get; set; }
        public decimal Percentage { get; set; }
    }




    /* -----------------------------Võ Tấn Qui-------------------------------------- */


    // Response for room statistics (for host dashboard)
    public class RoomStatisticsResponse
    {
        public int PropertyId { get; set; }
        public string PropertyName { get; set; }
        public int TotalRoomTypes { get; set; }
        public int TotalRooms { get; set; }
        public int ActiveRoomTypes { get; set; }
        public int InactiveRoomTypes { get; set; }
        public decimal AveragePrice { get; set; }
        public decimal LowestPrice { get; set; }
        public decimal HighestPrice { get; set; }
        public int TotalImages { get; set; }
        public int RoomTypesWithoutImages { get; set; }
        public List<RoomTypeSummaryResponse> RoomTypeSummaries { get; set; } = new();
    }


    /* -----------------------------Võ Tấn Qui-------------------------------------- */


    public class RoomTypeSummaryResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public decimal BasePrice { get; set; }
        public int TotalRooms { get; set; }
        public int ImageCount { get; set; }
        public int AmenityCount { get; set; }
        public bool IsActive { get; set; }
        public bool HasPrimaryImage { get; set; }
        public DateTime LastUpdated { get; set; }
    }
}
