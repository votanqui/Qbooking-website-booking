namespace QBooking.Dtos.Response
{
    // 1. Search Trends Response
    public class SearchTrendsResponse
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string GroupBy { get; set; }
        public List<SearchTrendItem> Trends { get; set; }
    }

    public class SearchTrendItem
    {
        public string Period { get; set; }
        public int TotalSearches { get; set; }
        public int UniqueUsers { get; set; }
        public int UniqueSessions { get; set; }
        public double AvgResultCount { get; set; }
    }

    // 2. Top Keywords Response
    public class TopKeywordsResponse
    {
        public string Period { get; set; }
        public int Top { get; set; }
        public List<KeywordItem> Keywords { get; set; }
    }

    public class KeywordItem
    {
        public string Keyword { get; set; }
        public int SearchCount { get; set; }
        public int UniqueUsers { get; set; }
        public double AvgResultCount { get; set; }
        public DateTime LastSearched { get; set; }
    }

    // 3. Popular Locations Response
    public class PopularLocationsResponse
    {
        public List<LocationItem> TopProvinces { get; set; }
        public List<CommuneLocationItem> TopCommunes { get; set; }
    }

    public class LocationItem
    {
        public int LocationId { get; set; }
        public string LocationName { get; set; }
        public int SearchCount { get; set; }
        public int UniqueUsers { get; set; }
    }

    public class CommuneLocationItem
    {
        public int CommuneId { get; set; }
        public string CommuneName { get; set; }
        public int ProvinceId { get; set; }
        public int SearchCount { get; set; }
    }

    // 4. Property Type Distribution Response
    public class PropertyTypeDistributionResponse
    {
        public string Period { get; set; }
        public int TotalSearches { get; set; }
        public List<PropertyTypeItem> Distribution { get; set; }
    }

    public class PropertyTypeItem
    {
        public string PropertyType { get; set; }
        public int Count { get; set; }
        public double Percentage { get; set; }
    }

    // 5. Price Range Analysis Response
    public class PriceRangeAnalysisResponse
    {
        public List<PriceRangeItem> Distribution { get; set; }
        public decimal AveragePriceMin { get; set; }
        public decimal AveragePriceMax { get; set; }
    }

    public class PriceRangeItem
    {
        public string Range { get; set; }
        public int Count { get; set; }
    }

    // 6. Property Views Stats Response
    public class PropertyViewsStatsResponse
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalViews { get; set; }
        public int UniqueProperties { get; set; }
        public int UniqueUsers { get; set; }
        public int UniqueIPAddresses { get; set; }
        public double AvgViewsPerProperty { get; set; }
        public List<ViewsByDayItem> ViewsByDay { get; set; }
    }

    public class ViewsByDayItem
    {
        public DateTime Date { get; set; }
        public int Count { get; set; }
    }

    // 7. Top Viewed Properties Response
    public class TopViewedPropertiesResponse
    {
        public string Period { get; set; }
        public int Top { get; set; }
        public List<TopPropertyItem> Properties { get; set; }
    }

    public class TopPropertyItem
    {
        public int PropertyId { get; set; }
        public string PropertyTitle { get; set; }
        public int ViewCount { get; set; }
        public int UniqueViewers { get; set; }
        public DateTime LastViewed { get; set; }
    }

    // 8. User Journey Response
    public class UserJourneyResponse
    {
        public int UserId { get; set; }
        public int TotalSearches { get; set; }
        public int TotalViews { get; set; }
        public DateTime? FirstActivity { get; set; }
        public DateTime? LastActivity { get; set; }
        public List<SearchHistoryItem> SearchHistory { get; set; }
        public List<ViewHistoryItem> ViewHistory { get; set; }
    }

    public class SearchHistoryItem
    {
        public string SearchKeyword { get; set; }
        public DateTime CreatedAt { get; set; }
        public int ResultCount { get; set; }
        public string ProvinceName { get; set; }
        public string CommuneName { get; set; }
    }

    public class ViewHistoryItem
    {
        public int PropertyId { get; set; }
        public string PropertyTitle { get; set; }
        public DateTime ViewedAt { get; set; }
    }

    // 9. Conversion Rate Response
    public class ConversionRateResponse
    {
        public string Period { get; set; }
        public int TotalSearches { get; set; }
        public int UsersWhoSearched { get; set; }
        public int UsersWhoViewed { get; set; }
        public double ConversionRate { get; set; }
        public double AvgSearchesPerUser { get; set; }
    }

    // 10. Peak Hours Response
    public class PeakHoursResponse
    {
        public string Period { get; set; }
        public List<HourlyActivityItem> SearchesByHour { get; set; }
        public List<HourlyActivityItem> ViewsByHour { get; set; }
        public int? PeakSearchHour { get; set; }
        public int? PeakViewHour { get; set; }
    }

    public class HourlyActivityItem
    {
        public int Hour { get; set; }
        public int Count { get; set; }
    }
}