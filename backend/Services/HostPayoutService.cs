using Microsoft.EntityFrameworkCore;
using QBooking.Data;
using QBooking.Dtos.Response;
using QBooking.Models;

namespace QBooking.Services
{
    public interface IHostPayoutService
    {
        // Host
        Task<IEnumerable<HostPayoutDto>> GetPayoutsByHostAsync(int hostId);
        Task<HostPayoutDto> GetPayoutByIdAsync(int id);
        Task<IEnumerable<HostEarningDto>> GetPayoutEarningsAsync(int payoutId);
        Task<bool> UpdateBankInfoAsync(int payoutId, string bankName, string accountNumber, string accountName);
        Task<IEnumerable<HostEarningDto>> GetPendingEarningsAsync(int hostId);

        // Admin
        Task<(IEnumerable<HostPayoutDto> items, int total)> GetAllPayoutsAsync(int page = 1, int pageSize = 10);
        Task<HostPayoutDto> CreateManualPayoutAsync(int hostId, DateTime startDate, DateTime endDate);
        Task<bool> ProcessPayoutAsync(int id, string transactionReference, string notes, int adminId);
        Task<bool> CompletePayoutAsync(int id, int adminId);
        Task<bool> CancelPayoutAsync(int id, int adminId);
        Task<PayoutStatisticsDto> GetPayoutStatisticsAsync();
    }

    public class HostPayoutService : IHostPayoutService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<HostPayoutService> _logger;
        private readonly AuditLogService _auditLogService;

        public HostPayoutService(ApplicationDbContext context, ILogger<HostPayoutService> logger, AuditLogService auditLogService)
        {
            _context = context;
            _logger = logger;
            _auditLogService = auditLogService;
        }

        public async Task<IEnumerable<HostPayoutDto>> GetPayoutsByHostAsync(int hostId)
        {
            try
            {
                var payouts = await _context.HostPayouts
                    .Where(p => p.HostId == hostId)
                    .OrderByDescending(p => p.CreatedAt)
                    .Select(p => new HostPayoutDto
                    {
                        Id = p.Id,
                        HostId = p.HostId,
                        HostName = p.Host.FullName,
                        PayoutPeriodStart = p.PayoutPeriodStart,
                        PayoutPeriodEnd = p.PayoutPeriodEnd,
                        TotalEarnings = p.TotalEarnings,
                        TotalPlatformFee = p.TotalPlatformFee,
                        TotalTax = p.TotalTax,
                        NetPayoutAmount = p.NetPayoutAmount,
                        BookingCount = p.BookingCount,
                        BankName = p.BankName,
                        BankAccountNumber = p.BankAccountNumber,
                        BankAccountName = p.BankAccountName,
                        PaymentMethod = p.PaymentMethod,
                        Status = p.Status,
                        TransactionReference = p.TransactionReference,
                        ProcessedAt = p.ProcessedAt,
                        CompletedAt = p.CompletedAt,
                        CreatedAt = p.CreatedAt
                    })
                    .ToListAsync();

                return payouts;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payouts for host {HostId}", hostId);
                return new List<HostPayoutDto>();
            }
        }

