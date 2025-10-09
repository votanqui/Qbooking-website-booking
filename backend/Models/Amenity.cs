namespace QBooking.Models
{
    public class Amenity
    {
        public int Id { get; set; }
        public int CategoryId { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Icon { get; set; }
        public string Description { get; set; }
        public bool IsPopular { get; set; } = false;
        public int SortOrder { get; set; } = 0;


        public AmenityCategory Category { get; set; }
        public ICollection<PropertyAmenity> PropertyAmenities { get; set; } = new List<PropertyAmenity>();
        public ICollection<RoomAmenity> RoomAmenities { get; set; } = new List<RoomAmenity>();

    }
}
