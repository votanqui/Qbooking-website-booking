namespace QBooking.Models
{
    public class PropertyView
    {
        public long Id { get; set; }

        public int PropertyId { get; set; }
        public int? UserId { get; set; }

        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
        public string? IPAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? Referrer { get; set; }

        // Navigation
        public Property Property { get; set; } = null!;
        public User? User { get; set; }
    }
}
