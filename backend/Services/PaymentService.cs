using Microsoft.EntityFrameworkCore;
using QBooking.Data;
using QBooking.Models;
using QBooking.Dtos.Request;
using QBooking.Dtos.Response;
using System.Text.Json;

namespace QBooking.Services
{
    public interface IRefundService
    {
        Task<ApiResponse<RefundTicketResponse>> CreateRefundTicketAsync(int customerId, CreateRefundTicketRequest request);
        Task<ApiResponse<List<RefundTicketResponse>>> GetCustomerRefundTicketsAsync(int customerId);
        Task<ApiResponse<RefundTicketDetailResponse>> GetRefundTicketDetailAsync(int ticketId, int? customerId = null);
        Task<ApiResponse<object>> CancelRefundTicketAsync(int ticketId, int customerId);
        Task<ApiResponse<List<RefundTicketResponse>>> GetAllRefundTicketsAsync(string? status = null);
        Task<ApiResponse<RefundResponse>> ProcessRefundAsync(int refundTicketId, ProcessRefundRequest request);
        Task<ApiResponse<RefundTicketResponse>> UpdateRefundTicketStatusAsync(int refundTicketId, string status);
        Task<ApiResponse<List<RefundResponse>>> GetRefundsAsync();
        Task<ApiResponse<List<RefundTicketResponse>>> GetHostRefundTicketsAsync(int hostId, string? status = null);
        Task<ApiResponse<RefundTicketDetailResponse>> GetHostRefundTicketDetailAsync(int ticketId, int hostId);
        Task<ApiResponse<RefundStatisticsResponse>> GetRefundStatisticsAsync(DateTime? fromDate, DateTime? toDate);
    }

    public class RefundService : IRefundService
    {
        private readonly ApplicationDbContext _context;
        private readonly AuditLogService _auditLogService;

        private readonly IEmailQueueService _emailQueueService;

        public RefundService(
            ApplicationDbContext context,
            AuditLogService auditLogService,
            IEmailQueueService emailQueueService)
        {
            _context = context;
            _auditLogService = auditLogService;
            _emailQueueService = emailQueueService;
        }

