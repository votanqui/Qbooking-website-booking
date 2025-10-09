namespace QBooking.Models
{
    public class ProductType
    {
        public int Id { get; set; }
        public string Name { get; set; }         // Ví dụ: "Khách sạn", "Homestay"
        public string Code { get; set; }         // Ví dụ: "hotel", "homestay"
        public string Description { get; set; }
        public string Icon { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation: 1 ProductType có nhiều Property
        public ICollection<Property> Properties { get; set; } = new List<Property>();
    }
}
