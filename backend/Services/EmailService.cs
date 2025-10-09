using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using QBooking.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }
    public async Task SendEmailVerificationAsync(string toEmail, string fullName, string verificationToken)
    {
        var verificationUrl = $"{_config["Frontend:BaseUrl"]}/auth/verify-email?token={verificationToken}";
        var body = GenerateEmailVerificationTemplate(fullName, verificationUrl);

        var mail = new MailMessage
        {
            From = new MailAddress(_config["Email:FromEmail"], _config["Email:FromName"]),
            Subject = "🎉 Chào mừng bạn đến với QBooking - Xác nhận tài khoản",
            Body = body,
            IsBodyHtml = true
        };
        mail.To.Add(toEmail);

        await SendEmailAsync(mail);
    }

    // GỬI EMAIL RESET MẬT KHẨU
    public async Task SendPasswordResetAsync(string toEmail, string fullName, string resetToken)
    {
        var resetUrl = $"{_config["Frontend:BaseUrl"]}/auth/reset-password?token={resetToken}";
        var body = GeneratePasswordResetTemplate(fullName, resetUrl);

        var mail = new MailMessage
        {
            From = new MailAddress(_config["Email:FromEmail"], _config["Email:FromName"]),
            Subject = "🔐 QBooking - Đặt lại mật khẩu của bạn",
            Body = body,
            IsBodyHtml = true
        };
        mail.To.Add(toEmail);

        await SendEmailAsync(mail);
    }

    // GỬI EMAIL THÔNG BÁO ĐỔI MẬT KHẨU THÀNH CÔNG
    public async Task SendPasswordResetSuccessAsync(string toEmail, string fullName)
    {
        var body = GeneratePasswordResetSuccessTemplate(fullName);

        var mail = new MailMessage
        {
            From = new MailAddress(_config["Email:FromEmail"], _config["Email:FromName"]),
            Subject = "✅ QBooking - Mật khẩu đã được đặt lại thành công",
            Body = body,
            IsBodyHtml = true
        };
        mail.To.Add(toEmail);

        await SendEmailAsync(mail);
    }

    // GỬI EMAIL BAN ACCOUNT
    public async Task SendAccountBannedAsync(string toEmail, string fullName, string reason, string contactEmail = null)
    {
        var body = GenerateAccountBannedTemplate(fullName, reason, contactEmail ?? _config["Email:SupportEmail"]);

        var mail = new MailMessage
        {
            From = new MailAddress(_config["Email:FromEmail"], _config["Email:FromName"]),
            Subject = "🚨 Thông báo: Tài khoản QBooking của bạn đã bị tạm khóa",
            Body = body,
            IsBodyHtml = true
        };
        mail.To.Add(toEmail);

        await SendEmailAsync(mail);
    }

    public async Task SendNoShowNotificationAsync(
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
    string roomTypeName = null)
    {
        var body = GenerateNoShowNotificationTemplate(
            guestName, guestPhone, bookingCode, checkIn, checkOut,
            nights, adults, children, roomsCount, totalAmount,
            gracePeriodHours, propertyName, roomTypeName);

        var mail = new MailMessage
        {
            From = new MailAddress(_config["Email:FromEmail"], _config["Email:FromName"]),
            Subject = $"⚠️ Thông báo: Booking {bookingCode} đã bị đánh dấu No-Show",
            Body = body,
            IsBodyHtml = true
        };
        mail.To.Add(toEmail);

        await SendEmailAsync(mail);
    }
    public async Task SendBookingNotificationToHostAsync(
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
    string propertyAddress = null)
    {
        var body = GenerateHostBookingNotificationTemplate(
            hostName, guestName, guestPhone, guestEmail, bookingCode,
            checkIn, checkOut, nights, adults, children, roomsCount,
            totalAmount, specialRequests, propertyName, roomTypeName, propertyAddress);

        var mail = new MailMessage
        {
            From = new MailAddress(_config["Email:FromEmail"], _config["Email:FromName"]),
            Subject = $"🎉 Booking mới #{bookingCode} - {propertyName}",
            Body = body,
            IsBodyHtml = true
        };
        mail.To.Add(toEmail);

        await SendEmailAsync(mail);
    }

    private string GenerateHostBookingNotificationTemplate(
        string hostName, string guestName, string guestPhone, string guestEmail,
        string bookingCode, DateTime checkIn, DateTime checkOut, int nights,
        int adults, int children, int roomsCount, decimal totalAmount,
        string specialRequests, string propertyName, string roomTypeName, string propertyAddress)
    {
        return $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Booking Mới - QBooking Host</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }}
        .email-container {{
            max-width: 650px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
        }}
        .logo {{
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 20px;
        }}
        .header h1 {{
            color: white;
            font-size: 28px;
            margin-bottom: 5px;
        }}
        .header p {{
            color: rgba(255,255,255,0.9);
            font-size: 15px;
        }}
        .content {{
            padding: 40px;
        }}
        .success-box {{
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 30px;
        }}
        .success-box h2 {{
            font-size: 24px;
            margin-bottom: 10px;
        }}
        .success-box p {{
            font-size: 16px;
            opacity: 0.95;
        }}
        .info-section {{
            background: #f8f9fa;
            border-radius: 15px;
            padding: 25px;
            margin: 20px 0;
        }}
        .section-title {{
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
            font-weight: 600;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        .info-row {{
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
        }}
        .info-row:last-child {{
            border-bottom: none;
        }}
        .info-label {{
            color: #666;
            font-weight: 500;
        }}
        .info-value {{
            color: #333;
            font-weight: 600;
            text-align: right;
        }}
        .highlight-value {{
            color: #667eea;
            font-weight: 700;
        }}
        .guest-card {{
            background: white;
            border: 2px solid #667eea;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }}
        .guest-card h3 {{
            color: #667eea;
            margin-bottom: 15px;
            font-size: 18px;
        }}
        .special-requests {{
            background: #fff8e1;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }}
        .special-requests h4 {{
            color: #f57c00;
            margin-bottom: 10px;
            font-size: 16px;
        }}
        .special-requests p {{
            color: #666;
            font-style: italic;
        }}
        .total-box {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin: 25px 0;
            text-align: center;
        }}
        .total-box .label {{
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 5px;
        }}
        .total-box .amount {{
            font-size: 32px;
            font-weight: 700;
        }}
        .action-buttons {{
            display: flex;
            gap: 15px;
            margin: 30px 0;
        }}
        .btn {{
            flex: 1;
            text-align: center;
            padding: 15px 20px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
            display: inline-block;
        }}
        .btn-primary {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
        }}
        .btn-secondary {{
            background: white;
            color: #667eea;
            border: 2px solid #667eea;
        }}
        .footer {{
            background: #333;
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .footer p {{
            margin-bottom: 8px;
            font-size: 14px;
            opacity: 0.9;
        }}
        @media (max-width: 600px) {{
            .content {{ padding: 25px 20px; }}
            .action-buttons {{ flex-direction: column; }}
        }}
    </style>
</head>
<body>
    <div class='email-container'>
        <div class='header'>
            <div class='logo'>Q</div>
            <h1>QBooking Host</h1>
            <p>Hệ thống quản lý booking</p>
        </div>
        
        <div class='content'>
            <div class='success-box'>
                <h2>🎉 Chúc mừng! Bạn có booking mới</h2>
                <p>Mã booking: <strong>{bookingCode}</strong></p>
            </div>

            <p style='font-size: 16px; color: #333; margin-bottom: 25px;'>
                Xin chào <strong>{hostName}</strong>,<br><br>
                Tuyệt vời! Khách sạn <strong>{propertyName}</strong> của bạn vừa nhận được 
                một booking mới và đã được thanh toán thành công. 💰
            </p>

            <!-- Guest Information -->
            <div class='guest-card'>
                <h3>👤 Thông tin khách hàng</h3>
                <div class='info-row'>
                    <span class='info-label'>Họ tên:</span>
                    <span class='info-value highlight-value'>{guestName}</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Số điện thoại:</span>
                    <span class='info-value'>{guestPhone}</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Email:</span>
                    <span class='info-value'>{guestEmail}</span>
                </div>
            </div>

            <!-- Property & Room Info -->
            <div class='info-section'>
                <div class='section-title'>
                    🏨 Thông tin cơ sở
                </div>
                <div class='info-row'>
                    <span class='info-label'>Khách sạn:</span>
                    <span class='info-value'>{propertyName}</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Địa chỉ:</span>
                    <span class='info-value'>{propertyAddress ?? "N/A"}</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Loại phòng:</span>
                    <span class='info-value'>{roomTypeName ?? "N/A"}</span>
                </div>
            </div>

            <!-- Booking Details -->
            <div class='info-section'>
                <div class='section-title'>
                    📅 Chi tiết booking
                </div>
                <div class='info-row'>
                    <span class='info-label'>Check-in:</span>
                    <span class='info-value highlight-value'>{checkIn:dd/MM/yyyy HH:mm}</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Check-out:</span>
                    <span class='info-value highlight-value'>{checkOut:dd/MM/yyyy HH:mm}</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Số đêm:</span>
                    <span class='info-value'>{nights} đêm</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Số phòng:</span>
                    <span class='info-value'>{roomsCount} phòng</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Số khách:</span>
                    <span class='info-value'>{adults} người lớn{(children > 0 ? $", {children} trẻ em" : "")}</span>
                </div>
            </div>

            {(!string.IsNullOrEmpty(specialRequests) ? $@"
            <div class='special-requests'>
                <h4>📝 Yêu cầu đặc biệt từ khách</h4>
                <p>{specialRequests}</p>
            </div>
            " : "")}

            <!-- Total Amount -->
            <div class='total-box'>
                <div class='label'>💰 Tổng doanh thu từ booking này</div>
                <div class='amount'>{totalAmount:N0} VNĐ</div>
            </div>

            <!-- Action Buttons -->
            <div class='action-buttons'>
                <a href='https://qbooking.com/host/bookings/{bookingCode}' class='btn btn-primary'>
                    📋 Xem chi tiết booking
                </a>
                <a href='tel:{guestPhone}' class='btn btn-secondary'>
                    📞 Gọi cho khách
                </a>
            </div>

            <div style='background: #e3f2fd; border-radius: 10px; padding: 20px; margin: 25px 0;'>
                <h4 style='color: #1976d2; margin-bottom: 10px;'>💡 Lưu ý quan trọng:</h4>
                <ul style='color: #666; padding-left: 20px; line-height: 1.8;'>
                    <li>Vui lòng chuẩn bị phòng trước ngày check-in</li>
                    <li>Liên hệ với khách nếu cần xác nhận thêm thông tin</li>
                    <li>Check-in đúng giờ để đảm bảo trải nghiệm tốt nhất</li>
                    <li>Booking này đã được thanh toán đầy đủ</li>
                </ul>
            </div>
        </div>
        
        <div class='footer'>
            <p><strong>QBooking Host Support</strong></p>
            <p>📧 {_config["Email:SupportEmail"]} | 📞 {_config["Email:CompanyPhone"]}</p>
            <p>Cần hỗ trợ? Liên hệ với chúng tôi bất cứ lúc nào!</p>
            <p style='margin-top: 15px; font-size: 12px;'>
                © 2024 QBooking. Tất cả quyền được bảo lưu.
            </p>
        </div>
    </div>
</body>
</html>";
    }
    public async Task SendRefundTicketCreatedAsync(
    string toEmail,
    string customerName,
    string bookingCode,
    decimal requestedAmount,
    string reason,
    string refundTicketId)
    {
        var body = $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Yêu cầu hoàn tiền đã được tạo</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }}
        .icon {{
            font-size: 64px;
            margin-bottom: 15px;
        }}
        .header h1 {{
            font-size: 24px;
            margin-bottom: 10px;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .info-box {{
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
        }}
        .info-row {{
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }}
        .info-row:last-child {{
            border-bottom: none;
        }}
        .info-label {{
            font-weight: 600;
            color: #666;
        }}
        .info-value {{
            color: #333;
            text-align: right;
        }}
        .amount {{
            color: #667eea;
            font-size: 20px;
            font-weight: bold;
        }}
        .cta-button {{
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }}
        .footer {{
            background: #333;
            color: white;
            padding: 30px;
            text-align: center;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class='email-container'>
        <div class='header'>
            <div class='icon'>💳</div>
            <h1>Yêu cầu hoàn tiền đã được tạo</h1>
            <p>Ticket #{refundTicketId}</p>
        </div>
        
        <div class='content'>
            <p style='font-size: 18px; margin-bottom: 25px;'>
                Xin chào <strong>{customerName}</strong>,
            </p>

            <p style='margin-bottom: 20px;'>
                Chúng tôi đã nhận được yêu cầu hoàn tiền của bạn và đang xử lý. Dưới đây là thông tin chi tiết:
            </p>

            <div class='info-box'>
                <div class='info-row'>
                    <span class='info-label'>Mã đặt phòng:</span>
                    <span class='info-value'><strong>{bookingCode}</strong></span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Số tiền yêu cầu:</span>
                    <span class='info-value amount'>{requestedAmount:N0} VNĐ</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Lý do:</span>
                    <span class='info-value'>{reason}</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Trạng thái:</span>
                    <span class='info-value' style='color: #ff9800;'><strong>Đang chờ xử lý</strong></span>
                </div>
            </div>

            <p style='color: #666; margin-top: 20px;'>
                ⏱️ Yêu cầu của bạn sẽ được xem xét trong vòng <strong>24-48 giờ làm việc</strong>. 
                Chúng tôi sẽ thông báo cho bạn ngay khi có kết quả.
            </p>

            <a href='https://qbooking.com/refund-tickets' class='cta-button'>
                Xem chi tiết yêu cầu
            </a>
        </div>
        
        <div class='footer'>
            <p><strong>QBooking Support Team</strong></p>
            <p>📧 {_config["Email:SupportEmail"]} | 📞 {_config["Email:CompanyPhone"]}</p>
            <p style='margin-top: 15px; font-size: 12px;'>
                © 2024 QBooking. Tất cả quyền được bảo lưu.
            </p>
        </div>
    </div>
</body>
</html>";

        var mail = new MailMessage
        {
            From = new MailAddress(_config["Email:FromEmail"], _config["Email:FromName"]),
            Subject = $"✅ Yêu cầu hoàn tiền #{refundTicketId} đã được tạo",
            Body = body,
            IsBodyHtml = true
        };
        mail.To.Add(toEmail);

        await SendEmailAsync(mail);
    }

    public async Task SendRefundTicketApprovedAsync(
        string toEmail,
        string customerName,
        string bookingCode,
        decimal refundedAmount,
        string bankName,
        string accountNumber,
        string refundTicketId)
    {
        var body = $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Yêu cầu hoàn tiền đã được duyệt</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }}
        .icon {{
            font-size: 64px;
            margin-bottom: 15px;
        }}
        .header h1 {{
            font-size: 24px;
            margin-bottom: 10px;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .success-box {{
            background: #e8f5e9;
            border: 2px solid #4caf50;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            text-align: center;
        }}
        .success-box h2 {{
            color: #4caf50;
            font-size: 28px;
            margin-bottom: 10px;
        }}
        .info-box {{
            background: #f8f9fa;
            border-left: 4px solid #4caf50;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
        }}
        .info-row {{
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }}
        .info-row:last-child {{
            border-bottom: none;
        }}
        .info-label {{
            font-weight: 600;
            color: #666;
        }}
        .info-value {{
            color: #333;
            text-align: right;
        }}
        .alert {{
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            color: #856404;
        }}
        .footer {{
            background: #333;
            color: white;
            padding: 30px;
            text-align: center;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class='email-container'>
        <div class='header'>
            <div class='icon'>✅</div>
            <h1>Yêu cầu hoàn tiền đã được duyệt</h1>
            <p>Ticket #{refundTicketId}</p>
        </div>
        
        <div class='content'>
            <p style='font-size: 18px; margin-bottom: 25px;'>
                Xin chào <strong>{customerName}</strong>,
            </p>

            <div class='success-box'>
                <h2>{refundedAmount:N0} VNĐ</h2>
                <p style='color: #4caf50; font-weight: 600;'>Đã được duyệt hoàn tiền</p>
            </div>

            <p style='margin-bottom: 20px;'>
                🎉 Tin vui! Yêu cầu hoàn tiền của bạn đã được duyệt. Số tiền sẽ được chuyển về tài khoản của bạn trong vòng <strong>3-5 ngày làm việc</strong>.
            </p>

            <div class='info-box'>
                <div class='info-row'>
                    <span class='info-label'>Mã đặt phòng:</span>
                    <span class='info-value'><strong>{bookingCode}</strong></span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Số tiền hoàn:</span>
                    <span class='info-value' style='color: #4caf50; font-weight: bold;'>{refundedAmount:N0} VNĐ</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Ngân hàng:</span>
                    <span class='info-value'>{bankName}</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Số tài khoản:</span>
                    <span class='info-value'>{accountNumber}</span>
                </div>
            </div>

            <div class='alert'>
                <strong>⚠️ Lưu ý:</strong> Vui lòng kiểm tra tài khoản ngân hàng của bạn sau 3-5 ngày làm việc. 
                Nếu có bất kỳ vấn đề gì, vui lòng liên hệ với chúng tôi ngay.
            </div>
        </div>
        
        <div class='footer'>
            <p><strong>QBooking Support Team</strong></p>
            <p>📧 {_config["Email:SupportEmail"]} | 📞 {_config["Email:CompanyPhone"]}</p>
            <p style='margin-top: 15px; font-size: 12px;'>
                © 2024 QBooking. Tất cả quyền được bảo lưu.
            </p>
        </div>
    </div>
</body>
</html>";

        var mail = new MailMessage
        {
            From = new MailAddress(_config["Email:FromEmail"], _config["Email:FromName"]),
            Subject = $"✅ Yêu cầu hoàn tiền #{refundTicketId} đã được duyệt",
            Body = body,
            IsBodyHtml = true
        };
        mail.To.Add(toEmail);

        await SendEmailAsync(mail);
    }

    public async Task SendRefundTicketRejectedAsync(
        string toEmail,
        string customerName,
        string bookingCode,
        decimal requestedAmount,
        string rejectReason,
        string refundTicketId)
    {
        var body = $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Yêu cầu hoàn tiền bị từ chối</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }}
        .icon {{
            font-size: 64px;
            margin-bottom: 15px;
        }}
        .header h1 {{
            font-size: 24px;
            margin-bottom: 10px;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .info-box {{
            background: #f8f9fa;
            border-left: 4px solid #f44336;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
        }}
        .info-row {{
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }}
        .info-row:last-child {{
            border-bottom: none;
        }}
        .info-label {{
            font-weight: 600;
            color: #666;
        }}
        .info-value {{
            color: #333;
            text-align: right;
        }}
        .reason-box {{
            background: #ffebee;
            border: 2px solid #f44336;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
        }}
        .reason-box h3 {{
            color: #f44336;
            margin-bottom: 10px;
        }}
        .cta-button {{
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }}
        .footer {{
            background: #333;
            color: white;
            padding: 30px;
            text-align: center;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class='email-container'>
        <div class='header'>
            <div class='icon'>❌</div>
            <h1>Yêu cầu hoàn tiền bị từ chối</h1>
            <p>Ticket #{refundTicketId}</p>
        </div>
        
        <div class='content'>
            <p style='font-size: 18px; margin-bottom: 25px;'>
                Xin chào <strong>{customerName}</strong>,
            </p>

            <p style='margin-bottom: 20px;'>
                Rất tiếc, sau khi xem xét kỹ lưỡng, chúng tôi không thể chấp thuận yêu cầu hoàn tiền của bạn vì lý do sau:
            </p>

            <div class='reason-box'>
                <h3>📋 Lý do từ chối:</h3>
                <p style='color: #666;'>{rejectReason}</p>
            </div>

            <div class='info-box'>
                <div class='info-row'>
                    <span class='info-label'>Mã đặt phòng:</span>
                    <span class='info-value'><strong>{bookingCode}</strong></span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Số tiền yêu cầu:</span>
                    <span class='info-value'>{requestedAmount:N0} VNĐ</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>Trạng thái:</span>
                    <span class='info-value' style='color: #f44336;'><strong>Đã từ chối</strong></span>
                </div>
            </div>

            <p style='color: #666; margin-top: 20px;'>
                💬 Nếu bạn có bất kỳ thắc mắc nào hoặc muốn khiếu nại quyết định này, 
                vui lòng liên hệ với bộ phận chăm sóc khách hàng của chúng tôi.
            </p>

            <a href='https://qbooking.com/support' class='cta-button'>
                Liên hệ hỗ trợ
            </a>
        </div>
        
        <div class='footer'>
            <p><strong>QBooking Support Team</strong></p>
            <p>📧 {_config["Email:SupportEmail"]} | 📞 {_config["Email:CompanyPhone"]}</p>
            <p style='margin-top: 15px; font-size: 12px;'>
                © 2024 QBooking. Tất cả quyền được bảo lưu.
            </p>
        </div>
    </div>
</body>
</html>";

        var mail = new MailMessage
        {
            From = new MailAddress(_config["Email:FromEmail"], _config["Email:FromName"]),
            Subject = $"❌ Yêu cầu hoàn tiền #{refundTicketId} đã bị từ chối",
            Body = body,
            IsBodyHtml = true
        };
        mail.To.Add(toEmail);

        await SendEmailAsync(mail);
    }
    public async Task SendAdminNotificationEmailAsync(
    string toEmail,
    string fullName,
    string title,
    string content,
    string notificationType)
    {
        var body = GenerateAdminNotificationTemplate(fullName, title, content, notificationType);

        var mail = new MailMessage
        {
            From = new MailAddress(_config["Email:FromEmail"], _config["Email:FromName"]),
            Subject = $"🔔 {title}",
            Body = body,
            IsBodyHtml = true
        };
        mail.To.Add(toEmail);

        await SendEmailAsync(mail);
    }

    private string GenerateAdminNotificationTemplate(
        string fullName,
        string title,
        string content,
        string notificationType)
    {
        // Icon theo type
        var icon = notificationType switch
        {
            "admin_announcement" => "📢",
            "admin_warning" => "⚠️",
            "admin_info" => "ℹ️",
            "admin_promotion" => "🎁",
            "admin_maintenance" => "🔧",
            _ => "🔔"
        };

        // Màu theo type
        var color = notificationType switch
        {
            "admin_warning" => "#ff9800",
            "admin_info" => "#2196f3",
            "admin_promotion" => "#4caf50",
            "admin_maintenance" => "#9c27b0",
            _ => "#667eea"
        };

        return $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>{title}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            background: linear-gradient(135deg, {color} 0%, {color}dd 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }}
        .icon {{
            font-size: 64px;
            margin-bottom: 15px;
        }}
        .header h1 {{
            font-size: 24px;
            margin-bottom: 10px;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .greeting {{
            font-size: 18px;
            color: #333;
            margin-bottom: 25px;
        }}
        .message-box {{
            background: #f8f9fa;
            border-left: 4px solid {color};
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
        }}
        .message-box p {{
            color: #555;
            line-height: 1.8;
            white-space: pre-wrap;
        }}
        .divider {{
            height: 2px;
            background: linear-gradient(to right, {color}, transparent);
            margin: 30px 0;
        }}
        .cta-button {{
            display: inline-block;
            background: {color};
            color: white;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }}
        .footer {{
            background: #333;
            color: white;
            padding: 30px;
            text-align: center;
            font-size: 14px;
        }}
        .footer p {{
            margin-bottom: 8px;
            opacity: 0.9;
        }}
    </style>
</head>
<body>
    <div class='email-container'>
        <div class='header'>
            <div class='icon'>{icon}</div>
            <h1>{title}</h1>
            <p>Thông báo từ QBooking</p>
        </div>
        
        <div class='content'>
            <div class='greeting'>
                Xin chào <strong>{fullName}</strong>,
            </div>

            <div class='message-box'>
                <p>{content}</p>
            </div>

            <div class='divider'></div>

            <p style='color: #666; font-size: 14px;'>
                Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline hỗ trợ.
            </p>

            <a href='https://qbooking.com/notifications' class='cta-button'>
                Xem tất cả thông báo
            </a>
        </div>
        
        <div class='footer'>
            <p><strong>QBooking Support Team</strong></p>
            <p>📧 {_config["Email:SupportEmail"]} | 📞 {_config["Email:CompanyPhone"]}</p>
            <p style='margin-top: 15px; font-size: 12px;'>
                © 2024 QBooking. Tất cả quyền được bảo lưu.
            </p>
        </div>
    </div>
</body>
</html>";
    }
    private string GenerateNoShowNotificationTemplate(
    string guestName, string guestPhone, string bookingCode,
    DateTime checkIn, DateTime checkOut, int nights,
    int adults, int children, int roomsCount, decimal totalAmount,
    int gracePeriodHours, string propertyName, string roomTypeName)
    {
        return $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Thông báo No-Show - QBooking</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 20px;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }}
        .header {{
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 40px 30px;
            text-align: center;
        }}
        .logo {{
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: bold;
            color: #f5576c;
            margin-bottom: 20px;
        }}
        .header h1 {{
            color: white;
            font-size: 28px;
            margin-bottom: 10px;
        }}
        .content {{
            padding: 40px;
        }}
        .alert-box {{
            background: #fff5f5;
            border-left: 4px solid #f5576c;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 8px;
        }}
        .alert-title {{
            color: #f5576c;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 10px;
        }}
        .alert-text {{
            color: #666;
            font-size: 15px;
            line-height: 1.8;
        }}
        .booking-details {{
            background: #f8f9fa;
            border-radius: 15px;
            padding: 25px;
            margin: 25px 0;
        }}
        .detail-title {{
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
            font-weight: 600;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
        }}
        .detail-row {{
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
        }}
        .detail-row:last-child {{
            border-bottom: none;
        }}
        .detail-label {{
            color: #666;
            font-weight: 500;
        }}
        .detail-value {{
            color: #333;
            font-weight: 600;
            text-align: right;
        }}
        .total-row {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 20px -25px -25px;
            padding: 20px 25px;
            border-radius: 0 0 15px 15px;
        }}
        .total-row .detail-label,
        .total-row .detail-value {{
            color: white;
            font-size: 18px;
        }}
        .info-box {{
            background: #fff8e1;
            border: 2px solid #ffd54f;
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
        }}
        .info-box h4 {{
            color: #f57c00;
            margin-bottom: 10px;
            font-size: 16px;
        }}
        .info-box p {{
            color: #666;
            font-size: 14px;
            line-height: 1.6;
        }}
        .contact-box {{
            background: #e3f2fd;
            border-radius: 10px;
            padding: 25px;
            margin: 25px 0;
            text-align: center;
        }}
        .contact-box h4 {{
            color: #1976d2;
            margin-bottom: 15px;
            font-size: 18px;
        }}
        .contact-box p {{
            color: #666;
            margin-bottom: 20px;
            font-size: 14px;
        }}
        .contact-btn {{
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-size: 15px;
            font-weight: 600;
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
        }}
        .footer {{
            background: #333;
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .footer p {{
            margin-bottom: 8px;
            font-size: 14px;
            opacity: 0.9;
        }}
        @media (max-width: 600px) {{
            .content {{ padding: 25px 20px; }}
            .booking-details {{ padding: 20px; }}
        }}
    </style>
</head>
<body>
    <div class='email-container'>
        <div class='header'>
            <div class='logo'>Q</div>
            <h1>QBooking</h1>
        </div>
        
        <div class='content'>
            <div class='alert-box'>
                <div class='alert-title'>⚠️ Booking đã bị đánh dấu No-Show</div>
                <div class='alert-text'>
                    Xin chào <strong>{guestName}</strong>,<br><br>
                    Chúng tôi rất tiếc phải thông báo rằng booking <strong>{bookingCode}</strong> của bạn 
                    đã bị đánh dấu là <strong>No-Show</strong> (không đến nhận phòng) do bạn không check-in 
                    trong khoảng thời gian quy định.
                </div>
            </div>

            <div class='booking-details'>
                <div class='detail-title'>📋 Thông tin booking</div>
                
                <div class='detail-row'>
                    <span class='detail-label'>Mã booking:</span>
                    <span class='detail-value'>{bookingCode}</span>
                </div>
                
                <div class='detail-row'>
                    <span class='detail-label'>Khách sạn:</span>
                    <span class='detail-value'>{propertyName ?? "N/A"}</span>
                </div>
                
                <div class='detail-row'>
                    <span class='detail-label'>Loại phòng:</span>
                    <span class='detail-value'>{roomTypeName ?? "N/A"}</span>
                </div>
                
                <div class='detail-row'>
                    <span class='detail-label'>Check-in (dự kiến):</span>
                    <span class='detail-value'>{checkIn:dd/MM/yyyy HH:mm}</span>
                </div>
                
                <div class='detail-row'>
                    <span class='detail-label'>Check-out:</span>
                    <span class='detail-value'>{checkOut:dd/MM/yyyy HH:mm}</span>
                </div>
                
                <div class='detail-row'>
                    <span class='detail-label'>Số đêm:</span>
                    <span class='detail-value'>{nights} đêm</span>
                </div>
                
                <div class='detail-row'>
                    <span class='detail-label'>Số phòng:</span>
                    <span class='detail-value'>{roomsCount} phòng</span>
                </div>
                
                <div class='detail-row'>
                    <span class='detail-label'>Khách:</span>
                    <span class='detail-value'>{adults} người lớn{(children > 0 ? $", {children} trẻ em" : "")}</span>
                </div>

                <div class='total-row'>
                    <div class='detail-row'>
                        <span class='detail-label'>Tổng tiền đã thanh toán:</span>
                        <span class='detail-value'>{totalAmount:N0} VNĐ</span>
                    </div>
                </div>
            </div>

            <div class='info-box'>
                <h4>📌 Lý do đánh dấu No-Show:</h4>
                <p>
                    Bạn đã không check-in trong vòng <strong>{gracePeriodHours} giờ</strong> 
                    sau thời gian check-in dự kiến (<strong>{checkIn:dd/MM/yyyy HH:mm}</strong>). 
                    Theo chính sách của chúng tôi, booking sẽ tự động bị đánh dấu No-Show 
                    nếu khách không đến trong khoảng thời gian này.
                </p>
            </div>

            <div class='info-box'>
                <h4>💰 Về việc hoàn tiền:</h4>
                <p>
                    Vui lòng xem lại chính sách hủy/hoàn tiền của khách sạn và điều khoản booking của bạn. 
                    Trong trường hợp No-Show, một số khách sạn có thể không hoàn lại tiền đặt cọc 
                    hoặc áp dụng phí phạt theo quy định.
                </p>
            </div>

            <div class='contact-box'>
                <h4>💬 Cần hỗ trợ?</h4>
                <p>
                    Nếu bạn cho rằng đây là một nhầm lẫn hoặc có vấn đề kỹ thuật,<br>
                    vui lòng liên hệ với chúng tôi ngay:
                </p>
                <a href='mailto:{_config["Email:SupportEmail"]}?subject=Khiếu nại No-Show - {bookingCode}' 
                   class='contact-btn'>
                    📧 Liên hệ hỗ trợ
                </a>
            </div>
        </div>
        
        <div class='footer'>
            <p><strong>QBooking Support Team</strong></p>
            <p>📧 {_config["Email:SupportEmail"]} | 📞 {_config["Email:CompanyPhone"]}</p>
            <p>Email này được gửi tự động, vui lòng không reply trực tiếp.</p>
            <p style='margin-top: 15px; font-size: 12px;'>
                © 2024 QBooking. Tất cả quyền được bảo lưu.
            </p>
        </div>
    </div>
</body>
</html>";
    }
    private string GenerateAccountBannedTemplate(string fullName, string reason, string contactEmail)
    {
        return $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Thông báo tạm khóa tài khoản QBooking</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            padding: 20px;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            padding: 40px 30px;
            text-align: center;
        }}
        .logo {{
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: bold;
            color: #ff6b6b;
            margin-bottom: 20px;
        }}
        .header h1 {{
            color: white;
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 300;
        }}
        .header p {{
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
        }}
        .content {{
            padding: 50px 40px;
            text-align: center;
        }}
        .warning-icon {{
            font-size: 64px;
            color: #ff6b6b;
            margin-bottom: 20px;
        }}
        .title-text {{
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
            font-weight: 600;
        }}
        .description {{
            font-size: 16px;
            color: #666;
            margin-bottom: 30px;
            line-height: 1.8;
        }}
        .reason-box {{
            background: #fff5f5;
            border: 2px solid #fed7d7;
            border-radius: 10px;
            padding: 20px;
            margin: 30px 0;
            text-align: left;
        }}
        .reason-title {{
            font-weight: 600;
            color: #e53e3e;
            margin-bottom: 10px;
            font-size: 16px;
        }}
        .reason-text {{
            color: #666;
            font-size: 14px;
            line-height: 1.6;
        }}
        .contact-section {{
            background: #f8f9fa;
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
        }}
        .contact-title {{
            font-size: 20px;
            color: #333;
            margin-bottom: 15px;
            font-weight: 600;
        }}
        .contact-info {{
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
            line-height: 1.6;
        }}
        .contact-btn {{
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
        }}
        .contact-btn:hover {{
            transform: translateY(-2px);
            box-shadow: 0 12px 25px rgba(102, 126, 234, 0.4);
        }}
        .security-tips {{
            background: #e8f5e8;
            border-left: 4px solid #48bb78;
            padding: 20px;
            margin: 30px 0;
            text-align: left;
        }}
        .security-tips h4 {{
            color: #2d3748;
            margin-bottom: 15px;
            font-size: 16px;
        }}
        .security-tips ul {{
            color: #4a5568;
            font-size: 14px;
            line-height: 1.6;
            padding-left: 20px;
        }}
        .security-tips li {{
            margin-bottom: 8px;
        }}
        .footer {{
            background: #333;
            color: white;
            padding: 40px;
            text-align: center;
        }}
        .footer p {{
            margin-bottom: 10px;
            font-size: 14px;
            opacity: 0.8;
        }}
        .important-note {{
            background: #fff8e1;
            border: 2px solid #ffcc02;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }}
        .important-note h4 {{
            color: #ff8f00;
            margin-bottom: 10px;
            font-size: 16px;
        }}
        .important-note p {{
            color: #666;
            font-size: 14px;
            line-height: 1.6;
        }}
        @media (max-width: 600px) {{
            .content {{ padding: 30px 20px; }}
            .header {{ padding: 30px 20px; }}
            .contact-section {{ padding: 20px; }}
            .contact-btn {{ padding: 12px 24px; font-size: 14px; }}
        }}
    </style>
</head>
<body>
    <div class='email-container'>
        <div class='header'>
            <div class='logo'>Q</div>
            <h1>QBooking Security</h1>
            <p>Thông báo bảo mật tài khoản</p>
        </div>
        
        <div class='content'>
            <div class='warning-icon'>⚠️</div>
            <h2 class='title-text'>Tài khoản của bạn đã bị tạm khóa</h2>
            
            <p class='description'>
                Xin chào <strong>{fullName}</strong>,<br>
                Chúng tôi rất tiếc phải thông báo rằng tài khoản QBooking của bạn đã bị tạm khóa do phát hiện hoạt động bất thường.
            </p>

            <div class='reason-box'>
                <div class='reason-title'>🔍 Lý do tạm khóa:</div>
                <div class='reason-text'>{reason}</div>
            </div>

            <div class='important-note'>
                <h4>📋 Lưu ý quan trọng:</h4>
                <p>
                    Việc tạm khóa này được thực hiện tự động bởi hệ thống bảo mật nhằm bảo vệ cộng đồng người dùng và duy trì môi trường đặt phòng an toàn.
                </p>
            </div>

            <div class='contact-section'>
                <h3 class='contact-title'>💬 Cần hỗ trợ?</h3>
                <p class='contact-info'>
                    Nếu bạn cho rằng đây là một nhầm lẫn hoặc có thắc mắc về việc tạm khóa này, 
                    vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi:
                </p>
                <a href='mailto:{contactEmail}?subject=Khiếu nại tạm khóa tài khoản - {fullName}' class='contact-btn'>
                    📧 Liên hệ hỗ trợ
                </a>
            </div>

            <div class='security-tips'>
                <h4>🛡️ Để tránh việc tạm khóa trong tương lai:</h4>
                <ul>
                    <li>Chỉ sử dụng một tài khoản duy nhất</li>
                    <li>Không chia sẻ thông tin đăng nhập với người khác</li>
                    <li>Tránh đăng nhập từ quá nhiều thiết bị khác nhau</li>
                    <li>Không sử dụng VPN hoặc proxy khi truy cập</li>
                    <li>Tuân thủ điều khoản sử dụng của QBooking</li>
                </ul>
            </div>
        </div>
        
        <div class='footer'>
            <p><strong>Đội ngũ Bảo mật QBooking</strong></p>
            <p>📧 {contactEmail} | 📞 {_config["Email:CompanyPhone"]}</p>
            <p>Email này được gửi tự động, vui lòng không reply trực tiếp.</p>
            <p style='margin-top: 20px; font-size: 12px;'>
                © 2024 QBooking. Tất cả quyền được bảo lưu.
            </p>
        </div>
    </div>
</body>
</html>";
    }
    // TEMPLATE EMAIL XÁC NHẬN TÀI KHOẢN
    private string GenerateEmailVerificationTemplate(string fullName, string verificationUrl)
    {
        return $@"
    <!DOCTYPE html>
    <html lang='vi'>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Xác nhận tài khoản QBooking</title>
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
            }}
            .email-container {{
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 30px;
                text-align: center;
            }}
            .logo {{
                width: 80px;
                height: 80px;
                background: white;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 20px;
            }}
            .header h1 {{
                color: white;
                font-size: 28px;
                margin-bottom: 10px;
                font-weight: 300;
            }}
            .header p {{
                color: rgba(255, 255, 255, 0.9);
                font-size: 16px;
            }}
            .content {{
                padding: 50px 40px;
                text-align: center;
            }}
            .welcome-text {{
                font-size: 24px;
                color: #333;
                margin-bottom: 20px;
                font-weight: 300;
            }}
            .description {{
                font-size: 16px;
                color: #666;
                margin-bottom: 40px;
                line-height: 1.8;
            }}
            .verify-btn {{
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 18px 50px;
                text-decoration: none;
                border-radius: 50px;
                font-size: 18px;
                font-weight: 600;
                box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
            }}
            .verify-btn:hover {{
                transform: translateY(-2px);
                box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
            }}
            .or-text {{
                margin: 40px 0;
                color: #999;
                font-size: 14px;
            }}
            .link-text {{
                background: #f8f9fa;
                border: 2px dashed #dee2e6;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                word-break: break-all;
                color: #667eea;
                font-size: 14px;
            }}
            .features {{
                background: #f8f9fa;
                padding: 40px;
                margin-top: 30px;
            }}
            .features h3 {{
                color: #333;
                margin-bottom: 30px;
                text-align: center;
                font-size: 20px;
            }}
            .feature-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }}
            .feature-item {{
                text-align: center;
                padding: 20px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
            }}
            .feature-icon {{
                font-size: 32px;
                margin-bottom: 15px;
            }}
            .feature-item h4 {{
                color: #333;
                margin-bottom: 10px;
                font-size: 16px;
            }}
            .feature-item p {{
                color: #666;
                font-size: 14px;
            }}
            .footer {{
                background: #333;
                color: white;
                padding: 40px;
                text-align: center;
            }}
            .footer p {{
                margin-bottom: 10px;
                font-size: 14px;
                opacity: 0.8;
            }}
            .social-links {{
                margin-top: 20px;
            }}
            .social-links a {{
                color: white;
                text-decoration: none;
                margin: 0 10px;
                font-size: 18px;
            }}
            @media (max-width: 600px) {{
                .content {{ padding: 30px 20px; }}
                .header {{ padding: 30px 20px; }}
                .features {{ padding: 20px; }}
                .verify-btn {{ padding: 15px 30px; font-size: 16px; }}
            }}
        </style>
    </head>
    <body>
        <div class='email-container'>
            <div class='header'>
                <div class='logo'>Q</div>
                <h1>Chào mừng đến QBooking!</h1>
                <p>Hệ thống đặt phòng thông minh #1 Việt Nam</p>
            </div>
            
            <div class='content'>
                <h2 class='welcome-text'>Xin chào {fullName}! 👋</h2>
                <p class='description'>
                    Cảm ơn bạn đã đăng ký tài khoản QBooking. Để hoàn tất quá trình đăng ký và trải nghiệm đầy đủ các tính năng tuyệt vời, 
                    vui lòng xác nhận địa chỉ email của bạn bằng cách nhấn vào nút bên dưới:
                </p>
                
                <a href='{verificationUrl}' class='verify-btn'>✨ Xác nhận tài khoản</a>
                
                <p class='or-text'>Hoặc sao chép liên kết sau vào trình duyệt:</p>
                <div class='link-text'>{verificationUrl}</div>
                
                <p style='color: #e74c3c; font-size: 14px; margin-top: 20px;'>
                    ⏰ Liên kết này sẽ hết hạn sau 24 giờ.
                </p>
            </div>
            
            <div class='features'>
                <h3>🌟 Những gì bạn sẽ có với QBooking:</h3>
                <div class='feature-grid'>
                    <div class='feature-item'>
                        <div class='feature-icon'>🏨</div>
                        <h4>Hàng nghìn khách sạn</h4>
                        <p>Lựa chọn đa dạng từ homestay đến resort 5 sao</p>
                    </div>
                    <div class='feature-item'>
                        <div class='feature-icon'>💰</div>
                        <h4>Giá tốt nhất</h4>
                        <p>Đảm bảo giá thấp nhất và nhiều ưu đãi hấp dẫn</p>
                    </div>
                    <div class='feature-item'>
                        <div class='feature-icon'>⚡</div>
                        <h4>Đặt phòng nhanh chóng</h4>
                        <p>Xác nhận tức thì, thanh toán an toàn 100%</p>
                    </div>
                </div>
            </div>
            
            <div class='footer'>
                <p><strong>QBooking Team</strong></p>
                <p>📧 {_config["Email:SupportEmail"]} | 📞 {_config["Email:CompanyPhone"]}</p>
                <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
                <div class='social-links'>
                    <a href='#'>📘</a>
                    <a href='#'>📷</a>
                    <a href='#'>🐦</a>
                </div>
            </div>
        </div>
    </body>
    </html>";
    }

    // TEMPLATE EMAIL RESET MẬT KHẨU
    private string GeneratePasswordResetTemplate(string fullName, string resetUrl)
    {
        return $@"
    <!DOCTYPE html>
    <html lang='vi'>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Đặt lại mật khẩu QBooking</title>
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                padding: 20px;
            }}
            .email-container {{
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                padding: 40px 30px;
                text-align: center;
            }}
            .lock-icon {{
                width: 80px;
                height: 80px;
                background: white;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                color: #ff6b6b;
                margin-bottom: 20px;
            }}
            .header h1 {{
                color: white;
                font-size: 28px;
                margin-bottom: 10px;
                font-weight: 300;
            }}
            .header p {{
                color: rgba(255, 255, 255, 0.9);
                font-size: 16px;
            }}
            .content {{
                padding: 50px 40px;
                text-align: center;
            }}
            .alert-box {{
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 30px;
            }}
            .alert-icon {{
                font-size: 24px;
                margin-bottom: 10px;
            }}
            .alert-text {{
                color: #856404;
                font-size: 16px;
                font-weight: 500;
            }}
            .greeting {{
                font-size: 24px;
                color: #333;
                margin-bottom: 20px;
                font-weight: 300;
            }}
            .description {{
                font-size: 16px;
                color: #666;
                margin-bottom: 40px;
                line-height: 1.8;
            }}
            .reset-btn {{
                display: inline-block;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                color: white;
                padding: 18px 50px;
                text-decoration: none;
                border-radius: 50px;
                font-size: 18px;
                font-weight: 600;
                box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
            }}
            .reset-btn:hover {{
                transform: translateY(-2px);
                box-shadow: 0 15px 40px rgba(255, 107, 107, 0.4);
            }}
            .link-text {{
                background: #f8f9fa;
                border: 2px dashed #dee2e6;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                word-break: break-all;
                color: #ff6b6b;
                font-size: 14px;
            }}
            .security-tips {{
                background: #e3f2fd;
                border-radius: 15px;
                padding: 30px;
                margin-top: 30px;
                text-align: left;
            }}
            .security-tips h3 {{
                color: #1976d2;
                margin-bottom: 20px;
                text-align: center;
                font-size: 18px;
            }}
            .security-tips ul {{
                list-style: none;
                padding: 0;
            }}
            .security-tips li {{
                margin-bottom: 12px;
                padding-left: 25px;
                position: relative;
                color: #555;
                font-size: 14px;
            }}
            .security-tips li:before {{
                content: '🔐';
                position: absolute;
                left: 0;
            }}
            .footer {{
                background: #333;
                color: white;
                padding: 40px;
                text-align: center;
            }}
            .footer p {{
                margin-bottom: 10px;
                font-size: 14px;
                opacity: 0.8;
            }}
            @media (max-width: 600px) {{
                .content {{ padding: 30px 20px; }}
                .header {{ padding: 30px 20px; }}
                .security-tips {{ padding: 20px; }}
                .reset-btn {{ padding: 15px 30px; font-size: 16px; }}
            }}
        </style>
    </head>
    <body>
        <div class='email-container'>
            <div class='header'>
                <div class='lock-icon'>🔐</div>
                <h1>Đặt lại mật khẩu</h1>
                <p>QBooking Security Center</p>
            </div>
            
            <div class='content'>
                <div class='alert-box'>
                    <div class='alert-icon'>⚠️</div>
                    <div class='alert-text'>Yêu cầu đặt lại mật khẩu cho tài khoản của bạn</div>
                </div>
                
                <h2 class='greeting'>Xin chào {fullName}!</h2>
                <p class='description'>
                    Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản QBooking của bạn. 
                    Nếu đây là yêu cầu của bạn, vui lòng nhấn vào nút bên dưới để tạo mật khẩu mới:
                </p>
                
                <a href='{resetUrl}' class='reset-btn'>🔑 Đặt lại mật khẩu</a>
                
                <p style='color: #999; font-size: 14px; margin-top: 20px;'>
                    Hoặc sao chép liên kết sau vào trình duyệt:
                </p>
                <div class='link-text'>{resetUrl}</div>
                
                <p style='color: #e74c3c; font-size: 14px; margin-top: 20px;'>
                    ⏰ Liên kết này sẽ hết hạn sau 1 giờ vì lý do bảo mật.
                </p>
                
                <div class='security-tips'>
                    <h3>🛡️ Tips bảo mật từ QBooking:</h3>
                    <ul>
                        <li>Sử dụng mật khẩu mạnh với ít nhất 8 ký tự</li>
                        <li>Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                        <li>Không chia sẻ mật khẩu với bất kỳ ai</li>
                        <li>Thay đổi mật khẩu định kỳ để đảm bảo an toàn</li>
                    </ul>
                </div>
            </div>
            
            <div class='footer'>
                <p><strong>QBooking Security Team</strong></p>
                <p>📧 {_config["Email:SupportEmail"]} | 📞 {_config["Email:CompanyPhone"]}</p>
                <p><strong style='color: #ff6b6b;'>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ ngay với chúng tôi!</strong></p>
            </div>
        </div>
    </body>
    </html>";
    }

    // TEMPLATE EMAIL THÔNG BÁO ĐỔI MẬT KHẨU THÀNH CÔNG
    private string GeneratePasswordResetSuccessTemplate(string fullName)
    {
        return $@"
    <!DOCTYPE html>
    <html lang='vi'>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Mật khẩu đã được đặt lại thành công</title>
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                line-height: 1.6; 
                color: #333;
                background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
                padding: 20px;
            }}
            .email-container {{
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
                padding: 40px 30px;
                text-align: center;
            }}
            .success-icon {{
                width: 80px;
                height: 80px;
                background: white;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                color: #00b894;
                margin-bottom: 20px;
                animation: checkmark 0.6s ease-in-out;
            }}
            @keyframes checkmark {{
                0% {{ transform: scale(0); }}
                50% {{ transform: scale(1.2); }}
                100% {{ transform: scale(1); }}
            }}
            .header h1 {{
                color: white;
                font-size: 28px;
                margin-bottom: 10px;
                font-weight: 300;
            }}
            .content {{
                padding: 50px 40px;
                text-align: center;
            }}
            .success-message {{
                font-size: 24px;
                color: #00b894;
                margin-bottom: 20px;
                font-weight: 600;
            }}
            .description {{
                font-size: 16px;
                color: #666;
                margin-bottom: 30px;
                line-height: 1.8;
            }}
            .info-box {{
                background: #f0f9ff;
                border: 1px solid #00cec9;
                border-radius: 15px;
                padding: 25px;
                margin: 30px 0;
            }}
            .login-btn {{
                display: inline-block;
                background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
                color: white;
                padding: 18px 50px;
                text-decoration: none;
                border-radius: 50px;
                font-size: 18px;
                font-weight: 600;
                box-shadow: 0 10px 30px rgba(0, 184, 148, 0.3);
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
            }}
            .login-btn:hover {{
                transform: translateY(-2px);
                box-shadow: 0 15px 40px rgba(0, 184, 148, 0.4);
            }}
            .footer {{
                background: #333;
                color: white;
                padding: 40px;
                text-align: center;
            }}
            .footer p {{
                margin-bottom: 10px;
                font-size: 14px;
                opacity: 0.8;
            }}
            @media (max-width: 600px) {{
                .content {{ padding: 30px 20px; }}
                .header {{ padding: 30px 20px; }}
                .login-btn {{ padding: 15px 30px; font-size: 16px; }}
            }}
        </style>
    </head>
    <body>
        <div class='email-container'>
            <div class='header'>
                <div class='success-icon'>✅</div>
                <h1>Thành công!</h1>
            </div>
            
            <div class='content'>
                <h2 class='success-message'>Mật khẩu đã được đặt lại!</h2>
                <p class='description'>
                    Xin chào {fullName}!<br><br>
                    Mật khẩu QBooking của bạn đã được thay đổi thành công. 
                    Bây giờ bạn có thể đăng nhập với mật khẩu mới.
                </p>
                
                <div class='info-box'>
                    <p style='color: #00b894; font-weight: 600; margin-bottom: 10px;'>🔒 Tài khoản của bạn đã được bảo mật</p>
                    <p style='color: #555; font-size: 14px;'>
                        Thời gian thay đổi: {DateTime.Now:dd/MM/yyyy HH:mm:ss} (UTC+7)
                    </p>
                </div>
                
                <a href='{_config["Frontend:BaseUrl"]}/auth/login' class='login-btn'>
                    🚀 Đăng nhập ngay
                </a>
                
                <p style='color: #e74c3c; font-size: 14px; margin-top: 30px; font-weight: 500;'>
                    ⚠️ Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ ngay với bộ phận hỗ trợ!
                </p>
            </div>
            
            <div class='footer'>
                <p><strong>QBooking Security Team</strong></p>
                <p>📧 {_config["Email:SupportEmail"]} | 📞 {_config["Email:CompanyPhone"]}</p>
                <p>Cảm ơn bạn đã sử dụng QBooking!</p>
            </div>
        </div>
    </body>
    </html>";
    }
    // XÁC NHẬN ĐÃ ĐJĂT PHÒNG 
    public async Task SendBookingConfirmationAsync(
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
        string roomTypeName = null)
    {
        var body = GenerateBookingConfirmationTemplate(
            guestName, guestPhone, bookingCode, checkIn, checkOut, nights,
            adults, children, roomsCount, roomPrice, discountPercent, discountAmount,
            taxAmount, serviceFee, totalAmount, paymentUrl, specialRequests,
            propertyName, roomTypeName
        );

        var mail = new MailMessage
        {
            From = new MailAddress(_config["Email:FromEmail"], _config["Email:FromName"]),
            Subject = $"✅ Xác nhận đặt phòng #{bookingCode} - QBooking",
            Body = body,
            IsBodyHtml = true
        };
        mail.To.Add(toEmail);

        await SendEmailAsync(mail);
    }
    // NHẮC NHỠ THANH TOÁN
    public async Task SendPaymentReminderAsync(
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
        string roomTypeName = null)
    {
        var body = GeneratePaymentReminderTemplate(
            guestName, guestPhone, bookingCode, checkIn, checkOut, nights,
            adults, children, roomsCount, roomPrice, discountPercent, discountAmount,
            taxAmount, serviceFee, totalAmount, paymentUrl, specialRequests,
            propertyName, roomTypeName
        );

        var mail = new MailMessage
        {
            From = new MailAddress(_config["Email:FromEmail"], _config["Email:FromName"]),
            Subject = $"⏰ Nhắc nhở thanh toán - Đặt phòng #{bookingCode} - QBooking",
            Body = body,
            IsBodyHtml = true
        };
        mail.To.Add(toEmail);

        await SendEmailAsync(mail);
    }
    // NHẮC NHỠ ĐÃ TỰ CANCCELD
    public async Task SendBookingCancelledAsync(
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
    string roomTypeName = null)
    {
        var body = GenerateBookingCancelledTemplate(
            guestName, guestPhone, bookingCode, checkIn, checkOut, nights,
            adults, children, roomsCount, totalAmount, cancelReason,
            propertyName, roomTypeName
        );

        var mail = new MailMessage
        {
            From = new MailAddress(_config["Email:FromEmail"], _config["Email:FromName"]),
            Subject = $"❌ Đặt phòng #{bookingCode} đã bị hủy - QBooking",
            Body = body,
            IsBodyHtml = true
        };
        mail.To.Add(toEmail);

        await SendEmailAsync(mail);
    }
    //CẢM ƠN
    public async Task SendThankYouEmailAsync(
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
    string roomTypeName = null)
    {
        var body = GenerateThankYouTemplate(
            guestName, guestPhone, bookingCode, checkIn, checkOut, nights,
            adults, children, roomsCount, totalAmount, reviewUrl,
            propertyName, roomTypeName
        );

        var mail = new MailMessage
        {
            From = new MailAddress(_config["Email:FromEmail"], _config["Email:FromName"]),
            Subject = $"🎉 Cảm ơn bạn đã lưu trú - #{bookingCode} - QBooking",
            Body = body,
            IsBodyHtml = true
        };
        mail.To.Add(toEmail);

        await SendEmailAsync(mail);
    }
    private async Task SendEmailAsync(MailMessage mail)
    {
        var smtpServer = _config["Email:SmtpServer"];
        var smtpPort = int.Parse(_config["Email:SmtpPort"]);
        var smtpUser = _config["Email:SmtpUsername"];
        var smtpPass = _config["Email:SmtpPassword"];

        using var smtp = new SmtpClient(smtpServer, smtpPort)
        {
            Credentials = new NetworkCredential(smtpUser, smtpPass),
            EnableSsl = true
        };

        await smtp.SendMailAsync(mail);
    }

    private string GeneratePaymentReminderTemplate(
        string guestName, string guestPhone, string bookingCode,
        DateTime checkIn, DateTime checkOut, int nights,
        int adults, int children, int roomsCount, decimal roomPrice,
        decimal discountPercent, decimal discountAmount, decimal taxAmount,
        decimal serviceFee, decimal totalAmount,
        string paymentUrl, string specialRequests, string propertyName,
        string roomTypeName)
    {
        var companyLogo = _config["Email:LogoUrl"] ?? "https://your-domain.com/logo.png";
        var supportEmail = _config["Email:SupportEmail"] ?? "support@qbooking.com";
        var companyPhone = _config["Email:CompanyPhone"] ?? "1900-xxxx";

        var vietnameseDayNames = new Dictionary<DayOfWeek, string>
        {
            { DayOfWeek.Monday, "Thứ Hai" },
            { DayOfWeek.Tuesday, "Thứ Ba" },
            { DayOfWeek.Wednesday, "Thứ Tư" },
            { DayOfWeek.Thursday, "Thứ Năm" },
            { DayOfWeek.Friday, "Thứ Sáu" },
            { DayOfWeek.Saturday, "Thứ Bảy" },
            { DayOfWeek.Sunday, "Chủ Nhật" }
        };

        var checkInDay = vietnameseDayNames[checkIn.DayOfWeek];
        var checkOutDay = vietnameseDayNames[checkOut.DayOfWeek];
        var guestCount = adults + (children > 0 ? children : 0);

        return $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Nhắc nhở thanh toán - QBooking</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            background: linear-gradient(135deg, #ff7675 0%, #fd79a8 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        .container {{
            max-width: 650px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }}
        .header {{
            background: linear-gradient(135deg, #ff7675 0%, #fd79a8 100%);
            color: white;
            text-align: center;
            padding: 40px 30px;
            position: relative;
        }}
        .header::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns=""http://www.w3.org/2000/svg"" viewBox=""0 0 100 100""><defs><pattern id=""grain"" width=""100"" height=""100"" patternUnits=""userSpaceOnUse""><circle cx=""50"" cy=""50"" r=""1"" fill=""rgba(255,255,255,0.1)""/></pattern></defs><rect width=""100"" height=""100"" fill=""url(%23grain)""/></svg>');
            opacity: 0.3;
        }}
        .header-content {{ position: relative; z-index: 1; }}
        .logo {{ max-width: 120px; margin-bottom: 15px; }}
        .header h1 {{ 
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }}
        .booking-code {{
            background: rgba(255,255,255,0.2);
            padding: 12px 24px;
            border-radius: 50px;
            font-size: 18px;
            font-weight: 600;
            letter-spacing: 2px;
            display: inline-block;
            margin-top: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
        }}
        .content {{ padding: 40px 30px; }}
        .greeting {{
            font-size: 24px;
            color: #2c3e50;
            margin-bottom: 25px;
            font-weight: 600;
        }}
        .urgent-message {{
            background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 30px;
            text-align: center;
            font-weight: 500;
            border: 3px solid #ff5252;
        }}
        .urgent-message h3 {{
            font-size: 22px;
            margin-bottom: 10px;
            font-weight: 700;
        }}
        .booking-details {{
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
            border: 1px solid #e9ecef;
        }}
        .detail-row {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #dee2e6;
        }}
        .detail-row:last-child {{ border-bottom: none; }}
        .detail-label {{
            font-weight: 600;
            color: #495057;
            flex: 1;
        }}
        .detail-value {{
            font-weight: 500;
            color: #212529;
            text-align: right;
            flex: 1;
        }}
        .highlight {{ 
            color: #ff6b6b; 
            font-weight: 700; 
        }}
        .date-container {{
            display: flex;
            justify-content: space-between;
            margin: 25px 0;
            gap: 20px;
        }}
        .date-box {{
            flex: 1;
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #ff7675 0%, #fd79a8 100%);
            color: white;
            border-radius: 15px;
            position: relative;
        }}
        .date-label {{
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
            opacity: 0.8;
        }}
        .date-value {{
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 5px;
        }}
        .day-name {{
            font-size: 14px;
            opacity: 0.9;
        }}
        .nights-badge {{
            position: absolute;
            top: -10px;
            right: -10px;
            background: #ff3742;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }}
        .pricing-section {{
            background: #ffffff;
            border: 2px solid #e9ecef;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
        }}
        .pricing-title {{
            font-size: 20px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 20px;
            text-align: center;
        }}
        .price-row {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            font-size: 15px;
        }}
        .price-row.discount {{
            color: #00b894;
            font-weight: 600;
        }}
        .price-row.total {{
            border-top: 2px solid #ff6b6b;
            margin-top: 15px;
            padding-top: 15px;
            font-size: 18px;
            font-weight: 700;
            color: #ff6b6b;
        }}
        .payment-section {{
            background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 30px;
            animation: pulse 2s infinite;
        }}
        @keyframes pulse {{
            0% {{ box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7); }}
            70% {{ box-shadow: 0 0 0 10px rgba(255, 107, 107, 0); }}
            100% {{ box-shadow: 0 0 0 0 rgba(255, 107, 107, 0); }}
        }}
        .payment-button {{
            display: inline-block;
            background: white;
            color: #ff6b6b;
            padding: 18px 45px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 700;
            font-size: 18px;
            margin-top: 20px;
            transition: all 0.3s ease;
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }}
        .payment-button:hover {{ 
            transform: translateY(-3px); 
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }}
        .warning-box {{
            background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 30px;
            text-align: center;
        }}
        .info-cards {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }}
        .info-card {{
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            border: 1px solid #e9ecef;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
        }}
        .info-card-icon {{
            font-size: 24px;
            margin-bottom: 10px;
        }}
        .info-card-title {{
            font-weight: 600;
            color: #495057;
            margin-bottom: 5px;
        }}
        .info-card-value {{
            font-weight: 700;
            color: #212529;
            font-size: 18px;
        }}
        .footer {{
            background: #2c3e50;
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .footer-content {{
            margin-bottom: 20px;
        }}
        .footer-links {{
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 20px;
        }}
        .footer-link {{
            color: #bdc3c7;
            text-decoration: none;
            font-size: 14px;
        }}
        .footer-link:hover {{ color: white; }}
        @media (max-width: 600px) {{
            .date-container {{ flex-direction: column; }}
            .info-cards {{ grid-template-columns: 1fr; }}
            .footer-links {{ flex-direction: column; gap: 10px; }}
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='header-content'>
                <img src='{companyLogo}' alt='QBooking Logo' class='logo'>
                <h1>⏰ Nhắc nhở thanh toán</h1>
                <div class='booking-code'>#{bookingCode}</div>
            </div>
        </div>

        <div class='content'>
            <div class='greeting'>
                Xin chào {guestName}! 👋
            </div>

            <div class='urgent-message'>
                <h3>🔔 Bạn có đặt phòng chưa thanh toán!</h3>
                <p>Đặt phòng của bạn đang chờ thanh toán để hoàn tất. Vui lòng thanh toán sớm để đảm bảo phòng của bạn.</p>
            </div>

            <div class='date-container'>
                <div class='date-box'>
                    <div class='date-label'>Nhận phòng</div>
                    <div class='date-value'>{checkIn:dd/MM/yyyy}</div>
                    <div class='day-name'>{checkInDay}</div>
                </div>
                <div class='date-box'>
                    <div class='date-label'>Trả phòng</div>
                    <div class='date-value'>{checkOut:dd/MM/yyyy}</div>
                    <div class='day-name'>{checkOutDay}</div>
                    <div class='nights-badge'>{nights}N</div>
                </div>
            </div>

            <div class='booking-details'>
                <div class='detail-row'>
                    <span class='detail-label'>🏨 Khách sạn:</span>
                    <span class='detail-value'>{propertyName ?? "QBooking Hotel"}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>🛏️ Loại phòng:</span>
                    <span class='detail-value'>{roomTypeName ?? "Standard Room"}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>📅 Số đêm:</span>
                    <span class='detail-value highlight'>{nights} đêm</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>🏠 Số phòng:</span>
                    <span class='detail-value'>{roomsCount} phòng</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>👥 Số khách:</span>
                    <span class='detail-value'>{guestCount} khách ({adults} người lớn{(children > 0 ? $", {children} trẻ em" : "")})</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>📞 Số điện thoại:</span>
                    <span class='detail-value'>{guestPhone}</span>
                </div>
            </div>

            <div class='pricing-section'>
                <div class='pricing-title'>💰 Số tiền cần thanh toán</div>
                <div class='price-row'>
                    <span>Giá phòng ({nights} đêm × {roomsCount} phòng):</span>
                    <span>{roomPrice:C}</span>
                </div>
                {(discountAmount > 0 ? $@"
                <div class='price-row discount'>
                    <span>🎉 Giảm giá ({discountPercent:F1}%):</span>
                    <span>-{discountAmount:C}</span>
                </div>
                <div class='price-row'>
                    <span>Tạm tính:</span>
                    <span>{(roomPrice - discountAmount):C}</span>
                </div>" : "")}
                <div class='price-row'>
                    <span>Phí dịch vụ:</span>
                    <span>{serviceFee:C}</span>
                </div>
                <div class='price-row'>
                    <span>Thuế VAT (10%):</span>
                    <span>{taxAmount:C}</span>
                </div>
                <div class='price-row total'>
                    <span>Tổng cần thanh toán:</span>
                    <span>{totalAmount:C}</span>
                </div>
            </div>

            <div class='payment-section'>
                <h3>🚨 THANH TOÁN NGAY</h3>
                <p>Để đảm bảo đặt phòng của bạn, vui lòng hoàn tất thanh toán ngay bây giờ!</p>
                <a href='{paymentUrl}' class='payment-button'>Thanh toán ngay</a>
                <p style='margin-top: 20px; font-size: 14px; opacity: 0.9;'>
                    💳 Hỗ trợ: Visa, Mastercard, JCB, Chuyển khoản ngân hàng
                </p>
            </div>

            <div class='warning-box'>
                <h4>⚠️ Lưu ý quan trọng</h4>
                <p>Nếu không thanh toán trong thời gian quy định, đặt phòng của bạn có thể bị hủy tự động.</p>
            </div>
        </div>

        <div class='footer'>
            <div class='footer-content'>
                <h4>🎯 QBooking - Đặt phòng thông minh</h4>
                <p>Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7</p>
            </div>
            
            <div class='footer-links'>
                <a href='mailto:{supportEmail}' class='footer-link'>📧 {supportEmail}</a>
                <a href='tel:{companyPhone}' class='footer-link'>📞 {companyPhone}</a>
                <a href='#' class='footer-link'>🌐 qbooking.com</a>
            </div>
            
            <p style='margin-top: 20px; font-size: 12px; color: #95a5a6;'>
                © 2024 QBooking. Tất cả quyền được bảo lưu.<br>
                Email này được gửi tự động, vui lòng không trả lời.
            </p>
        </div>
    </div>
</body>
</html>";
    }

    // Giữ nguyên template xác nhận booking cũ
    // Thêm method này vào EmailService class
    private string GenerateBookingConfirmationTemplate(
        string guestName, string guestPhone, string bookingCode,
        DateTime checkIn, DateTime checkOut, int nights,
        int adults, int children, int roomsCount, decimal roomPrice,
        decimal discountPercent, decimal discountAmount, decimal taxAmount,
        decimal serviceFee, decimal totalAmount,
        string paymentUrl, string specialRequests, string propertyName,
        string roomTypeName)
    {
        var companyLogo = _config["Email:LogoUrl"] ?? "https://your-domain.com/logo.png";
        var supportEmail = _config["Email:SupportEmail"] ?? "support@qbooking.com";
        var companyPhone = _config["Email:CompanyPhone"] ?? "1900-xxxx";
        var websiteUrl = _config["Website:Url"] ?? "https://qbooking.com";

        var vietnameseDayNames = new Dictionary<DayOfWeek, string>
    {
        { DayOfWeek.Monday, "Thứ Hai" },
        { DayOfWeek.Tuesday, "Thứ Ba" },
        { DayOfWeek.Wednesday, "Thứ Tư" },
        { DayOfWeek.Thursday, "Thứ Năm" },
        { DayOfWeek.Friday, "Thứ Sáu" },
        { DayOfWeek.Saturday, "Thứ Bảy" },
        { DayOfWeek.Sunday, "Chủ Nhật" }
    };

        var checkInDay = vietnameseDayNames[checkIn.DayOfWeek];
        var checkOutDay = vietnameseDayNames[checkOut.DayOfWeek];
        var guestCount = adults + (children > 0 ? children : 0);

        return $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Xác nhận đặt phòng thành công - QBooking</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        .container {{
            max-width: 650px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }}
        .header {{
            background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
            color: white;
            text-align: center;
            padding: 40px 30px;
            position: relative;
        }}
        .header::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns=""http://www.w3.org/2000/svg"" viewBox=""0 0 100 100""><defs><pattern id=""grain"" width=""100"" height=""100"" patternUnits=""userSpaceOnUse""><circle cx=""50"" cy=""50"" r=""1"" fill=""rgba(255,255,255,0.1)""/></pattern></defs><rect width=""100"" height=""100"" fill=""url(%23grain)""/></svg>');
            opacity: 0.3;
        }}
        .header-content {{ position: relative; z-index: 1; }}
        .logo {{ max-width: 120px; margin-bottom: 15px; }}
        .header h1 {{ 
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }}
        .booking-code {{
            background: rgba(255,255,255,0.2);
            padding: 12px 24px;
            border-radius: 50px;
            font-size: 18px;
            font-weight: 600;
            letter-spacing: 2px;
            display: inline-block;
            margin-top: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
        }}
        .content {{ padding: 40px 30px; }}
        .greeting {{
            font-size: 24px;
            color: #2c3e50;
            margin-bottom: 25px;
            font-weight: 600;
        }}
        .success-message {{
            background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            text-align: center;
            font-weight: 500;
        }}
        .success-message h3 {{
            font-size: 24px;
            margin-bottom: 15px;
            font-weight: 700;
        }}
        .success-message p {{
            font-size: 16px;
            line-height: 1.7;
            margin-bottom: 10px;
        }}
        .booking-details {{
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
            border: 1px solid #e9ecef;
        }}
        .detail-row {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #dee2e6;
        }}
        .detail-row:last-child {{ border-bottom: none; }}
        .detail-label {{
            font-weight: 600;
            color: #495057;
            flex: 1;
        }}
        .detail-value {{
            font-weight: 500;
            color: #212529;
            text-align: right;
            flex: 1;
        }}
        .highlight {{ 
            color: #00b894; 
            font-weight: 700; 
        }}
        .date-container {{
            display: flex;
            justify-content: space-between;
            margin: 25px 0;
            gap: 20px;
        }}
        .date-box {{
            flex: 1;
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
            color: white;
            border-radius: 15px;
            position: relative;
        }}
        .date-label {{
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
            opacity: 0.8;
        }}
        .date-value {{
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 5px;
        }}
        .day-name {{
            font-size: 14px;
            opacity: 0.9;
        }}
        .nights-badge {{
            position: absolute;
            top: -10px;
            right: -10px;
            background: #00a085;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }}
        .pricing-section {{
            background: #ffffff;
            border: 2px solid #e9ecef;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
        }}
        .pricing-title {{
            font-size: 20px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 20px;
            text-align: center;
        }}
        .price-row {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            font-size: 15px;
        }}
        .price-row.discount {{
            color: #00b894;
            font-weight: 600;
        }}
        .price-row.total {{
            border-top: 2px solid #00b894;
            margin-top: 15px;
            padding-top: 15px;
            font-size: 18px;
            font-weight: 700;
            color: #00b894;
        }}
        .paid-badge {{
            background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .website-section {{
            background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 30px;
        }}
        .website-button {{
            display: inline-block;
            background: white;
            color: #6c5ce7;
            padding: 15px 35px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 700;
            font-size: 16px;
            margin-top: 15px;
            transition: all 0.3s ease;
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }}
        .website-button:hover {{ 
            transform: translateY(-3px); 
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }}
        .info-section {{
            background: #fff3cd;
            color: #856404;
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 30px;
            border: 1px solid #ffeaa7;
        }}
        .footer {{
            background: #2c3e50;
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .footer-content {{
            margin-bottom: 20px;
        }}
        .footer-links {{
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 20px;
        }}
        .footer-link {{
            color: #bdc3c7;
            text-decoration: none;
            font-size: 14px;
        }}
        .footer-link:hover {{ color: white; }}
        @media (max-width: 600px) {{
            .date-container {{ flex-direction: column; }}
            .footer-links {{ flex-direction: column; gap: 10px; }}
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='header-content'>
                <img src='{companyLogo}' alt='QBooking Logo' class='logo'>
                <h1>✅ Đặt phòng thành công!</h1>
                <div class='booking-code'>#{bookingCode}</div>
            </div>
        </div>

        <div class='content'>
            <div class='greeting'>
                Xin chào {guestName}! 🎉
            </div>

            <div class='success-message'>
                <h3>🎊 Cảm ơn bạn đã đặt phòng!</h3>
                <p>Chúng tôi đã nhận được thanh toán của bạn và xác nhận đặt phòng thành công.</p>
                <p>Thông tin chi tiết đặt phòng của bạn như sau:</p>
            </div>

            <div class='date-container'>
                <div class='date-box'>
                    <div class='date-label'>Nhận phòng</div>
                    <div class='date-value'>{checkIn:dd/MM/yyyy}</div>
                    <div class='day-name'>{checkInDay}</div>
                </div>
                <div class='date-box'>
                    <div class='date-label'>Trả phòng</div>
                    <div class='date-value'>{checkOut:dd/MM/yyyy}</div>
                    <div class='day-name'>{checkOutDay}</div>
                    <div class='nights-badge'>{nights}N</div>
                </div>
            </div>

            <div class='booking-details'>
                <div class='detail-row'>
                    <span class='detail-label'>🏨 Khách sạn:</span>
                    <span class='detail-value'>{propertyName ?? "QBooking Hotel"}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>🛏️ Loại phòng:</span>
                    <span class='detail-value'>{roomTypeName ?? "Standard Room"}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>📅 Số đêm:</span>
                    <span class='detail-value highlight'>{nights} đêm</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>🏠 Số phòng:</span>
                    <span class='detail-value'>{roomsCount} phòng</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>👥 Số khách:</span>
                    <span class='detail-value'>{guestCount} khách ({adults} người lớn{(children > 0 ? $", {children} trẻ em" : "")})</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>📞 Số điện thoại:</span>
                    <span class='detail-value'>{guestPhone}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>💳 Trạng thái thanh toán:</span>
                    <span class='detail-value'><span class='paid-badge'>Đã thanh toán</span></span>
                </div>
            </div>

            <div class='pricing-section'>
                <div class='pricing-title'>💰 Chi tiết thanh toán</div>
                <div class='price-row'>
                    <span>Giá phòng ({nights} đêm × {roomsCount} phòng):</span>
                    <span>{roomPrice:C}</span>
                </div>
                {(discountAmount > 0 ? $@"
                <div class='price-row discount'>
                    <span>🎉 Giảm giá ({discountPercent:F1}%):</span>
                    <span>-{discountAmount:C}</span>
                </div>
                <div class='price-row'>
                    <span>Tạm tính:</span>
                    <span>{(roomPrice - discountAmount):C}</span>
                </div>" : "")}
                <div class='price-row'>
                    <span>Phí dịch vụ:</span>
                    <span>{serviceFee:C}</span>
                </div>
                <div class='price-row'>
                    <span>Thuế VAT (10%):</span>
                    <span>{taxAmount:C}</span>
                </div>
                <div class='price-row total'>
                    <span>Đã thanh toán:</span>
                    <span>{totalAmount:C}</span>
                </div>
            </div>

            {(!string.IsNullOrEmpty(specialRequests) ? $@"
            <div class='info-section'>
                <h4>📝 Yêu cầu đặc biệt:</h4>
                <p>{specialRequests}</p>
                <p style='margin-top: 10px; font-size: 14px;'>
                    Chúng tôi sẽ cố gắng đáp ứng yêu cầu của bạn tùy thuộc vào tình hình thực tế.
                </p>
            </div>" : "")}

            <div class='info-section'>
                <h4>ℹ️ Lưu ý quan trọng:</h4>
                <ul style='margin-left: 20px; margin-top: 10px;'>
                    <li>Vui lòng mang theo CMND/CCCD khi check-in</li>
                    <li>Thời gian check-in: 14:00 | Check-out: 12:00</li>
                    <li>Liên hệ khách sạn trước nếu bạn đến muộn</li>
                    <li>Mã đặt phòng: <strong>#{bookingCode}</strong></li>
                </ul>
            </div>

            <div class='website-section'>
                <h3>🌐 Khám phá thêm</h3>
                <p>Ghé thăm website để xem các ưu đãi mới nhất và đặt phòng cho chuyến đi tiếp theo!</p>
                <a href='{websiteUrl}' class='website-button'>Truy cập QBooking.com</a>
            </div>
        </div>

        <div class='footer'>
            <div class='footer-content'>
                <h4>🎯 QBooking - Đặt phòng thông minh</h4>
                <p>Cảm ơn bạn đã tin tưởng và lựa chọn dịch vụ của chúng tôi!</p>
            </div>
            
            <div class='footer-links'>
                <a href='mailto:{supportEmail}' class='footer-link'>📧 {supportEmail}</a>
                <a href='tel:{companyPhone}' class='footer-link'>📞 {companyPhone}</a>
                <a href='{websiteUrl}' class='footer-link'>🌐 qbooking.com</a>
            </div>
            
            <p style='margin-top: 20px; font-size: 12px; color: #95a5a6;'>
                © 2024 QBooking. Tất cả quyền được bảo lưu.<br>
                Chúc bạn có những trải nghiệm tuyệt vời! ✨
            </p>
        </div>
    </div>
</body>
</html>";
    }
    private string GenerateBookingCancelledTemplate(
      string guestName, string guestPhone, string bookingCode,
      DateTime checkIn, DateTime checkOut, int nights,
      int adults, int children, int roomsCount, decimal totalAmount,
      string cancelReason, string propertyName, string roomTypeName)
    {
        var companyLogo = _config["Email:LogoUrl"] ?? "https://your-domain.com/logo.png";
        var supportEmail = _config["Email:SupportEmail"] ?? "support@qbooking.com";
        var companyPhone = _config["Email:CompanyPhone"] ?? "1900-xxxx";

        var vietnameseDayNames = new Dictionary<DayOfWeek, string>
    {
        { DayOfWeek.Monday, "Thứ Hai" },
        { DayOfWeek.Tuesday, "Thứ Ba" },
        { DayOfWeek.Wednesday, "Thứ Tư" },
        { DayOfWeek.Thursday, "Thứ Năm" },
        { DayOfWeek.Friday, "Thứ Sáu" },
        { DayOfWeek.Saturday, "Thứ Bảy" },
        { DayOfWeek.Sunday, "Chủ Nhật" }
    };

        var checkInDay = vietnameseDayNames[checkIn.DayOfWeek];
        var checkOutDay = vietnameseDayNames[checkOut.DayOfWeek];
        var guestCount = adults + (children > 0 ? children : 0);

        // Phân loại lý do hủy để hiển thị message phù hợp
        bool isAutoCancel = cancelReason.Contains("Không thanh toán trong 24 giờ") ||
                           cancelReason.Contains("không hoàn tất thanh toán");
        bool isAdminCancel = cancelReason.Contains("Hủy bởi quản trị viên") ||
                            cancelReason.Contains("admin");
        bool isHostCancel = cancelReason.Contains("Hủy bởi chủ nhà") ||
                           cancelReason.Contains("host");
        bool isCustomerCancel = cancelReason.Contains("Hủy bởi khách hàng") ||
                               cancelReason.Contains("customer");

        // Xác định màu sắc và message dựa trên loại hủy
        string headerColor = "#e74c3c"; // Đỏ mặc định
        string cancelTitle = "Đặt phòng đã bị hủy";
        string cancelMessage = "Rất tiếc, đặt phòng của bạn đã bị hủy.";
        string policyMessage = "";
        string actionSection = "";

        if (isAutoCancel)
        {
            headerColor = "#e74c3c"; // Đỏ
            cancelTitle = "Đặt phòng đã bị hủy tự động";
            cancelMessage = "Rất tiếc, đặt phòng của bạn đã bị hủy tự động do không hoàn tất thanh toán trong thời hạn quy định.";
            policyMessage = "Theo chính sách của chúng tôi, đặt phòng sẽ bị hủy tự động nếu không thanh toán trong vòng 24 giờ kể từ khi đặt.";
            actionSection = $@"
            <div class='new-booking-section'>
                <h3>🏨 Đặt phòng mới?</h3>
                <p>Bạn vẫn có thể đặt phòng mới với chúng tôi. Hãy hoàn tất thanh toán sớm để tránh bị hủy.</p>
                <a href='https://yourdomain.com' class='new-booking-button'>Đặt phòng mới</a>
            </div>";
        }
        else if (isAdminCancel)
        {
            headerColor = "#f39c12"; // Cam
            cancelTitle = "Đặt phòng đã bị hủy bởi quản trị viên";
            cancelMessage = "Đặt phòng của bạn đã được hủy bởi đội ngũ quản trị viên của chúng tôi.";
            policyMessage = "Chúng tôi xin lỗi vì sự bất tiện này. Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ với bộ phận hỗ trợ khách hàng.";
            actionSection = $@"
            <div class='support-section'>
                <h3>📞 Cần hỗ trợ?</h3>
                <p>Nếu bạn có bất kỳ thắc mắc nào về việc hủy đặt phòng, đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ.</p>
                <div style='margin-top: 15px;'>
                    <a href='mailto:{supportEmail}' class='support-button'>Liên hệ hỗ trợ</a>
                </div>
            </div>";
        }
        else if (isHostCancel)
        {
            headerColor = "#9b59b6"; // Tím
            cancelTitle = "Đặt phòng đã bị hủy bởi chủ nhà";
            cancelMessage = "Chủ nhà đã hủy đặt phòng của bạn vì những lý do không thể tránh khỏi.";
            policyMessage = "Chúng tôi hiểu điều này có thể gây bất tiện. Chúng tôi sẽ hỗ trợ bạn tìm chỗ ở thay thế tương tự.";
            actionSection = $@"
            <div class='alternative-section'>
                <h3>🏠 Tìm chỗ ở thay thế?</h3>
                <p>Chúng tôi sẽ giúp bạn tìm những lựa chọn thay thế tương tự trong cùng khu vực với cùng mức giá.</p>
                <div style='margin-top: 15px;'>
                    <a href='https://yourdomain.com/search' class='alternative-button'>Tìm phòng thay thế</a>
                    <a href='mailto:{supportEmail}' class='support-button' style='margin-left: 10px;'>Yêu cầu hỗ trợ</a>
                </div>
            </div>";
        }
        else if (isCustomerCancel)
        {
            headerColor = "#3498db"; // Xanh dương
            cancelTitle = "Xác nhận hủy đặt phòng";
            cancelMessage = "Đặt phòng của bạn đã được hủy theo yêu cầu của bạn.";
            policyMessage = "Nếu có phí hủy được áp dụng, nó sẽ được hiển thị trong thông tin chi tiết bên dưới.";
            actionSection = $@"
            <div class='rebooking-section'>
                <h3>🔄 Đặt lại phòng?</h3>
                <p>Nếu bạn thay đổi ý định, chúng tôi luôn sẵn sàng phục vụ bạn với những lựa chọn tốt nhất.</p>
                <a href='https://yourdomain.com' class='rebooking-button'>Đặt phòng mới</a>
            </div>";
        }

        return $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>{cancelTitle} - QBooking</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            background: linear-gradient(135deg, {headerColor} 0%, {GetDarkerColor(headerColor)} 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        .container {{
            max-width: 650px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }}
        .header {{
            background: linear-gradient(135deg, {headerColor} 0%, {GetDarkerColor(headerColor)} 100%);
            color: white;
            text-align: center;
            padding: 40px 30px;
        }}
        .header h1 {{ 
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 10px;
        }}
        .booking-code {{
            background: rgba(255,255,255,0.2);
            padding: 12px 24px;
            border-radius: 50px;
            font-size: 18px;
            font-weight: 600;
            letter-spacing: 2px;
            display: inline-block;
            margin-top: 15px;
        }}
        .content {{ padding: 40px 30px; }}
        .greeting {{
            font-size: 24px;
            color: #2c3e50;
            margin-bottom: 25px;
            font-weight: 600;
        }}
        .cancel-message {{
            background: linear-gradient(135deg, {headerColor} 0%, {GetDarkerColor(headerColor)} 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 30px;
            text-align: center;
        }}
        .cancel-message h3 {{
            font-size: 22px;
            margin-bottom: 15px;
            font-weight: 700;
        }}
        .booking-details {{
            background: #f8f9fa;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
        }}
        .detail-row {{
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #dee2e6;
        }}
        .detail-row:last-child {{ border-bottom: none; }}
        .detail-label {{ font-weight: 600; color: #495057; }}
        .detail-value {{ font-weight: 500; color: #212529; }}
        .date-container {{
            display: flex;
            justify-content: space-between;
            margin: 25px 0;
            gap: 20px;
        }}
        .date-box {{
            flex: 1;
            text-align: center;
            padding: 20px;
            background: #6c757d;
            color: white;
            border-radius: 15px;
            opacity: 0.7;
        }}
        .date-label {{ font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }}
        .date-value {{ font-size: 16px; font-weight: 700; margin-bottom: 5px; }}
        .day-name {{ font-size: 14px; }}
        .reason-box {{
            background: #fff3cd;
            color: #856404;
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 30px;
            border: 1px solid #ffeaa7;
        }}
        .new-booking-section, .support-section, .alternative-section, .rebooking-section {{
            background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 30px;
        }}
        .support-section {{
            background: linear-gradient(135deg, #f39c12 0%, #d68910 100%);
        }}
        .alternative-section {{
            background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
        }}
        .rebooking-section {{
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
        }}
        .new-booking-button, .support-button, .alternative-button, .rebooking-button {{
            display: inline-block;
            background: white;
            color: #00b894;
            padding: 15px 35px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 700;
            margin-top: 15px;
            transition: all 0.3s ease;
        }}
        .support-button {{ color: #f39c12; }}
        .alternative-button {{ color: #9b59b6; }}
        .rebooking-button {{ color: #3498db; }}
        .footer {{
            background: #2c3e50;
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .footer-links {{
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 20px;
        }}
        .footer-link {{
            color: #bdc3c7;
            text-decoration: none;
        }}
        @media (max-width: 600px) {{
            .date-container {{ flex-direction: column; }}
            .footer-links {{ flex-direction: column; gap: 10px; }}
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <img src='{companyLogo}' alt='QBooking Logo' style='max-width: 120px; margin-bottom: 15px;'>
            <h1>{GetCancelIcon(cancelReason)} {cancelTitle}</h1>
            <div class='booking-code'>#{bookingCode}</div>
        </div>

        <div class='content'>
            <div class='greeting'>
                Xin chào {guestName}!
            </div>

            <div class='cancel-message'>
                <h3>{GetCancelIcon(cancelReason)} {cancelMessage}</h3>
            </div>

            <div class='reason-box'>
                <h4>📋 Lý do hủy:</h4>
                <p><strong>{cancelReason}</strong></p>
                {(string.IsNullOrEmpty(policyMessage) ? "" : $"<p style='margin-top: 10px; font-size: 14px;'>{policyMessage}</p>")}
            </div>

            <div class='date-container'>
                <div class='date-box'>
                    <div class='date-label'>Nhận phòng (đã hủy)</div>
                    <div class='date-value'>{checkIn:dd/MM/yyyy}</div>
                    <div class='day-name'>{checkInDay}</div>
                </div>
                <div class='date-box'>
                    <div class='date-label'>Trả phòng (đã hủy)</div>
                    <div class='date-value'>{checkOut:dd/MM/yyyy}</div>
                    <div class='day-name'>{checkOutDay}</div>
                </div>
            </div>

            <div class='booking-details'>
                <h3 style='margin-bottom: 20px; color: #2c3e50;'>Chi tiết đặt phòng đã hủy</h3>
                <div class='detail-row'>
                    <span class='detail-label'>🏨 Khách sạn:</span>
                    <span class='detail-value'>{propertyName ?? "QBooking Hotel"}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>🛏️ Loại phòng:</span>
                    <span class='detail-value'>{roomTypeName ?? "Standard Room"}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>📅 Số đêm:</span>
                    <span class='detail-value'>{nights} đêm</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>🏠 Số phòng:</span>
                    <span class='detail-value'>{roomsCount} phòng</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>👥 Số khách:</span>
                    <span class='detail-value'>{guestCount} khách ({adults} người lớn{(children > 0 ? $", {children} trẻ em" : "")})</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>💰 Tổng tiền (đã hủy):</span>
                    <span class='detail-value' style='text-decoration: line-through; color: #6c757d;'>{totalAmount:C}</span>
                </div>
            </div>

            {actionSection}
        </div>

        <div class='footer'>
            <div style='margin-bottom: 20px;'>
                <h4>🎯 QBooking - Đặt phòng thông minh</h4>
                <p>Chúng tôi xin lỗi vì sự bất tiện này</p>
            </div>
            
            <div class='footer-links'>
                <a href='mailto:{supportEmail}' class='footer-link'>📧 {supportEmail}</a>
                <a href='tel:{companyPhone}' class='footer-link'>📞 {companyPhone}</a>
                <a href='#' class='footer-link'>🌐 qbooking.com</a>
            </div>
            
            <p style='margin-top: 20px; font-size: 12px; color: #95a5a6;'>
                © 2024 QBooking. Tất cả quyền được bảo lưu.
            </p>
        </div>
    </div>
</body>
</html>";
    }

    // Helper methods
    private string GetDarkerColor(string color)
    {
        return color switch
        {
            "#e74c3c" => "#c0392b", // Đỏ đậm hơn
            "#f39c12" => "#d68910", // Cam đậm hơn  
            "#9b59b6" => "#8e44ad", // Tím đậm hơn
            "#3498db" => "#2980b9", // Xanh đậm hơn
            _ => "#c0392b"
        };
    }

    private string GetCancelIcon(string cancelReason)
    {
        if (cancelReason.Contains("Không thanh toán") || cancelReason.Contains("không hoàn tất thanh toán"))
            return "⏰";
        if (cancelReason.Contains("quản trị viên") || cancelReason.Contains("admin"))
            return "👨‍💼";
        if (cancelReason.Contains("chủ nhà") || cancelReason.Contains("host"))
            return "🏠";
        if (cancelReason.Contains("khách hàng") || cancelReason.Contains("customer"))
            return "👤";
        return "❌";
    }
    private string GenerateThankYouTemplate(
    string guestName, string guestPhone, string bookingCode,
    DateTime checkIn, DateTime checkOut, int nights,
    int adults, int children, int roomsCount, decimal totalAmount,
    string reviewUrl, string propertyName, string roomTypeName)
    {
        var companyLogo = _config["Email:LogoUrl"] ?? "https://your-domain.com/logo.png";
        var supportEmail = _config["Email:SupportEmail"] ?? "support@qbooking.com";
        var companyPhone = _config["Email:CompanyPhone"] ?? "1900-xxxx";

        var vietnameseDayNames = new Dictionary<DayOfWeek, string>
    {
        { DayOfWeek.Monday, "Thứ Hai" },
        { DayOfWeek.Tuesday, "Thứ Ba" },
        { DayOfWeek.Wednesday, "Thứ Tư" },
        { DayOfWeek.Thursday, "Thứ Năm" },
        { DayOfWeek.Friday, "Thứ Sáu" },
        { DayOfWeek.Saturday, "Thứ Bảy" },
        { DayOfWeek.Sunday, "Chủ Nhật" }
    };

        var checkInDay = vietnameseDayNames[checkIn.DayOfWeek];
        var checkOutDay = vietnameseDayNames[checkOut.DayOfWeek];
        var guestCount = adults + (children > 0 ? children : 0);

        return $@"
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Cảm ơn bạn đã lưu trú - QBooking</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        .container {{
            max-width: 650px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }}
        .header {{
            background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
            color: white;
            text-align: center;
            padding: 40px 30px;
            position: relative;
        }}
        .header::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns=""http://www.w3.org/2000/svg"" viewBox=""0 0 100 100""><defs><pattern id=""grain"" width=""100"" height=""100"" patternUnits=""userSpaceOnUse""><circle cx=""50"" cy=""50"" r=""1"" fill=""rgba(255,255,255,0.1)""/></pattern></defs><rect width=""100"" height=""100"" fill=""url(%23grain)""/></svg>');
            opacity: 0.3;
        }}
        .header-content {{ position: relative; z-index: 1; }}
        .logo {{ max-width: 120px; margin-bottom: 15px; }}
        .header h1 {{ 
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }}
        .booking-code {{
            background: rgba(255,255,255,0.2);
            padding: 12px 24px;
            border-radius: 50px;
            font-size: 18px;
            font-weight: 600;
            letter-spacing: 2px;
            display: inline-block;
            margin-top: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
        }}
        .content {{ padding: 40px 30px; }}
        .greeting {{
            font-size: 24px;
            color: #2c3e50;
            margin-bottom: 25px;
            font-weight: 600;
        }}
        .thank-you-message {{
            background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            text-align: center;
            font-weight: 500;
        }}
        .thank-you-message h3 {{
            font-size: 24px;
            margin-bottom: 15px;
            font-weight: 700;
        }}
        .thank-you-message p {{
            font-size: 16px;
            line-height: 1.7;
            margin-bottom: 10px;
        }}
        .booking-summary {{
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
            border: 1px solid #e9ecef;
        }}
        .summary-title {{
            font-size: 20px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 20px;
            text-align: center;
        }}
        .detail-row {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #dee2e6;
        }}
        .detail-row:last-child {{ border-bottom: none; }}
        .detail-label {{
            font-weight: 600;
            color: #495057;
            flex: 1;
        }}
        .detail-value {{
            font-weight: 500;
            color: #212529;
            text-align: right;
            flex: 1;
        }}
        .completed-badge {{
            background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .date-container {{
            display: flex;
            justify-content: space-between;
            margin: 25px 0;
            gap: 20px;
        }}
        .date-box {{
            flex: 1;
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
            color: white;
            border-radius: 15px;
            position: relative;
        }}
        .date-label {{
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
            opacity: 0.8;
        }}
        .date-value {{
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 5px;
        }}
        .day-name {{
            font-size: 14px;
            opacity: 0.9;
        }}
        .nights-badge {{
            position: absolute;
            top: -10px;
            right: -10px;
            background: #00a085;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }}
        .review-section {{
            background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 8px 25px rgba(253, 203, 110, 0.3);
        }}
        .review-section h3 {{
            font-size: 24px;
            margin-bottom: 15px;
            font-weight: 700;
        }}
        .star-rating {{
            font-size: 32px;
            margin: 15px 0;
            letter-spacing: 5px;
        }}
        .review-button {{
            display: inline-block;
            background: white;
            color: #e17055;
            padding: 18px 45px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 700;
            font-size: 18px;
            margin-top: 20px;
            transition: all 0.3s ease;
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }}
        .review-button:hover {{ 
            transform: translateY(-3px); 
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            color: #d63031;
        }}
        .benefits-section {{
            background: #ffffff;
            border: 2px solid #00b894;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
        }}
        .benefits-title {{
            font-size: 20px;
            font-weight: 700;
            color: #00b894;
            margin-bottom: 20px;
            text-align: center;
        }}
        .benefit-item {{
            display: flex;
            align-items: center;
            padding: 10px 0;
            font-size: 15px;
        }}
        .benefit-icon {{
            font-size: 20px;
            margin-right: 15px;
            color: #00b894;
        }}
        .social-section {{
            background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 30px;
        }}
        .social-section h4 {{
            margin-bottom: 15px;
            font-size: 18px;
        }}
        .social-links {{
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 15px;
        }}
        .social-link {{
            color: white;
            font-size: 24px;
            text-decoration: none;
            transition: transform 0.3s ease;
        }}
        .social-link:hover {{
            transform: scale(1.2);
        }}
        .footer {{
            background: #2c3e50;
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .footer-content {{
            margin-bottom: 20px;
        }}
        .footer-links {{
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 20px;
        }}
        .footer-link {{
            color: #bdc3c7;
            text-decoration: none;
            font-size: 14px;
        }}
        .footer-link:hover {{ color: white; }}
        @media (max-width: 600px) {{
            .date-container {{ flex-direction: column; }}
            .footer-links {{ flex-direction: column; gap: 10px; }}
            .social-links {{ flex-wrap: wrap; }}
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='header-content'>
                <img src='{companyLogo}' alt='QBooking Logo' class='logo'>
                <h1>🎉 Cảm ơn bạn đã lưu trú!</h1>
                <div class='booking-code'>#{bookingCode}</div>
            </div>
        </div>

        <div class='content'>
            <div class='greeting'>
                Xin chào {guestName}! 👋
            </div>

            <div class='thank-you-message'>
                <h3>✨ Cảm ơn bạn đã chọn QBooking!</h3>
                <p>Chúng tôi hy vọng bạn đã có những trải nghiệm tuyệt vời trong chuyến lưu trú vừa qua.</p>
                <p>Sự hài lòng của bạn là niềm động lực lớn nhất đối với chúng tôi!</p>
            </div>

            <div class='date-container'>
                <div class='date-box'>
                    <div class='date-label'>Ngày nhận phòng</div>
                    <div class='date-value'>{checkIn:dd/MM/yyyy}</div>
                    <div class='day-name'>{checkInDay}</div>
                </div>
                <div class='date-box'>
                    <div class='date-label'>Ngày trả phòng</div>
                    <div class='date-value'>{checkOut:dd/MM/yyyy}</div>
                    <div class='day-name'>{checkOutDay}</div>
                    <div class='nights-badge'>{nights}N</div>
                </div>
            </div>

            <div class='booking-summary'>
                <div class='summary-title'>📋 Tóm tắt lưu trú của bạn</div>
                <div class='detail-row'>
                    <span class='detail-label'>🏨 Khách sạn:</span>
                    <span class='detail-value'>{propertyName ?? "QBooking Hotel"}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>🛏️ Loại phòng:</span>
                    <span class='detail-value'>{roomTypeName ?? "Standard Room"}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>📅 Số đêm:</span>
                    <span class='detail-value'>{nights} đêm</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>🏠 Số phòng:</span>
                    <span class='detail-value'>{roomsCount} phòng</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>👥 Số khách:</span>
                    <span class='detail-value'>{guestCount} khách ({adults} người lớn{(children > 0 ? $", {children} trẻ em" : "")})</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>📞 Số điện thoại:</span>
                    <span class='detail-value'>{guestPhone}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>💰 Tổng chi phí:</span>
                    <span class='detail-value'>{totalAmount:C}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>✅ Trạng thái:</span>
                    <span class='detail-value'><span class='completed-badge'>Hoàn thành</span></span>
                </div>
            </div>

            <div class='review-section'>
                <h3>⭐ Chia sẻ trải nghiệm của bạn</h3>
                <p>Hãy để lại đánh giá để giúp những khách hàng khác có những lựa chọn tốt nhất!</p>
                <div class='star-rating'>⭐⭐⭐⭐⭐</div>
                <p style='font-size: 14px; margin-bottom: 0;'>Đánh giá của bạn rất quan trọng với chúng tôi</p>
                <a href='{reviewUrl}' class='review-button'>Viết đánh giá ngay</a>
            </div>

            <div class='benefits-section'>
                <div class='benefits-title'>🎁 Ưu đãi dành cho bạn</div>
                <div class='benefit-item'>
                    <span class='benefit-icon'>🎯</span>
                    <span>Tích điểm thưởng cho lần đặt tiếp theo</span>
                </div>
                <div class='benefit-item'>
                    <span class='benefit-icon'>💌</span>
                    <span>Nhận thông tin khuyến mãi độc quyền</span>
                </div>
                <div class='benefit-item'>
                    <span class='benefit-icon'>⚡</span>
                    <span>Ưu tiên đặt phòng trong các dịp đặc biệt</span>
                </div>
                <div class='benefit-item'>
                    <span class='benefit-icon'>🎊</span>
                    <span>Giảm giá 10% cho lần đặt phòng tiếp theo</span>
                </div>
            </div>

            <div class='social-section'>
                <h4>📱 Kết nối với chúng tôi</h4>
                <p>Theo dõi để không bỏ lỡ các ưu đãi hấp dẫn!</p>
                <div class='social-links'>
                    <a href='#' class='social-link'>📘</a>
                    <a href='#' class='social-link'>📷</a>
                    <a href='#' class='social-link'>🐦</a>
                    <a href='#' class='social-link'>📺</a>
                </div>
            </div>
        </div>

        <div class='footer'>
            <div class='footer-content'>
                <h4>🎯 QBooking - Đặt phòng thông minh</h4>
                <p>Cảm ơn bạn đã tin tưởng và lựa chọn dịch vụ của chúng tôi!</p>
            </div>
            
            <div class='footer-links'>
                <a href='mailto:{supportEmail}' class='footer-link'>📧 {supportEmail}</a>
                <a href='tel:{companyPhone}' class='footer-link'>📞 {companyPhone}</a>
                <a href='#' class='footer-link'>🌐 qbooking.com</a>
            </div>
            
            <p style='margin-top: 20px; font-size: 12px; color: #95a5a6;'>
                © 2024 QBooking. Tất cả quyền được bảo lưu.<br>
                Hẹn gặp lại bạn trong những chuyến đi tiếp theo! ✈️
            </p>
        </div>
    </div>
</body>
</html>";
    }

}