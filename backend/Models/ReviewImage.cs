namespace QBooking.Models
{
    public class ReviewImage
    {
        public int Id { get; set; }
        public int ReviewId { get; set; }
        public string ImageUrl { get; set; }
        public int? DisplayOrder { get; set; }
        public DateTime? CreatedAt { get; set; }

        // Navigation property
        public Review Review { get; set; }
    }
}
