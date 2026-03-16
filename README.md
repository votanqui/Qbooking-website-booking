# QBooking Backend API

Nền tảng đặt phòng / homestay. Backend .NET 8, monolithic architecture, Entity Framework Core + SQL Server. Tích hợp thanh toán SePay, AI chatbot (OpenAI), real-time notification qua SignalR.

---

## Tech Stack

| | |
|---|---|
| Framework | .NET 8 / ASP.NET Core |
| ORM | Entity Framework Core + SQL Server |
| Auth | JWT Bearer + cookie `jwt` |
| Real-time | SignalR |
| Thanh toán | SePay webhook |
| AI | OpenAI API (chatbot) |
| Email | SMTP Gmail (queue nội bộ) |
| Cache | IMemoryCache |
| Rate Limiting | AspNetCoreRateLimit |

---

## Cấu trúc project

```
QBooking/
├── Controllers/        # API endpoints
├── Services/           # Business logic
├── Models/             # EF Core entities
├── Dtos/               # Request / Response DTOs
│   ├── Request/
│   └── Response/
├── Backgroundservice/  # Background jobs
├── Data/               # ApplicationDbContext
├── Hubs/               # SignalR NotificationHub
├── Extension/          # ServiceExtensions (DI)
└── Program.cs
```

---

## Cài đặt

**Yêu cầu:** .NET 8 SDK, SQL Server

```bash
# 1. Clone
git clone <repo-url> && cd QBooking

# 2. Cấu hình
cp appsettings.json appsettings.Development.json
# Điền các giá trị thực (xem phần Cấu hình bên dưới)

# 3. Migrate DB
dotnet ef database update

# 4. Chạy
dotnet run
```

Swagger: `http://localhost:<port>/swagger` — chỉ ở Development.

---

## Cấu hình

Điền vào `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=QBooking;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "<chuỗi ngẫu nhiên ít nhất 32 ký tự>",
    "Issuer": "https://yourdomain.com/",
    "Audience": "https://yourdomain.com/"
  },
  "Email": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SmtpUsername": "<your@gmail.com>",
    "SmtpPassword": "<16-char App Password>",
    "FromEmail": "noreply@yourdomain.com",
    "FromName": "QBooking System"
  },
  "Frontend": { "BaseUrl": "https://yourdomain.com/" },
  "Backend":  { "BaseUrl": "https://api.yourdomain.com/" },
  "OpenAI":   { "ApiKey": "<openai-api-key>" },
  "SePay":    { "ApiKey": "<sepay-api-key>" }
}
```

> ⚠️ Không commit file chứa secret thực. Dùng biến môi trường khi deploy production.

### Cấu hình nâng cao (tùy chỉnh trong appsettings)

| Section | Key | Mô tả |
|---|---|---|
| `FeaturedProperty` | `MinAverageRating` | Rating tối thiểu để nổi bật (default: 4.0) |
| `FeaturedProperty` | `MinBookingCount` | Số booking tối thiểu (default: 10) |
| `FeaturedProperty` | `MinViewCount` | Số lượt xem tối thiểu (default: 100) |
| `SuspiciousUserDetection` | `MaxLoginAttemptsPerDay` | Ngưỡng login/ngày trước khi auto-ban (default: 60) |
| `SuspiciousUserDetection` | `EnableAutoBan` | Bật/tắt tự động ban (default: true) |
| `NoShowCheck` | `GracePeriodHours` | Giờ gia hạn check-in trước khi mark no-show (default: 6) |

---

## API

Base URL: `https://api.yourdomain.com`

Auth header: `Authorization: Bearer <access_token>` hoặc cookie `jwt`

### Auth — `/api/auth`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/auth/login` | — | Đăng nhập, trả JWT token |
| POST | `/api/auth/register` | — | Đăng ký tài khoản |
| POST | `/api/auth/logout` | ✓ | Đăng xuất, xóa token |
| POST | `/api/auth/forgot-password` | — | Gửi email reset mật khẩu |
| POST | `/api/auth/reset-password` | — | Đặt lại mật khẩu bằng token |
| POST | `/api/auth/verify-email` | — | Xác thực email |
| POST | `/api/auth/resend-verification` | — | Gửi lại email xác thực |

