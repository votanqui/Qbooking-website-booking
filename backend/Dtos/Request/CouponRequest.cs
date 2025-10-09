using System.ComponentModel.DataAnnotations;

namespace QBooking.Dtos.Request
{
    public class CreateCouponRequest
    {
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string DiscountType { get; set; } = null!; // percentage, fixedAmount, freeNight
        public decimal DiscountValue { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public decimal MinOrderAmount { get; set; } = 0;
        public int MinNights { get; set; } = 1;
        public string? ApplicableDays { get; set; }
        public string ApplicableTo { get; set; } = "all"; // all, property, propertyType, location
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? MaxTotalUses { get; set; }
        public int MaxUsesPerCustomer { get; set; } = 1;
        public bool IsPublic { get; set; } = true;
        public bool IsFeatured { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public List<CouponApplicationRequest>? Applications { get; set; }
    }

    public class UpdateCouponRequest
    {
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string DiscountType { get; set; } = null!;
        public decimal DiscountValue { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public decimal MinOrderAmount { get; set; } = 0;
        public int MinNights { get; set; } = 1;
        public string? ApplicableDays { get; set; }
        public string ApplicableTo { get; set; } = "all";
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? MaxTotalUses { get; set; }
        public int MaxUsesPerCustomer { get; set; } = 1;
        public bool IsPublic { get; set; } = true;
        public bool IsFeatured { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public List<CouponApplicationRequest>? Applications { get; set; }
    }

    public class CouponApplicationRequest
    {
        public string ApplicableType { get; set; } = null!; // property, propertyType, location
        public int ApplicableId { get; set; }
    }

    public class ValidateCouponRequest
    {
        public string Code { get; set; } = null!;
        public int BookingId { get; set; }
    }

    public class ApplyCouponRequest
    {
        public string Code { get; set; } = null!;
        public int BookingId { get; set; }
    }
    public class ApplyCouponByCodeRequest
    {
        [Required(ErrorMessage = "Mã giảm giá là bắt buộc")]
        public string CouponCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mã đặt phòng là bắt buộc")]
        public string BookingCode { get; set; } = string.Empty;
    }
    public class DuplicateCouponRequest
    {
        [Required(ErrorMessage = "Mã code mới là bắt buộc")]
        [StringLength(20, MinimumLength = 3, ErrorMessage = "Mã code phải có độ dài từ 3-20 ký tự")]
        [RegularExpression(@"^[A-Za-z0-9]+$", ErrorMessage = "Mã code chỉ được chứa chữ cái và số")]
        public string NewCode { get; set; } = string.Empty;
    }
}