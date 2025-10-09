namespace QBooking.Models
{
    public class CouponApplication
    {
        public int Id { get; set; }
        public int CouponId { get; set; }
        public string ApplicableType { get; set; } = null!; // property, propertyType, location
        public int ApplicableId { get; set; }

        // Navigation
        public Coupon Coupon { get; set; }
    }
}
