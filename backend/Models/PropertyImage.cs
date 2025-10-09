namespace QBooking.Models
{
    public class PropertyImage
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public string ImageUrl { get; set; }
        public string ImageType { get; set; } = "interior";
        public string Title { get; set; }
        public string Description { get; set; }
        public bool IsPrimary { get; set; } = false;
        public int SortOrder { get; set; } = 0;
        public int? FileSize { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


        public Property Property { get; set; }
    }
}
