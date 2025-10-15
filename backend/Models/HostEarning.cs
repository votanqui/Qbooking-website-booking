using System.ComponentModel.DataAnnotations.Schema;

namespace QBooking.Models
{
    public class HostEarning
    {
        public int Id { get; set; }
        public int BookingId { get; set; }
        public int HostId { get; set; }
        public int PropertyId { get; set; }

  
        public decimal EarningAmount { get; set; }

    
        public decimal PlatformFee { get; set; }

        public decimal TaxAmount { get; set; }


        public decimal NetAmount { get; set; }

        public string Status { get; set; } = "pending";
        public DateTime EarnedDate { get; set; }
        public DateTime? PaidDate { get; set; }
        public int? PayoutId { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public virtual Booking Booking { get; set; }
        public virtual User Host { get; set; }
        public virtual Property Property { get; set; }
        public virtual HostPayout Payout { get; set; }
    }
}
