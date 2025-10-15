using System.ComponentModel.DataAnnotations;

namespace QBooking.Dtos.Request
{
    public class UpdateBankInfoDto
    {
        [Required]
        public string BankName { get; set; }
        [Required]
        public string BankAccountNumber { get; set; }
        [Required]
        public string BankAccountName { get; set; }
    }

    public class CreateManualPayoutDto
    {
        [Required]
        public int HostId { get; set; }
        [Required]
        public DateTime PayoutPeriodStart { get; set; }
        [Required]
        public DateTime PayoutPeriodEnd { get; set; }
    }

    public class ProcessPayoutDto
    {
        [Required]
        public string TransactionReference { get; set; }
        public string Notes { get; set; }
    }
}
