namespace QBooking.Dtos.Response
{
    public class AmenityCategoryResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Icon { get; set; }
        public string Description { get; set; }
        public int SortOrder { get; set; }
        public List<AmenityResponse> Amenities { get; set; } = new List<AmenityResponse>();
    }



    /* ------------------------------------------------------------------- */


    public class AmenityResponse
    {
        public int Id { get; set; }
        public int CategoryId { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Icon { get; set; }
        public string Description { get; set; }
        public bool IsPopular { get; set; }
        public int SortOrder { get; set; }
        public string CategoryName { get; set; }
    }



    /* ------------------------------------------------------------------- */


    public class PaginatedResponse<T>
    {
        public List<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPrevPage { get; set; }
    }


    /* ------------------------------------------------------------------- */
    public class AmenityStatisticsOverview
    {
        public int TotalCategories { get; set; }
        public int TotalAmenities { get; set; }
        public int PopularAmenities { get; set; }
        public int TotalPropertyAmenities { get; set; }
        public List<CategoryWithCount> TopCategories { get; set; }
    }

    public class CategoryWithCount
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public int AmenityCount { get; set; }
        public int PropertyCount { get; set; }
    }

    public class AmenityUsageStatistics
    {
        public int AmenityId { get; set; }
        public string AmenityName { get; set; }
        public string CategoryName { get; set; }
        public string Icon { get; set; }
        public bool IsPopular { get; set; }
        public int UsageCount { get; set; }
        public int PropertyCount { get; set; }
    }

    public class UnusedAmenityResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string CategoryName { get; set; }
        public string Icon { get; set; }
        public bool IsPopular { get; set; }

    }

    public class CategoryStatistics
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public string Icon { get; set; }
        public int TotalAmenities { get; set; }
        public int PopularAmenities { get; set; }
        public int TotalUsage { get; set; }
        public int UniqueProperties { get; set; }
        public double AverageUsagePerAmenity { get; set; }
    }



}
