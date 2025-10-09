namespace QBooking.Models
{
    public class RoomType
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Description { get; set; }
        public string ShortDescription { get; set; }
        public int MaxAdults { get; set; } = 2;
        public int MaxChildren { get; set; } = 1;
        public int MaxGuests { get; set; } = 2;
        public string BedType { get; set; }
        public decimal? RoomSize { get; set; }
        public decimal BasePrice { get; set; }
        public decimal? WeekendPrice { get; set; }
        public decimal? HolidayPrice { get; set; }
        public decimal WeeklyDiscountPercent { get; set; } = 0;
        public decimal MonthlyDiscountPercent { get; set; } = 0;
        public int TotalRooms { get; set; } = 1;
        public string MetaTitle { get; set; }
        public string MetaDescription { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;


        public Property Property { get; set; }
        public ICollection<RoomImage> Images { get; set; } = new List<RoomImage>();
        public ICollection<RoomAmenity> RoomAmenities { get; set; } = new List<RoomAmenity>();


    }
}
