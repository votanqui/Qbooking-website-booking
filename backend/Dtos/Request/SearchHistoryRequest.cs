namespace QBooking.Dtos.Request
{
    public class CreateSearchHistoryRequest
    {
        public string? SearchKeyword { get; set; }
        public int? ProvinceId { get; set; }
        public int? CommuneId { get; set; }
        public string? PropertyType { get; set; }
        public DateTime? CheckIn { get; set; }
        public DateTime? CheckOut { get; set; }
        public int? Adults { get; set; }
        public int? Children { get; set; }
        public decimal? PriceMin { get; set; }
        public decimal? PriceMax { get; set; }
        public byte? StarRating { get; set; }
        public int? ResultCount { get; set; }
    }
    public class UpdateSearchHistoryRequest
    {
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
    }

    public class SearchHistoryFilterRequest
    {
        public int? UserId { get; set; }
        public string? SessionId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class PopularSearchesRequest
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int Limit { get; set; } = 10;
    }
}