### User — `/api/user`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/user/profile` | ✓ | Thông tin cá nhân |
| PUT | `/api/user/profile` | ✓ | Cập nhật profile |
| GET | `/api/user/properties` | ✓ | Property của tôi (host) |
| POST | `/api/user/upload-avatar` | ✓ | Upload ảnh đại diện |
| DELETE | `/api/user/remove-avatar` | ✓ | Xóa ảnh đại diện |
| POST | `/api/user/upgrade-to-host` | ✓ | Nâng cấp tài khoản thành host |
| POST | `/api/user/change-password` | ✓ | Đổi mật khẩu |
| GET | `/api/user/statistics` | ✓ | Thống kê cá nhân |
| GET | `/api/user/admin/users` | Admin | Danh sách tất cả users |
| GET | `/api/user/admin/users/{userId}` | Admin | Chi tiết user |
| PUT | `/api/user/admin/users/{userId}/status` | Admin | Block/unblock user |
| PUT | `/api/user/admin/users/{userId}/role` | Admin | Đổi role |
| GET | `/api/user/admin/users/{userId}/bookings` | Admin | Lịch sử booking của user |
| GET | `/api/user/admin/users/statistics` | Admin | Thống kê users |
| POST | `/api/user/admin/users/{userId}/reset-password` | Admin | Reset mật khẩu user |

### Property — `/api/property`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/property` | — | Danh sách property (filter + phân trang) |
| GET | `/api/property/{id}` | — | Chi tiết property |
| GET | `/api/property/slug/{slug}` | — | Chi tiết property theo slug |
| GET | `/api/property/approved` | — | Property đã duyệt |
| GET | `/api/property/featured` | — | Property nổi bật |
| GET | `/api/property/most-viewed` | — | Property xem nhiều nhất |
| GET | `/api/property/most-booked` | — | Property đặt nhiều nhất |
| GET | `/api/property/{id}/similar` | — | Property tương tự |
| GET | `/api/property/my-properties` | ✓ | Property của tôi |
| POST | `/api/property/create` | ✓ | Tạo property mới |
| PUT | `/api/property/{id}` | ✓ | Cập nhật property |
| DELETE | `/api/property/{id}` | ✓ | Xóa property |
| PUT | `/api/property/{id}/submit-for-review` | ✓ | Gửi duyệt |
| POST | `/api/property/{id}/upload-images` | ✓ | Upload ảnh property |
| DELETE | `/api/property/image/{imageId}` | ✓ | Xóa ảnh |
| PUT | `/api/property/image/{imageId}/set-primary` | ✓ | Đặt ảnh chính |
| GET | `/api/property/{id}/booking` | ✓ | Lịch booking của property |
| PUT | `/api/property/{id}/approve` | Admin | Duyệt property |
| PUT | `/api/property/{id}/toggle-featured` | Admin | Bật/tắt nổi bật |
| PUT | `/api/property/admin/{id}/deactivate` | Admin | Vô hiệu hóa |
| PUT | `/api/property/admin/{id}/activate` | Admin | Kích hoạt lại |
| PUT | `/api/property/admin/{id}/reject` | Admin | Từ chối duyệt |
| GET | `/api/property/admin/all` | Admin | Tất cả property |
| GET | `/api/property/admin/{id}/detail` | Admin | Chi tiết admin view |
| GET | `/api/property/admin/statistics` | Admin | Thống kê property |
| GET | `/api/property/admin/by-status/{status}` | Admin | Lọc theo trạng thái |

**Product Types:**

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/property/product-types` | Danh sách loại property |
| GET | `/api/property/product-types/{id}` | Chi tiết |
| POST | `/api/property/product-types` | Tạo mới |
| PUT | `/api/property/product-types/{id}` | Cập nhật |
| DELETE | `/api/property/product-types/{id}` | Xóa |
| PATCH | `/api/property/product-types/{id}/toggle-active` | Bật/tắt |

### Room — `/api/room`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/room` | — | Danh sách phòng |
| GET | `/api/room/{id}` | — | Chi tiết phòng |
| GET | `/api/room/slug/{slug}` | — | Chi tiết theo slug |
| GET | `/api/room/property/{propertyId}` | — | Phòng của property |
| POST | `/api/room/create` | ✓ | Tạo phòng |
| POST | `/api/room/create-multiple` | ✓ | Tạo nhiều phòng cùng lúc |
| PUT | `/api/room/{id}` | ✓ | Cập nhật phòng |
| DELETE | `/api/room/{id}` | ✓ | Xóa phòng |
| POST | `/api/room/{id}/upload-images` | ✓ | Upload ảnh phòng |
| DELETE | `/api/room/image/{imageId}` | ✓ | Xóa ảnh |
| PUT | `/api/room/image/{imageId}/set-primary` | ✓ | Đặt ảnh chính |