        public async Task<HostPayoutDto> GetPayoutByIdAsync(int id)
        {
            try
            {
                var payout = await _context.HostPayouts.FirstOrDefaultAsync(p => p.Id == id);
                if (payout == null) return null;

                return new HostPayoutDto
                {
                    Id = payout.Id,
                    HostId = payout.HostId,
                    HostName = payout.Host.FullName,
                    PayoutPeriodStart = payout.PayoutPeriodStart,
                    PayoutPeriodEnd = payout.PayoutPeriodEnd,
                    TotalEarnings = payout.TotalEarnings,
                    TotalPlatformFee = payout.TotalPlatformFee,
                    TotalTax = payout.TotalTax,
                    NetPayoutAmount = payout.NetPayoutAmount,
                    BookingCount = payout.BookingCount,
                    BankName = payout.BankName,
                    BankAccountNumber = payout.BankAccountNumber,
                    BankAccountName = payout.BankAccountName,
                    PaymentMethod = payout.PaymentMethod,
                    Status = payout.Status,
                    TransactionReference = payout.TransactionReference,
                    ProcessedAt = payout.ProcessedAt,
                    CompletedAt = payout.CompletedAt,
                    CreatedAt = payout.CreatedAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payout {PayoutId}", id);
                return null;
            }
        }

        public async Task<IEnumerable<HostEarningDto>> GetPayoutEarningsAsync(int payoutId)
        {
            try
            {
                var earnings = await _context.HostEarnings
                    .Include(e => e.Property)
                    .Include(e => e.Booking)
                    .Where(e => e.PayoutId == payoutId)
                    .Select(e => new HostEarningDto
                    {
                        Id = e.Id,
                        BookingId = e.BookingId,
                        HostId = e.HostId,
                        HostName = e.Host.FullName,
                        PropertyId = e.PropertyId,
                        EarningAmount = e.EarningAmount,
                        PlatformFee = e.PlatformFee,
                        TaxAmount = e.TaxAmount,
                        NetAmount = e.NetAmount,
                        Status = e.Status,
                        EarnedDate = e.EarnedDate,
                        PaidDate = e.PaidDate,
                        PayoutId = e.PayoutId,
                        PropertyName = e.Property.Name,
                        BookingReference = e.Booking.BookingCode,
                        CreatedAt = e.CreatedAt
                    })
                    .ToListAsync();

                return earnings;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting earnings for payout {PayoutId}", payoutId);
                return new List<HostEarningDto>();
            }
        }

        public async Task<bool> UpdateBankInfoAsync(int payoutId, string bankName, string accountNumber, string accountName)
        {
            try
            {
                var payout = await _context.HostPayouts.FindAsync(payoutId);
                if (payout == null || payout.Status != "pending") return false;

                payout.BankName = bankName;
                payout.BankAccountNumber = accountNumber;
                payout.BankAccountName = accountName;
                payout.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                _logger.LogInformation("Bank info updated for payout {PayoutId}", payoutId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating bank info for payout {PayoutId}", payoutId);
                return false;
            }
        }

        public async Task<IEnumerable<HostEarningDto>> GetPendingEarningsAsync(int hostId)
        {
            try
            {
                var earnings = await _context.HostEarnings
                    .Include(e => e.Property)
                    .Include(e => e.Booking)
                    .Where(e => e.HostId == hostId && e.Status == "approved" && e.PayoutId == null)
                    .Select(e => new HostEarningDto
                    {
                        Id = e.Id,
                        BookingId = e.BookingId,
                        HostId = e.HostId,
                        HostName = e.Host.FullName,
                        PropertyId = e.PropertyId,
                        EarningAmount = e.EarningAmount,
                        PlatformFee = e.PlatformFee,
                        TaxAmount = e.TaxAmount,
                        NetAmount = e.NetAmount,
                        Status = e.Status,
                        EarnedDate = e.EarnedDate,
                        PaidDate = e.PaidDate,
                        PayoutId = e.PayoutId,
                        PropertyName = e.Property.Name,
                        BookingReference = e.Booking.BookingCode,
                        CreatedAt = e.CreatedAt
                    })
                    .ToListAsync();

                return earnings;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending earnings for host {HostId}", hostId);
                return new List<HostEarningDto>();
            }
        }

        public async Task<(IEnumerable<HostPayoutDto> items, int total)> GetAllPayoutsAsync(int page = 1, int pageSize = 10)
        {
            try
            {
                var query = _context.HostPayouts;
                var total = await query.CountAsync();

                var payouts = await query
                    .OrderByDescending(p => p.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new HostPayoutDto
                    {
                        Id = p.Id,
                        HostId = p.HostId,
                        HostName = p.Host.FullName,
                        PayoutPeriodStart = p.PayoutPeriodStart,
                        PayoutPeriodEnd = p.PayoutPeriodEnd,
                        TotalEarnings = p.TotalEarnings,
                        TotalPlatformFee = p.TotalPlatformFee,
                        TotalTax = p.TotalTax,
                        NetPayoutAmount = p.NetPayoutAmount,
                        BookingCount = p.BookingCount,
                        BankName = p.BankName,
                        BankAccountNumber = p.BankAccountNumber,
                        BankAccountName = p.BankAccountName,
                        PaymentMethod = p.PaymentMethod,
                        Status = p.Status,
                        TransactionReference = p.TransactionReference,
                        ProcessedAt = p.ProcessedAt,
                        CompletedAt = p.CompletedAt,
                        CreatedAt = p.CreatedAt
                    })
                    .ToListAsync();

                return (payouts, total);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all payouts");
                return (new List<HostPayoutDto>(), 0);
            }
        }

        public async Task<HostPayoutDto> CreateManualPayoutAsync(int hostId, DateTime startDate, DateTime endDate)
        {
            try
            {
                var host = await _context.Users.FindAsync(hostId);
                if (host == null) return null;

                var earnings = await _context.HostEarnings
                    .Where(e => e.HostId == hostId && e.Status == "approved"
                            && e.PayoutId == null
                            && e.EarnedDate >= startDate
                            && e.EarnedDate <= endDate)
                    .ToListAsync();

                if (!earnings.Any()) return null;

                var payout = new HostPayout
                {
                    HostId = hostId,
                    PayoutPeriodStart = startDate,
                    PayoutPeriodEnd = endDate,
                    TotalEarnings = earnings.Sum(e => e.EarningAmount),
                    TotalPlatformFee = earnings.Sum(e => e.PlatformFee),
                    TotalTax = earnings.Sum(e => e.TaxAmount),
                    NetPayoutAmount = earnings.Sum(e => e.NetAmount),
                    BookingCount = earnings.Count,
                    BankName = "Pending",
                    BankAccountNumber = "Pending",
                    BankAccountName = host.FullName,
                    PaymentMethod = "bank_transfer",
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.HostPayouts.Add(payout);
                await _context.SaveChangesAsync();

                foreach (var earning in earnings)
                {
                    earning.PayoutId = payout.Id;
                    earning.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("Manual payout {PayoutId} created for host {HostId}", payout.Id, hostId);

                return new HostPayoutDto
                {
                    Id = payout.Id,
                    HostId = payout.HostId,
                    PayoutPeriodStart = payout.PayoutPeriodStart,
                    PayoutPeriodEnd = payout.PayoutPeriodEnd,
                    TotalEarnings = payout.TotalEarnings,
                    TotalPlatformFee = payout.TotalPlatformFee,
                    TotalTax = payout.TotalTax,
                    NetPayoutAmount = payout.NetPayoutAmount,
                    BookingCount = payout.BookingCount,
                    BankName = payout.BankName,
                    BankAccountNumber = payout.BankAccountNumber,
                    BankAccountName = payout.BankAccountName,
                    PaymentMethod = payout.PaymentMethod,
                    Status = payout.Status,
                    TransactionReference = payout.TransactionReference,
                    ProcessedAt = payout.ProcessedAt,
                    CompletedAt = payout.CompletedAt,
                    CreatedAt = payout.CreatedAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating manual payout for host {HostId}", hostId);
                return null;
            }
        }

        public async Task<bool> ProcessPayoutAsync(int id, string transactionReference, string notes, int adminId)
        {
            try
            {
                var payout = await _context.HostPayouts.FindAsync(id);
                if (payout == null || payout.Status != "pending") return false;

                payout.Status = "processing";
                payout.TransactionReference = transactionReference;
                payout.Notes = notes;
                payout.ProcessedBy = adminId;
                payout.ProcessedAt = DateTime.UtcNow;
                payout.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await _auditLogService.LogActionAsync("PROCESS_PAYOUT", "HostPayout", id, "status: pending", "status: processing");

                _logger.LogInformation("Payout {PayoutId} processed by admin {AdminId}", id, adminId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payout {PayoutId}", id);
                return false;
            }
        }

        public async Task<bool> CompletePayoutAsync(int id, int adminId)
        {
            try
            {
                var payout = await _context.HostPayouts.FindAsync(id);
                if (payout == null || payout.Status != "processing") return false;

                payout.Status = "completed";
                payout.CompletedAt = DateTime.UtcNow;
                payout.UpdatedAt = DateTime.UtcNow;

                var earnings = await _context.HostEarnings
                    .Where(e => e.PayoutId == id)
                    .ToListAsync();

                foreach (var earning in earnings)
                {
                    earning.Status = "paid";
                    earning.PaidDate = DateTime.UtcNow;
                    earning.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                await _auditLogService.LogActionAsync("COMPLETE_PAYOUT", "HostPayout", id, "status: processing", "status: completed");

                _logger.LogInformation("Payout {PayoutId} completed by admin {AdminId}", id, adminId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completing payout {PayoutId}", id);
                return false;
            }
        }

        public async Task<bool> CancelPayoutAsync(int id, int adminId)
        {
            try
            {
                var payout = await _context.HostPayouts.FindAsync(id);
                if (payout == null || (payout.Status != "pending" && payout.Status != "processing"))
                    return false;

                payout.Status = "cancelled";
                payout.UpdatedAt = DateTime.UtcNow;

                var earnings = await _context.HostEarnings
                    .Where(e => e.PayoutId == id)
                    .ToListAsync();

                foreach (var earning in earnings)
                {
                    earning.PayoutId = null;
                    earning.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                await _auditLogService.LogActionAsync("CANCEL_PAYOUT", "HostPayout", id, $"status: {payout.Status}", "status: cancelled");

                _logger.LogInformation("Payout {PayoutId} cancelled by admin {AdminId}", id, adminId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling payout {PayoutId}", id);
                return false;
            }
        }

        public async Task<PayoutStatisticsDto> GetPayoutStatisticsAsync()
        {
            try
            {
                var stats = await _context.HostPayouts
                    .GroupBy(p => 1)
                    .Select(g => new PayoutStatisticsDto
                    {
                        TotalPayouts = g.Sum(p => p.NetPayoutAmount),
                        ProcessedCount = g.Count(p => p.Status == "processing"),
                        PendingCount = g.Count(p => p.Status == "pending"),
                        CompletedCount = g.Count(p => p.Status == "completed"),
                        CancelledCount = g.Count(p => p.Status == "cancelled"),
                        AveragePayoutAmount = g.Count() > 0 ? g.Sum(p => p.NetPayoutAmount) / g.Count() : 0
                    })
                    .FirstOrDefaultAsync();

                return stats ?? new PayoutStatisticsDto();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payout statistics");
                return new PayoutStatisticsDto();
            }
        }
    }
}