using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QBooking.Data;
using QBooking.Models;
using QBooking.Dtos.Response;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AnalyticsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Phân tích xu hướng tìm kiếm theo thời gian
        [HttpGet("search-trends")]
        public async Task<ActionResult<ApiResponse<SearchTrendsResponse>>> GetSearchTrends(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string groupBy = "day")
        {
            try
            {
                var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
                var end = endDate ?? DateTime.UtcNow;

                var searches = await _context.SearchHistories
                    .Where(s => s.CreatedAt >= start && s.CreatedAt <= end)
                    .ToListAsync();

                var grouped = groupBy.ToLower() switch
                {
                    "week" => searches.GroupBy(s => (object)new
                    {
                        Year = s.CreatedAt.Year,
                        Week = (s.CreatedAt.DayOfYear - 1) / 7 + 1
                    }),
                    "month" => searches.GroupBy(s => (object)new
                    {
                        Year = s.CreatedAt.Year,
                        Month = s.CreatedAt.Month
                    }),
                    _ => searches.GroupBy(s => (object)s.CreatedAt.Date)
                };


                var trends = grouped.Select(g => new SearchTrendItem
                {
                    Period = groupBy.ToLower() == "day"
                        ? g.Key.ToString()
                        : $"{g.First().CreatedAt.Year}-{g.First().CreatedAt.Month:00}",
                    TotalSearches = g.Count(),
                    UniqueUsers = g.Where(s => s.UserId.HasValue).Select(s => s.UserId).Distinct().Count(),
                    UniqueSessions = g.Select(s => s.SessionId).Distinct().Count(),
                    AvgResultCount = g.Average(s => s.ResultCount)
                }).OrderBy(x => x.Period).ToList();

                var response = new SearchTrendsResponse
                {
                    StartDate = start,
                    EndDate = end,
                    GroupBy = groupBy,
                    Trends = trends
                };

                return Ok(new ApiResponse<SearchTrendsResponse>
                {
                    Success = true,
                    Message = "Lấy xu hướng tìm kiếm thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<SearchTrendsResponse>
                {
                    Success = false,
                    Message = "Lỗi khi lấy xu hướng tìm kiếm",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // 2. Top từ khóa tìm kiếm phổ biến
        [HttpGet("top-keywords")]
        public async Task<ActionResult<ApiResponse<TopKeywordsResponse>>> GetTopKeywords(
            [FromQuery] int top = 10,
            [FromQuery] int? days = 30)
        {
            try
            {
                var startDate = DateTime.UtcNow.AddDays(-(days ?? 30));

                var keywords = await _context.SearchHistories
                    .Where(s => s.CreatedAt >= startDate && !string.IsNullOrEmpty(s.SearchKeyword))
                    .GroupBy(s => s.SearchKeyword.ToLower())
                    .Select(g => new KeywordItem
                    {
                        Keyword = g.Key,
                        SearchCount = g.Count(),
                        UniqueUsers = g.Where(s => s.UserId.HasValue).Select(s => s.UserId).Distinct().Count(),
                        AvgResultCount = g.Average(s => s.ResultCount),
                        LastSearched = g.Max(s => s.CreatedAt)
                    })
                    .OrderByDescending(x => x.SearchCount)
                    .Take(top)
                    .ToListAsync();

                var response = new TopKeywordsResponse
                {
                    Period = $"Last {days} days",
                    Top = top,
                    Keywords = keywords
                };

                return Ok(new ApiResponse<TopKeywordsResponse>
                {
                    Success = true,
                    Message = "Lấy top keywords thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<TopKeywordsResponse>
                {
                    Success = false,
                    Message = "Lỗi khi lấy top keywords",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // 3. Phân tích địa điểm tìm kiếm phổ biến
        [HttpGet("popular-locations")]
        public async Task<ActionResult<ApiResponse<PopularLocationsResponse>>> GetPopularLocations(
            [FromQuery] int top = 10)
        {
            try
            {
                var provinces = await _context.SearchHistories
                    .Where(s => s.ProvinceId.HasValue)
                    .GroupBy(s => new { s.ProvinceId, s.Province.Name })
                    .Select(g => new LocationItem
                    {
                        LocationId = g.Key.ProvinceId.Value,
                        LocationName = g.Key.Name,
                        SearchCount = g.Count(),
                        UniqueUsers = g.Where(s => s.UserId.HasValue).Select(s => s.UserId).Distinct().Count()
                    })
                    .OrderByDescending(x => x.SearchCount)
                    .Take(top)
                    .ToListAsync();

                var communes = await _context.SearchHistories
                    .Where(s => s.CommuneId.HasValue)
                    .GroupBy(s => new { s.CommuneId, s.Commune.Name, s.Commune.ProvinceId })
                    .Select(g => new CommuneLocationItem
                    {
                        CommuneId = g.Key.CommuneId.Value,
                        CommuneName = g.Key.Name,
                        ProvinceId = g.Key.ProvinceId,
                        SearchCount = g.Count()
                    })
                    .OrderByDescending(x => x.SearchCount)
                    .Take(top)
                    .ToListAsync();

                var response = new PopularLocationsResponse
                {
                    TopProvinces = provinces,
                    TopCommunes = communes
                };

                return Ok(new ApiResponse<PopularLocationsResponse>
                {
                    Success = true,
                    Message = "Lấy địa điểm phổ biến thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<PopularLocationsResponse>
                {
                    Success = false,
                    Message = "Lỗi khi lấy địa điểm phổ biến",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // 4. Phân tích loại hình bất động sản được tìm kiếm
        [HttpGet("property-type-distribution")]
        public async Task<ActionResult<ApiResponse<PropertyTypeDistributionResponse>>> GetPropertyTypeDistribution(
            [FromQuery] int? days = 30)
        {
            try
            {
                var startDate = DateTime.UtcNow.AddDays(-(days ?? 30));

                var distribution = await _context.SearchHistories
                    .Where(s => s.CreatedAt >= startDate && !string.IsNullOrEmpty(s.PropertyType))
                    .GroupBy(s => s.PropertyType)
                    .Select(g => new PropertyTypeItem
                    {
                        PropertyType = g.Key,
                        Count = g.Count()
                    })
                    .OrderByDescending(x => x.Count)
                    .ToListAsync();

                var total = distribution.Sum(d => d.Count);
                foreach (var item in distribution)
                {
                    item.Percentage = Math.Round((double)item.Count / total * 100, 2);
                }

                var response = new PropertyTypeDistributionResponse
                {
                    Period = $"Last {days} days",
                    TotalSearches = total,
                    Distribution = distribution
                };

                return Ok(new ApiResponse<PropertyTypeDistributionResponse>
                {
                    Success = true,
                    Message = "Lấy phân bố loại hình thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<PropertyTypeDistributionResponse>
                {
                    Success = false,
                    Message = "Lỗi khi lấy phân bố loại hình",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // 5. Phân tích giá tìm kiếm
        [HttpGet("price-range-analysis")]
        public async Task<ActionResult<ApiResponse<PriceRangeAnalysisResponse>>> GetPriceRangeAnalysis()
        {
            try
            {
                var searches = await _context.SearchHistories
                    .Where(s => s.PriceMin.HasValue || s.PriceMax.HasValue)
                    .Select(s => new { s.PriceMin, s.PriceMax })
                    .ToListAsync();

                var priceRanges = new[]
                {
                    new { Range = "0-500K", Min = 0m, Max = 500000m },
                    new { Range = "500K-1M", Min = 500000m, Max = 1000000m },
                    new { Range = "1M-2M", Min = 1000000m, Max = 2000000m },
                    new { Range = "2M-5M", Min = 2000000m, Max = 5000000m },
                    new { Range = "5M+", Min = 5000000m, Max = decimal.MaxValue }
                };

                var distribution = priceRanges.Select(range => new PriceRangeItem
                {
                    Range = range.Range,
                    Count = searches.Count(s =>
                        (s.PriceMin ?? 0) >= range.Min && (s.PriceMax ?? decimal.MaxValue) <= range.Max)
                }).ToList();

                var response = new PriceRangeAnalysisResponse
                {
                    Distribution = distribution,
                    AveragePriceMin = searches.Where(s => s.PriceMin.HasValue).Any()
                        ? searches.Where(s => s.PriceMin.HasValue).Average(s => s.PriceMin.Value)
                        : 0,
                    AveragePriceMax = searches.Where(s => s.PriceMax.HasValue).Any()
                        ? searches.Where(s => s.PriceMax.HasValue).Average(s => s.PriceMax.Value)
                        : 0
                };

                return Ok(new ApiResponse<PriceRangeAnalysisResponse>
                {
                    Success = true,
                    Message = "Lấy phân tích giá thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<PriceRangeAnalysisResponse>
                {
                    Success = false,
                    Message = "Lỗi khi lấy phân tích giá",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // 6. Phân tích lượt xem property
        [HttpGet("property-views-stats")]
        public async Task<ActionResult<ApiResponse<PropertyViewsStatsResponse>>> GetPropertyViewsStats(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var start = startDate ?? DateTime.UtcNow.AddMonths(-1);
                var end = endDate ?? DateTime.UtcNow;

                var views = await _context.PropertyViews
                    .Where(v => v.ViewedAt >= start && v.ViewedAt <= end)
                    .ToListAsync();

                var viewsByDay = views.GroupBy(v => v.ViewedAt.Date)
                    .Select(g => new ViewsByDayItem
                    {
                        Date = g.Key,
                        Count = g.Count()
                    })
                    .OrderBy(x => x.Date)
                    .ToList();

                var uniqueProperties = views.Select(v => v.PropertyId).Distinct().Count();

                var response = new PropertyViewsStatsResponse
                {
                    StartDate = start,
                    EndDate = end,
                    TotalViews = views.Count,
                    UniqueProperties = uniqueProperties,
                    UniqueUsers = views.Where(v => v.UserId.HasValue).Select(v => v.UserId).Distinct().Count(),
                    UniqueIPAddresses = views.Where(v => !string.IsNullOrEmpty(v.IPAddress))
                        .Select(v => v.IPAddress).Distinct().Count(),
                    AvgViewsPerProperty = uniqueProperties > 0 ? (double)views.Count / uniqueProperties : 0,
                    ViewsByDay = viewsByDay
                };

                return Ok(new ApiResponse<PropertyViewsStatsResponse>
                {
                    Success = true,
                    Message = "Lấy thống kê lượt xem thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<PropertyViewsStatsResponse>
                {
                    Success = false,
                    Message = "Lỗi khi lấy thống kê lượt xem",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // 7. Top properties được xem nhiều nhất
        [HttpGet("top-viewed-properties")]
        public async Task<ActionResult<ApiResponse<TopViewedPropertiesResponse>>> GetTopViewedProperties(
            [FromQuery] int top = 10,
            [FromQuery] int? days = 30)
        {
            try
            {
                var startDate = DateTime.UtcNow.AddDays(-(days ?? 30));

                var properties = await _context.PropertyViews
                    .Where(v => v.ViewedAt >= startDate)
                    .GroupBy(v => new { v.PropertyId, v.Property.Name })
                    .Select(g => new TopPropertyItem
                    {
                        PropertyId = g.Key.PropertyId,
                        PropertyTitle = g.Key.Name,
                        ViewCount = g.Count(),
                        UniqueViewers = g.Where(v => v.UserId.HasValue).Select(v => v.UserId).Distinct().Count(),
                        LastViewed = g.Max(v => v.ViewedAt)
                    })
                    .OrderByDescending(x => x.ViewCount)
                    .Take(top)
                    .ToListAsync();

                var response = new TopViewedPropertiesResponse
                {
                    Period = $"Last {days} days",
                    Top = top,
                    Properties = properties
                };

                return Ok(new ApiResponse<TopViewedPropertiesResponse>
                {
                    Success = true,
                    Message = "Lấy top properties thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<TopViewedPropertiesResponse>
                {
                    Success = false,
                    Message = "Lỗi khi lấy top properties",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // 8. Phân tích hành vi người dùng (User Journey)
        [HttpGet("user-journey/{userId}")]
        public async Task<ActionResult<ApiResponse<UserJourneyResponse>>> GetUserJourney(int userId)
        {
            try
            {
                var searches = await _context.SearchHistories
                    .Where(s => s.UserId == userId)
                    .Include(s => s.Province)
                    .Include(s => s.Commune)
                    .OrderBy(s => s.CreatedAt)
                    .ToListAsync();

                var views = await _context.PropertyViews
                    .Where(v => v.UserId == userId)
                    .Include(v => v.Property)
                    .OrderBy(v => v.ViewedAt)
                    .ToListAsync();

                var searchHistory = searches.Select(s => new SearchHistoryItem
                {
                    SearchKeyword = s.SearchKeyword,
                    CreatedAt = s.CreatedAt,
                    ResultCount = s.ResultCount,
                    ProvinceName = s.Province?.Name,
                    CommuneName = s.Commune?.Name
                }).ToList();

                var viewHistory = views.Select(v => new ViewHistoryItem
                {
                    PropertyId = v.PropertyId,
                    PropertyTitle = v.Property.Name,
                    ViewedAt = v.ViewedAt
                }).ToList();

                var response = new UserJourneyResponse
                {
                    UserId = userId,
                    TotalSearches = searches.Count,
                    TotalViews = views.Count,
                    FirstActivity = searches.Any() ? searches.First().CreatedAt : (DateTime?)null,
                    LastActivity = views.Any() ? views.Last().ViewedAt :
                        (searches.Any() ? searches.Last().CreatedAt : (DateTime?)null),
                    SearchHistory = searchHistory,
                    ViewHistory = viewHistory
                };

                return Ok(new ApiResponse<UserJourneyResponse>
                {
                    Success = true,
                    Message = "Lấy hành trình người dùng thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<UserJourneyResponse>
                {
                    Success = false,
                    Message = "Lỗi khi lấy hành trình người dùng",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // 9. Conversion rate (từ tìm kiếm đến xem chi tiết)
        [HttpGet("conversion-rate")]
        public async Task<ActionResult<ApiResponse<ConversionRateResponse>>> GetConversionRate(
            [FromQuery] int? days = 30)
        {
            try
            {
                var startDate = DateTime.UtcNow.AddDays(-(days ?? 30));

                var totalSearches = await _context.SearchHistories
                    .Where(s => s.CreatedAt >= startDate)
                    .CountAsync();

                var searchesWithViews = await _context.SearchHistories
                    .Where(s => s.CreatedAt >= startDate && s.UserId.HasValue)
                    .Select(s => s.UserId.Value)
                    .Distinct()
                    .CountAsync();

                var usersWithViews = await _context.PropertyViews
                    .Where(v => v.ViewedAt >= startDate && v.UserId.HasValue)
                    .Select(v => v.UserId.Value)
                    .Distinct()
                    .CountAsync();

                var response = new ConversionRateResponse
                {
                    Period = $"Last {days} days",
                    TotalSearches = totalSearches,
                    UsersWhoSearched = searchesWithViews,
                    UsersWhoViewed = usersWithViews,
                    ConversionRate = totalSearches > 0
                        ? Math.Round((double)usersWithViews / totalSearches * 100, 2)
                        : 0,
                    AvgSearchesPerUser = searchesWithViews > 0
                        ? Math.Round((double)totalSearches / searchesWithViews, 2)
                        : 0
                };

                return Ok(new ApiResponse<ConversionRateResponse>
                {
                    Success = true,
                    Message = "Lấy tỷ lệ chuyển đổi thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<ConversionRateResponse>
                {
                    Success = false,
                    Message = "Lỗi khi lấy tỷ lệ chuyển đổi",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // 10. Phân tích theo thời gian (Peak hours)
        [HttpGet("peak-hours")]
        public async Task<ActionResult<ApiResponse<PeakHoursResponse>>> GetPeakHours(
            [FromQuery] int? days = 30)
        {
            try
            {
                var startDate = DateTime.UtcNow.AddDays(-(days ?? 30));

                var searchesByHour = await _context.SearchHistories
                    .Where(s => s.CreatedAt >= startDate)
                    .GroupBy(s => s.CreatedAt.Hour)
                    .Select(g => new HourlyActivityItem
                    {
                        Hour = g.Key,
                        Count = g.Count()
                    })
                    .OrderBy(x => x.Hour)
                    .ToListAsync();

                var viewsByHour = await _context.PropertyViews
                    .Where(v => v.ViewedAt >= startDate)
                    .GroupBy(v => v.ViewedAt.Hour)
                    .Select(g => new HourlyActivityItem
                    {
                        Hour = g.Key,
                        Count = g.Count()
                    })
                    .OrderBy(x => x.Hour)
                    .ToListAsync();

                var response = new PeakHoursResponse
                {
                    Period = $"Last {days} days",
                    SearchesByHour = searchesByHour,
                    ViewsByHour = viewsByHour,
                    PeakSearchHour = searchesByHour.OrderByDescending(x => x.Count).FirstOrDefault()?.Hour,
                    PeakViewHour = viewsByHour.OrderByDescending(x => x.Count).FirstOrDefault()?.Hour
                };

                return Ok(new ApiResponse<PeakHoursResponse>
                {
                    Success = true,
                    Message = "Lấy giờ cao điểm thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<PeakHoursResponse>
                {
                    Success = false,
                    Message = "Lỗi khi lấy giờ cao điểm",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
    }
}