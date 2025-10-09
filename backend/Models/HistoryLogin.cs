namespace QBooking.Models
{
    public class HistoryLogin
    {
        public long Id { get; set; }

        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;

        public DateTime LoginTime { get; set; } = DateTime.UtcNow;
        public string? IpAddress { get; set; }
        public string? DeviceInfo { get; set; }
        public bool IsSuccess { get; set; }
        public string? FailureReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; } = null!;
    }
}
