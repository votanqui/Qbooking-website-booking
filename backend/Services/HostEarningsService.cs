using Microsoft.EntityFrameworkCore;
using QBooking.Data;
using QBooking.Dtos.Response;
using QBooking.Models;

namespace QBooking.Services
{
    public interface IHostEarningsService
    {
        Task<HostEarning> CreateEarningFromCheckoutAsync(Booking booking);
        Task<IEnumerable<HostEarningDto>> GetEarningsByHostAsync(int userId, string status = null, DateTime? fromDate = null, DateTime? toDate = null);
        Task<HostEarningsStatisticsDto> GetEarningsStatisticsAsync(int userId, DateTime? fromDate = null, DateTime? toDate = null);
        Task<HostEarningDto> GetEarningByIdAsync(int id);
        Task<IEnumerable<HostEarningsSummaryDto>> GetEarningsSummaryAsync(int userId, int year);

        // Admin
        Task<(IEnumerable<HostEarningDto> items, int total)> GetAllEarningsAsync(int page = 1, int pageSize = 10, string status = null);
        Task<bool> ApproveEarningAsync(int id, int adminId);
        Task<bool> RejectEarningAsync(int id, int adminId);
        Task<PayoutStatisticsDto> GetAdminStatisticsAsync();


    }

    public class HostEarningsService : IHostEarningsService
    {
        private readonly ApplicationDbContext _context;
        private const decimal PLATFORM_FEE_PERCENTAGE = 0.15m; // 15%
        private const decimal TAX_PERCENTAGE = 0.10m; // 10%

 
        private readonly ILogger<HostEarningsService> _logger;
        private readonly AuditLogService _auditLogService;

        public HostEarningsService(ApplicationDbContext context, ILogger<HostEarningsService> logger, AuditLogService auditLogService)
        {
            _context = context;
            _logger = logger;
            _auditLogService = auditLogService;
        }

