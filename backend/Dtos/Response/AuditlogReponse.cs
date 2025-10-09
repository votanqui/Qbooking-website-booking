namespace QBooking.Dtos.Response
{
    public class AuditLogDto
    {
        public int Id { get; set; }
        public string ActionType { get; set; }
        public string TableName { get; set; }
        public int? RecordId { get; set; }
        public int? UserId { get; set; }
        public string UserName { get; set; }
        public string IPAddress { get; set; }
        public string UserAgent { get; set; }
        public DateTime ActionTime { get; set; }
        public string OldValues { get; set; }
        public string NewValues { get; set; }
    }

    public class AuditLogResponseDto
    {
        public List<AuditLogDto> AuditLogs { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class AuditLogStatisticsDto
    {
        public int TotalActions { get; set; }
        public Dictionary<string, int> ActionsByType { get; set; } = new();
        public Dictionary<string, int> ActionsByTable { get; set; } = new();
        public Dictionary<string, int> TopUsers { get; set; } = new();
        public Dictionary<string, int> ActionsByDay { get; set; } = new();
    }
    public class DashboardOverviewAuditlogDto
    {
        public int TotalActions { get; set; }
        public int TotalUsers { get; set; }
        public int TotalTables { get; set; }
        public int AverageActionsPerDay { get; set; }
        public List<AuditLogDto> RecentActions { get; set; } = new();
        public List<ActionTrendDto> ActionTrend { get; set; } = new();
    }

    public class ActionTrendDto
    {
        public DateTime Date { get; set; }
        public int Count { get; set; }
    }

    public class UserActivityDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public int TotalActions { get; set; }
        public DateTime FirstAction { get; set; }
        public DateTime LastAction { get; set; }
        public Dictionary<string, int> ActionsByType { get; set; } = new();
        public Dictionary<string, int> ActionsByTable { get; set; } = new();
        public Dictionary<int, int> ActionsByHour { get; set; } = new();
        public List<AuditLogDto> RecentActions { get; set; } = new();
    }

    public class ActivityReportDto
    {
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public int TotalActions { get; set; }
        public int UniqueUsers { get; set; }
        public Dictionary<string, int> ActionsByType { get; set; } = new();
        public Dictionary<string, int> ActionsByTable { get; set; } = new();
        public Dictionary<string, int> Timeline { get; set; } = new();
    }

    public class SuspiciousActivityDto
    {
        public string Type { get; set; }
        public int? UserId { get; set; }
        public string? IPAddress { get; set; }
        public int Count { get; set; }
        public DateTime? FirstOccurrence { get; set; }
        public DateTime? LastOccurrence { get; set; }
        public string Severity { get; set; } // Low, Medium, High
        public string? Details { get; set; }
    }
}

