
using Microsoft.EntityFrameworkCore;
using QBooking.Models;
using System.Data;

namespace QBooking.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {

        }

        public DbSet<Province> Provinces { get; set; }
        public DbSet<Commune> Communes { get; set; }
        public DbSet<User> Users { get; set; }

        public DbSet<UserToken> UserTokens { get; set; }

        public DbSet<Property> Properties { get; set; }
        public DbSet<ProductType> ProductTypes { get; set; }
        public DbSet<PropertyAmenity> PropertyAmenities { get; set; }
        public DbSet<PropertyImage> PropertyImages { get; set; }
        public DbSet<RoomAmenity> RoomAmenities { get; set; }

        public DbSet<RoomType> RoomTypes { get; set; }
        public DbSet<RoomImage> RoomImages { get; set; }

        public DbSet<Amenity> Amenities { get; set; }
        public DbSet<AmenityCategory> AmenityCategories { get; set; }

        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Payment> Payments { get; set; }

        public DbSet<Favorite> Favorites { get; set; }

        public DbSet<Notification> Notifications { get; set; }

        public DbSet<SearchHistory> SearchHistories { get; set; }

        public DbSet<AuditLog> AuditLogs { get; set; }
     

        public DbSet<Coupon> Coupons { get; set; }
        public DbSet<CouponApplication> CouponApplications { get; set; }
        public DbSet<CouponUsage> CouponUsages { get; set; }
        public DbSet<RefundTicket> RefundTickets { get; set; }
        public DbSet<Refund> Refunds { get; set; }

        public DbSet<Review> Reviews { get; set; }

        public DbSet<ReviewImage> ReviewImages { get; set; }
        public DbSet<HistoryLogin> HistoryLogins { get; set; }
        public DbSet<PropertyView> PropertyViews { get; set; }

        public DbSet<WebsiteSetting> WebsiteSettings { get; set; }
        public DbSet<HostEarning> HostEarnings { get; set; }
        public DbSet<HostPayout> HostPayouts { get; set; } 

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Cấu hình PropertyAmenity
            modelBuilder.Entity<PropertyAmenity>()
                .HasKey(pa => new { pa.PropertyId, pa.AmenityId });

            modelBuilder.Entity<PropertyAmenity>()
                .HasOne(pa => pa.Property)
                .WithMany(p => p.Amenities)
                .HasForeignKey(pa => pa.PropertyId)
                .OnDelete(DeleteBehavior.Cascade); // Thêm cascade delete

            modelBuilder.Entity<PropertyAmenity>()
                .HasOne(pa => pa.Amenity)
                .WithMany(a => a.PropertyAmenities)
                .HasForeignKey(pa => pa.AmenityId)
                .OnDelete(DeleteBehavior.Restrict); // Không xóa Amenity khi xóa PropertyAmenity

            // Cấu hình RoomAmenity
            modelBuilder.Entity<RoomAmenity>()
                .HasKey(ra => new { ra.RoomTypeId, ra.AmenityId });

            modelBuilder.Entity<RoomAmenity>()
                .HasOne(ra => ra.RoomType)
                .WithMany(rt => rt.RoomAmenities)
                .HasForeignKey(ra => ra.RoomTypeId)
                .OnDelete(DeleteBehavior.Cascade); // Thêm cascade delete

            modelBuilder.Entity<RoomAmenity>()
                .HasOne(ra => ra.Amenity)
                .WithMany(a => a.RoomAmenities)
                .HasForeignKey(ra => ra.AmenityId)
                .OnDelete(DeleteBehavior.Restrict); // Không xóa Amenity khi xóa RoomAmenity

            // Cấu hình quan hệ Property -> RoomType
            modelBuilder.Entity<RoomType>()
                .HasOne(rt => rt.Property)
                .WithMany(p => p.RoomTypes)
                .HasForeignKey(rt => rt.PropertyId)
                .OnDelete(DeleteBehavior.Cascade); // Cascade delete RoomType khi xóa Property

            // Cấu hình quan hệ RoomType -> Images (nếu có)
            modelBuilder.Entity<RoomImage>() // hoặc tên model tương ứng
                .HasOne(ri => ri.RoomType)
                .WithMany(rt => rt.Images)
                .HasForeignKey(ri => ri.RoomTypeId)
                .OnDelete(DeleteBehavior.Cascade);

            // Cấu hình quan hệ Property -> Images (nếu có)
            modelBuilder.Entity<PropertyImage>() // hoặc tên model tương ứng
                .HasOne(pi => pi.Property)
                .WithMany(p => p.Images)
                .HasForeignKey(pi => pi.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);
        }

    }
}