        public async Task<ApiResponse<RefundTicketResponse>> CreateRefundTicketAsync(
            int customerId,
            CreateRefundTicketRequest request)
        {
            try
            {
                var booking = await _context.Bookings
                    .Include(b => b.Property)
                    .FirstOrDefaultAsync(b =>
                        b.Id == request.BookingId &&
                        b.CustomerId == customerId);

                if (booking == null)
                {
                    return new ApiResponse<RefundTicketResponse>
                    {
                        Success = false,
                        Message = "Booking không tồn tại hoặc không thuộc về bạn",
                        StatusCode = 404
                    };
                }
                if (string.Equals(booking.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    return new ApiResponse<RefundTicketResponse>
                    {
                        Success = false,
                        Message = "Không thể tạo yêu cầu hoàn tiền cho booking đã bị hủy",
                        StatusCode = 400
                    };
                }

                if (!string.Equals(booking.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
                {
                    return new ApiResponse<RefundTicketResponse>
                    {
                        Success = false,
                        Message = "Chỉ có thể tạo yêu cầu hoàn tiền cho booking đã thanh toán",
                        StatusCode = 400
                    };
                }

                var existingTicket = await _context.RefundTickets
                    .FirstOrDefaultAsync(rt =>
                        rt.BookingId == request.BookingId &&
                        rt.Status == "pending");

                if (existingTicket != null)
                {
                    return new ApiResponse<RefundTicketResponse>
                    {
                        Success = false,
                        Message = "Đã có yêu cầu hoàn tiền đang chờ xử lý cho booking này",
                        StatusCode = 400
                    };
                }

                var refundTicket = new RefundTicket
                {
                    BookingId = request.BookingId,
                    CustomerId = customerId,
                    RequestedAmount = request.RequestedAmount,
                    Reason = request.Reason,
                    BankName = request.BankName,
                    BankAccountNumber = request.BankAccountNumber,
                    BankAccountName = request.BankAccountName,
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow
                };

                _context.RefundTickets.Add(refundTicket);
                await _context.SaveChangesAsync();
                await _emailQueueService.QueueRefundTicketCreatedAsync(
    customerId,
    booking.GuestEmail,
    new
    {
        CustomerName = booking.GuestName,
        BookingCode = booking.BookingCode,
        RequestedAmount = refundTicket.RequestedAmount,
        Reason = refundTicket.Reason,
        RefundTicketId = refundTicket.Id.ToString()
    }
);
                var auditOptions = new JsonSerializerOptions
                {
                    ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles
                };
                await _auditLogService.LogInsertAsync(
                    "RefundTicket",
                    refundTicket.Id,
                    JsonSerializer.Serialize(refundTicket, auditOptions)
                );

                var response = new RefundTicketResponse
                {
                    Id = refundTicket.Id,
                    BookingId = refundTicket.BookingId,
                    BookingCode = booking.BookingCode,
                    PropertyName = booking.Property?.Name,
                    CustomerId = refundTicket.CustomerId,
                    RequestedAmount = refundTicket.RequestedAmount,
                    Reason = refundTicket.Reason,
                    BankName = refundTicket.BankName,
                    BankAccountNumber = refundTicket.BankAccountNumber,
                    BankAccountName = refundTicket.BankAccountName,
                    Status = refundTicket.Status,
                    CreatedAt = refundTicket.CreatedAt,
                    ProcessedAt = refundTicket.ProcessedAt
                };

                return new ApiResponse<RefundTicketResponse>
                {
                    Success = true,
                    Message = "Tạo yêu cầu hoàn tiền thành công",
                    StatusCode = 201,
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<RefundTicketResponse>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi tạo yêu cầu hoàn tiền",
                    StatusCode = 500,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<List<RefundTicketResponse>>> GetCustomerRefundTicketsAsync(int customerId)
        {
            try
            {
                var refundTickets = await _context.RefundTickets
                    .Include(rt => rt.Booking)
                        .ThenInclude(b => b.Property)
                    .Where(rt => rt.CustomerId == customerId)
                    .OrderByDescending(rt => rt.CreatedAt)
                    .ToListAsync();

                var response = refundTickets.Select(rt => new RefundTicketResponse
                {
                    Id = rt.Id,
                    BookingId = rt.BookingId,
                    BookingCode = rt.Booking.BookingCode,
                    PropertyName = rt.Booking.Property.Name,
                    CustomerId = rt.CustomerId,
                    RequestedAmount = rt.RequestedAmount,
                    Reason = rt.Reason,
                    BankName = rt.BankName,
                    BankAccountNumber = rt.BankAccountNumber,
                    BankAccountName = rt.BankAccountName,
                    Status = rt.Status,
                    CreatedAt = rt.CreatedAt,
                    ProcessedAt = rt.ProcessedAt
                }).ToList();

                return new ApiResponse<List<RefundTicketResponse>>
                {
                    Success = true,
                    Message = "Lấy danh sách yêu cầu hoàn tiền thành công",
                    StatusCode = 200,
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<RefundTicketResponse>>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi lấy danh sách yêu cầu hoàn tiền",
                    StatusCode = 500,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<RefundTicketDetailResponse>> GetRefundTicketDetailAsync(int ticketId, int? customerId = null)
        {
            try
            {
                var query = _context.RefundTickets
                    .Include(rt => rt.Booking)
                        .ThenInclude(b => b.Property)
                    .Include(rt => rt.Customer)
                    .Include(rt => rt.Refunds)
                    .AsQueryable();

                if (customerId.HasValue)
                {
                    query = query.Where(rt => rt.CustomerId == customerId.Value);
                }

                var refundTicket = await query.FirstOrDefaultAsync(rt => rt.Id == ticketId);

                if (refundTicket == null)
                {
                    return new ApiResponse<RefundTicketDetailResponse>
                    {
                        Success = false,
                        Message = "Yêu cầu hoàn tiền không tồn tại",
                        StatusCode = 404
                    };
                }

                var response = new RefundTicketDetailResponse
                {
                    Id = refundTicket.Id,
                    BookingId = refundTicket.BookingId,
                    BookingCode = refundTicket.Booking.BookingCode,
                    PropertyName = refundTicket.Booking.Property.Name,
                    CustomerId = refundTicket.CustomerId,
                    CustomerName = refundTicket.Customer.FullName,
                    CustomerEmail = refundTicket.Customer.Email,
                    RequestedAmount = refundTicket.RequestedAmount,
                    Reason = refundTicket.Reason,
                    BankName = refundTicket.BankName,
                    BankAccountNumber = refundTicket.BankAccountNumber,
                    BankAccountName = refundTicket.BankAccountName,
                    Status = refundTicket.Status,
                    CreatedAt = refundTicket.CreatedAt,
                    ProcessedAt = refundTicket.ProcessedAt,
                    Refund = refundTicket.Refunds?.FirstOrDefault() != null ? new RefundResponse
                    {
                        Id = refundTicket.Refunds.First().Id,
                        RefundTicketId = refundTicket.Refunds.First().RefundTicketId,
                        RefundedAmount = refundTicket.Refunds.First().RefundedAmount,
                        ReceiverBankName = refundTicket.Refunds.First().ReceiverBankName,
                        ReceiverAccount = refundTicket.Refunds.First().ReceiverAccount,
                        ReceiverName = refundTicket.Refunds.First().ReceiverName,
                        PaymentMethod = refundTicket.Refunds.First().PaymentMethod,
                        PaymentReference = refundTicket.Refunds.First().PaymentReference,
                        Notes = refundTicket.Refunds.First().Notes,
                        CreatedAt = refundTicket.Refunds.First().CreatedAt
                    } : null
                };

                return new ApiResponse<RefundTicketDetailResponse>
                {
                    Success = true,
                    Message = "Lấy chi tiết yêu cầu hoàn tiền thành công",
                    StatusCode = 200,
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<RefundTicketDetailResponse>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi lấy chi tiết yêu cầu hoàn tiền",
                    StatusCode = 500,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<object>> CancelRefundTicketAsync(int ticketId, int customerId)
        {
            try
            {
                var refundTicket = await _context.RefundTickets
                    .FirstOrDefaultAsync(rt => rt.Id == ticketId && rt.CustomerId == customerId);

                if (refundTicket == null)
                {
                    return new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Yêu cầu hoàn tiền không tồn tại hoặc không thuộc về bạn",
                        StatusCode = 404
                    };
                }

                if (refundTicket.Status != "pending")
                {
                    return new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Chỉ có thể hủy yêu cầu hoàn tiền đang chờ xử lý",
                        StatusCode = 400
                    };
                }

                var oldValues = JsonSerializer.Serialize(refundTicket);

                refundTicket.Status = "cancelled";
                refundTicket.ProcessedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var newValues = JsonSerializer.Serialize(new
                {
                    refundTicket.Id,
                    refundTicket.Status,
                    refundTicket.ProcessedAt
                });

                await _auditLogService.LogUpdateAsync("RefundTicket", refundTicket.Id, oldValues, newValues);

                return new ApiResponse<object>
                {
                    Success = true,
                    Message = "Hủy yêu cầu hoàn tiền thành công",
                    StatusCode = 200
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<object>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi hủy yêu cầu hoàn tiền",
                    StatusCode = 500,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<List<RefundTicketResponse>>> GetAllRefundTicketsAsync(string? status = null)
        {
            try
            {
                var query = _context.RefundTickets
                    .Include(rt => rt.Booking)
                        .ThenInclude(b => b.Property)
                    .Include(rt => rt.Customer)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(rt => rt.Status == status);
                }

                var refundTickets = await query
                    .OrderByDescending(rt => rt.CreatedAt)
                    .ToListAsync();

                var response = refundTickets.Select(rt => new RefundTicketResponse
                {
                    Id = rt.Id,
                    BookingId = rt.BookingId,
                    BookingCode = rt.Booking.BookingCode,
                    PropertyName = rt.Booking.Property.Name,
                    CustomerId = rt.CustomerId,
                    CustomerName = rt.Customer.FullName,
                    CustomerEmail = rt.Customer.Email,
                    RequestedAmount = rt.RequestedAmount,
                    Reason = rt.Reason,
                    BankName = rt.BankName,
                    BankAccountNumber = rt.BankAccountNumber,
                    BankAccountName = rt.BankAccountName,
                    Status = rt.Status,
                    CreatedAt = rt.CreatedAt,
                    ProcessedAt = rt.ProcessedAt
                }).ToList();

                return new ApiResponse<List<RefundTicketResponse>>
                {
                    Success = true,
                    Message = "Lấy danh sách yêu cầu hoàn tiền thành công",
                    StatusCode = 200,
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<RefundTicketResponse>>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi lấy danh sách yêu cầu hoàn tiền",
                    StatusCode = 500,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<RefundResponse>> ProcessRefundAsync(int refundTicketId, ProcessRefundRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var refundTicket = await _context.RefundTickets
                    .Include(rt => rt.Booking)
                        .ThenInclude(b => b.Property)
                    .Include(rt => rt.Booking.RoomType)
                    .Include(rt => rt.Customer)
                    .FirstOrDefaultAsync(rt => rt.Id == refundTicketId);

                if (refundTicket == null)
                {
                    return new ApiResponse<RefundResponse>
                    {
                        Success = false,
                        Message = "Yêu cầu hoàn tiền không tồn tại",
                        StatusCode = 404
                    };
                }

                if (refundTicket.Status != "pending")
                {
                    return new ApiResponse<RefundResponse>
                    {
                        Success = false,
                        Message = "Yêu cầu hoàn tiền đã được xử lý",
                        StatusCode = 400
                    };
                }

                var booking = refundTicket.Booking;

                // Kiểm tra booking có thể cancel không
                if (booking.Status == "cancelled" || booking.Status == "completed")
                {
                    return new ApiResponse<RefundResponse>
                    {
                        Success = false,
                        Message = $"Không thể xử lý hoàn tiền cho booking với trạng thái: {booking.Status}",
                        StatusCode = 400
                    };
                }

                // Lưu old values để audit
                var oldRefundTicketValues = JsonSerializer.Serialize(new
                {
                    refundTicket.Id,
                    refundTicket.Status,
                    refundTicket.RequestedAmount,
                    refundTicket.Reason
                });

                var oldBookingValues = JsonSerializer.Serialize(new
                {
                    booking.Id,
                    booking.BookingCode,
                    booking.Status,
                    booking.PaymentStatus,
                    booking.TotalAmount
                });

                // 1. Tạo Refund record
                var refund = new Refund
                {
                    RefundTicketId = refundTicketId,
                    BookingId = refundTicket.BookingId,
                    CustomerId = refundTicket.CustomerId,
                    ApprovedBy = request.ApprovedBy,
                    RefundedAmount = request.RefundedAmount,
                    ReceiverBankName = request.ReceiverBankName,
                    ReceiverAccount = request.ReceiverAccount,
                    ReceiverName = request.ReceiverName,
                    PaymentMethod = request.PaymentMethod,
                    PaymentReference = request.PaymentReference,
                    Notes = request.Notes,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Refunds.Add(refund);

                // 2. Update RefundTicket status
                refundTicket.Status = "approved";
                refundTicket.ProcessedAt = DateTime.UtcNow;

                // 3. Cancel Booking
                booking.Status = "cancelled";
                booking.CancelledAt = DateTime.UtcNow;
                booking.UpdatedAt = DateTime.UtcNow;

                // Lưu tất cả changes
                await _context.SaveChangesAsync();

                // 4. Gửi email
                if (!string.IsNullOrEmpty(booking.GuestEmail))
                {
                    var nights = (int)(booking.CheckOut - booking.CheckIn).TotalDays;
                    var emailData = new
                    {
                        GuestName = booking.GuestName,
                        GuestPhone = booking.GuestPhone ?? "",
                        BookingCode = booking.BookingCode,
                        CheckIn = booking.CheckIn.ToString("yyyy-MM-dd"),
                        CheckOut = booking.CheckOut.ToString("yyyy-MM-dd"),
                        Nights = nights,
                        Adults = booking.Adults,
                        Children = booking.Children,
                        RoomsCount = booking.RoomsCount,
                        TotalAmount = booking.TotalAmount,
                        PropertyName = booking.Property?.Name,
                        RoomTypeName = booking.RoomType?.Name,
                        CancelReason = $"Đặt phòng đã được hủy do hoàn tiền. Số tiền hoàn: {refund.RefundedAmount:C}"
                    };

                    // Gửi email vào queue
                    await _emailQueueService.QueueBookingCancelledAsync(
                        booking.CustomerId,
                        booking.GuestEmail,
                        emailData
                    );
                }

                // Commit transaction
                await transaction.CommitAsync();
                await _emailQueueService.QueueRefundTicketApprovedAsync(
    refundTicket.CustomerId,
    refundTicket.Customer.Email,
    new
    {
        CustomerName = refundTicket.Customer.FullName,
        BookingCode = booking.BookingCode,
        RefundedAmount = refund.RefundedAmount,
        BankName = refund.ReceiverBankName,
        AccountNumber = refund.ReceiverAccount,
        RefundTicketId = refundTicket.Id.ToString()
    }
);
                // Log audit sau khi commit thành công
                await _auditLogService.LogInsertAsync(
                    "Refund",
                    refund.Id,
                    JsonSerializer.Serialize(new
                    {
                        refund.Id,
                        refund.RefundTicketId,
                        refund.BookingId,
                        refund.CustomerId,
                        refund.ApprovedBy,
                        refund.RefundedAmount,
                        refund.ReceiverBankName,
                        refund.ReceiverAccount,
                        refund.ReceiverName,
                        refund.PaymentMethod,
                        refund.PaymentReference,
                        refund.Notes,
                        refund.CreatedAt
                    })
                );

                var newRefundTicketValues = JsonSerializer.Serialize(new
                {
                    refundTicket.Id,
                    refundTicket.Status,
                    refundTicket.ProcessedAt
                });
                await _auditLogService.LogUpdateAsync("RefundTicket", refundTicket.Id, oldRefundTicketValues, newRefundTicketValues);

                var newBookingValues = JsonSerializer.Serialize(new
                {
                    booking.Id,
                    booking.BookingCode,
                    booking.Status,
                    booking.PaymentStatus,
                    booking.TotalAmount,
                    booking.UpdatedAt,
                    booking.CancelledAt,
                    RefundCancellation = true,
                    RefundAmount = refund.RefundedAmount
                });
                await _auditLogService.LogUpdateAsync("Booking", booking.Id, oldBookingValues, newBookingValues);

                await _auditLogService.LogActionAsync(
                    "REFUND_PROCESSED",
                    "Booking",
                    booking.Id,
                    $"Booking {booking.BookingCode} đã được hủy do hoàn tiền. Số tiền hoàn: {refund.RefundedAmount:C}"
                );

                // Tạo response
                var response = new RefundResponse
                {
                    Id = refund.Id,
                    RefundTicketId = refund.RefundTicketId,
                    BookingId = refund.BookingId,
                    BookingCode = booking.BookingCode,
                    CustomerId = refund.CustomerId,
                    CustomerName = refundTicket.Customer.FullName,
                    ApprovedBy = refund.ApprovedBy,
                    RefundedAmount = refund.RefundedAmount,
                    ReceiverBankName = refund.ReceiverBankName,
                    ReceiverAccount = refund.ReceiverAccount,
                    ReceiverName = refund.ReceiverName,
                    PaymentMethod = refund.PaymentMethod,
                    PaymentReference = refund.PaymentReference,
                    Notes = refund.Notes,
                    CreatedAt = refund.CreatedAt
                };

                return new ApiResponse<RefundResponse>
                {
                    Success = true,
                    Message = "Xử lý hoàn tiền thành công. Booking đã được hủy và email thông báo đã được gửi",
                    StatusCode = 201,
                    Data = response
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                await _auditLogService.LogActionAsync(
                    "REFUND_PROCESS_FAILED",
                    "RefundTicket",
                    refundTicketId,
                    $"Lỗi khi xử lý hoàn tiền: {ex.Message}"
                );

                return new ApiResponse<RefundResponse>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi xử lý hoàn tiền. Tất cả thay đổi đã được hoàn tác",
                    StatusCode = 500,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<RefundTicketResponse>> UpdateRefundTicketStatusAsync(int refundTicketId, string status)
        {
            try
            {
                var refundTicket = await _context.RefundTickets
                    .Include(rt => rt.Booking)
                        .ThenInclude(b => b.Property)
                    .Include(rt => rt.Customer)
                    .FirstOrDefaultAsync(rt => rt.Id == refundTicketId);

                if (refundTicket == null)
                {
                    return new ApiResponse<RefundTicketResponse>
                    {
                        Success = false,
                        Message = "Yêu cầu hoàn tiền không tồn tại",
                        StatusCode = 404
                    };
                }

                var oldValues = JsonSerializer.Serialize(new
                {
                    refundTicket.Id,
                    refundTicket.Status,
                    refundTicket.RequestedAmount,
                    refundTicket.Reason,
                    refundTicket.BankName,
                    refundTicket.BankAccountNumber,
                    refundTicket.BankAccountName
                });

                refundTicket.Status = status;
                refundTicket.ProcessedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                if (status.ToLower() == "rejected")
                {
                    await _emailQueueService.QueueRefundTicketRejectedAsync(
                        refundTicket.CustomerId,
                        refundTicket.Customer.Email,
                        new
                        {
                            CustomerName = refundTicket.Customer.FullName,
                            BookingCode = refundTicket.Booking.BookingCode,
                            RequestedAmount = refundTicket.RequestedAmount,
                            RejectReason = "Không đáp ứng điều kiện hoàn tiền theo chính sách của chúng tôi",
                            RefundTicketId = refundTicket.Id.ToString()
                        }
                    );
                }
                var newValues = JsonSerializer.Serialize(new
                {
                    refundTicket.Id,
                    refundTicket.Status,
                    refundTicket.ProcessedAt
                });

                await _auditLogService.LogUpdateAsync("RefundTicket", refundTicket.Id, oldValues, newValues);

                var response = new RefundTicketResponse
                {
                    Id = refundTicket.Id,
                    BookingId = refundTicket.BookingId,
                    BookingCode = refundTicket.Booking.BookingCode,
                    PropertyName = refundTicket.Booking.Property.Name,
                    CustomerId = refundTicket.CustomerId,
                    CustomerName = refundTicket.Customer.FullName,
                    CustomerEmail = refundTicket.Customer.Email,
                    RequestedAmount = refundTicket.RequestedAmount,
                    Reason = refundTicket.Reason,
                    BankName = refundTicket.BankName,
                    BankAccountNumber = refundTicket.BankAccountNumber,
                    BankAccountName = refundTicket.BankAccountName,
                    Status = refundTicket.Status,
                    CreatedAt = refundTicket.CreatedAt,
                    ProcessedAt = refundTicket.ProcessedAt
                };

                return new ApiResponse<RefundTicketResponse>
                {
                    Success = true,
                    Message = "Cập nhật trạng thái yêu cầu hoàn tiền thành công",
                    StatusCode = 200,
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<RefundTicketResponse>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi cập nhật trạng thái",
                    StatusCode = 500,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<List<RefundResponse>>> GetRefundsAsync()
        {
            try
            {
                var refunds = await _context.Refunds
                    .Include(r => r.RefundTicket)
                        .ThenInclude(rt => rt.Booking)
                            .ThenInclude(b => b.Property)
                    .Include(r => r.Customer)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                var response = refunds.Select(r => new RefundResponse
                {
                    Id = r.Id,
                    RefundTicketId = r.RefundTicketId,
                    BookingId = r.BookingId,
                    BookingCode = r.RefundTicket.Booking.BookingCode,
                    CustomerId = r.CustomerId,
                    CustomerName = r.Customer.FullName,
                    ApprovedBy = r.ApprovedBy,
                    RefundedAmount = r.RefundedAmount,
                    ReceiverBankName = r.ReceiverBankName,
                    ReceiverAccount = r.ReceiverAccount,
                    ReceiverName = r.ReceiverName,
                    PaymentMethod = r.PaymentMethod,
                    PaymentReference = r.PaymentReference,
                    Notes = r.Notes,
                    CreatedAt = r.CreatedAt
                }).ToList();

                return new ApiResponse<List<RefundResponse>>
                {
                    Success = true,
                    Message = "Lấy danh sách hoàn tiền thành công",
                    StatusCode = 200,
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<RefundResponse>>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi lấy danh sách hoàn tiền",
                    StatusCode = 500,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<List<RefundTicketResponse>>> GetHostRefundTicketsAsync(int hostId, string? status = null)
        {
            try
            {
                var query = _context.RefundTickets
                    .Include(rt => rt.Booking)
                        .ThenInclude(b => b.Property)
                    .Include(rt => rt.Customer)
                    .Where(rt => rt.Booking.Property.HostId == hostId);

                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(rt => rt.Status == status);
                }

                var refundTickets = await query
                    .OrderByDescending(rt => rt.CreatedAt)
                    .ToListAsync();

                var response = refundTickets.Select(rt => new RefundTicketResponse
                {
                    Id = rt.Id,
                    BookingId = rt.BookingId,
                    BookingCode = rt.Booking.BookingCode,
                    PropertyName = rt.Booking.Property.Name,
                    CustomerId = rt.CustomerId,
                    CustomerName = rt.Customer.FullName,
                    CustomerEmail = rt.Customer.Email,
                    RequestedAmount = rt.RequestedAmount,
                    Reason = rt.Reason,
                    BankName = rt.BankName,
                    BankAccountNumber = rt.BankAccountNumber,
                    BankAccountName = rt.BankAccountName,
                    Status = rt.Status,
                    CreatedAt = rt.CreatedAt,
                    ProcessedAt = rt.ProcessedAt
                }).ToList();

                return new ApiResponse<List<RefundTicketResponse>>
                {
                    Success = true,
                    Message = "Lấy danh sách yêu cầu hoàn tiền thành công",
                    StatusCode = 200,
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<RefundTicketResponse>>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi lấy danh sách yêu cầu hoàn tiền",
                    StatusCode = 500,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<RefundTicketDetailResponse>> GetHostRefundTicketDetailAsync(int ticketId, int hostId)
        {
            try
            {
                var refundTicket = await _context.RefundTickets
                    .Include(rt => rt.Booking)
                        .ThenInclude(b => b.Property)
                    .Include(rt => rt.Customer)
                    .Include(rt => rt.Refunds)
                    .FirstOrDefaultAsync(rt => rt.Id == ticketId && rt.Booking.Property.HostId == hostId);

                if (refundTicket == null)
                {
                    return new ApiResponse<RefundTicketDetailResponse>
                    {
                        Success = false,
                        Message = "Yêu cầu hoàn tiền không tồn tại hoặc không thuộc property của bạn",
                        StatusCode = 404
                    };
                }

                var response = new RefundTicketDetailResponse
                {
                    Id = refundTicket.Id,
                    BookingId = refundTicket.BookingId,
                    BookingCode = refundTicket.Booking.BookingCode,
                    PropertyName = refundTicket.Booking.Property.Name,
                    CustomerId = refundTicket.CustomerId,
                    CustomerName = refundTicket.Customer.FullName,
                    CustomerEmail = refundTicket.Customer.Email,
                    RequestedAmount = refundTicket.RequestedAmount,
                    Reason = refundTicket.Reason,
                    BankName = refundTicket.BankName,
                    BankAccountNumber = refundTicket.BankAccountNumber,
                    BankAccountName = refundTicket.BankAccountName,
                    Status = refundTicket.Status,
                    CreatedAt = refundTicket.CreatedAt,
                    ProcessedAt = refundTicket.ProcessedAt,
                    Refund = refundTicket.Refunds?.FirstOrDefault() != null ? new RefundResponse
                    {
                        Id = refundTicket.Refunds.First().Id,
                        RefundTicketId = refundTicket.Refunds.First().RefundTicketId,
                        RefundedAmount = refundTicket.Refunds.First().RefundedAmount,
                        ReceiverBankName = refundTicket.Refunds.First().ReceiverBankName,
                        ReceiverAccount = refundTicket.Refunds.First().ReceiverAccount,
                        ReceiverName = refundTicket.Refunds.First().ReceiverName,
                        PaymentMethod = refundTicket.Refunds.First().PaymentMethod,
                        PaymentReference = refundTicket.Refunds.First().PaymentReference,
                        Notes = refundTicket.Refunds.First().Notes,
                        CreatedAt = refundTicket.Refunds.First().CreatedAt
                    } : null
                };

                return new ApiResponse<RefundTicketDetailResponse>
                {
                    Success = true,
                    Message = "Lấy chi tiết yêu cầu hoàn tiền thành công",
                    StatusCode = 200,
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<RefundTicketDetailResponse>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi lấy chi tiết yêu cầu hoàn tiền",
                    StatusCode = 500,
                    Error = ex.Message
                };
            }
        }

        public async Task<ApiResponse<RefundStatisticsResponse>> GetRefundStatisticsAsync(DateTime? fromDate, DateTime? toDate)
        {
            try
            {
                var query = _context.Refunds.AsQueryable();

                if (fromDate.HasValue)
                {
                    query = query.Where(r => r.CreatedAt >= fromDate.Value);
                }

                if (toDate.HasValue)
                {
                    query = query.Where(r => r.CreatedAt <= toDate.Value);
                }

                var refunds = await query.ToListAsync();
                var refundTickets = await _context.RefundTickets
                    .Where(rt =>
                        (!fromDate.HasValue || rt.CreatedAt >= fromDate.Value) &&
                        (!toDate.HasValue || rt.CreatedAt <= toDate.Value))
                    .ToListAsync();

                var response = new RefundStatisticsResponse
                {
                    TotalRefundTickets = refundTickets.Count,
                    PendingTickets = refundTickets.Count(rt => rt.Status == "pending"),
                    ApprovedTickets = refundTickets.Count(rt => rt.Status == "approved"),
                    RejectedTickets = refundTickets.Count(rt => rt.Status == "rejected"),
                    CancelledTickets = refundTickets.Count(rt => rt.Status == "cancelled"),
                    TotalRefundAmount = refunds.Sum(r => r.RefundedAmount),
                    TotalRefundCount = refunds.Count,
                    AverageRefundAmount = refunds.Any() ? refunds.Average(r => r.RefundedAmount) : 0,
                    FromDate = fromDate,
                    ToDate = toDate
                };

                return new ApiResponse<RefundStatisticsResponse>
                {
                    Success = true,
                    Message = "Lấy thống kê hoàn tiền thành công",
                    StatusCode = 200,
                    Data = response
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<RefundStatisticsResponse>
                {
                    Success = false,
                    Message = "Có lỗi xảy ra khi lấy thống kê hoàn tiền",
                    StatusCode = 500,
                    Error = ex.Message
                };
            }
        }
    }
}