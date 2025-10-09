namespace QBooking.Models
{
    public class RoomAmenity
    {
        public int RoomTypeId { get; set; }
        public int AmenityId { get; set; }
        public int Quantity { get; set; } = 1;


        public RoomType RoomType { get; set; }
        public Amenity Amenity { get; set; }
    }
}
