namespace QBooking.Dtos.Response
{
    public class PublicCouponResponse
    {
        public int Id { get; set; }
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string DiscountType { get; set; } = null!;
        public decimal DiscountValue { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public decimal MinOrderAmount { get; set; }
        public int MinNights { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsFeatured { get; set; }
        public string ApplicableTo { get; set; } = null!;
        public List<CouponApplicationResponse> Applications { get; set; } = new List<CouponApplicationResponse>();
    }

    // Response cho coupon detail (admin)
    public class AdminCouponResponse
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string DiscountType { get; set; } = string.Empty;
        public decimal DiscountValue { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public decimal MinOrderAmount { get; set; }
        public int MinNights { get; set; }
        public string? ApplicableDays { get; set; }
        public string ApplicableTo { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? MaxTotalUses { get; set; }
        public int MaxUsesPerCustomer { get; set; }
        public int UsedCount { get; set; }
        public bool IsPublic { get; set; }
        public bool IsFeatured { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<CouponApplicationResponse> Applications { get; set; } = new();
    }

    public class CouponApplicationResponse
    {
        public int Id { get; set; }
        public string ApplicableType { get; set; } = string.Empty;
        public int ApplicableId { get; set; }
        public string? ApplicableName { get; set; } // Tên của property/productType/province
    }

    // Response cho coupon validation
    public class CouponValidationResponse
    {
        public bool IsValid { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal FinalAmount { get; set; }
        public string? CouponName { get; set; }
        public string? DiscountType { get; set; }
    }

    // Response cho coupon usage
    public class CouponUsageResponse
    {
        public int Id { get; set; }
        public string CouponCode { get; set; } = string.Empty;
        public string CouponName { get; set; } = string.Empty;
        public decimal DiscountAmount { get; set; }
        public DateTime UsedAt { get; set; }
        public int BookingId { get; set; }
    }

    // Response cho customer coupon usage history
    public class CustomerCouponUsageResponse
    {
        public int Id { get; set; }
        public string CouponCode { get; set; } = string.Empty;
        public string CouponName { get; set; } = string.Empty;
        public decimal DiscountAmount { get; set; }
        public DateTime UsedAt { get; set; }
        public int BookingId { get; set; }
        public string? BookingCode { get; set; }
    }

    // Response cho coupon statistics
    public class CouponStatisticsResponse
    {
        public int CouponId { get; set; }
        public string CouponCode { get; set; } = string.Empty;
        public string CouponName { get; set; } = string.Empty;
        public int TotalUsages { get; set; }
        public decimal TotalDiscountAmount { get; set; }
        public int UniqueCustomers { get; set; }
        public decimal AverageDiscountAmount { get; set; }
        public int? RemainingUses { get; set; }
        public decimal UsageRate { get; set; } // Tỷ lệ sử dụng (%)
    }

    // Response đơn giản cho các action toggle/delete
    public class SimpleActionResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    // Response cho check code availability
    public class CodeAvailabilityResponse
    {
        public bool IsAvailable { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    // Response cho discount types
    public class DiscountTypeResponse
    {
        public string Value { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    // Response cho applicable to types
    public class ApplicableToTypeResponse
    {
        public string Value { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    // Response tóm tắt cho search results
    public class CouponSummaryResponse
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string DiscountType { get; set; } = string.Empty;
        public decimal DiscountValue { get; set; }
        public string ApplicableTo { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public bool IsPublic { get; set; }
        public int UsedCount { get; set; }
        public int? MaxTotalUses { get; set; }
        public DateTime EndDate { get; set; }
    }
    public class CouponOverviewStatisticsResponse
    {
        public int TotalCoupons { get; set; }
        public int ActiveCoupons { get; set; }
        public int InactiveCoupons { get; set; }
        public int ExpiredCoupons { get; set; }
        public int TotalUsages { get; set; }
        public decimal TotalDiscountAmount { get; set; }
        public int UniqueCustomers { get; set; }
        public decimal AverageDiscountPerUsage { get; set; }
        public int ThisMonthUsages { get; set; }
        public decimal ThisMonthDiscountAmount { get; set; }
    }

    public class CouponDetailStatisticsResponse
    {
        public int CouponId { get; set; }
        public string CouponCode { get; set; } = string.Empty;
        public string CouponName { get; set; } = string.Empty;
        public int TotalUsages { get; set; }
        public decimal TotalDiscountAmount { get; set; }
        public int UniqueCustomers { get; set; }
        public decimal AverageDiscountAmount { get; set; }
        public decimal UsageRate { get; set; }
        public int? RemainingUses { get; set; }
        public int DaysUntilExpiry { get; set; }
        public bool IsActive { get; set; }
        public bool IsExpired { get; set; }
    }

    public class TopUsedCouponResponse
    {
        public int CouponId { get; set; }
        public string CouponCode { get; set; } = string.Empty;
        public string CouponName { get; set; } = string.Empty;
        public int UsageCount { get; set; }
        public decimal TotalDiscountAmount { get; set; }
        public string DiscountType { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }

    public class AdminCouponUsageHistoryResponse
    {
        public int Id { get; set; }
        public string CouponCode { get; set; } = string.Empty;
        public string CouponName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string BookingCode { get; set; } = string.Empty;
        public decimal DiscountAmount { get; set; }
        public DateTime UsedAt { get; set; }
    }

    public class CouponPerformanceReportResponse
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string GroupBy { get; set; } = string.Empty;
        public List<PerformanceDataPoint> DataPoints { get; set; } = new();
        public int TotalUsages { get; set; }
        public decimal TotalDiscountAmount { get; set; }
        public decimal AverageDiscountPerPeriod { get; set; }
    }

    public class PerformanceDataPoint
    {
        public string Period { get; set; } = string.Empty;
        public int UsageCount { get; set; }
        public decimal TotalDiscountAmount { get; set; }
        public int UniqueCustomers { get; set; }
    }

    public class ExpiringSoonCouponResponse
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public DateTime EndDate { get; set; }
        public int DaysRemaining { get; set; }
        public int UsedCount { get; set; }
        public int? MaxTotalUses { get; set; }
        public bool IsPublic { get; set; }
    }

    public class TopCouponCustomerResponse
    {
        public int CustomerId { get; set; }
        public string CustomerEmail { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public int TotalCouponUsages { get; set; }
        public decimal TotalSavingsAmount { get; set; }
        public int UniqueCouponsUsed { get; set; }
    }
}