using QBooking.Backgroundservice;
using QBooking.BackgroundServices;
using QBooking.Services;
using QBooking.Services.BackgroundServices;
using QBooking.Services.Interfaces;

namespace QBooking.Extension
{
    public static class ServiceExtensions
    {
        public static IServiceCollection AddApplicationServices(
                                                                  this IServiceCollection services, IConfiguration configuration)
        {

            services.AddScoped<IEmailService, EmailService>();

            services.AddScoped<AuthService>();

            services.AddScoped<AuditLogService>();

            services.AddScoped<IBookingService, BookingService>();

            services.AddScoped<ICouponService, CouponService>();

            services.AddScoped<ISePayWebhookService, SePayWebhookService>();

            services.AddScoped<IPropertyService, PropertyService>();

            services.AddScoped<IRefundService, RefundService>();

            services.AddHostedService<ExpiredCouponCleanupService>();

            services.AddScoped<IReviewService, ReviewService>();

            services.AddHostedService<BookingAutoRejectService>();

            services.AddHostedService<PaymentReminderService>();

            services.AddScoped<IEmailQueueService, EmailQueueService>();

            services.AddHostedService<EmailProcessingBackgroundService>(); 

            services.AddHostedService<AuditLogCleanupService>();

            services.AddHostedService<ImageMetadataUpdateService>();

            services.AddScoped<HistoryLoginService>();

            services.AddHostedService<LoginHistoryCleanupService>();

            services.AddHostedService<FeaturedPropertyBackgroundService>();

            services.AddHostedService<NoShowCheckingBackgroundService>();

            services.AddScoped<INotificationService, NotificationService>();

            services.AddHttpClient();

            services.AddScoped<IHostEarningsService, HostEarningsService>();

            services.AddHostedService<MonthlyPayoutBackgroundService>();

            services.AddScoped<IHostPayoutService, HostPayoutService>();

            return services;
        }
    }
}