        public async Task<HostEarning> CreateEarningFromCheckoutAsync(Booking booking)
        {
            var property = await _context.Properties.FindAsync(booking.PropertyId);

            var platformFee = booking.TotalAmount * PLATFORM_FEE_PERCENTAGE;
            var taxAmount = booking.TotalAmount * TAX_PERCENTAGE;
            var netAmount = booking.TotalAmount - platformFee - taxAmount;

            var earning = new HostEarning
            {
                BookingId = booking.Id,
                HostId = property.HostId,
                PropertyId = booking.PropertyId,
                EarningAmount = booking.TotalAmount,
                PlatformFee = platformFee,
                TaxAmount = taxAmount,
                NetAmount = netAmount,
                Status = "pending",
                EarnedDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.HostEarnings.Add(earning);
            await _context.SaveChangesAsync();
            return earning;
        }

        public async Task<IEnumerable<HostEarningDto>> GetEarningsByHostAsync(int userId, string status = null, DateTime? fromDate = null, DateTime? toDate = null)
        {
            try
            {
                var query = _context.HostEarnings
                    .Include(e => e.Property)
                    .Include(e => e.Booking)
                    .Where(e => e.HostId == userId);

                if (!string.IsNullOrEmpty(status))
                    query = query.Where(e => e.Status == status);

                if (fromDate.HasValue)
                    query = query.Where(e => e.EarnedDate >= fromDate.Value);

                if (toDate.HasValue)
                    query = query.Where(e => e.EarnedDate <= toDate.Value);

                var earnings = await query
                    .OrderByDescending(e => e.EarnedDate)
                    .Select(e => new HostEarningDto
                    {
                        Id = e.Id,
                        BookingId = e.BookingId,
                        HostId = e.HostId,
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
                _logger.LogError(ex, "Error getting earnings for host {UserId}", userId);
                return new List<HostEarningDto>();
            }
        }

        public async Task<HostEarningsStatisticsDto> GetEarningsStatisticsAsync(int userId, DateTime? fromDate = null, DateTime? toDate = null)
        {
            try
            {
                var query = _context.HostEarnings.Where(e => e.HostId == userId);

                if (fromDate.HasValue)
                    query = query.Where(e => e.EarnedDate >= fromDate.Value);

                if (toDate.HasValue)
                    query = query.Where(e => e.EarnedDate <= toDate.Value);

                var stats = await query
                    .GroupBy(e => 1)
                    .Select(g => new HostEarningsStatisticsDto
                    {
                        TotalEarnings = g.Sum(e => e.EarningAmount),
                        TotalPlatformFee = g.Sum(e => e.PlatformFee),
                        TotalTax = g.Sum(e => e.TaxAmount),
                        TotalNetAmount = g.Sum(e => e.NetAmount),
                        TotalBookings = g.Count(),
                        ApprovedCount = g.Count(e => e.Status == "approved"),
                        PendingCount = g.Count(e => e.Status == "pending"),
                        RejectedCount = g.Count(e => e.Status == "rejected"),
                        AverageEarningPerBooking = g.Count() > 0 ? g.Sum(e => e.EarningAmount) / g.Count() : 0
                    })
                    .FirstOrDefaultAsync();

                return stats ?? new HostEarningsStatisticsDto();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting earnings statistics for host {UserId}", userId);
                return new HostEarningsStatisticsDto();
            }
        }

        public async Task<HostEarningDto> GetEarningByIdAsync(int id)
        {
            try
            {
                var earning = await _context.HostEarnings
                    .Include(e => e.Property)
                    .Include(e => e.Booking)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (earning == null)
                    return null;

                return new HostEarningDto
                {
                    Id = earning.Id,
                    BookingId = earning.BookingId,
                    HostId = earning.HostId,
                    PropertyId = earning.PropertyId,
                    EarningAmount = earning.EarningAmount,
                    PlatformFee = earning.PlatformFee,
                    TaxAmount = earning.TaxAmount,
                    NetAmount = earning.NetAmount,
                    Status = earning.Status,
                    EarnedDate = earning.EarnedDate,
                    PaidDate = earning.PaidDate,
                    PayoutId = earning.PayoutId,
                    PropertyName = earning.Property.Name,
                    BookingReference = earning.Booking.BookingCode,
                    CreatedAt = earning.CreatedAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting earning {EarningId}", id);
                return null;
            }
        }

        public async Task<IEnumerable<HostEarningsSummaryDto>> GetEarningsSummaryAsync(int userId, int year)
        {
            try
            {
                var earnings = await _context.HostEarnings
                    .Where(e => e.HostId == userId && e.EarnedDate.Year == year)
                    .GroupBy(e => new { e.EarnedDate.Year, e.EarnedDate.Month })
                    .Select(g => new HostEarningsSummaryDto
                    {
                        Month = g.Key.Month,
                        Year = g.Key.Year,
                        TotalEarnings = g.Sum(e => e.EarningAmount),
                        NetAmount = g.Sum(e => e.NetAmount),
                        BookingCount = g.Count()
                    })
                    .OrderBy(s => s.Month)
                    .ToListAsync();

                return earnings;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting earnings summary for host {UserId}", userId);
                return new List<HostEarningsSummaryDto>();
            }
        }

        public async Task<(IEnumerable<HostEarningDto> items, int total)> GetAllEarningsAsync(int page = 1, int pageSize = 10, string status = null)
        {
            try
            {
                var query = _context.HostEarnings
    .Include(e => e.Property)
    .Include(e => e.Booking)
    .Include(e => e.Host)
    .AsQueryable();

                if (!string.IsNullOrEmpty(status))
                    query = query.Where(e => e.Status == status);

                var total = await query.CountAsync();

                var earnings = await query
                    .OrderByDescending(e => e.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
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

                return (earnings, total);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all earnings");
                return (new List<HostEarningDto>(), 0);
            }
        }

        public async Task<bool> ApproveEarningAsync(int id, int adminId)
        {
            try
            {
                var earning = await _context.HostEarnings.FindAsync(id);
                if (earning == null) return false;

                earning.Status = "approved";
                earning.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await _auditLogService.LogActionAsync("APPROVE_EARNING", "HostEarning", id, "status: pending", "status: approved");

                _logger.LogInformation("Earning {EarningId} approved by admin {AdminId}", id, adminId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving earning {EarningId}", id);
                return false;
            }
        }

        public async Task<bool> RejectEarningAsync(int id, int adminId)
        {
            try
            {
                var earning = await _context.HostEarnings.FindAsync(id);
                if (earning == null) return false;

                earning.Status = "rejected";
                earning.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await _auditLogService.LogActionAsync("REJECT_EARNING", "HostEarning", id, "status: pending", "status: rejected");

                _logger.LogInformation("Earning {EarningId} rejected by admin {AdminId}", id, adminId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting earning {EarningId}", id);
                return false;
            }
        }

        public async Task<PayoutStatisticsDto> GetAdminStatisticsAsync()
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
                _logger.LogError(ex, "Error getting admin statistics");
                return new PayoutStatisticsDto();
            }
        }
    }
}