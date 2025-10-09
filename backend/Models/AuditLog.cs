namespace QBooking.Models
{
    public class AuditLog
    {
        public int Id { get; set; }

        public string ActionType { get; set; } // INSERT, UPDATE, DELETE, LOGIN, LOGOUT

        public string TableName { get; set; }

        public int? RecordId { get; set; }

        public int? UserId { get; set; }

        public string IPAddress { get; set; }

        public string UserAgent { get; set; }

        public DateTime ActionTime { get; set; } = DateTime.UtcNow;

        public string OldValues { get; set; }

        public string NewValues { get; set; }

        // Navigation
        public User User { get; set; }
    }
}
