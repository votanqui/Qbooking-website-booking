using QBooking.Models;

namespace QBooking.Services
{
    public interface IEmailService
    {
        Task SendBookingConfirmationAsync(
            string toEmail,
            string guestName,
            string guestPhone,
            string bookingCode,
            DateTime checkIn,
            DateTime checkOut,
            int nights,
            int adults,
            int children,
            int roomsCount,
            decimal roomPrice,
            decimal discountPercent,
            decimal discountAmount,
            decimal taxAmount,
            decimal serviceFee,
            decimal totalAmount,
            string paymentUrl,
            string specialRequests = null,
            string propertyName = null,
            string roomTypeName = null);

        Task SendPaymentReminderAsync(
            string toEmail,
            string guestName,
            string guestPhone,
            string bookingCode,
            DateTime checkIn,
            DateTime checkOut,
            int nights,
            int adults,
            int children,
            int roomsCount,
            decimal roomPrice,
            decimal discountPercent,
            decimal discountAmount,
            decimal taxAmount,
            decimal serviceFee,
            decimal totalAmount,
            string paymentUrl,
            string specialRequests = null,
            string propertyName = null,
            string roomTypeName = null);

        Task SendBookingCancelledAsync(
               string toEmail,
               string guestName,
               string guestPhone,
               string bookingCode,
               DateTime checkIn,
               DateTime checkOut,
               int nights,
               int adults,
               int children,
               int roomsCount,
               decimal totalAmount,
               string cancelReason = "Không thanh toán trong 24 giờ",
               string propertyName = null,
               string roomTypeName = null);
        Task SendThankYouEmailAsync(
            string toEmail,
            string guestName,
            string guestPhone,
            string bookingCode,
            DateTime checkIn,
            DateTime checkOut,
            int nights,
            int adults,
            int children,
            int roomsCount,
            decimal totalAmount,
            string reviewUrl,
            string propertyName = null,
            string roomTypeName = null);
        Task SendEmailVerificationAsync(string toEmail, string fullName, string verificationToken);
        Task SendPasswordResetAsync(string toEmail, string fullName, string resetToken);
        Task SendPasswordResetSuccessAsync(string toEmail, string fullName);

        Task SendAccountBannedAsync(string toEmail, string fullName, string reason, string contactEmail = null);

        Task SendNoShowNotificationAsync(
    string toEmail,
    string guestName,
    string guestPhone,
    string bookingCode,
    DateTime checkIn,
    DateTime checkOut,
    int nights,
    int adults,
    int children,
    int roomsCount,
    decimal totalAmount,
    int gracePeriodHours,
    string propertyName = null,
    string roomTypeName = null);

        Task SendBookingNotificationToHostAsync(
      string toEmail,
      string hostName,
      string guestName,
      string guestPhone,
      string guestEmail,
      string bookingCode,
      DateTime checkIn,
      DateTime checkOut,
      int nights,
      int adults,
      int children,
      int roomsCount,
      decimal totalAmount,
      string specialRequests = null,
      string propertyName = null,
      string roomTypeName = null,
      string propertyAddress = null
  );
        Task SendAdminNotificationEmailAsync(string toEmail, string fullName, string title, string content, string notificationType);
        Task SendRefundTicketCreatedAsync(
    string toEmail,
    string customerName,
    string bookingCode,
    decimal requestedAmount,
    string reason,
    string refundTicketId);

        Task SendRefundTicketApprovedAsync(
            string toEmail,
            string customerName,
            string bookingCode,
            decimal refundedAmount,
            string bankName,
            string accountNumber,
            string refundTicketId);

        Task SendRefundTicketRejectedAsync(
            string toEmail,
            string customerName,
            string bookingCode,
            decimal requestedAmount,
            string rejectReason,
            string refundTicketId);
    }
}