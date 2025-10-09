namespace QBooking.Models
{
    public class AmenityCategory
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Icon { get; set; }
        public string Description { get; set; }
        public int SortOrder { get; set; } = 0;


        public ICollection<Amenity> Amenities { get; set; } = new List<Amenity>();
    }
}
