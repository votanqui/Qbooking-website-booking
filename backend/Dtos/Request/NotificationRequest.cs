namespace QBooking.Dtos.Request
{
    public class AdminNotificationFilterRequest
    {
        public string? Type { get; set; }
        public string? Priority { get; set; }
        public bool? IsRead { get; set; }
        public int? UserId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class AdminSendNotificationRequest
    {
        public int UserId { get; set; }
        public string Type { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Priority { get; set; } = "normal";
        public string? RelatedType { get; set; }
        public int? RelatedId { get; set; }
        public bool SendEmail { get; set; } = false;
    }

    public class AdminBroadcastNotificationRequest
    {
        public List<int> UserIds { get; set; }
        public string Type { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Priority { get; set; } = "normal";
        public bool SendEmail { get; set; } = false;
    }

    public class NotificationReportRequest
    {
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public string GroupBy { get; set; } = "day"; // day, week, month
    }
    public class TestNotificationRequest
    {
        public int UserId { get; set; }
        public string? Title { get; set; }
        public string? Content { get; set; }
    }
    public class AdminSendToAllNotificationRequest
    {
        public string Type { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Priority { get; set; } = "normal";
        public bool SendEmail { get; set; } = false;
        public string? RelatedType { get; set; }
        public int? RelatedId { get; set; }
    }
}
