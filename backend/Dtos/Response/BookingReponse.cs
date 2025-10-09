namespace QBooking.Dtos.Response
{
    public class BookingDto
    {
        public int Id { get; set; }
        public string BookingCode { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public string CustomerEmail { get; set; }
        public string CustomerPhone { get; set; }
        public int PropertyId { get; set; }
        public string PropertyName { get; set; }
        public string PropertyAddress { get; set; }
        public int RoomTypeId { get; set; }
        public string RoomTypeName { get; set; }
        public DateTime CheckIn { get; set; }
        public DateTime CheckOut { get; set; }
        public int Nights { get; set; }
        public int Adults { get; set; }
        public int Children { get; set; }
        public int RoomsCount { get; set; }
        public string GuestName { get; set; }
        public string GuestPhone { get; set; }
        public string GuestEmail { get; set; }
        public decimal RoomPrice { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal ServiceFee { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public string PaymentStatus { get; set; }
        public string BookingSource { get; set; }
        public DateTime BookingDate { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? CheckedInAt { get; set; }
        public DateTime? CheckedOutAt { get; set; }
        public DateTime? CancelledAt { get; set; }
    }

    public class BookingDetailDto : BookingDto
    {
        public int CustomerId { get; set; }
        public int PropertyId { get; set; }
        public int RoomTypeId { get; set; }
        public string GuestIdNumber { get; set; }
        public string SpecialRequests { get; set; }
        public decimal RoomPrice { get; set; }
        public decimal DiscountPercent { get; set; } // Server-calculated discount percentage
        public decimal DiscountAmount { get; set; }
        public decimal CouponDiscountPercent { get; set; }
        public decimal CouponDiscountAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal ServiceFee { get; set; }
        public string BookingSource { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? CheckedInAt { get; set; }
        public DateTime? CheckedOutAt { get; set; }
        public DateTime? CancelledAt { get; set; }
    }
  

    // Bổ sung thông tin cho BookingStatisticsDto
    public class BookingStatisticsDto
    {
        // Basic counts
        public int TotalBookings { get; set; }
        public int PendingBookings { get; set; }
        public int ConfirmedBookings { get; set; }
        public int CheckedInBookings { get; set; }
        public int CompletedBookings { get; set; }
        public int CancelledBookings { get; set; }

        // Revenue statistics
        public decimal TotalRevenue { get; set; }
        public decimal PendingRevenue { get; set; }
        public decimal ConfirmedRevenue { get; set; }
        public decimal CompletedRevenue { get; set; }
        public decimal CancelledRevenue { get; set; }

        // Average calculations
        public decimal AverageBookingValue { get; set; }
        public double AverageNights { get; set; }
        public decimal AverageRevenuePerNight { get; set; }
        public double AverageGuestsPerBooking { get; set; }

        // Guest statistics
        public int TotalGuests { get; set; }
        public int TotalAdults { get; set; }
        public int TotalChildren { get; set; }
        public int TotalRoomsBooked { get; set; }

        // Payment statistics
        public int PaidBookings { get; set; }
        public int UnpaidBookings { get; set; }
        public int RefundedBookings { get; set; }
        public decimal TotalPaidAmount { get; set; }
        public decimal TotalUnpaidAmount { get; set; }

        // Time-based statistics
        public int BookingsThisMonth { get; set; }
        public int BookingsLastMonth { get; set; }
        public decimal RevenueThisMonth { get; set; }
        public decimal RevenueLastMonth { get; set; }
        public decimal GrowthRate { get; set; }

        // Cancellation statistics
        public decimal CancellationRate { get; set; }
        public int CustomerCancellations { get; set; }
        public int HostCancellations { get; set; }

        // Breakdowns
        public Dictionary<string, int> BookingsBySource { get; set; }
        public Dictionary<string, decimal> RevenueByMonth { get; set; }
        public Dictionary<int, int> BookingsByProperty { get; set; }
        public Dictionary<string, int> BookingsByStatus { get; set; }
        public Dictionary<string, int> BookingsByPaymentStatus { get; set; }

        // Top performers
        public List<PropertyPerformance> TopProperties { get; set; }
        public List<MonthlyRevenue> MonthlyBreakdown { get; set; }
    }

    public class PropertyPerformance
    {
        public int PropertyId { get; set; }
        public string PropertyName { get; set; }
        public int BookingCount { get; set; }
        public decimal Revenue { get; set; }
        public decimal AverageRating { get; set; }
    }

    public class MonthlyRevenue
    {
        public string Month { get; set; }
        public int BookingCount { get; set; }
        public decimal Revenue { get; set; }
        public int CancelledCount { get; set; }
    }
    public class AuditLogDto2
    {
        public int Id { get; set; }
        public string Action { get; set; }
        public string TableName { get; set; }
        public int? RecordId { get; set; }
        public string OldValues { get; set; }
        public string NewValues { get; set; }
        public DateTime Timestamp { get; set; }
        public int? UserId { get; set; }
        public string IpAddress { get; set; }
        public string Description { get; set; }
    }
    public class DashboardOverviewDto
    {
        public int TotalBookings { get; set; }
        public decimal TotalRevenue { get; set; }
        public int PendingBookings { get; set; }
        public int ConfirmedBookings { get; set; }
        public int CheckedInBookings { get; set; }
        public int CompletedBookings { get; set; }
        public int CancelledBookings { get; set; }
        public int PendingRefundTickets { get; set; }
        public int TotalGuests { get; set; }
        public decimal AverageBookingValue { get; set; }
        public decimal OccupancyRate { get; set; }
    }

    public class RevenueChartDto
    {
        public string GroupBy { get; set; }
        public List<RevenueDataPoint> Data { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalBookings { get; set; }
    }

    public class RevenueDataPoint
    {
        public string Period { get; set; }
        public decimal Revenue { get; set; }
        public int BookingCount { get; set; }
    }

    public class BookingTrendsDto
    {
        public List<MonthlyTrendDto> MonthlyTrends { get; set; }
        public decimal OverallGrowthRate { get; set; }
    }

    public class MonthlyTrendDto
    {
        public string Month { get; set; }
        public int TotalBookings { get; set; }
        public decimal Revenue { get; set; }
        public decimal CancellationRate { get; set; }
    }

    public class TopPropertyDto
    {
        public int PropertyId { get; set; }
        public string PropertyName { get; set; }
        public int TotalBookings { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal AverageBookingValue { get; set; }
    }

    public class TopCustomerDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public string CustomerEmail { get; set; }
        public int TotalBookings { get; set; }
        public decimal TotalSpent { get; set; }
        public decimal AverageSpent { get; set; }
    }

    public class DashboardAlertsDto
    {
        public int PendingBookingsCount { get; set; }
        public int CheckInsTodayCount { get; set; }
        public int CheckOutsTodayCount { get; set; }
        public int LateCheckoutsCount { get; set; }
        public int UnpaidBookingsCount { get; set; }
        public int PendingRefundsCount { get; set; }
        public int TotalAlertsCount { get; set; }
    }
    public class AdminBookingListResponse
    {
        public List<AdminBookingListDto> Bookings { get; set; }
        public int TotalRecords { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class AdminBookingListDto
    {
        public int Id { get; set; }
        public string BookingCode { get; set; }

        // Customer Info
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public string CustomerEmail { get; set; }
        public string CustomerPhone { get; set; }

        // Property & Host Info
        public int PropertyId { get; set; }
        public string PropertyName { get; set; }
        public int HostId { get; set; }
        public string HostName { get; set; }
        public string HostEmail { get; set; }

        // Room Info
        public int RoomTypeId { get; set; }
        public string RoomTypeName { get; set; }

        // Booking Details
        public DateTime CheckIn { get; set; }
        public DateTime CheckOut { get; set; }
        public int Nights { get; set; }
        public int Adults { get; set; }
        public int Children { get; set; }
        public int RoomsCount { get; set; }

        // Guest Info
        public string GuestName { get; set; }
        public string GuestPhone { get; set; }
        public string GuestEmail { get; set; }

        // Financial
        public decimal TotalAmount { get; set; }
        public decimal RoomPrice { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal ServiceFee { get; set; }
        public decimal TaxAmount { get; set; }

        // Status
        public string Status { get; set; }
        public string PaymentStatus { get; set; }

        // Timestamps
        public DateTime BookingDate { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? CheckedInAt { get; set; }
        public DateTime? CheckedOutAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Refund Info
        public bool HasRefundTicket { get; set; }
        public string RefundTicketStatus { get; set; }
        public decimal? RefundTicketAmount { get; set; }
        public bool HasRefund { get; set; }
        public decimal? RefundedAmount { get; set; }
    }

    public class AdminBookingDetailDto
    {
        // Basic Info
        public int Id { get; set; }
        public string BookingCode { get; set; }

        // Customer Details
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public string CustomerEmail { get; set; }
        public string CustomerPhone { get; set; }
        public string CustomerAvatar { get; set; }

        // Property & Host Details
        public int PropertyId { get; set; }
        public string PropertyName { get; set; }
        public string PropertyAddress { get; set; }
        public int HostId { get; set; }
        public string HostName { get; set; }
        public string HostEmail { get; set; }
        public string HostPhone { get; set; }

        // Room Details
        public int RoomTypeId { get; set; }
        public string RoomTypeName { get; set; }
        public int TotalRooms { get; set; }
        public int MaxGuests { get; set; }

        // Booking Details
        public DateTime CheckIn { get; set; }
        public DateTime CheckOut { get; set; }
        public int Nights { get; set; }
        public int Adults { get; set; }
        public int Children { get; set; }
        public int RoomsCount { get; set; }

        // Guest Information
        public string GuestName { get; set; }
        public string GuestPhone { get; set; }
        public string GuestEmail { get; set; }
        public string GuestIdNumber { get; set; }
        public string SpecialRequests { get; set; }

        // Financial Breakdown
        public decimal RoomPrice { get; set; }
        public decimal DiscountPercent { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal CouponDiscountPercent { get; set; }
        public decimal CouponDiscountAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal ServiceFee { get; set; }
        public decimal TotalAmount { get; set; }

        // Status & Source
        public string Status { get; set; }
        public string PaymentStatus { get; set; }
        public string BookingSource { get; set; }
        public string UtmSource { get; set; }
        public string UtmCampaign { get; set; }
        public string UtmMedium { get; set; }

        // Timestamps
        public DateTime BookingDate { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? CheckedInAt { get; set; }
        public DateTime? CheckedOutAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Refund Ticket (Customer Request)
        public RefundTicketDto RefundTicket { get; set; }

        // Refunds (Admin Processed)
        public List<RefundDto> Refunds { get; set; }

        // Reviews
        public List<ReviewSummaryDto> Reviews { get; set; }

        // Payments
        public List<PaymentSummaryDto> Payments { get; set; }
    }

    public class RefundTicketDto
    {
        public int Id { get; set; }
        public decimal RequestedAmount { get; set; }
        public string Reason { get; set; }
        public string BankName { get; set; }
        public string BankAccountNumber { get; set; }
        public string BankAccountName { get; set; }
        public string Status { get; set; } // pending, approved, rejected
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
    }

    public class RefundDto
    {
        public int Id { get; set; }
        public int RefundTicketId { get; set; }
        public int ApprovedBy { get; set; }
        public string ApprovedByName { get; set; }
        public decimal RefundedAmount { get; set; }
        public string ReceiverBankName { get; set; }
        public string ReceiverAccount { get; set; }
        public string ReceiverName { get; set; }
        public string PaymentMethod { get; set; }
        public string PaymentReference { get; set; }
        public string Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ReviewSummaryDto
    {
        public int Id { get; set; }
        public byte OverallRating { get; set; }
        public string Title { get; set; }
        public string ReviewText { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PaymentSummaryDto
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AdminBookingStatisticsDto
    {
        // Basic Counts
        public int TotalBookings { get; set; }
        public int PendingBookings { get; set; }
        public int ConfirmedBookings { get; set; }
        public int CheckedInBookings { get; set; }
        public int CompletedBookings { get; set; }
        public int CancelledBookings { get; set; }

        // Financial Statistics
        public decimal TotalRevenue { get; set; }
        public decimal PendingRevenue { get; set; }
        public decimal ConfirmedRevenue { get; set; }
        public decimal CompletedRevenue { get; set; }
        public decimal CancelledRevenue { get; set; }
        public decimal AverageBookingValue { get; set; }

        // Guest Statistics
        public int TotalGuests { get; set; }
        public int TotalAdults { get; set; }
        public int TotalChildren { get; set; }
        public double AverageGuestsPerBooking { get; set; }

        // Room Statistics
        public int TotalRoomsBooked { get; set; }
        public double AverageRoomsPerBooking { get; set; }
        public double AverageNights { get; set; }

        // Payment Statistics
        public int TotalPaid { get; set; }
        public int TotalUnpaid { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal UnpaidAmount { get; set; }

        // Refund Statistics
        public int TotalRefundTickets { get; set; }
        public int PendingRefundTickets { get; set; }
        public int ApprovedRefundTickets { get; set; }
        public int RejectedRefundTickets { get; set; }
        public decimal TotalRefundRequested { get; set; }
        public decimal TotalRefunded { get; set; }
        public int TotalRefundProcessed { get; set; }

        // Source Statistics
        public Dictionary<string, int> BookingsBySource { get; set; }
        public Dictionary<string, decimal> RevenueBySource { get; set; }

        // Monthly Trends
        public Dictionary<string, int> BookingsByMonth { get; set; }
        public Dictionary<string, decimal> RevenueByMonth { get; set; }

        // Property Statistics
        public Dictionary<int, PropertyStatsDto> BookingsByProperty { get; set; }

        // Customer Statistics
        public int UniqueCustomers { get; set; }
        public int ReturningCustomers { get; set; }
        public double ReturnRate { get; set; }
    }

    public class PropertyStatsDto
    {
        public int PropertyId { get; set; }
        public string PropertyName { get; set; }
        public int TotalBookings { get; set; }
        public decimal TotalRevenue { get; set; }
        public double AverageRating { get; set; }
    }
}
