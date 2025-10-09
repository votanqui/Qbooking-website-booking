namespace QBooking.Models
{
    public class Review
    {
        public int Id { get; set; }
        public int BookingId { get; set; }
        public int CustomerId { get; set; }
        public int PropertyId { get; set; }
        public byte OverallRating { get; set; }
        public byte? CleanlinessRating { get; set; }
        public byte? LocationRating { get; set; }
        public byte? ServiceRating { get; set; }
        public byte? ValueRating { get; set; }
        public byte? AmenitiesRating { get; set; }
        public string? Title { get; set; }
        public string? ReviewText { get; set; }
        public string? Pros { get; set; }
        public string? Cons { get; set; }
        public string? TravelType { get; set; }
        public string? RoomStayed { get; set; }
        public bool? IsVerified { get; set; }
        public bool? IsAnonymous { get; set; }
        public string? Status { get; set; }
        public string? HostReply { get; set; }
        public DateTime? HostRepliedAt { get; set; }
        public bool? IsFeatured { get; set; }
        public int? HelpfulCount { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Booking Booking { get; set; }
        public User Customer { get; set; }
        public Property Property { get; set; }
        public ICollection<ReviewImage> ReviewImages { get; set; } = new List<ReviewImage>();
    }

}
