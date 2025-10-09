namespace QBooking.Models
{
    public class RoomImage
    {
        public int Id { get; set; }
        public int RoomTypeId { get; set; }
        public string ImageUrl { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public bool IsPrimary { get; set; } = false;
        public int SortOrder { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


        public RoomType RoomType { get; set; }
    }
}