### Booking — `/api/booking`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/booking` | ✓ | Tạo booking |
| GET | `/api/booking/{id}` | ✓ | Chi tiết booking |
| GET | `/api/booking/code/{bookingCode}` | ✓ | Tìm theo mã booking |
| GET | `/api/booking/my-bookings` | ✓ | Booking của tôi |
| GET | `/api/booking/check-availability` | — | Kiểm tra phòng trống |
| GET | `/api/booking/check-availability-detailed` | — | Kiểm tra chi tiết |
| GET | `/api/booking/available-dates` | — | Ngày còn trống |
| GET | `/api/booking/price-quote` | — | Tính giá trước khi đặt |
| GET | `/api/booking/{id}/receipt` | ✓ | Hóa đơn booking |
| PUT | `/api/booking/{id}/confirm` | ✓ | Xác nhận booking (host) |
| PUT | `/api/booking/{id}/cancel` | ✓ | Huỷ booking |
| PUT | `/api/booking/{id}/checkin` | ✓ | Check-in |
| PUT | `/api/booking/{id}/checkout` | ✓ | Check-out |
| GET | `/api/booking/host/bookings` | ✓ | Booking của host |
| GET | `/api/booking/host/{id}/detail` | ✓ | Chi tiết (host view) |
| GET | `/api/booking/host/statistics` | ✓ | Thống kê host |
| GET | `/api/booking/admin/all` | Admin | Tất cả bookings |
| GET | `/api/booking/{id}/admin-detail` | Admin | Chi tiết admin view |
| GET | `/api/booking/admin/statistics` | Admin | Thống kê admin |
| PUT | `/api/booking/{id}/admin-cancel` | Admin | Admin huỷ booking |
| PUT | `/api/booking/admin/{id}/update-status` | Admin | Cập nhật status |
| PUT | `/api/booking/admin/{id}/update-payment-status` | Admin | Cập nhật trạng thái thanh toán |
| GET | `/api/booking/admin/export` | Admin | Export CSV |
| GET | `/api/booking/admin/dashboard/overview` | Admin | Dashboard tổng quan |
| GET | `/api/booking/admin/dashboard/revenue-chart` | Admin | Biểu đồ doanh thu |
| GET | `/api/booking/admin/dashboard/booking-trends` | Admin | Xu hướng booking |
| GET | `/api/booking/admin/dashboard/top-properties` | Admin | Top property |
| GET | `/api/booking/admin/dashboard/top-customers` | Admin | Top khách hàng |
| GET | `/api/booking/admin/dashboard/alerts` | Admin | Cảnh báo |

**Booking status:** `Pending` → `Confirmed` / `Cancelled` → `CheckedIn` → `CheckedOut` / `NoShow`

### Payment — SePay `/api/sepay`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/sepay/webhook` | API Key | Webhook SePay (không dùng JWT) |
| GET | `/api/sepay/qr-code/{bookingCode}` | ✓ | Lấy QR code thanh toán |
| GET | `/api/sepay/booking-status/{bookingId}` | ✓ | Trạng thái thanh toán |
| GET | `/api/sepay/booking-status-by-code/{bookingCode}` | ✓ | Trạng thái theo mã |
| GET | `/api/sepay/payment-history/{bookingCode}` | ✓ | Lịch sử thanh toán |

