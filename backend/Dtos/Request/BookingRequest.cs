namespace QBooking.Dtos.Request
{
    public class CreateBookingRequest
    {
        public int PropertyId { get; set; }
        public int RoomTypeId { get; set; }
        public DateTime CheckIn { get; set; }
        public DateTime CheckOut { get; set; }
        public int Adults { get; set; } = 1;
        public int Children { get; set; } = 0;
        public int RoomsCount { get; set; } = 1;
        public string GuestName { get; set; }
        public string GuestPhone { get; set; }
        public string GuestEmail { get; set; }
        public string GuestIdNumber { get; set; }
        public string SpecialRequests { get; set; }
        // DiscountPercent removed - will be calculated server-side
        public string BookingSource { get; set; }
        public string UtmSource { get; set; }
        public string UtmCampaign { get; set; }
        public string UtmMedium { get; set; }
    }

    public class CancelBookingRequest
    {
        public string Reason { get; set; }
    }
    public class AdminCancelBookingRequest
    {
        public string Reason { get; set; }
        public decimal? RefundAmount { get; set; }
        public bool SendNotification { get; set; } = true;
    }
    public class UpdateBookingStatusRequest
    {
        public string Status { get; set; } // pending, confirmed, checkedIn, completed, cancelled
        public string Note { get; set; }
    }

    public class UpdatePaymentStatusRequest
    {
        public string PaymentStatus { get; set; } // unpaid, paid, refunded, partial_refund
        public string Note { get; set; }
    }
}
