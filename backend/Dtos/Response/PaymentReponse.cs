namespace QBooking.Dtos.Response
{
    public class RefundTicketResponse
    {
        public int Id { get; set; }
        public int BookingId { get; set; }
        public string BookingCode { get; set; }
        public string PropertyName { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public string CustomerEmail { get; set; }
        public decimal RequestedAmount { get; set; }
        public string Reason { get; set; }
        public string BankName { get; set; }
        public string BankAccountNumber { get; set; }
        public string BankAccountName { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
    }

    // Response cho RefundTicket chi tiết (bao gồm cả Refund nếu có)
    public class RefundTicketDetailResponse
    {
        public int Id { get; set; }
        public int BookingId { get; set; }
        public string BookingCode { get; set; }
        public string PropertyName { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public string CustomerEmail { get; set; }
        public decimal RequestedAmount { get; set; }
        public string Reason { get; set; }
        public string BankName { get; set; }
        public string BankAccountNumber { get; set; }
        public string BankAccountName { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }

        // Thông tin refund nếu đã được xử lý
        public RefundResponse Refund { get; set; }
    }

    // Response cho Refund
    public class RefundResponse
    {
        public int Id { get; set; }
        public int RefundTicketId { get; set; }
        public int BookingId { get; set; }
        public string BookingCode { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public int ApprovedBy { get; set; }
        public decimal RefundedAmount { get; set; }
        public string ReceiverBankName { get; set; }
        public string ReceiverAccount { get; set; }
        public string ReceiverName { get; set; }
        public string PaymentMethod { get; set; }
        public string PaymentReference { get; set; }
        public string Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // Response cho thống kê refund
    public class RefundStatisticsResponse
    {
        public int TotalRefundTickets { get; set; }
        public int PendingTickets { get; set; }
        public int ApprovedTickets { get; set; }
        public int RejectedTickets { get; set; }
        public int CancelledTickets { get; set; }
        public decimal TotalRefundAmount { get; set; }
        public int TotalRefundCount { get; set; }
        public decimal AverageRefundAmount { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
}