### Refund — `/api/payment`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/payment/tickets` | ✓ | Tạo yêu cầu hoàn tiền |
| GET | `/api/payment/tickets/my` | ✓ | Yêu cầu hoàn tiền của tôi |
| GET | `/api/payment/tickets/my/{ticketId}` | ✓ | Chi tiết yêu cầu |
| DELETE | `/api/payment/tickets/{ticketId}` | ✓ | Huỷ yêu cầu |
| GET | `/api/payment/tickets` | Admin | Tất cả yêu cầu hoàn tiền |
| GET | `/api/payment/tickets/{ticketId}` | Admin | Chi tiết (admin) |
| POST | `/api/payment/tickets/{refundTicketId}/process` | Admin | Xử lý hoàn tiền |
| PUT | `/api/payment/tickets/{refundTicketId}/status` | Admin | Cập nhật status |
| GET | `/api/payment/refunds` | Admin | Danh sách hoàn tiền |
| GET | `/api/payment/tickets/host/properties` | Host | Yêu cầu theo property |
| GET | `/api/payment/tickets/host/{ticketId}` | Host | Chi tiết (host view) |
| GET | `/api/payment/statistics` | Admin | Thống kê thanh toán |

### Review — `/api/review`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/review/property/{propertyId}` | — | Reviews của property |
| POST | `/api/review/customer/create` | ✓ | Viết review |
| GET | `/api/review/customer/my-reviews` | ✓ | Reviews của tôi |
| GET | `/api/review/customer/my-reviews/{id}` | ✓ | Chi tiết review |
| PUT | `/api/review/customer/my-reviews/{id}` | ✓ | Sửa review |
| DELETE | `/api/review/customer/my-reviews/{id}` | ✓ | Xóa review |
| POST | `/api/review/host/reviews/{reviewId}/reply` | Host | Trả lời review |
| PUT | `/api/review/host/reviews/{reviewId}/reply` | Host | Sửa trả lời |
| DELETE | `/api/review/host/reviews/{reviewId}/reply` | Host | Xóa trả lời |
| GET | `/api/review/host/my-properties-reviews` | Host | Reviews của properties tôi |
| GET | `/api/review/host/property/{propertyId}/reviews` | Host | Reviews theo property |
| GET | `/api/review/admin/reviews` | Admin | Tất cả reviews |
| GET | `/api/review/admin/reviews/{id}` | Admin | Chi tiết (admin) |
| PATCH | `/api/review/admin/reviews/{id}/status` | Admin | Duyệt / ẩn review |
| PATCH | `/api/review/admin/reviews/{id}/featured` | Admin | Bật/tắt nổi bật |
| DELETE | `/api/review/admin/reviews/{id}` | Admin | Xóa review |
| GET | `/api/review/admin/statistics/overview` | Admin | Thống kê tổng quan |
| GET | `/api/review/admin/statistics/trends` | Admin | Xu hướng review |
| GET | `/api/review/admin/statistics/top-properties` | Admin | Top property theo review |
| GET | `/api/review/admin/statistics/rating-distribution` | Admin | Phân bổ rating |

### Coupon — `/api/coupons`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/coupons/public` | — | Coupon công khai |
| GET | `/api/coupons/featured` | — | Coupon nổi bật |
| GET | `/api/coupons/check-availability/{code}` | — | Kiểm tra coupon còn hạn |
| POST | `/api/coupons/apply` | ✓ | Áp dụng coupon cho booking |
| POST | `/api/coupons/apply-by-code` | ✓ | Áp dụng theo mã |
| POST | `/api/coupons/cancel/{bookingId}` | ✓ | Huỷ coupon của booking |
| POST | `/api/coupons/validate` | ✓ | Kiểm tra hợp lệ |
| GET | `/api/coupons` | Admin | Tất cả coupons |
| GET | `/api/coupons/{id}` | Admin | Chi tiết |
| GET | `/api/coupons/code/{code}` | Admin | Tìm theo mã |
| POST | `/api/coupons` | Admin | Tạo coupon |
| PUT | `/api/coupons/{id}` | Admin | Cập nhật |
| DELETE | `/api/coupons/{id}` | Admin | Xóa |
| PATCH | `/api/coupons/{id}/toggle-status` | Admin | Bật/tắt |
| POST | `/api/coupons/{id}/duplicate` | Admin | Nhân bản coupon |
| GET | `/api/coupons/statistics/overview` | Admin | Thống kê tổng quan |
| GET | `/api/coupons/statistics/top-used` | Admin | Top coupon dùng nhiều |
| GET | `/api/coupons/expiring-soon` | Admin | Sắp hết hạn |
| GET | `/api/coupons/export/csv` | Admin | Export CSV |

