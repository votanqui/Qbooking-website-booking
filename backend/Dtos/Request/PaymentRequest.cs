using System.ComponentModel.DataAnnotations;

namespace QBooking.Dtos.Request
{
    public class CreateRefundTicketRequest
    {
        public int BookingId { get; set; }
        public decimal RequestedAmount { get; set; }
        public string Reason { get; set; }
        public string BankName { get; set; }
        public string BankAccountNumber { get; set; }
        public string BankAccountName { get; set; }
    }

    // Request xử lý refund (admin approve và tạo record Refund)
    public class ProcessRefundRequest
    {
        public int ApprovedBy { get; set; }
        public decimal RefundedAmount { get; set; }
        public string ReceiverBankName { get; set; }
        public string ReceiverAccount { get; set; }
        public string ReceiverName { get; set; }
        public string PaymentMethod { get; set; } = "bank_transfer";
        public string PaymentReference { get; set; }
        public string Notes { get; set; }
    }

    // Request cập nhật status của RefundTicket
    public class UpdateRefundTicketStatusRequest
    {
        public string Status { get; set; } // pending, approved, rejected, cancelled
    }
}
