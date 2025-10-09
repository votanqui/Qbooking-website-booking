namespace QBooking.Models
{
    public class Coupon
    {
        public int Id { get; set; }
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string DiscountType { get; set; } = null!; // percentage, fixedAmount, freeNight
        public decimal DiscountValue { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public decimal MinOrderAmount { get; set; } = 0;
        public int MinNights { get; set; } = 1;
        public string? ApplicableDays { get; set; } // ví dụ: "Mon,Tue,Wed"
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? MaxTotalUses { get; set; }
        public int MaxUsesPerCustomer { get; set; } = 1;
        public int UsedCount { get; set; } = 0;
        public string? ApplicableTo { get; set; } = "all";
        public bool IsPublic { get; set; } = true;
        public bool IsFeatured { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation

        public ICollection<CouponUsage>? Usages { get; set; }
        public ICollection<CouponApplication> CouponApplications { get; set; } = new List<CouponApplication>();
    }
}
