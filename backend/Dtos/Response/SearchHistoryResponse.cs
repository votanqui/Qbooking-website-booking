namespace QBooking.Dtos.Response
{
    public class SearchHistoryResponse
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string SessionId { get; set; }
        public string SearchKeyword { get; set; }
        public int? ProvinceId { get; set; }
        public int? CommuneId { get; set; }
        public string PropertyType { get; set; }
        public DateTime? CheckIn { get; set; }
        public DateTime? CheckOut { get; set; }
        public int? Adults { get; set; }
        public int? Children { get; set; }
        public decimal? PriceMin { get; set; }
        public decimal? PriceMax { get; set; }
        public byte? StarRating { get; set; }
        public int ResultCount { get; set; }
        public string IPAddress { get; set; }
        public string UserAgent { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public UserResponse User { get; set; }
        public ProvinceResponse Province { get; set; }
        public CommuneResponse Commune { get; set; }
    }

    public class UserResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
    }

    public class ProvinceResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Code { get; set; }
    }

    public class CommuneResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Code { get; set; }
    }

    public class SearchHistoryListResponse
    {
        public List<SearchHistoryResponse> Items { get; set; }
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class UserSearchStatsResponse
    {
        public int TotalSearches { get; set; }
        public List<TopSearchKeywordResponse> TopSearchKeywords { get; set; }
        public List<TopProvinceResponse> TopProvinces { get; set; }
    }

    public class TopSearchKeywordResponse
    {
        public string Keyword { get; set; }
        public int Count { get; set; }
    }

    public class TopProvinceResponse
    {
        public int? ProvinceId { get; set; }
        public string ProvinceName { get; set; }
        public int Count { get; set; }
    }

    public class PopularSearchResponse
    {
        public string Keyword { get; set; }
        public int Count { get; set; }
    }
}
