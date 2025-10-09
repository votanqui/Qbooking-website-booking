using System.ComponentModel.DataAnnotations;

namespace QBooking.Dtos.Request
{
    public class SePayWebhookRequest
    {
        [Required]
        public int Id { get; set; }

        [Required]
        public string Gateway { get; set; }

        [Required]
        public string TransactionDate { get; set; }

        [Required]
        public string AccountNumber { get; set; }

        public string? Code { get; set; }

        [Required]
        public string Content { get; set; }

        [Required]
        public string TransferType { get; set; }

        [Required]
        public decimal TransferAmount { get; set; }

        public decimal Accumulated { get; set; }

        public string? SubAccount { get; set; }

        public string ReferenceCode { get; set; }

        public string Description { get; set; }
    }
}