### Notification — `/api/notification`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/notification` | ✓ | Thông báo của tôi |
| GET | `/api/notification/unread-count` | ✓ | Số chưa đọc |
| PUT | `/api/notification/{id}/read` | ✓ | Đánh dấu đã đọc |
| POST | `/api/notification/admin/send` | Admin | Gửi cho user cụ thể |
| POST | `/api/notification/admin/send-all` | Admin | Gửi cho tất cả |
| POST | `/api/notification/admin/broadcast` | Admin | Broadcast real-time |
| GET | `/api/notification/admin` | Admin | Tất cả notifications |
| GET | `/api/notification/admin/statistics` | Admin | Thống kê |

### Host Earnings & Payout

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/hostearnings` | Host | Thu nhập của tôi |
| GET | `/api/hostearnings/{id}` | Host | Chi tiết khoản thu |
| GET | `/api/hostearnings/statistics` | Host | Thống kê thu nhập |
| GET | `/api/hostearnings/summary` | Host | Tóm tắt |
| GET | `/api/hostearnings/admin/all` | Admin | Tất cả thu nhập |
| PUT | `/api/hostearnings/admin/{id}/approve` | Admin | Duyệt |
| PUT | `/api/hostearnings/admin/{id}/reject` | Admin | Từ chối |
| GET | `/api/hostearnings/admin/statistics` | Admin | Thống kê admin |
| GET | `/api/hostpayout` | Host | Yêu cầu thanh toán của tôi |
| GET | `/api/hostpayout/{id}` | Host | Chi tiết |
| GET | `/api/hostpayout/{id}/earnings` | Host | Earnings liên kết |
| PUT | `/api/hostpayout/{id}/bank-info` | Host | Cập nhật thông tin ngân hàng |
| GET | `/api/hostpayout/pending-earnings` | Host | Earnings chờ thanh toán |
| GET | `/api/hostpayout/admin/all` | Admin | Tất cả payout |
| POST | `/api/hostpayout/admin/create-manual` | Admin | Tạo payout thủ công |
| PUT | `/api/hostpayout/admin/{id}/process` | Admin | Xử lý |
| PUT | `/api/hostpayout/admin/{id}/complete` | Admin | Hoàn tất |
| PUT | `/api/hostpayout/admin/{id}/cancel` | Admin | Huỷ |
| GET | `/api/hostpayout/admin/statistics` | Admin | Thống kê |

### Amenity — `/api/amenity`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/amenity` | — | Danh sách tiện nghi |
| GET | `/api/amenity/{id}` | — | Chi tiết |
| GET | `/api/amenity/categories` | — | Danh mục tiện nghi |
| GET | `/api/amenity/categories/simple` | — | Danh mục dạng đơn giản |
| GET | `/api/amenity/categories/{id}` | — | Chi tiết danh mục |
| POST | `/api/amenity` | Admin | Tạo tiện nghi |
| PUT | `/api/amenity/{id}` | Admin | Cập nhật |
| DELETE | `/api/amenity/{id}` | Admin | Xóa |
| PATCH | `/api/amenity/{id}/toggle-popular` | Admin | Bật/tắt phổ biến |
| PATCH | `/api/amenity/{id}/sort-order` | Admin | Sắp xếp thứ tự |
| POST | `/api/amenity/categories` | Admin | Tạo danh mục |
| PUT | `/api/amenity/categories/{id}` | Admin | Cập nhật danh mục |
| DELETE | `/api/amenity/categories/{id}` | Admin | Xóa danh mục |
| PATCH | `/api/amenity/categories/{id}/sort-order` | Admin | Sắp xếp danh mục |

### Các endpoint khác

