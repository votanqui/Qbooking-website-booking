namespace QBooking.Dtos.Response
{
    public class HostEarningDto
    {
        public int Id { get; set; }
        public int BookingId { get; set; }
        public int HostId { get; set; }
        public string HostName { get; set; }
        public int PropertyId { get; set; }
        public decimal EarningAmount { get; set; }
        public decimal PlatformFee { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal NetAmount { get; set; }
        public string Status { get; set; }
        public DateTime EarnedDate { get; set; }
        public DateTime? PaidDate { get; set; }
        public int? PayoutId { get; set; }
        public string PropertyName { get; set; }
        public string BookingReference { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class HostEarningsStatisticsDto
    {
        public decimal TotalEarnings { get; set; }
        public decimal TotalPlatformFee { get; set; }
        public decimal TotalTax { get; set; }
        public decimal TotalNetAmount { get; set; }
        public int TotalBookings { get; set; }
        public int ApprovedCount { get; set; }
        public int PendingCount { get; set; }
        public int RejectedCount { get; set; }
        public decimal AverageEarningPerBooking { get; set; }
    }

    public class HostEarningsSummaryDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public decimal TotalEarnings { get; set; }
        public decimal NetAmount { get; set; }
        public int BookingCount { get; set; }
    }

    public class HostPayoutDto
    {
        public int Id { get; set; }
        public int HostId { get; set; }
        public string HostName { get; set; }
        public DateTime PayoutPeriodStart { get; set; }
        public DateTime PayoutPeriodEnd { get; set; }
        public decimal TotalEarnings { get; set; }
        public decimal TotalPlatformFee { get; set; }
        public decimal TotalTax { get; set; }
        public decimal NetPayoutAmount { get; set; }
        public int BookingCount { get; set; }
        public string BankName { get; set; }
        public string BankAccountNumber { get; set; }
        public string BankAccountName { get; set; }
        public string PaymentMethod { get; set; }
        public string Status { get; set; }
        public string TransactionReference { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PayoutStatisticsDto
    {
        public decimal TotalPayouts { get; set; }
        public int ProcessedCount { get; set; }
        public int PendingCount { get; set; }
        public int CompletedCount { get; set; }
        public int CancelledCount { get; set; }
        public decimal AveragePayoutAmount { get; set; }
    }
}
