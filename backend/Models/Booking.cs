namespace QBooking.Models
{
    public class Booking
    {
        public int Id { get; set; }
        public string BookingCode { get; set; }
        public int CustomerId { get; set; }
        public int PropertyId { get; set; }
        public int RoomTypeId { get; set; }
        public DateTime CheckIn { get; set; }
        public DateTime CheckOut { get; set; }
        public int Nights { get; set; }
        public int Adults { get; set; } = 1;
        public int Children { get; set; } = 0;
        public int RoomsCount { get; set; } = 1;
        public string GuestName { get; set; }
        public string GuestPhone { get; set; }
        public string GuestEmail { get; set; }
        public string GuestIdNumber { get; set; }
        public string SpecialRequests { get; set; }
        public decimal RoomPrice { get; set; }
        public decimal DiscountPercent { get; set; } = 0;
        public decimal DiscountAmount { get; set; } = 0;
        public decimal CouponDiscountPercent { get; set; } = 0;
        public decimal CouponDiscountAmount { get; set; } = 0;
        public decimal TaxAmount { get; set; } = 0;
        public decimal ServiceFee { get; set; } = 0;
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "pending";
        public string PaymentStatus { get; set; } = "unpaid";
        public string BookingSource { get; set; } = "website";
        public string UtmSource { get; set; }
        public string UtmCampaign { get; set; }
        public string UtmMedium { get; set; }
        public DateTime BookingDate { get; set; } = DateTime.UtcNow;
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? CheckedInAt { get; set; }
        public DateTime? CheckedOutAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;


        public User Customer { get; set; }
        public Property Property { get; set; }
        public RoomType RoomType { get; set; }
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();

        public ICollection<RefundTicket> RefundTickets { get; set; } = new List<RefundTicket>();
        public ICollection<Refund> Refunds { get; set; } = new List<Refund>();

    }
}
