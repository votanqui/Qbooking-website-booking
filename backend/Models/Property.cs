namespace QBooking.Models
{
    public class Property
    {
        public int Id { get; set; }
        public int HostId { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public int ProductTypeId { get; set; }
        public string Description { get; set; }
        public string ShortDescription { get; set; }
       public string AddressDetail { get; set; }
        public int? CommuneId { get; set; }
        public int ProvinceId { get; set; }
        public string PostalCode { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public byte StarRating { get; set; } = 0;
        public int TotalRooms { get; set; } = 0;
        public int? EstablishedYear { get; set; }
        public TimeSpan? CheckInTime { get; set; }
        public TimeSpan? CheckOutTime { get; set; }
        public int MinStayNights { get; set; } = 1;
        public int MaxStayNights { get; set; } = 30;
        public string CancellationPolicy { get; set; } = "moderate";
        public string MetaTitle { get; set; }
        public string MetaDescription { get; set; }
        public string MetaKeywords { get; set; }
        public decimal? PriceFrom { get; set; }
        public string Currency { get; set; } = "VND";
        public string Status { get; set; } = "draft";
        public bool IsActive { get; set; } = true;
        public bool IsFeatured { get; set; } = false;
        public int ViewCount { get; set; } = 0;
        public int BookingCount { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;


        public User Host { get; set; }
        public Province Province { get; set; }
        public Commune Commune { get; set; }
        public ProductType ProductType { get; set; }

        public ICollection<PropertyImage> Images { get; set; } = new List<PropertyImage>();
        public ICollection<PropertyAmenity> Amenities { get; set; } = new List<PropertyAmenity>();
        public ICollection<RoomType> RoomTypes { get; set; } = new List<RoomType>();
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<Favorite> Favorites { get; set; }

    }
}
