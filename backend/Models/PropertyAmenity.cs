namespace QBooking.Models
{
    public class PropertyAmenity
    {
        public int PropertyId { get; set; }
        public int AmenityId { get; set; }
        public bool IsFree { get; set; } = true;
        public string AdditionalInfo { get; set; }


        public Property Property { get; set; }
        public Amenity Amenity { get; set; }
    }
}
