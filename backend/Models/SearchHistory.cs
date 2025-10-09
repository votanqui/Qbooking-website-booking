namespace QBooking.Models
{
    public class SearchHistory
    {
        public int Id { get; set; }

        public int? UserId { get; set; }

        public string SessionId { get; set; }

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

        public int ResultCount { get; set; }

        public string IPAddress { get; set; }

        public string UserAgent { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; }
        public Province Province { get; set; }
        public Commune Commune { get; set; }
    }
}
