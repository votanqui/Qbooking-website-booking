
namespace QBooking.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string FullName { get; set; }
        public string? Phone { get; set; }
        public string Role { get; set; } = "customer";
        public string? Avatar { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? AddressDetail { get; set; }
        public int? CommuneId { get; set; }
        public int? ProvinceId { get; set; }
        public bool IsEmailVerified { get; set; } = false;
        public bool IsActive { get; set; } = true;


        public string? BankName { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? BankAccountName { get; set; }

        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;


        public Province Province { get; set; }
        public Commune Commune { get; set; }

        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public ICollection<RefundTicket> RefundTickets { get; set; } = new List<RefundTicket>();    
        public ICollection<Refund> Refunds { get; set; } = new List<Refund>();

        public virtual ICollection<HostEarning> HostEarnings { get; set; }
    }
}
