namespace QBooking.Models
{
    public class RefundTicket
    {
        public int Id { get; set; }
        public int BookingId { get; set; }
        public int CustomerId { get; set; }
        public decimal RequestedAmount { get; set; }
        public string Reason { get; set; }
        public string BankName { get; set; }
        public string BankAccountNumber { get; set; }
        public string BankAccountName { get; set; }
        public string Status { get; set; } = "pending"; // pending, approved, rejected
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; }

        // Navigation properties
        public Booking Booking { get; set; }
        public User Customer { get; set; }
        public ICollection<Refund> Refunds { get; set; } = new List<Refund>();
    }
}
