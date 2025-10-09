using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using QBooking.Data;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatbotController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;
        private readonly ILogger<ChatbotController> _logger;
        private readonly IMemoryCache _cache;

        public ChatbotController(
            ApplicationDbContext context,
            IHttpClientFactory httpClientFactory,
            IConfiguration config,
            ILogger<ChatbotController> logger,
            IMemoryCache cache)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _config = config;
            _logger = logger;
            _cache = cache;
        }

        [HttpPost("ask")]
        public async Task<IActionResult> Ask([FromBody] ChatRequest request)
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            try
            {
                if (string.IsNullOrWhiteSpace(request.Question))
                {
                    return BadRequest(new { error = "Câu hỏi không được để trống" });
                }

                var question = request.Question.ToLower();
                bool isBookingRelated = IsBookingRelated(question);

                _logger.LogInformation("⏱️ Start: {Question}", request.Question);

                var client = _httpClientFactory.CreateClient();
                var apiKey = _config["OpenAI:ApiKey"];

                if (string.IsNullOrEmpty(apiKey))
                {
                    return BadRequest(new { error = "OpenAI API Key chưa được cấu hình" });
                }

                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                client.Timeout = TimeSpan.FromSeconds(30);

                string systemPrompt;
                string userPrompt;

                // 🔧 Lấy URL từ config
                string backendUrl = _config["Backend:BaseUrl"] ?? $"{Request.Scheme}://{Request.Host}";
                string frontendUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:3000";

                if (isBookingRelated)
                {
                    // 🔥 BỎ GPT EXTRACTION - Dùng REGEX thay thế (nhanh gấp 100 lần!)
                    var sw1 = System.Diagnostics.Stopwatch.StartNew();
                    var criteria = ExtractSearchCriteriaFast(request.Question);
                    sw1.Stop();
                    _logger.LogInformation("⏱️ Extract (regex): {Ms}ms - {@Criteria}", sw1.ElapsedMilliseconds, criteria);

                    var sw2 = System.Diagnostics.Stopwatch.StartNew();
                    var properties = await FindMatchingPropertiesSuperFast(criteria);
                    sw2.Stop();
                    _logger.LogInformation("⏱️ DB query: {Ms}ms - Found {Count}", sw2.ElapsedMilliseconds, properties.Count);

                    if (!properties.Any())
                    {
                        return Ok(new
                        {
                            answer = "Xin lỗi, hiện tại tôi không tìm thấy property nào phù hợp. " +
                                   "Bạn có thể thử thay đổi tiêu chí tìm kiếm không?"
                        });
                    }

                    var propertyText = FormatPropertiesForAI(properties, backendUrl, frontendUrl);

                    systemPrompt = @"Bạn là Minh - nhân viên tư vấn booking chuyên nghiệp.

NHIỆM VỤ: Tư vấn properties phù hợp nhất

QUY TẮC:
1. Dùng markdown format đẹp
2. Hiển thị ảnh: ![Tên]({url})
3. Đánh số properties
4. Highlight điểm mạnh
5. Format giá: {giá:N0} VND/đêm
6. Thêm emoji 🏨🌴⭐💰📍
7. KHÔNG bịa thông tin

CÁCH TRẢ LỜI:
- Chào và tóm tắt yêu cầu ngắn gọn
- Giới thiệu từng property
- Kết luận với gợi ý";

                    userPrompt = $@"Properties tìm được:

{propertyText}

Câu hỏi: {request.Question}

Hãy tư vấn chi tiết!";
                }
                else
                {
                    systemPrompt = @"Bạn là Minh - nhân viên tư vấn booking.
Hướng dẫn khách hỏi về:
- Tìm khách sạn/resort theo địa điểm
- Giá phòng, tiện nghi
- Chính sách đặt/hủy phòng

Trả lời ngắn gọn, thân thiện.";

                    userPrompt = request.Question;
                }

                var sw4 = System.Diagnostics.Stopwatch.StartNew();
                var answer = await GetGPTResponse(client, systemPrompt, userPrompt);
                sw4.Stop();
                _logger.LogInformation("⏱️ GPT response: {Ms}ms", sw4.ElapsedMilliseconds);

                stopwatch.Stop();
                _logger.LogInformation("⏱️ TOTAL: {Ms}ms", stopwatch.ElapsedMilliseconds);

                return Ok(new { answer });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AI chat");
                return StatusCode(500, new { error = "Đã có lỗi xảy ra", detail = ex.Message });
            }
        }

        private static readonly Regex BookingKeywordRegex = new Regex(
            @"\b(khách sạn|resort|villa|homestay|phòng|đặt phòng|booking|du lịch|nghỉ dưỡng|lưu trú|thuê phòng|checkin|checkout|giá phòng|tiện nghi|hồ bơi|gần biển|trung tâm)\b",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private bool IsBookingRelated(string question)
        {
            return BookingKeywordRegex.IsMatch(question);
        }

        // 🚀 REGEX-BASED EXTRACTION - Nhanh gấp 100 lần GPT!
        private BookingCriteria ExtractSearchCriteriaFast(string question)
        {
            var criteria = new BookingCriteria();
            var lowerQuestion = question.ToLower();

            // Extract province names
            var provinces = new[] {
                "hồ chí minh", "hcm", "sài gòn", "saigon",
                "hà nội", "hanoi",
                "đà nẵng", "da nang",
                "nha trang",
                "phú quốc", "phu quoc",
                "vũng tàu", "vung tau",
                "đà lạt", "da lat",
                "hội an", "hoi an",
                "huế", "hue",
                "cần thơ", "can tho",
                "hạ long", "ha long"
            };

            foreach (var province in provinces)
            {
                if (lowerQuestion.Contains(province))
                {
                    // Normalize province name
                    criteria.ProvinceName = province switch
                    {
                        var p when p.Contains("hồ chí minh") || p.Contains("hcm") || p.Contains("sài gòn") || p.Contains("saigon") => "Hồ Chí Minh",
                        var p when p.Contains("hà nội") || p.Contains("hanoi") => "Hà Nội",
                        var p when p.Contains("đà nẵng") || p.Contains("da nang") => "Đà Nẵng",
                        "nha trang" => "Nha Trang",
                        var p when p.Contains("phú quốc") || p.Contains("phu quoc") => "Phú Quốc",
                        var p when p.Contains("vũng tàu") || p.Contains("vung tau") => "Vũng Tàu",
                        var p when p.Contains("đà lạt") || p.Contains("da lat") => "Đà Lạt",
                        var p when p.Contains("hội an") || p.Contains("hoi an") => "Hội An",
                        var p when p.Contains("huế") || p.Contains("hue") => "Huế",
                        var p when p.Contains("cần thơ") || p.Contains("can tho") => "Cần Thơ",
                        var p when p.Contains("hạ long") || p.Contains("ha long") => "Hạ Long",
                        _ => province
                    };
                    break;
                }
            }

            // Extract product type
            if (Regex.IsMatch(lowerQuestion, @"\b(khách sạn|hotel)\b"))
                criteria.ProductTypeName = "hotel";
            else if (lowerQuestion.Contains("resort"))
                criteria.ProductTypeName = "resort";
            else if (lowerQuestion.Contains("villa"))
                criteria.ProductTypeName = "villa";
            else if (lowerQuestion.Contains("homestay"))
                criteria.ProductTypeName = "homestay";

            // Extract star rating
            var starMatch = Regex.Match(lowerQuestion, @"(\d)\s*sao");
            if (starMatch.Success)
            {
                criteria.MinRating = int.Parse(starMatch.Groups[1].Value);
            }

            // Extract price (simple patterns)
            var priceMatch = Regex.Match(lowerQuestion, @"(?:dưới|under|<)\s*(\d+(?:[,.\d]*)?)\s*(?:k|triệu|tr|m|million)?");
            if (priceMatch.Success)
            {
                var priceStr = priceMatch.Groups[1].Value.Replace(",", "").Replace(".", "");
                if (decimal.TryParse(priceStr, out var price))
                {
                    // Convert k/triệu to actual price
                    if (lowerQuestion.Contains("triệu") || lowerQuestion.Contains("tr") || lowerQuestion.Contains("m"))
                        criteria.MaxPrice = price * 1_000_000;
                    else if (lowerQuestion.Contains("k"))
                        criteria.MaxPrice = price * 1_000;
                    else
                        criteria.MaxPrice = price;
                }
            }

            // Extract guest count
            var guestMatch = Regex.Match(lowerQuestion, @"(\d+)\s*(?:người|khách|guest|pax)");
            if (guestMatch.Success)
            {
                criteria.Adults = int.Parse(guestMatch.Groups[1].Value);
            }

            // Extract amenities
            if (lowerQuestion.Contains("hồ bơi") || lowerQuestion.Contains("pool"))
                criteria.Amenities.Add("hồ bơi");
            if (lowerQuestion.Contains("gần biển") || lowerQuestion.Contains("beach"))
                criteria.Amenities.Add("gần biển");
            if (lowerQuestion.Contains("wifi"))
                criteria.Amenities.Add("wifi");
            if (lowerQuestion.Contains("gym"))
                criteria.Amenities.Add("gym");

            return criteria;
        }

        // 🚀 SUPER OPTIMIZED QUERY
        private async Task<List<PropertySearchResult>> FindMatchingPropertiesSuperFast(BookingCriteria criteria)
        {
            var cacheKey = $"props_{criteria.ProvinceName?.ToLower()}_{criteria.ProductTypeName?.ToLower()}_{criteria.MinRating}";

            if (_cache.TryGetValue<List<PropertySearchResult>>(cacheKey, out var cachedProperties))
            {
                _logger.LogInformation("✅ Cache HIT");
                return cachedProperties;
            }

            _logger.LogInformation("❌ Cache MISS - Querying...");

            var query = _context.Properties
                .AsNoTracking()
                .Where(p => p.Status == "approved" && p.IsActive);

            if (!string.IsNullOrEmpty(criteria.ProvinceName))
            {
                query = query.Where(p => EF.Functions.Like(p.Province.Name, $"%{criteria.ProvinceName}%"));
            }

            if (!string.IsNullOrEmpty(criteria.ProductTypeName))
            {
                var typeMap = new Dictionary<string, string>
                {
                    {"hotel", "hotel"}, {"resort", "resort"},
                    {"villa", "villa"}, {"homestay", "homestay"}
                };

                if (typeMap.TryGetValue(criteria.ProductTypeName.ToLower(), out var typeCode))
                {
                    query = query.Where(p => p.ProductType.Code == typeCode);
                }
            }

            if (criteria.MinRating.HasValue)
            {
                query = query.Where(p => p.StarRating >= criteria.MinRating.Value);
            }

            if (criteria.MaxPrice.HasValue)
            {
                query = query.Where(p => p.PriceFrom <= criteria.MaxPrice.Value);
            }

            // EAGER LOADING - Load tất cả related data 1 lần
            var properties = await query
                .Include(p => p.Province)
                .Include(p => p.ProductType)
                .Include(p => p.Images.Where(img => img.IsPrimary))
                .Include(p => p.Amenities.Take(5)).ThenInclude(pa => pa.Amenity)
                .Include(p => p.RoomTypes.Where(rt => rt.IsActive).Take(3))
                .OrderByDescending(p => p.IsFeatured)
                .ThenBy(p => p.PriceFrom)
                .Take(5)
                .ToListAsync();

            // Map to DTO (in-memory, siêu nhanh)
            var results = properties.Select(p => new PropertySearchResult
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                Address = p.AddressDetail,
                Province = p.Province.Name,
                ProductType = p.ProductType.Name,
                PriceFrom = p.PriceFrom,
                StarRating = p.StarRating,
                IsFeatured = p.IsFeatured,
                TotalRooms = p.TotalRooms,
                PrimaryImage = p.Images.FirstOrDefault(img => img.IsPrimary)?.ImageUrl,
                Amenities = p.Amenities.Select(pa => pa.Amenity.Name).ToList(),
                AvailableRoomTypes = p.RoomTypes
                    .Where(rt => rt.IsActive)
                    .Select(rt => new RoomTypeInfo
                    {
                        Name = rt.Name,
                        MaxGuests = rt.MaxGuests,
                        BasePrice = rt.BasePrice
                    }).ToList(),
                BookingCount = 0,
                AverageRating = null
            }).ToList();

            _cache.Set(cacheKey, results, TimeSpan.FromMinutes(15));

            return results;
        }

        // 🔧 Cập nhật hàm này - tách backend/frontend URL
        private string FormatPropertiesForAI(List<PropertySearchResult> properties, string backendUrl, string frontendUrl)
        {
            return string.Join("\n\n---\n\n", properties.Select((p, index) =>
            {
                // 📸 Ảnh dùng backend URL
                var imageUrl = !string.IsNullOrEmpty(p.PrimaryImage)
                    ? $"{backendUrl}{p.PrimaryImage}"
                    : $"{backendUrl}/images/default-property.jpg";

                // 🔗 Link chi tiết dùng frontend URL
                var detailLink = $"{frontendUrl}/properties/{p.Slug}";

                var roomInfo = p.AvailableRoomTypes.Any()
                    ? string.Join(", ", p.AvailableRoomTypes.Select(rt =>
                        $"{rt.Name} ({rt.MaxGuests} khách, {rt.BasePrice:N0}đ/đêm)"))
                    : "Liên hệ để biết chi tiết";

                return $@"### {index + 1}. {p.Name}

📍 {p.Address}, {p.Province}
🏨 {p.ProductType} - {p.StarRating} sao {(p.IsFeatured ? "⭐" : "")}
💰 Từ {p.PriceFrom:N0} VND/đêm
🏠 {p.TotalRooms} phòng

**Tiện nghi:** {string.Join(", ", p.Amenities)}
**Loại phòng:** {roomInfo}

**Ảnh:** {imageUrl}
**Link:** {detailLink}";
            }));
        }

        private async Task<string> GetGPTResponse(HttpClient client, string systemPrompt, string userPrompt)
        {
            var messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            };

            var payload = new
            {
                model = "gpt-4o-mini",
                messages = messages,
                temperature = 0.7,
                max_tokens = 1200
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync("https://api.openai.com/v1/chat/completions", content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"OpenAI API error: {error}");
            }

            var result = await response.Content.ReadFromJsonAsync<OpenAiResponse>();
            return result?.Choices?.FirstOrDefault()?.Message?.Content ?? "Xin lỗi, tôi không thể trả lời lúc này.";
        }

        // DTOs
        public class ChatRequest
        {
            public string Question { get; set; }
        }

        public class BookingCriteria
        {
            public int? ProvinceId { get; set; }
            public string ProvinceName { get; set; }
            public int? ProductTypeId { get; set; }
            public string ProductTypeName { get; set; }
            public decimal? MaxPrice { get; set; }
            public int? MinRating { get; set; }
            public int Adults { get; set; } = 1;
            public int Children { get; set; } = 0;
            public List<string> Amenities { get; set; } = new();
        }

        public class PropertySearchResult
        {
            public int Id { get; set; }
            public string Name { get; set; }
            public string Slug { get; set; }
            public string Address { get; set; }
            public string Province { get; set; }
            public string ProductType { get; set; }
            public decimal? PriceFrom { get; set; }
            public int StarRating { get; set; }
            public bool IsFeatured { get; set; }
            public string PrimaryImage { get; set; }
            public int TotalRooms { get; set; }
            public List<string> Amenities { get; set; }
            public List<RoomTypeInfo> AvailableRoomTypes { get; set; }
            public int BookingCount { get; set; }
            public decimal? AverageRating { get; set; }
        }

        public class RoomTypeInfo
        {
            public string Name { get; set; }
            public int MaxGuests { get; set; }
            public decimal BasePrice { get; set; }
        }

        public class OpenAiResponse
        {
            public List<Choice> Choices { get; set; }

            public class Choice
            {
                public Message Message { get; set; }
            }

            public class Message
            {
                public string Role { get; set; }
                public string Content { get; set; }
            }
        }
    }
}