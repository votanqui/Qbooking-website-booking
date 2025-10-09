namespace QBooking.Models
{
    public class CouponUsage
    {
        public int Id { get; set; }
        public int CouponId { get; set; }
        public int CustomerId { get; set; }
        public int BookingId { get; set; }
        public decimal DiscountAmount { get; set; }
        public DateTime UsedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Coupon Coupon { get; set; } = null!;
        public User Customer { get; set; } = null!;   // giả định có bảng Users
        public Booking Booking { get; set; } = null!; // giả định có bảng Bookings
    }
}
