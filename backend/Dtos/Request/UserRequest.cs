using System.ComponentModel.DataAnnotations;

namespace QBooking.DTOs.Request
{
    public class UpdateProfileRequest
    {
        [StringLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự")]
        public string FullName { get; set; }

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [StringLength(15, ErrorMessage = "Số điện thoại không được vượt quá 15 ký tự")]
        public string Phone { get; set; }

        public DateTime? DateOfBirth { get; set; }

        [StringLength(10, ErrorMessage = "Giới tính không hợp lệ")]
        public string Gender { get; set; }

        [StringLength(500, ErrorMessage = "Địa chỉ chi tiết không được vượt quá 500 ký tự")]
        public string AddressDetail { get; set; }

        public int? CommuneId { get; set; }

        public int? ProvinceId { get; set; }
        [StringLength(100)]
        public string? BankName { get; set; }

        [StringLength(50)]
        public string? BankAccountNumber { get; set; }

        [StringLength(100)]
        public string? BankAccountName { get; set; }
    }

    public class UploadAvatarRequest
    {
        [Required(ErrorMessage = "File ảnh là bắt buộc")]
        public IFormFile Avatar { get; set; }
    }

    public class GetUserPropertiesRequest
    {
        public string? Status { get; set; }
        public int? ProductTypeId { get; set; } // Thay đổi từ string Type sang int? ProductTypeId
        public bool? IsActive { get; set; }
        public bool? IsFeatured { get; set; }
        public string? Search { get; set; }
        public string SortBy { get; set; } = "created"; // name, type, created, updated, bookings
        public string SortOrder { get; set; } = "desc"; // asc, desc
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
    public class GetUsersRequest
    {
        public string? Role { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsEmailVerified { get; set; }
        public int? ProvinceId { get; set; }
        public string? Search { get; set; }
        public DateTime? CreatedFrom { get; set; }
        public DateTime? CreatedTo { get; set; }
        public string SortBy { get; set; } = "created"; // name, email, created, role
        public string SortOrder { get; set; } = "desc"; // asc, desc
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    // Request cho UpdateUserStatus
    public class UpdateUserStatusRequest
    {
        [Required(ErrorMessage = "Trạng thái là bắt buộc")]
        public bool IsActive { get; set; }

        [StringLength(500, ErrorMessage = "Lý do không được vượt quá 500 ký tự")]
        public string? Reason { get; set; }
    }

    // Request cho UpdateUserRole
    public class UpdateUserRoleRequest
    {
        [Required(ErrorMessage = "Role là bắt buộc")]
        [StringLength(50, ErrorMessage = "Role không được vượt quá 50 ký tự")]
        public string Role { get; set; }

        [StringLength(500, ErrorMessage = "Lý do không được vượt quá 500 ký tự")]
        public string? Reason { get; set; }
    }

    // Request cho GetUserBookings
    public class GetUserBookingsRequest
    {
        public string? Status { get; set; }
        public string? PaymentStatus { get; set; }
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public string SortBy { get; set; } = "date"; // date, amount, checkin
        public string SortOrder { get; set; } = "desc"; // asc, desc
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    // Request cho AdminResetPassword
    public class AdminResetPasswordRequest
    {
        [Required(ErrorMessage = "Mật khẩu mới là bắt buộc")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải có từ 6-100 ký tự")]
        public string NewPassword { get; set; }

        [StringLength(500, ErrorMessage = "Lý do không được vượt quá 500 ký tự")]
        public string? Reason { get; set; }
    }
}