| Controller | Endpoint tiêu biểu | Mô tả |
|---|---|---|
| Favorite | `GET/POST/DELETE /api/favorite` | Yêu thích property |
| SearchHistory | `GET/POST /api/searchhistory` | Lịch sử tìm kiếm |
| PropertyViews | `POST /api/propertyviews` | Track lượt xem |
| Analytics | `GET /api/analytics/search-trends` | Xu hướng tìm kiếm |
| Analytics | `GET /api/analytics/popular-locations` | Địa điểm phổ biến |
| Analytics | `GET /api/analytics/top-viewed-properties` | Property xem nhiều |
| Analytics | `GET /api/analytics/conversion-rate` | Tỷ lệ chuyển đổi |
| Dashboard | `GET /api/dashboard/overview` | Tổng quan admin |
| Dashboard | `GET /api/dashboard/revenue-chart` | Biểu đồ doanh thu |
| AuditLog | `GET /api/auditlog` | Audit log hệ thống |
| AuditLog | `GET /api/auditlog/export/csv` | Export CSV |
| AuditLog | `GET /api/auditlog/security/suspicious-activities` | Hoạt động đáng ngờ |
| Andress | `GET /api/andress/provinces` | Danh sách tỉnh/thành |
| Andress | `GET /api/andress/communes/by-province/{code}` | Xã/phường theo tỉnh |
| Andress | `GET /api/andress/properties/map` | Vị trí property trên bản đồ |
| Chatbot | `POST /api/chatbot/ask` | AI chatbot hỏi đáp |
| HistoryLogin | `GET /api/historylogin/my-history` | Lịch sử đăng nhập |
| WebsiteSettings | `GET /api/admin/websitesettings/public` | Cài đặt website công khai |
| WebsiteSettings | `POST/GET /api/admin/websitesettings` | Quản lý cài đặt (Admin) |

### Response format

```json
{
  "success": true,
  "message": "Thành công",
  "data": { ... }
}
```

### SignalR

Endpoint: `wss://api.yourdomain.com/notificationHub`

Event nhận từ server: `ReceiveNotification` → `{ id, title, message, type, createdAt }`

---

## Rate Limiting

| Endpoint | Giới hạn | Chu kỳ |
|---|---|---|
| Tất cả `*` | 100 req | 1 phút |

---

## Background Services

| Service | Chu kỳ | Mô tả |
|---|---|---|
| `EmailProcessingBackgroundService` | liên tục (queue) | Xử lý email trong queue |
| `BookingAutoRejectService` | định kỳ | Tự huỷ booking pending quá hạn |
| `PaymentReminderService` | định kỳ | Nhắc thanh toán booking |
| `NoShowCheckingBackgroundService` | 1 giờ | Đánh dấu no-show sau grace period |
| `FeaturedPropertyBackgroundService` | 24 giờ | Tự động cập nhật property nổi bật |
| `ExpiredCouponCleanupService` | định kỳ | Vô hiệu hóa coupon hết hạn |
| `AuditLogCleanupService` | định kỳ | Xóa audit log cũ |
| `LoginHistoryCleanupService` | định kỳ | Xóa lịch sử đăng nhập cũ |
| `ImageMetadataUpdateService` | định kỳ | Cập nhật metadata ảnh |
| `MonthlyPayoutBackgroundService` | hàng tháng | Tạo payout tự động cho host |

---

## Database

SQL Server, 41 bảng, quản lý bằng EF Core migrations.

```bash
# Tạo migration mới
dotnet ef migrations add <TênMigration>

# Áp dụng
dotnet ef database update
```

| Nhóm | Models |
|---|---|
| Auth | `User`, `UserToken`, `HistoryLogin` |
| Property | `Property`, `PropertyImage`, `PropertyAmenity`, `PropertyView`, `ProductType` |
| Room | `RoomType`, `RoomImage`, `RoomAmenity` |
| Booking | `Booking` |
| Payment | `Payment`, `Refund`, `RefundTicket` |
| Host | `HostEarning`, `HostPayout` |
| Review | `Review`, `ReviewImage` |
| Coupon | `Coupon`, `CouponApplication`, `CouponUsage` |
| Address | `Province`, `Commune` |
| Amenity | `Amenity`, `AmenityCategory` |
| Social | `Favorite`, `Notification`, `SearchHistory` |
| Config | `WebsiteSetting`, `EmailSetting` |
| Logs | `AuditLog` |

**Roles:** `admin`, `customer`, `host`
