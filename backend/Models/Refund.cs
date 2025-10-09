namespace QBooking.Models
{
    public class Refund
    {
        public int Id { get; set; }
        public int RefundTicketId { get; set; }
        public int BookingId { get; set; }
        public int CustomerId { get; set; }
        public int ApprovedBy { get; set; }
        public decimal RefundedAmount { get; set; }
        public string ReceiverBankName { get; set; }
        public string ReceiverAccount { get; set; }
        public string ReceiverName { get; set; }
        public string PaymentMethod { get; set; } = "bank_transfer";
        public string PaymentReference { get; set; }
        public string Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public RefundTicket RefundTicket { get; set; }
        public Booking Booking { get; set; }
        public User Customer { get; set; }

    }
}
