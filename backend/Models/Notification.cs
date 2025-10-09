using System.ComponentModel.DataAnnotations;

namespace QBooking.Models
{
    public class Notification
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        [MaxLength(50)]
        public string? Type { get; set; } // Made nullable to match DB

        [MaxLength(200)]
        public string? Title { get; set; } // Made nullable to match DB

        public string? Content { get; set; } // Already nullable (nvarchar(MAX))

        [MaxLength(100)]
        public string? EmailTo { get; set; } // Nullable in DB

        public bool EmailSent { get; set; } = false; // Default value
        public DateTime? EmailSentAt { get; set; } // Nullable in DB
        public bool IsRead { get; set; } = false; // Default value
        public DateTime? ReadAt { get; set; } // Nullable in DB
        public int? RelatedId { get; set; } // Nullable in DB

        [MaxLength(50)]
        public string? RelatedType { get; set; } // Nullable in DB

        [MaxLength(20)]
        public string? Priority { get; set; } = "normal"; // Nullable in DB with default

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Nullable in DB but with default
        public int EmailRetryCount { get; set; } = 0; // Not nullable in DB
        public int MaxEmailRetries { get; set; } = 3; // Not nullable in DB
        public DateTime? NextEmailRetryAt { get; set; } // Nullable in DB

        [MaxLength(1000)]
        public string? EmailError { get; set; } // Nullable in DB

        // Navigation
        public User? User { get; set; }
    }
}