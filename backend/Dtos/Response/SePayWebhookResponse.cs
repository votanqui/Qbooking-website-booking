namespace QBooking.Dtos.Response
{
    public class SePayWebhookResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public object Data { get; set; }
    }

    public class PaymentProcessedResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public PaymentProcessedData Data { get; set; }
    }

    public class PaymentProcessedData
    {
        public int BookingId { get; set; }
        public string BookingCode { get; set; }
        public int PaymentId { get; set; }
        public string PaymentStatus { get; set; }
        public string BookingStatus { get; set; }
        public decimal Amount { get; set; }
        public string TransactionId { get; set; }
        public DateTime ProcessedAt { get; set; }
    }

    public class BookingStatusChangedNotification
    {
        public int BookingId { get; set; }
        public string BookingCode { get; set; }
        public string OldStatus { get; set; }
        public string NewStatus { get; set; }
        public string PaymentStatus { get; set; }
        public decimal TotalAmount { get; set; }
        public string GuestName { get; set; }
        public string GuestEmail { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
