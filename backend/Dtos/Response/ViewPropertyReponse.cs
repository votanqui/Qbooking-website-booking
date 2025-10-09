namespace QBooking.Dtos.Response
{
    public class PropertyViewDto
    {
        public long Id { get; set; }
        public int PropertyId { get; set; }
        public int? UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public DateTime ViewedAt { get; set; }
        public string? IPAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? Referrer { get; set; }
    }

    public class UserViewHistoryDto
    {
        public long Id { get; set; }
        public int PropertyId { get; set; }
        public string PropertyTitle { get; set; } = string.Empty;
        public string PropertyAddress { get; set; } = string.Empty;
        public DateTime ViewedAt { get; set; }
    }

    public class PropertyViewsResponse
    {
        public List<PropertyViewDto> Views { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class UserViewHistoryResponse
    {
        public List<UserViewHistoryDto> Views { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class PropertyViewStatistics
    {
        public int TotalViews { get; set; }
        public int UniqueUsers { get; set; }
        public int AnonymousViews { get; set; }
        public int RegisteredUserViews { get; set; }
        public List<PropertyViewCount> TopProperties { get; set; } = new();
        public List<DailyViewStat> DailyStats { get; set; } = new();
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
    }

    public class PropertyViewCount
    {
        public int PropertyId { get; set; }
        public string PropertyTitle { get; set; } = string.Empty;
        public int ViewCount { get; set; }
    }

    public class DailyViewStat
    {
        public DateTime Date { get; set; }
        public int ViewCount { get; set; }
        public int UniqueUsers { get; set; }
    }

    public class PopularPropertyDto
    {
        public int PropertyId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public int ViewCount { get; set; }
        public int UniqueViewers { get; set; }
    }
}
