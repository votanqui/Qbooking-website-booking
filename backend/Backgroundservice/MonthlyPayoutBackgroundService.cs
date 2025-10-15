using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using QBooking.Data;
using QBooking.Models;

namespace QBooking.Services
{
    public class MonthlyPayoutBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MonthlyPayoutBackgroundService> _logger;

        public MonthlyPayoutBackgroundService(IServiceProvider serviceProvider, ILogger<MonthlyPayoutBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.Now;

                    // Chỉ chạy vào ngày 1 hàng tháng
                    if (now.Day == 14)
                    {
                        await ProcessMonthlyPayoutsAsync();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing monthly payouts");
                }

                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }

        private async Task ProcessMonthlyPayoutsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var lastMonth = DateTime.UtcNow.AddMonths(-1);
            var periodStart = new DateTime(lastMonth.Year, lastMonth.Month, 1);
            var periodEnd = periodStart.AddMonths(1).AddDays(-1);

            // Lấy earnings chưa thanh toán trong tháng trước
            var pendingEarnings = await context.HostEarnings
                .Where(e => e.Status == "approved"
                    && e.PayoutId == null
                    && e.EarnedDate >= periodStart
                    && e.EarnedDate <= periodEnd)
                .GroupBy(e => e.HostId)
                .ToListAsync();

            foreach (var group in pendingEarnings)
            {
                var hostId = group.Key;
                var earnings = group.ToList();

                // Lấy thông tin bank của host
                var host = await context.Users.FindAsync(hostId);
                if (host == null) continue;

                var payout = new HostPayout
                {
                    HostId = hostId,
                    PayoutPeriodStart = periodStart,
                    PayoutPeriodEnd = periodEnd,
                    TotalEarnings = earnings.Sum(e => e.EarningAmount),
                    TotalPlatformFee = earnings.Sum(e => e.PlatformFee),
                    TotalTax = earnings.Sum(e => e.TaxAmount),
                    NetPayoutAmount = earnings.Sum(e => e.NetAmount),
                    BookingCount = earnings.Count,
                    BankName = host.BankName, // Cần cập nhật từ profile host
                    BankAccountNumber = host.BankAccountNumber,
                    BankAccountName = host.BankAccountName,
                    PaymentMethod = "bank_transfer",
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                context.HostPayouts.Add(payout);
                await context.SaveChangesAsync();

                // Cập nhật PayoutId cho các earnings
                foreach (var earning in earnings)
                {
                    earning.PayoutId = payout.Id;
                    earning.UpdatedAt = DateTime.UtcNow;
                }

                await context.SaveChangesAsync();
                _logger.LogInformation($"Created payout {payout.Id} for host {hostId}");
            }
        }
    }
}

