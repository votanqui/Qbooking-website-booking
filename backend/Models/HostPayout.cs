using System.ComponentModel.DataAnnotations.Schema;

namespace QBooking.Models
{
    public class HostPayout
    {
        public int Id { get; set; }
        public int HostId { get; set; }
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
        public string? TransactionReference { get; set; }
        public string Status { get; set; } = "pending";
        public int? ProcessedBy { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public virtual User Host { get; set; }
        public virtual ICollection<HostEarning> HostEarnings { get; set; }
    }
}
