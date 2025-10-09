using QBooking.Models;

namespace QBooking.Dtos.Response
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string? UserName { get; set; }
        public string? Type { get; set; }
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? EmailTo { get; set; }
        public bool EmailSent { get; set; }
        public DateTime? EmailSentAt { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public int? RelatedId { get; set; }
        public string? RelatedType { get; set; }
        public string? Priority { get; set; }
        public DateTime CreatedAt { get; set; }
        public int EmailRetryCount { get; set; }
        public int MaxEmailRetries { get; set; }
        public DateTime? NextEmailRetryAt { get; set; }
        public string? EmailError { get; set; }
    }

    public class NotificationListResponse
    {
        public List<NotificationDto> Notifications { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class EmailStatisticsResponse
    {
        public int TotalEmails { get; set; }
        public int SentEmails { get; set; }
        public int FailedEmails { get; set; }
        public int PendingEmails { get; set; }
        public double SuccessRate { get; set; }
        public List<TypeStatistic> TypeStatistics { get; set; } = new();
    }

    public class TypeStatistic
    {
        public string Type { get; set; } = string.Empty;
        public int Count { get; set; }
        public int SentCount { get; set; }
        public int FailedCount { get; set; }
    }
    public class NotificationStatisticsResponse
    {
        public int TotalNotifications { get; set; }
        public int TotalSent { get; set; }
        public int TotalRead { get; set; }
        public int TotalUnread { get; set; }
        public int TotalEmailSent { get; set; }
        public int TotalEmailFailed { get; set; }
        public Dictionary<string, int> ByType { get; set; }
        public Dictionary<string, int> ByPriority { get; set; }
        public double ReadRate { get; set; }
        public double EmailSuccessRate { get; set; }
    }

    public class UserNotificationStatisticsResponse
    {
        public int UserId { get; set; }
        public string UserName { get; set; }
        public string UserEmail { get; set; }
        public int TotalReceived { get; set; }
        public int TotalRead { get; set; }
        public int TotalUnread { get; set; }
        public int TotalEmailSent { get; set; }
        public DateTime? LastNotificationDate { get; set; }
        public Dictionary<string, int> ByType { get; set; }
        public double ReadRate { get; set; }
    }

    public class NotificationReportResponse
    {
        public string Period { get; set; }
        public DateTime Date { get; set; }
        public int TotalSent { get; set; }
        public int TotalRead { get; set; }
        public int TotalEmailSent { get; set; }
        public Dictionary<string, int> ByType { get; set; }
    }

    public class PaginatedNotificationsResponse
    {
        public List<Notification> Notifications { get; set; }
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}