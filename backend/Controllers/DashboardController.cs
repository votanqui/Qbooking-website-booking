using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QBooking.Data;
using QBooking.Models;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Dashboard/overview
        [HttpGet("overview")]
        public async Task<ActionResult<DashboardOverviewDto>> GetOverview(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var start = startDate ?? DateTime.UtcNow.AddDays(-30);
            var end = endDate ?? DateTime.UtcNow;

            var overview = new DashboardOverviewDto
            {
                TotalBookings = await _context.Bookings
                    .Where(b => b.BookingDate >= start && b.BookingDate <= end)
                    .CountAsync(),

                TotalRevenue = await _context.Bookings
                    .Where(b => b.BookingDate >= start && b.BookingDate <= end 
                        && b.PaymentStatus == "paid")
                    .SumAsync(b => b.TotalAmount),

                TotalCustomers = await _context.Users
                    .Where(u => u.Role == "customer" 
                        && u.CreatedAt >= start && u.CreatedAt <= end)
                    .CountAsync(),

                TotalProperties = await _context.Properties
                    .Where(p => p.IsActive)
                    .CountAsync(),

                PendingBookings = await _context.Bookings
                    .Where(b => b.Status == "pending")
                    .CountAsync(),

                CheckInsToday = await _context.Bookings
                    .Where(b => b.CheckIn.Date == DateTime.UtcNow.Date 
                        && b.Status == "confirmed")
                    .CountAsync(),

                CheckOutsToday = await _context.Bookings
                    .Where(b => b.CheckOut.Date == DateTime.UtcNow.Date)
                    .CountAsync(),

                ActiveRefundTickets = await _context.RefundTickets
                    .Where(r => r.Status == "pending")
                    .CountAsync(),

                AverageBookingValue = await _context.Bookings
                    .Where(b => b.BookingDate >= start && b.BookingDate <= end 
                        && b.PaymentStatus == "paid")
                    .AverageAsync(b => (decimal?)b.TotalAmount) ?? 0
            };

            return Ok(overview);
        }

        // GET: api/Dashboard/revenue-chart
        [HttpGet("revenue-chart")]
        public async Task<ActionResult<IEnumerable<RevenueChartDto>>> GetRevenueChart(
            [FromQuery] string period = "daily", // daily, weekly, monthly
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var start = startDate ?? DateTime.UtcNow.AddDays(-30);
            var end = endDate ?? DateTime.UtcNow;

            var bookings = await _context.Bookings
                .Where(b => b.BookingDate >= start && b.BookingDate <= end 
                    && b.PaymentStatus == "paid")
                .Select(b => new { b.BookingDate, b.TotalAmount })
                .ToListAsync();

            List<RevenueChartDto> chart;

            switch (period.ToLower())
            {
                case "monthly":
                    chart = bookings
                        .GroupBy(b => new { b.BookingDate.Year, b.BookingDate.Month })
                        .Select(g => new RevenueChartDto
                        {
                            Period = $"{g.Key.Year}-{g.Key.Month:D2}",
                            Revenue = g.Sum(b => b.TotalAmount),
                            BookingCount = g.Count()
                        })
                        .OrderBy(x => x.Period)
                        .ToList();
                    break;

                case "weekly":
                    chart = bookings
                        .GroupBy(b => new
                        {
                            Year = b.BookingDate.Year,
                            Week = (b.BookingDate.DayOfYear - 1) / 7 + 1
                        })
                        .Select(g => new RevenueChartDto
                        {
                            Period = $"{g.Key.Year}-W{g.Key.Week:D2}",
                            Revenue = g.Sum(b => b.TotalAmount),
                            BookingCount = g.Count()
                        })
                        .OrderBy(x => x.Period)
                        .ToList();
                    break;

                default: // daily
                    chart = bookings
                        .GroupBy(b => b.BookingDate.Date)
                        .Select(g => new RevenueChartDto
                        {
                            Period = g.Key.ToString("yyyy-MM-dd"),
                            Revenue = g.Sum(b => b.TotalAmount),
                            BookingCount = g.Count()
                        })
                        .OrderBy(x => x.Period)
                        .ToList();
                    break;
            }

            return Ok(chart);
        }

        // GET: api/Dashboard/booking-status
        [HttpGet("booking-status")]
        public async Task<ActionResult<IEnumerable<BookingStatusDto>>> GetBookingStatus()
        {
            var statusData = await _context.Bookings
                .GroupBy(b => b.Status)
                .Select(g => new BookingStatusDto
                {
                    Status = g.Key,
                    Count = g.Count(),
                    TotalAmount = g.Sum(b => b.TotalAmount)
                })
                .ToListAsync();

            return Ok(statusData);
        }

        // GET: api/Dashboard/top-properties
        [HttpGet("top-properties")]
        public async Task<ActionResult<IEnumerable<TopPropertyDto>>> GetTopProperties(
            [FromQuery] int limit = 10,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var start = startDate ?? DateTime.UtcNow.AddDays(-30);
            var end = endDate ?? DateTime.UtcNow;

            var topProperties = await _context.Bookings
                .Where(b => b.BookingDate >= start && b.BookingDate <= end)
                .GroupBy(b => new { b.PropertyId, b.Property.Name })
                .Select(g => new TopPropertyDto
                {
                    PropertyId = g.Key.PropertyId,
                    PropertyName = g.Key.Name,
                    BookingCount = g.Count(),
                    TotalRevenue = g.Sum(b => b.TotalAmount),
                    AverageRating = _context.Reviews
                        .Where(r => r.PropertyId == g.Key.PropertyId)
                        .Average(r => (decimal?)r.OverallRating) ?? 0
                })
                .OrderByDescending(p => p.TotalRevenue)
                .Take(limit)
                .ToListAsync();

            return Ok(topProperties);
        }

        // GET: api/Dashboard/recent-bookings
        [HttpGet("recent-bookings")]
        public async Task<ActionResult<IEnumerable<RecentBookingDto>>> GetRecentBookings(
            [FromQuery] int limit = 10)
        {
            var recentBookings = await _context.Bookings
                .Include(b => b.Customer)
                .Include(b => b.Property)
                .Include(b => b.RoomType)
                .OrderByDescending(b => b.BookingDate)
                .Take(limit)
                .Select(b => new RecentBookingDto
                {
                    BookingId = b.Id,
                    BookingCode = b.BookingCode,
                    CustomerName = b.Customer.FullName,
                    PropertyName = b.Property.Name,
                    RoomTypeName = b.RoomType.Name,
                    CheckIn = b.CheckIn,
                    CheckOut = b.CheckOut,
                    TotalAmount = b.TotalAmount,
                    Status = b.Status,
                    PaymentStatus = b.PaymentStatus,
                    BookingDate = b.BookingDate
                })
                .ToListAsync();

            return Ok(recentBookings);
        }

        // GET: api/Dashboard/occupancy-rate
        [HttpGet("occupancy-rate")]
        public async Task<ActionResult<OccupancyRateDto>> GetOccupancyRate(
            [FromQuery] DateTime? date = null)
        {
            var targetDate = date ?? DateTime.UtcNow;

            var totalRooms = await _context.RoomTypes
                .Where(rt => rt.IsActive)
                .SumAsync(rt => rt.TotalRooms);

            var bookedRooms = await _context.Bookings
                .Where(b => b.CheckIn <= targetDate && b.CheckOut > targetDate
                    && (b.Status == "confirmed" || b.Status == "checked_in"))
                .SumAsync(b => b.RoomsCount);

            var occupancyRate = totalRooms > 0 
                ? (decimal)bookedRooms / totalRooms * 100 
                : 0;

            return Ok(new OccupancyRateDto
            {
                Date = targetDate,
                TotalRooms = totalRooms,
                BookedRooms = bookedRooms,
                AvailableRooms = totalRooms - bookedRooms,
                OccupancyPercentage = Math.Round(occupancyRate, 2)
            });
        }

        // GET: api/Dashboard/customer-growth
        [HttpGet("customer-growth")]
        public async Task<ActionResult<IEnumerable<CustomerGrowthDto>>> GetCustomerGrowth(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var start = startDate ?? DateTime.UtcNow.AddMonths(-12);
            var end = endDate ?? DateTime.UtcNow;

            // Bước 1: Lấy dữ liệu cơ bản từ DB
            var customers = await _context.Users
                .Where(u => u.Role == "customer" && u.CreatedAt >= start && u.CreatedAt <= end)
                .ToListAsync();

            // Bước 2: Group và tính toán trên client (in-memory)
            var customerGrowth = customers
                .GroupBy(u => new { u.CreatedAt.Value.Year, u.CreatedAt.Value.Month })
                .Select(g =>
                {
                    var year = g.Key.Year;
                    var month = g.Key.Month;
                    var lastDayOfMonth = new DateTime(year, month, 1).AddMonths(1).AddDays(-1);

                    var totalCustomers = customers
                        .Count(u => u.CreatedAt <= lastDayOfMonth);

                    return new CustomerGrowthDto
                    {
                        Period = $"{year}-{month:D2}",
                        NewCustomers = g.Count(),
                        TotalCustomers = totalCustomers
                    };
                })
                .OrderBy(x => x.Period)
                .ToList();

            return Ok(customerGrowth);
        }


        // GET: api/Dashboard/payment-methods
        [HttpGet("payment-methods")]
        public async Task<ActionResult<IEnumerable<PaymentMethodDto>>> GetPaymentMethods(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var start = startDate ?? DateTime.UtcNow.AddDays(-30);
            var end = endDate ?? DateTime.UtcNow;

            var paymentMethods = await _context.Payments
                .Where(p => p.CreatedAt >= start && p.CreatedAt <= end 
                    && p.Status == "completed")
                .GroupBy(p => p.PaymentMethod)
                .Select(g => new PaymentMethodDto
                {
                    Method = g.Key,
                    Count = g.Count(),
                    TotalAmount = g.Sum(p => p.Amount),
                    Percentage = 0 // Will calculate after
                })
                .ToListAsync();

            var total = paymentMethods.Sum(p => p.Count);
            if (total > 0)
            {
                foreach (var method in paymentMethods)
                {
                    method.Percentage = Math.Round((decimal)method.Count / total * 100, 2);
                }
            }

            return Ok(paymentMethods);
        }

        // GET: api/Dashboard/reviews-summary
        [HttpGet("reviews-summary")]
        public async Task<ActionResult<ReviewsSummaryDto>> GetReviewsSummary(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var start = startDate ?? DateTime.UtcNow.AddDays(-30);
            var end = endDate ?? DateTime.UtcNow;

            var reviews = await _context.Reviews
                .Where(r => r.CreatedAt >= start && r.CreatedAt <= end)
                .ToListAsync();

            var summary = new ReviewsSummaryDto
            {
                TotalReviews = reviews.Count,
                AverageRating = reviews.Any()
    ? (decimal)Math.Round(reviews.Average(r => (double)r.OverallRating), 2)
    : 0,
                AverageCleanliness = reviews.Where(r => r.CleanlinessRating.HasValue)
                    .Average(r => (decimal?)r.CleanlinessRating) ?? 0,
                AverageLocation = reviews.Where(r => r.LocationRating.HasValue)
                    .Average(r => (decimal?)r.LocationRating) ?? 0,
                AverageService = reviews.Where(r => r.ServiceRating.HasValue)
                    .Average(r => (decimal?)r.ServiceRating) ?? 0,
                AverageValue = reviews.Where(r => r.ValueRating.HasValue)
                    .Average(r => (decimal?)r.ValueRating) ?? 0,
                RatingDistribution = reviews
                    .GroupBy(r => r.OverallRating)
                    .OrderBy(g => g.Key)
                    .Select(g => new RatingDistributionDto
                    {
                        Rating = g.Key,
                        Count = g.Count()
                    })
                    .ToList()
            };

            return Ok(summary);
        }
    }

    // DTOs
    public class DashboardOverviewDto
    {
        public int TotalBookings { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalCustomers { get; set; }
        public int TotalProperties { get; set; }
        public int PendingBookings { get; set; }
        public int CheckInsToday { get; set; }
        public int CheckOutsToday { get; set; }
        public int ActiveRefundTickets { get; set; }
        public decimal AverageBookingValue { get; set; }
    }

    public class RevenueChartDto
    {
        public string Period { get; set; }
        public decimal Revenue { get; set; }
        public int BookingCount { get; set; }
    }

    public class BookingStatusDto
    {
        public string Status { get; set; }
        public int Count { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class TopPropertyDto
    {
        public int PropertyId { get; set; }
        public string PropertyName { get; set; }
        public int BookingCount { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal AverageRating { get; set; }
    }

    public class RecentBookingDto
    {
        public int BookingId { get; set; }
        public string BookingCode { get; set; }
        public string CustomerName { get; set; }
        public string PropertyName { get; set; }
        public string RoomTypeName { get; set; }
        public DateTime CheckIn { get; set; }
        public DateTime CheckOut { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public string PaymentStatus { get; set; }
        public DateTime BookingDate { get; set; }
    }

    public class OccupancyRateDto
    {
        public DateTime Date { get; set; }
        public int TotalRooms { get; set; }
        public int BookedRooms { get; set; }
        public int AvailableRooms { get; set; }
        public decimal OccupancyPercentage { get; set; }
    }

    public class CustomerGrowthDto
    {
        public string Period { get; set; }
        public int NewCustomers { get; set; }
        public int TotalCustomers { get; set; }
    }

    public class PaymentMethodDto
    {
        public string Method { get; set; }
        public int Count { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal Percentage { get; set; }
    }

    public class ReviewsSummaryDto
    {
        public int TotalReviews { get; set; }
        public decimal AverageRating { get; set; }
        public decimal AverageCleanliness { get; set; }
        public decimal AverageLocation { get; set; }
        public decimal AverageService { get; set; }
        public decimal AverageValue { get; set; }
        public List<RatingDistributionDto> RatingDistribution { get; set; }
    }

    public class RatingDistributionDto
    {
        public byte Rating { get; set; }
        public int Count { get; set; }
    }
}