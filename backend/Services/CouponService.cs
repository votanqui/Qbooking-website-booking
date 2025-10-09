using QBooking.Models;
using QBooking.Data;
using QBooking.Dtos.Response;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace QBooking.Services
{
    public interface ICouponService
    {
        Task<Coupon?> GetCouponByIdAsync(int id);
        Task<Coupon?> GetCouponByCodeAsync(string code);
        Task<Coupon> CreateCouponAsync(Coupon coupon, List<CouponApplication>? applications = null);
        Task<Coupon?> UpdateCouponAsync(int id, Coupon coupon, List<CouponApplication>? applications = null);
        Task<bool> DeleteCouponAsync(int id);
        Task<bool> ToggleCouponStatusAsync(int id);
        Task<CouponValidationResult> ValidateCouponAsync(string code, int customerId, int bookingId);
        Task<decimal> CalculateDiscountAsync(Coupon coupon, decimal orderAmount, decimal roomPrice, int nights);
        Task<CouponUsage> ApplyCouponAsync(string code, int customerId, int bookingId);
        Task<CouponUsage> ApplyCouponByCodeAsync(string couponCode, int customerId, string bookingCode);
        Task CancelCouponByCodeAsync(string bookingCode, int customerId);
        Task CancelCouponAsync(int bookingId, int customerId);
        Task<PagedResult<AdminCouponResponse>> GetAllCouponsAsync(
        string? keyword = null,
        bool? isFeatured = null,
        bool? isPublic = null,
        bool? isActive = null,
        string? discountType = null,
        string? applicableTo = null,
        int page = 1,
        int pageSize = 10);

        Task<IEnumerable<PublicCouponResponse>> GetPublicCouponsAsync(string? keyword = null, int limit = 20);
        Task<IEnumerable<PublicCouponResponse>> GetFeaturedCouponsAsync(int limit = 10);



        Task<CouponOverviewStatisticsResponse> GetCouponOverviewStatisticsAsync();
        Task<CouponDetailStatisticsResponse?> GetCouponDetailStatisticsAsync(int couponId);
        Task<IEnumerable<TopUsedCouponResponse>> GetTopUsedCouponsAsync(int limit, DateTime? startDate, DateTime? endDate);
        Task<PagedResult<AdminCouponUsageHistoryResponse>> GetAllCouponUsageHistoryAsync(
            int? couponId, int? customerId, string? customerEmail,
            DateTime? startDate, DateTime? endDate, int page, int pageSize);
        Task<CouponPerformanceReportResponse> GetCouponPerformanceReportAsync(
            DateTime? startDate, DateTime? endDate, string? groupBy);
        Task<IEnumerable<ExpiringSoonCouponResponse>> GetExpiringSoonCouponsAsync(int days);
        Task<IEnumerable<TopCouponCustomerResponse>> GetTopCouponCustomersAsync(
            int limit, DateTime? startDate, DateTime? endDate);
        Task<string> ExportCouponsToCSVAsync(DateTime? startDate, DateTime? endDate);
        Task<Coupon?> DuplicateCouponAsync(int couponId, string newCode);

    }

    public class CouponService : ICouponService
    {
        private readonly ApplicationDbContext _context;
        private readonly AuditLogService _auditLogService;

        // Valid discount types
        private readonly string[] ValidDiscountTypes = { "percentage", "fixedAmount", "freeNight" };

        // Valid applicable to types
        private readonly string[] ValidApplicableToTypes = { "all", "property", "propertyType", "location" };

        public CouponService(ApplicationDbContext context, AuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        public async Task<Coupon?> GetCouponByIdAsync(int id)
        {
            return await _context.Coupons
                .Include(c => c.CouponApplications)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Coupon?> GetCouponByCodeAsync(string code)
        {
            return await _context.Coupons
                .Include(c => c.CouponApplications)
                .FirstOrDefaultAsync(c => c.Code == code);
        }
        public async Task<PagedResult<AdminCouponResponse>> GetAllCouponsAsync(
     string? keyword = null,
     bool? isFeatured = null,
     bool? isPublic = null,
     bool? isActive = null,
     string? discountType = null,
     string? applicableTo = null,
     int page = 1,
     int pageSize = 10)
        {
            // Validate parameters
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 10;

            var query = _context.Coupons
                .Include(c => c.CouponApplications)
                .AsQueryable();

            // Apply filters
            query = ApplyCouponFilters(query, keyword, isFeatured, isPublic, isActive, discountType, applicableTo);

            // Get total count
            var totalCount = await query.CountAsync();

            // Get paged data
            var coupons = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Map to response DTOs with detailed application info
            var couponResponses = new List<AdminCouponResponse>();
            foreach (var coupon in coupons)
            {
                var response = await MapToAdminCouponResponseAsync(coupon);
                couponResponses.Add(response);
            }

            return new PagedResult<AdminCouponResponse>
            {
                Items = couponResponses,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };
        }

        // 3. Cập nhật phương thức GetPublicCouponsAsync
        public async Task<IEnumerable<PublicCouponResponse>> GetPublicCouponsAsync(string? keyword = null, int limit = 20)
        {
            // Validate parameters
            if (limit < 1 || limit > 50) limit = 20;

            var query = _context.Coupons
                .Include(c => c.CouponApplications)
                .Where(c => c.IsPublic && c.IsActive)
                .Where(c => DateTime.UtcNow >= c.StartDate && DateTime.UtcNow <= c.EndDate)
                .AsQueryable();

            // Apply keyword filter
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(c => c.Code.Contains(keyword) ||
                                       c.Name.Contains(keyword) ||
                                       c.Description.Contains(keyword));
            }

            var coupons = await query
                .OrderByDescending(c => c.IsFeatured)
                .ThenByDescending(c => c.CreatedAt)
                .Take(limit)
                .ToListAsync();

            var results = new List<PublicCouponResponse>();
            foreach (var coupon in coupons)
            {
                var response = await MapToPublicCouponResponseAsync(coupon);
                results.Add(response);
            }

            return results;
        }

        // 4. Cập nhật phương thức GetFeaturedCouponsAsync
        public async Task<IEnumerable<PublicCouponResponse>> GetFeaturedCouponsAsync(int limit = 10)
        {
            // Validate parameters
            if (limit < 1 || limit > 20) limit = 10;

            var coupons = await _context.Coupons
                .Include(c => c.CouponApplications)
                .Where(c => c.IsFeatured && c.IsActive && c.IsPublic)
                .Where(c => DateTime.UtcNow >= c.StartDate && DateTime.UtcNow <= c.EndDate)
                .OrderByDescending(c => c.CreatedAt)
                .Take(limit)
                .ToListAsync();

            var results = new List<PublicCouponResponse>();
            foreach (var coupon in coupons)
            {
                var response = await MapToPublicCouponResponseAsync(coupon);
                results.Add(response);
            }

            return results;
        }
        // ====== PRIVATE HELPER METHODS ======

        private IQueryable<Coupon> ApplyCouponFilters(
            IQueryable<Coupon> query,
            string? keyword = null,
            bool? isFeatured = null,
            bool? isPublic = null,
            bool? isActive = null,
            string? discountType = null,
            string? applicableTo = null)
        {
            // Keyword filter
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(c => c.Code.Contains(keyword) ||
                                       c.Name.Contains(keyword) ||
                                       c.Description.Contains(keyword));
            }

            // Boolean filters
            if (isFeatured.HasValue)
                query = query.Where(c => c.IsFeatured == isFeatured.Value);

            if (isPublic.HasValue)
                query = query.Where(c => c.IsPublic == isPublic.Value);

            if (isActive.HasValue)
                query = query.Where(c => c.IsActive == isActive.Value);

            // String filters
            if (!string.IsNullOrWhiteSpace(discountType))
                query = query.Where(c => c.DiscountType.ToLower() == discountType.ToLower());

            if (!string.IsNullOrWhiteSpace(applicableTo))
                query = query.Where(c => c.ApplicableTo.ToLower() == applicableTo.ToLower());

            return query;
        }

        private async Task<AdminCouponResponse> MapToAdminCouponResponseAsync(Coupon coupon)
        {
            var applications = new List<CouponApplicationResponse>();

            if (coupon.CouponApplications?.Any() == true)
            {
                foreach (var app in coupon.CouponApplications)
                {
                    var applicationResponse = new CouponApplicationResponse
                    {
                        Id = app.Id,
                        ApplicableType = app.ApplicableType,
                        ApplicableId = app.ApplicableId
                    };

                    // Lấy tên tương ứng dựa vào ApplicableType
                    switch (app.ApplicableType.ToLower())
                    {
                        case "property":
                            var property = await _context.Properties
                                .FirstOrDefaultAsync(p => p.Id == app.ApplicableId);
                            applicationResponse.ApplicableName = property?.Name;
                            break;

                        case "propertytype":
                            var propertyType = await _context.ProductTypes
                                .FirstOrDefaultAsync(pt => pt.Id == app.ApplicableId);
                            applicationResponse.ApplicableName = propertyType?.Name;
                            break;

                        case "location":
                            var location = await _context.Provinces
                                .FirstOrDefaultAsync(p => p.Id == app.ApplicableId);
                            applicationResponse.ApplicableName = location?.Name;
                            break;
                    }

                    applications.Add(applicationResponse);
                }
            }

            return new AdminCouponResponse
            {
                Id = coupon.Id,
                Code = coupon.Code,
                Name = coupon.Name,
                Description = coupon.Description,
                DiscountType = coupon.DiscountType,
                DiscountValue = coupon.DiscountValue,
                MaxDiscountAmount = coupon.MaxDiscountAmount,
                MinOrderAmount = coupon.MinOrderAmount,
                MinNights = coupon.MinNights,
                ApplicableDays = coupon.ApplicableDays,
                ApplicableTo = coupon.ApplicableTo,
                StartDate = coupon.StartDate,
                EndDate = coupon.EndDate,
                MaxTotalUses = coupon.MaxTotalUses,
                MaxUsesPerCustomer = coupon.MaxUsesPerCustomer,
                UsedCount = coupon.UsedCount,
                IsPublic = coupon.IsPublic,
                IsFeatured = coupon.IsFeatured,
                IsActive = coupon.IsActive,
                CreatedAt = coupon.CreatedAt,
                UpdatedAt = coupon.UpdatedAt,
                Applications = applications
            };
        }

        private async Task<PublicCouponResponse> MapToPublicCouponResponseAsync(Coupon coupon)
        {
            var applications = new List<CouponApplicationResponse>();

            if (coupon.CouponApplications?.Any() == true)
            {
                foreach (var app in coupon.CouponApplications)
                {
                    var applicationResponse = new CouponApplicationResponse
                    {
                        Id = app.Id,
                        ApplicableType = app.ApplicableType,
                        ApplicableId = app.ApplicableId
                    };

                    // Lấy tên tương ứng dựa vào ApplicableType
                    switch (app.ApplicableType.ToLower())
                    {
                        case "property":
                            var property = await _context.Properties
                                .FirstOrDefaultAsync(p => p.Id == app.ApplicableId);
                            applicationResponse.ApplicableName = property?.Name;
                            break;

                        case "propertytype":
                            var propertyType = await _context.ProductTypes
                                .FirstOrDefaultAsync(pt => pt.Id == app.ApplicableId);
                            applicationResponse.ApplicableName = propertyType?.Name;
                            break;

                        case "location":
                            var location = await _context.Provinces
                                .FirstOrDefaultAsync(p => p.Id == app.ApplicableId);
                            applicationResponse.ApplicableName = location?.Name;
                            break;
                    }

                    applications.Add(applicationResponse);
                }
            }

            return new PublicCouponResponse
            {
                Id = coupon.Id,
                Code = coupon.Code,
                Name = coupon.Name,
                Description = coupon.Description,
                DiscountType = coupon.DiscountType,
                DiscountValue = coupon.DiscountValue,
                MaxDiscountAmount = coupon.MaxDiscountAmount,
                MinOrderAmount = coupon.MinOrderAmount,
                MinNights = coupon.MinNights,
                EndDate = coupon.EndDate,
                IsFeatured = coupon.IsFeatured,
                ApplicableTo = coupon.ApplicableTo,
                Applications = applications
            };
        }
        public async Task<Coupon> CreateCouponAsync(Coupon coupon, List<CouponApplication>? applications = null)
        {
            // Validate constraints
            ValidateCouponConstraints(coupon);

            // Validate applications if provided
            if (applications != null && applications.Any())
            {
                await ValidateCouponApplicationsAsync(applications);
            }

            coupon.CreatedAt = DateTime.UtcNow;
            coupon.UpdatedAt = DateTime.UtcNow;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Coupons.Add(coupon);
                await _context.SaveChangesAsync();

                // Add applications if provided and ApplicableTo is not "all"
                if (applications != null && applications.Any() && !coupon.ApplicableTo.Equals("all", StringComparison.OrdinalIgnoreCase))
                {
                    foreach (var app in applications)
                    {
                        app.CouponId = coupon.Id;
                        _context.CouponApplications.Add(app);
                    }
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                // Log audit
                var newValues = JsonSerializer.Serialize(new
                {
                    coupon.Id,
                    coupon.Code,
                    coupon.Name,
                    coupon.DiscountType,
                    coupon.DiscountValue,
                    coupon.ApplicableTo,
                    coupon.IsActive,
                    coupon.CreatedAt,
                    Applications = applications?.Select(a => new { a.ApplicableType, a.ApplicableId })
                });
                await _auditLogService.LogInsertAsync("Coupon", coupon.Id, newValues);

                return coupon;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<Coupon?> UpdateCouponAsync(int id, Coupon coupon, List<CouponApplication>? applications = null)
        {
            var existingCoupon = await _context.Coupons
                .Include(c => c.CouponApplications)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (existingCoupon == null) return null;

            // Store old values for audit
            var oldValues = JsonSerializer.Serialize(new
            {
                existingCoupon.Id,
                existingCoupon.Code,
                existingCoupon.Name,
                existingCoupon.DiscountType,
                existingCoupon.DiscountValue,
                existingCoupon.ApplicableTo,
                existingCoupon.IsActive,
                existingCoupon.UpdatedAt,
                Applications = existingCoupon.CouponApplications.Select(a => new { a.ApplicableType, a.ApplicableId })
            });

            // Validate constraints
            ValidateCouponConstraints(coupon);

            // Validate applications if provided
            if (applications != null && applications.Any())
            {
                await ValidateCouponApplicationsAsync(applications);
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Update coupon properties
                existingCoupon.Code = coupon.Code;
                existingCoupon.Name = coupon.Name;
                existingCoupon.Description = coupon.Description;
                existingCoupon.DiscountType = coupon.DiscountType;
                existingCoupon.DiscountValue = coupon.DiscountValue;
                existingCoupon.MaxDiscountAmount = coupon.MaxDiscountAmount;
                existingCoupon.MinOrderAmount = coupon.MinOrderAmount;
                existingCoupon.MinNights = coupon.MinNights;
                existingCoupon.ApplicableDays = coupon.ApplicableDays;
                existingCoupon.ApplicableTo = coupon.ApplicableTo;
                existingCoupon.StartDate = coupon.StartDate;
                existingCoupon.EndDate = coupon.EndDate;
                existingCoupon.MaxTotalUses = coupon.MaxTotalUses;
                existingCoupon.MaxUsesPerCustomer = coupon.MaxUsesPerCustomer;
                existingCoupon.IsPublic = coupon.IsPublic;
                existingCoupon.IsFeatured = coupon.IsFeatured;
                existingCoupon.IsActive = coupon.IsActive;
                existingCoupon.UpdatedAt = DateTime.UtcNow;

                // Remove existing applications
                _context.CouponApplications.RemoveRange(existingCoupon.CouponApplications);

                // Add new applications if provided and ApplicableTo is not "all"
                if (applications != null && applications.Any() && !coupon.ApplicableTo.Equals("all", StringComparison.OrdinalIgnoreCase))
                {
                    foreach (var app in applications)
                    {
                        app.CouponId = existingCoupon.Id;
                        _context.CouponApplications.Add(app);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Log audit
                var newValues = JsonSerializer.Serialize(new
                {
                    existingCoupon.Id,
                    existingCoupon.Code,
                    existingCoupon.Name,
                    existingCoupon.DiscountType,
                    existingCoupon.DiscountValue,
                    existingCoupon.ApplicableTo,
                    existingCoupon.IsActive,
                    existingCoupon.UpdatedAt,
                    Applications = applications?.Select(a => new { a.ApplicableType, a.ApplicableId })
                });
                await _auditLogService.LogUpdateAsync("Coupon", id, oldValues, newValues);

                return existingCoupon;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> DeleteCouponAsync(int id)
        {
            var coupon = await _context.Coupons
                .Include(c => c.CouponApplications)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (coupon == null) return false;

            // Store old values for audit
            var oldValues = JsonSerializer.Serialize(new
            {
                coupon.Id,
                coupon.Code,
                coupon.Name,
                coupon.DiscountType,
                coupon.DiscountValue,
                coupon.ApplicableTo,
                coupon.IsActive,
                Applications = coupon.CouponApplications.Select(a => new { a.ApplicableType, a.ApplicableId })
            });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // First delete all related CouponUsages
                var usages = await _context.CouponUsages.Where(u => u.CouponId == id).ToListAsync();
                if (usages.Any())
                {
                    _context.CouponUsages.RemoveRange(usages);

                    // Log deletion of usage records
                    foreach (var usage in usages)
                    {
                        var usageOldValues = JsonSerializer.Serialize(new
                        {
                            usage.Id,
                            usage.CouponId,
                            usage.CustomerId,
                            usage.BookingId,
                            usage.DiscountAmount,
                            usage.UsedAt
                        });
                        await _auditLogService.LogDeleteAsync("CouponUsage", usage.Id, usageOldValues);
                    }
                }

                // Delete applications
                if (coupon.CouponApplications.Any())
                {
                    _context.CouponApplications.RemoveRange(coupon.CouponApplications);
                }

                // Then delete the coupon
                _context.Coupons.Remove(coupon);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                // Log audit for coupon deletion
                await _auditLogService.LogDeleteAsync("Coupon", id, oldValues);

                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> ToggleCouponStatusAsync(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null) return false;

            var oldValue = coupon.IsActive;
            coupon.IsActive = !coupon.IsActive;
            coupon.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log audit
            var oldValues = JsonSerializer.Serialize(new { IsActive = oldValue });
            var newValues = JsonSerializer.Serialize(new { IsActive = coupon.IsActive });
            await _auditLogService.LogUpdateAsync("Coupon", id, oldValues, newValues);

            return true;
        }

        public async Task<CouponValidationResult> ValidateCouponAsync(string code, int customerId, int bookingId)
        {
            // Get booking information with property details
            var booking = await _context.Bookings
                .Include(b => b.Property)
                    .ThenInclude(p => p.ProductType)
                .Include(b => b.Property)
                    .ThenInclude(p => p.Province)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
            {
                return new CouponValidationResult { IsValid = false, ErrorMessage = "Không tìm thấy thông tin đặt phòng" };
            }

            var coupon = await _context.Coupons
                .Include(c => c.CouponApplications)
                .FirstOrDefaultAsync(c => c.Code == code);

            if (coupon == null)
            {
                return new CouponValidationResult { IsValid = false, ErrorMessage = "Mã giảm giá không tồn tại" };
            }

            // Kiểm tra trạng thái active
            if (!coupon.IsActive)
            {
                return new CouponValidationResult { IsValid = false, ErrorMessage = "Mã giảm giá đã bị vô hiệu hóa" };
            }

            // Kiểm tra thời gian hiệu lực
            var now = DateTime.UtcNow;
            if (now < coupon.StartDate || now > coupon.EndDate)
            {
                return new CouponValidationResult { IsValid = false, ErrorMessage = "Mã giảm giá đã hết hạn hoặc chưa có hiệu lực" };
            }

            // Kiểm tra áp dụng cho property/propertyType/location
            if (!await IsApplicableToBookingAsync(coupon, booking))
            {
                return new CouponValidationResult { IsValid = false, ErrorMessage = "Mã giảm giá không áp dụng cho property/location này" };
            }

            // Kiểm tra số đêm tối thiểu
            if (booking.Nights < coupon.MinNights)
            {
                return new CouponValidationResult { IsValid = false, ErrorMessage = $"Đặt phòng phải tối thiểu {coupon.MinNights} đêm" };
            }

            // Kiểm tra giá trị đơn hàng tối thiểu
            if (booking.TotalAmount < coupon.MinOrderAmount)
            {
                return new CouponValidationResult { IsValid = false, ErrorMessage = $"Giá trị đơn hàng phải tối thiểu {coupon.MinOrderAmount:C}" };
            }

            // Kiểm tra ngày áp dụng
            if (!string.IsNullOrEmpty(coupon.ApplicableDays) && !coupon.ApplicableDays.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                var applicableDays = coupon.ApplicableDays.Split(',').Select(d => d.Trim()).ToArray();
                var checkInDay = booking.CheckIn.ToString("ddd");
                if (!applicableDays.Contains(checkInDay, StringComparer.OrdinalIgnoreCase))
                {
                    return new CouponValidationResult { IsValid = false, ErrorMessage = "Mã giảm giá không áp dụng cho ngày check-in này" };
                }
            }

            // Kiểm tra tổng số lần sử dụng
            if (coupon.MaxTotalUses.HasValue && coupon.UsedCount >= coupon.MaxTotalUses.Value)
            {
                return new CouponValidationResult { IsValid = false, ErrorMessage = "Mã giảm giá đã hết lượt sử dụng" };
            }

            // Kiểm tra số lần sử dụng của khách hàng
            var customerUsageCount = await _context.CouponUsages
                .CountAsync(u => u.CouponId == coupon.Id && u.CustomerId == customerId);

            if (customerUsageCount >= coupon.MaxUsesPerCustomer)
            {
                return new CouponValidationResult { IsValid = false, ErrorMessage = "Bạn đã sử dụng hết lượt cho mã giảm giá này" };
            }

            return new CouponValidationResult { IsValid = true, Coupon = coupon, Booking = booking };
        }

        public async Task<decimal> CalculateDiscountAsync(Coupon coupon, decimal orderAmount, decimal roomPrice, int nights)
        {
            decimal discount = 0;

            switch (coupon.DiscountType.ToLower())
            {
                case "percentage":
                    discount = orderAmount * (coupon.DiscountValue / 100);
                    if (coupon.MaxDiscountAmount.HasValue && discount > coupon.MaxDiscountAmount.Value)
                    {
                        discount = coupon.MaxDiscountAmount.Value;
                    }
                    break;

                case "fixedamount":
                    discount = coupon.DiscountValue;
                    break;

                case "freenight":
                    // Tính giảm giá theo số đêm miễn phí
                    var pricePerNight = roomPrice / nights;
                    var freeNights = Math.Min((int)coupon.DiscountValue, nights);

                    // Không được giảm hết số đêm (phải có ít nhất 1 đêm phải trả)
                    if (freeNights >= nights)
                    {
                        freeNights = nights - 1;
                    }

                    discount = pricePerNight * freeNights;
                    break;
            }

            return Math.Min(discount, orderAmount); // Không được vượt quá tổng tiền đơn hàng
        }

        public async Task<CouponUsage> ApplyCouponAsync(string code, int customerId, int bookingId)
        {
            // Get booking information
            var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId);
            if (booking == null)
                throw new ArgumentException("Không tìm thấy thông tin đặt phòng");

            // Check if coupon is already applied to this booking
            var existingUsage = await _context.CouponUsages
                .FirstOrDefaultAsync(cu => cu.BookingId == bookingId);
            if (existingUsage != null)
                throw new ArgumentException("Booking này đã có mã giảm giá được áp dụng");

            var coupon = await GetCouponByCodeAsync(code);
            if (coupon == null)
                throw new ArgumentException("Mã giảm giá không tồn tại");

            // Validate coupon first
            var validationResult = await ValidateCouponAsync(code, customerId, bookingId);
            if (!validationResult.IsValid)
                throw new ArgumentException(validationResult.ErrorMessage);

            // Store old values for audit log
            var oldTotalAmount = booking.TotalAmount;

            // Calculate coupon discount using current total amount (after time-based discount)
            var couponDiscountAmount = await CalculateDiscountAsync(coupon, booking.TotalAmount, booking.RoomPrice, booking.Nights);

            // Calculate coupon discount percent (for tracking purposes)
            var couponDiscountPercent = booking.RoomPrice > 0
                ? (couponDiscountAmount / booking.RoomPrice) * 100
                : 0;

            var usage = new CouponUsage
            {
                CouponId = coupon.Id,
                CustomerId = customerId,
                BookingId = bookingId,
                DiscountAmount = couponDiscountAmount,
                UsedAt = DateTime.UtcNow
            };

            _context.CouponUsages.Add(usage);

            // Update booking with coupon discount
            booking.CouponDiscountPercent = couponDiscountPercent;
            booking.CouponDiscountAmount = couponDiscountAmount;

            // Recalculate total: RoomPrice - TimeDiscount + Tax + ServiceFee - CouponDiscount
            // = (RoomPrice - DiscountAmount) + TaxAmount + ServiceFee - CouponDiscountAmount
            booking.TotalAmount = booking.RoomPrice - booking.DiscountAmount + booking.TaxAmount + booking.ServiceFee - couponDiscountAmount;
            booking.UpdatedAt = DateTime.UtcNow;

            // Update coupon usage count
            coupon.UsedCount++;
            coupon.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log audit for coupon usage
            var usageValues = JsonSerializer.Serialize(new
            {
                usage.CouponId,
                usage.CustomerId,
                usage.BookingId,
                CouponCode = code,
                CouponDiscountPercent = couponDiscountPercent,
                CouponDiscountAmount = couponDiscountAmount,
                OldTotalAmount = oldTotalAmount,
                NewTotalAmount = booking.TotalAmount
            });
            await _auditLogService.LogInsertAsync("CouponUsage", usage.Id, usageValues);

            return usage;
        }

        // ==================== CouponService - CancelCouponAsync ====================
        public async Task CancelCouponAsync(int bookingId, int customerId)
        {
            // Get booking information
            var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId);
            if (booking == null)
                throw new ArgumentException("Không tìm thấy thông tin đặt phòng");

            // Verify booking belongs to customer
            if (booking.CustomerId != customerId)
                throw new ArgumentException("Không có quyền thực hiện thao tác này");

            // Find coupon usage for this booking
            var usage = await _context.CouponUsages
                .Include(cu => cu.Coupon)
                .FirstOrDefaultAsync(cu => cu.BookingId == bookingId);

            if (usage == null)
                throw new ArgumentException("Không tìm thấy mã giảm giá nào được áp dụng cho booking này");

            // Store original values for audit log
            var originalCouponDiscountPercent = booking.CouponDiscountPercent;
            var originalCouponDiscountAmount = booking.CouponDiscountAmount;
            var originalTotalAmount = booking.TotalAmount;

            // Reset coupon discount values
            booking.CouponDiscountPercent = 0;
            booking.CouponDiscountAmount = 0;

            // Recalculate total without coupon discount
            // Keep time-based discount intact
            booking.TotalAmount = booking.RoomPrice - booking.DiscountAmount + booking.TaxAmount + booking.ServiceFee;
            booking.UpdatedAt = DateTime.UtcNow;

            // Decrease coupon usage count
            if (usage.Coupon != null)
            {
                usage.Coupon.UsedCount = Math.Max(0, usage.Coupon.UsedCount - 1);
                usage.Coupon.UpdatedAt = DateTime.UtcNow;
            }

            // Remove coupon usage record
            _context.CouponUsages.Remove(usage);

            await _context.SaveChangesAsync();

            // Log audit for coupon cancellation
            var cancelValues = JsonSerializer.Serialize(new
            {
                BookingId = bookingId,
                CouponId = usage.CouponId,
                CouponCode = usage.Coupon?.Code,
                CancelledCouponDiscountPercent = originalCouponDiscountPercent,
                CancelledCouponDiscountAmount = originalCouponDiscountAmount,
                OldTotalAmount = originalTotalAmount,
                NewTotalAmount = booking.TotalAmount,
                CancelledAt = DateTime.UtcNow
            });
            await _auditLogService.LogDeleteAsync("CouponUsage", usage.Id, cancelValues);
        }
        public async Task<CouponUsage> ApplyCouponByCodeAsync(string couponCode, int customerId, string bookingCode)
        {
            // Get booking information by booking code
            var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.BookingCode == bookingCode);
            if (booking == null)
                throw new ArgumentException("Không tìm thấy thông tin đặt phòng");

            // Verify booking belongs to customer
            if (booking.CustomerId != customerId)
                throw new ArgumentException("Không có quyền thực hiện thao tác này");

            // Check if coupon is already applied to this booking
            var existingUsage = await _context.CouponUsages
                .FirstOrDefaultAsync(cu => cu.BookingId == booking.Id);
            if (existingUsage != null)
                throw new ArgumentException("Booking này đã có mã giảm giá được áp dụng");

            var coupon = await GetCouponByCodeAsync(couponCode);
            if (coupon == null)
                throw new ArgumentException("Mã giảm giá không tồn tại");

            // Validate coupon first
            var validationResult = await ValidateCouponAsync(couponCode, customerId, booking.Id);
            if (!validationResult.IsValid)
                throw new ArgumentException(validationResult.ErrorMessage);

            // Store old values for audit log
            var oldTotalAmount = booking.TotalAmount;

            // Calculate coupon discount using current total amount (after time-based discount)
            var couponDiscountAmount = await CalculateDiscountAsync(coupon, booking.TotalAmount, booking.RoomPrice, booking.Nights);

            // Calculate coupon discount percent (for tracking purposes)
            var couponDiscountPercent = booking.RoomPrice > 0
                ? (couponDiscountAmount / booking.RoomPrice) * 100
                : 0;

            var usage = new CouponUsage
            {
                CouponId = coupon.Id,
                CustomerId = customerId,
                BookingId = booking.Id,
                DiscountAmount = couponDiscountAmount,
                UsedAt = DateTime.UtcNow
            };

            _context.CouponUsages.Add(usage);

            // Update booking with coupon discount
            booking.CouponDiscountPercent = couponDiscountPercent;
            booking.CouponDiscountAmount = couponDiscountAmount;

            // Recalculate total: RoomPrice - TimeDiscount + Tax + ServiceFee - CouponDiscount
            booking.TotalAmount = booking.RoomPrice - booking.DiscountAmount + booking.TaxAmount + booking.ServiceFee - couponDiscountAmount;
            booking.UpdatedAt = DateTime.UtcNow;

            // Update coupon usage count
            coupon.UsedCount++;
            coupon.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log audit for coupon usage
            var usageValues = JsonSerializer.Serialize(new
            {
                usage.CouponId,
                usage.CustomerId,
                usage.BookingId,
                BookingCode = bookingCode,
                CouponCode = couponCode,
                CouponDiscountPercent = couponDiscountPercent,
                CouponDiscountAmount = couponDiscountAmount,
                OldTotalAmount = oldTotalAmount,
                NewTotalAmount = booking.TotalAmount
            });
            await _auditLogService.LogInsertAsync("CouponUsage", usage.Id, usageValues);

            return usage;
        }

        // ==================== CouponService - CancelCouponByCodeAsync ====================
        public async Task CancelCouponByCodeAsync(string bookingCode, int customerId)
        {
            // Get booking information by booking code
            var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.BookingCode == bookingCode);
            if (booking == null)
                throw new ArgumentException("Không tìm thấy thông tin đặt phòng");

            // Verify booking belongs to customer
            if (booking.CustomerId != customerId)
                throw new ArgumentException("Không có quyền thực hiện thao tác này");

            // Find coupon usage for this booking
            var usage = await _context.CouponUsages
                .Include(cu => cu.Coupon)
                .FirstOrDefaultAsync(cu => cu.BookingId == booking.Id);

            if (usage == null)
                throw new ArgumentException("Không tìm thấy mã giảm giá nào được áp dụng cho booking này");

            // Store original values for audit log
            var originalCouponDiscountPercent = booking.CouponDiscountPercent;
            var originalCouponDiscountAmount = booking.CouponDiscountAmount;
            var originalTotalAmount = booking.TotalAmount;

            // Reset coupon discount values
            booking.CouponDiscountPercent = 0;
            booking.CouponDiscountAmount = 0;

            // Recalculate total without coupon discount
            booking.TotalAmount = booking.RoomPrice - booking.DiscountAmount + booking.TaxAmount + booking.ServiceFee;
            booking.UpdatedAt = DateTime.UtcNow;

            // Decrease coupon usage count
            if (usage.Coupon != null)
            {
                usage.Coupon.UsedCount = Math.Max(0, usage.Coupon.UsedCount - 1);
                usage.Coupon.UpdatedAt = DateTime.UtcNow;
            }

            // Remove coupon usage record
            _context.CouponUsages.Remove(usage);

            await _context.SaveChangesAsync();

            // Log audit for coupon cancellation
            var cancelValues = JsonSerializer.Serialize(new
            {
                BookingId = booking.Id,
                BookingCode = bookingCode,
                CouponId = usage.CouponId,
                CouponCode = usage.Coupon?.Code,
                CancelledCouponDiscountPercent = originalCouponDiscountPercent,
                CancelledCouponDiscountAmount = originalCouponDiscountAmount,
                OldTotalAmount = originalTotalAmount,
                NewTotalAmount = booking.TotalAmount,
                CancelledAt = DateTime.UtcNow
            });
            await _auditLogService.LogDeleteAsync("CouponUsage", usage.Id, cancelValues);
        }
        private async Task<bool> IsApplicableToBookingAsync(Coupon coupon, Booking booking)
        {
            // If ApplicableTo is "all", it applies to all bookings
            if (coupon.ApplicableTo.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            // If no applications defined but ApplicableTo is not "all", consider as not applicable
            if (!coupon.CouponApplications.Any())
            {
                return false;
            }

            foreach (var application in coupon.CouponApplications)
            {
                switch (application.ApplicableType.ToLower())
                {
                    case "property":
                        if (booking.PropertyId == application.ApplicableId)
                            return true;
                        break;

                    case "propertytype":
                        if (booking.Property?.ProductTypeId == application.ApplicableId)
                            return true;
                        break;

                    case "location":
                        if (booking.Property?.ProvinceId == application.ApplicableId)
                            return true;
                        break;
                }
            }

            return false;
        }

        private async Task ValidateCouponApplicationsAsync(List<CouponApplication> applications)
        {
            var errors = new List<string>();

            foreach (var app in applications)
            {
                switch (app.ApplicableType.ToLower())
                {
                    case "property":
                        var property = await _context.Properties.FindAsync(app.ApplicableId);
                        if (property == null)
                            errors.Add($"Property với ID {app.ApplicableId} không tồn tại");
                        break;

                    case "propertytype":
                        var productType = await _context.ProductTypes.FindAsync(app.ApplicableId);
                        if (productType == null)
                            errors.Add($"ProductType với ID {app.ApplicableId} không tồn tại");
                        break;

                    case "location":
                        var province = await _context.Provinces.FindAsync(app.ApplicableId);
                        if (province == null)
                            errors.Add($"Province với ID {app.ApplicableId} không tồn tại");
                        break;

                    default:
                        errors.Add($"ApplicableType '{app.ApplicableType}' không hợp lệ. Chỉ hỗ trợ: property, propertyType, location");
                        break;
                }
            }

            if (errors.Any())
            {
                throw new ArgumentException($"Lỗi validation applications: {string.Join("; ", errors)}");
            }
        }
        public async Task<CouponOverviewStatisticsResponse> GetCouponOverviewStatisticsAsync()
        {
            var totalCoupons = await _context.Coupons.CountAsync();
            var activeCoupons = await _context.Coupons.CountAsync(c => c.IsActive);
            var expiredCoupons = await _context.Coupons.CountAsync(c => DateTime.UtcNow > c.EndDate);

            var totalUsages = await _context.CouponUsages.CountAsync();
            var totalDiscountAmount = await _context.CouponUsages.SumAsync(u => (decimal?)u.DiscountAmount) ?? 0;

            var uniqueCustomers = await _context.CouponUsages
                .Select(u => u.CustomerId)
                .Distinct()
                .CountAsync();

            var thisMonthUsages = await _context.CouponUsages
                .CountAsync(u => u.UsedAt.Month == DateTime.UtcNow.Month &&
                                u.UsedAt.Year == DateTime.UtcNow.Year);

            var thisMonthDiscount = await _context.CouponUsages
                .Where(u => u.UsedAt.Month == DateTime.UtcNow.Month &&
                           u.UsedAt.Year == DateTime.UtcNow.Year)
                .SumAsync(u => (decimal?)u.DiscountAmount) ?? 0;

            return new CouponOverviewStatisticsResponse
            {
                TotalCoupons = totalCoupons,
                ActiveCoupons = activeCoupons,
                InactiveCoupons = totalCoupons - activeCoupons,
                ExpiredCoupons = expiredCoupons,
                TotalUsages = totalUsages,
                TotalDiscountAmount = totalDiscountAmount,
                UniqueCustomers = uniqueCustomers,
                AverageDiscountPerUsage = totalUsages > 0 ? totalDiscountAmount / totalUsages : 0,
                ThisMonthUsages = thisMonthUsages,
                ThisMonthDiscountAmount = thisMonthDiscount
            };
        }

        public async Task<CouponDetailStatisticsResponse?> GetCouponDetailStatisticsAsync(int couponId)
        {
            var coupon = await _context.Coupons
                .Include(c => c.CouponApplications)
                .FirstOrDefaultAsync(c => c.Id == couponId);

            if (coupon == null) return null;

            var usages = await _context.CouponUsages
                .Where(u => u.CouponId == couponId)
                .ToListAsync();

            var totalUsages = usages.Count;
            var totalDiscountAmount = usages.Sum(u => u.DiscountAmount);
            var uniqueCustomers = usages.Select(u => u.CustomerId).Distinct().Count();
            var averageDiscountAmount = totalUsages > 0 ? totalDiscountAmount / totalUsages : 0;

            var usageRate = coupon.MaxTotalUses.HasValue && coupon.MaxTotalUses.Value > 0
                ? (decimal)coupon.UsedCount / coupon.MaxTotalUses.Value * 100
                : 0;

            var remainingUses = coupon.MaxTotalUses.HasValue
                ? Math.Max(0, coupon.MaxTotalUses.Value - coupon.UsedCount)
                : (int?)null;

            var daysUntilExpiry = (coupon.EndDate - DateTime.UtcNow).Days;

            return new CouponDetailStatisticsResponse
            {
                CouponId = coupon.Id,
                CouponCode = coupon.Code,
                CouponName = coupon.Name,
                TotalUsages = totalUsages,
                TotalDiscountAmount = totalDiscountAmount,
                UniqueCustomers = uniqueCustomers,
                AverageDiscountAmount = averageDiscountAmount,
                UsageRate = usageRate,
                RemainingUses = remainingUses,
                DaysUntilExpiry = daysUntilExpiry,
                IsActive = coupon.IsActive,
                IsExpired = DateTime.UtcNow > coupon.EndDate
            };
        }

        public async Task<IEnumerable<TopUsedCouponResponse>> GetTopUsedCouponsAsync(
            int limit, DateTime? startDate, DateTime? endDate)
        {
            var query = _context.CouponUsages.AsQueryable();

            if (startDate.HasValue)
                query = query.Where(u => u.UsedAt >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(u => u.UsedAt <= endDate.Value);

            var topCoupons = await query
                .GroupBy(u => u.CouponId)
                .Select(g => new
                {
                    CouponId = g.Key,
                    UsageCount = g.Count(),
                    TotalDiscount = g.Sum(u => u.DiscountAmount)
                })
                .OrderByDescending(x => x.UsageCount)
                .Take(limit)
                .ToListAsync();

            var result = new List<TopUsedCouponResponse>();

            foreach (var item in topCoupons)
            {
                var coupon = await _context.Coupons.FindAsync(item.CouponId);
                if (coupon != null)
                {
                    result.Add(new TopUsedCouponResponse
                    {
                        CouponId = item.CouponId,
                        CouponCode = coupon.Code,
                        CouponName = coupon.Name,
                        UsageCount = item.UsageCount,
                        TotalDiscountAmount = item.TotalDiscount,
                        DiscountType = coupon.DiscountType,
                        IsActive = coupon.IsActive
                    });
                }
            }

            return result;
        }

        public async Task<PagedResult<AdminCouponUsageHistoryResponse>> GetAllCouponUsageHistoryAsync(
            int? couponId, int? customerId, string? customerEmail,
            DateTime? startDate, DateTime? endDate, int page, int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 20;

            var query = _context.CouponUsages
                .Include(u => u.Coupon)
                .Include(u => u.Customer)
                .Include(u => u.Booking)
                .AsQueryable();

            if (couponId.HasValue)
                query = query.Where(u => u.CouponId == couponId.Value);

            if (customerId.HasValue)
                query = query.Where(u => u.CustomerId == customerId.Value);

            if (!string.IsNullOrWhiteSpace(customerEmail))
                query = query.Where(u => u.Customer != null && u.Customer.Email.Contains(customerEmail));

            if (startDate.HasValue)
                query = query.Where(u => u.UsedAt >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(u => u.UsedAt <= endDate.Value);

            var totalCount = await query.CountAsync();

            var usages = await query
                .OrderByDescending(u => u.UsedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var items = usages.Select(u => new AdminCouponUsageHistoryResponse
            {
                Id = u.Id,
                CouponCode = u.Coupon?.Code ?? string.Empty,
                CouponName = u.Coupon?.Name ?? string.Empty,
                CustomerEmail = u.Customer?.Email ?? string.Empty,
                CustomerName = u.Customer?.FullName ?? string.Empty,
                BookingCode = u.Booking?.BookingCode ?? string.Empty,
                DiscountAmount = u.DiscountAmount,
                UsedAt = u.UsedAt
            }).ToList();

            return new PagedResult<AdminCouponUsageHistoryResponse>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };
        }

        public async Task<CouponPerformanceReportResponse> GetCouponPerformanceReportAsync(
            DateTime? startDate, DateTime? endDate, string? groupBy)
        {
            groupBy = groupBy?.ToLower() ?? "month";
            var validGroupBy = new[] { "day", "week", "month", "year" };

            if (!validGroupBy.Contains(groupBy))
                throw new ArgumentException("GroupBy phải là: day, week, month, hoặc year");

            var start = startDate ?? DateTime.UtcNow.AddMonths(-6);
            var end = endDate ?? DateTime.UtcNow;

            var usages = await _context.CouponUsages
                .Where(u => u.UsedAt >= start && u.UsedAt <= end)
                .ToListAsync();

            var dataPoints = new List<PerformanceDataPoint>();

            switch (groupBy)
            {
                case "day":
                    dataPoints = usages
                        .GroupBy(u => u.UsedAt.Date)
                        .Select(g => new PerformanceDataPoint
                        {
                            Period = g.Key.ToString("yyyy-MM-dd"),
                            UsageCount = g.Count(),
                            TotalDiscountAmount = g.Sum(u => u.DiscountAmount),
                            UniqueCustomers = g.Select(u => u.CustomerId).Distinct().Count()
                        })
                        .OrderBy(d => d.Period)
                        .ToList();
                    break;

                case "week":
                    dataPoints = usages
                        .GroupBy(u => System.Globalization.CultureInfo.CurrentCulture.Calendar
                            .GetWeekOfYear(u.UsedAt, System.Globalization.CalendarWeekRule.FirstDay, DayOfWeek.Monday))
                        .Select(g => new PerformanceDataPoint
                        {
                            Period = $"Week {g.Key}",
                            UsageCount = g.Count(),
                            TotalDiscountAmount = g.Sum(u => u.DiscountAmount),
                            UniqueCustomers = g.Select(u => u.CustomerId).Distinct().Count()
                        })
                        .OrderBy(d => d.Period)
                        .ToList();
                    break;

                case "month":
                    dataPoints = usages
                        .GroupBy(u => new { u.UsedAt.Year, u.UsedAt.Month })
                        .Select(g => new PerformanceDataPoint
                        {
                            Period = $"{g.Key.Year}-{g.Key.Month:D2}",
                            UsageCount = g.Count(),
                            TotalDiscountAmount = g.Sum(u => u.DiscountAmount),
                            UniqueCustomers = g.Select(u => u.CustomerId).Distinct().Count()
                        })
                        .OrderBy(d => d.Period)
                        .ToList();
                    break;

                case "year":
                    dataPoints = usages
                        .GroupBy(u => u.UsedAt.Year)
                        .Select(g => new PerformanceDataPoint
                        {
                            Period = g.Key.ToString(),
                            UsageCount = g.Count(),
                            TotalDiscountAmount = g.Sum(u => u.DiscountAmount),
                            UniqueCustomers = g.Select(u => u.CustomerId).Distinct().Count()
                        })
                        .OrderBy(d => d.Period)
                        .ToList();
                    break;
            }

            return new CouponPerformanceReportResponse
            {
                StartDate = start,
                EndDate = end,
                GroupBy = groupBy,
                DataPoints = dataPoints,
                TotalUsages = usages.Count,
                TotalDiscountAmount = usages.Sum(u => u.DiscountAmount),
                AverageDiscountPerPeriod = dataPoints.Any() ? usages.Sum(u => u.DiscountAmount) / dataPoints.Count : 0
            };
        }

        public async Task<IEnumerable<ExpiringSoonCouponResponse>> GetExpiringSoonCouponsAsync(int days)
        {
            var endDate = DateTime.UtcNow.AddDays(days);

            var coupons = await _context.Coupons
                .Where(c => c.IsActive &&
                           c.EndDate > DateTime.UtcNow &&
                           c.EndDate <= endDate)
                .OrderBy(c => c.EndDate)
                .ToListAsync();

            return coupons.Select(c => new ExpiringSoonCouponResponse
            {
                Id = c.Id,
                Code = c.Code,
                Name = c.Name,
                EndDate = c.EndDate,
                DaysRemaining = (c.EndDate - DateTime.UtcNow).Days,
                UsedCount = c.UsedCount,
                MaxTotalUses = c.MaxTotalUses,
                IsPublic = c.IsPublic
            });
        }

        public async Task<IEnumerable<TopCouponCustomerResponse>> GetTopCouponCustomersAsync(
            int limit, DateTime? startDate, DateTime? endDate)
        {
            var query = _context.CouponUsages.AsQueryable();

            if (startDate.HasValue)
                query = query.Where(u => u.UsedAt >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(u => u.UsedAt <= endDate.Value);

            var topCustomers = await query
                .GroupBy(u => u.CustomerId)
                .Select(g => new
                {
                    CustomerId = g.Key,
                    UsageCount = g.Count(),
                    TotalSavings = g.Sum(u => u.DiscountAmount),
                    UniqueCouponsUsed = g.Select(u => u.CouponId).Distinct().Count()
                })
                .OrderByDescending(x => x.UsageCount)
                .Take(limit)
                .ToListAsync();

            var result = new List<TopCouponCustomerResponse>();

            foreach (var item in topCustomers)
            {
                var customer = await _context.Users.FindAsync(item.CustomerId);
                if (customer != null)
                {
                    result.Add(new TopCouponCustomerResponse
                    {
                        CustomerId = item.CustomerId,
                        CustomerEmail = customer.Email,
                        CustomerName = customer.FullName,
                        TotalCouponUsages = item.UsageCount,
                        TotalSavingsAmount = item.TotalSavings,
                        UniqueCouponsUsed = item.UniqueCouponsUsed
                    });
                }
            }

            return result;
        }

        public async Task<string> ExportCouponsToCSVAsync(DateTime? startDate, DateTime? endDate)
        {
            var query = _context.CouponUsages
                .Include(u => u.Coupon)
                .Include(u => u.Customer)
                .Include(u => u.Booking)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(u => u.UsedAt >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(u => u.UsedAt <= endDate.Value);

            var usages = await query.OrderByDescending(u => u.UsedAt).ToListAsync();

            var csv = new System.Text.StringBuilder();
            csv.AppendLine("ID,Mã Coupon,Tên Coupon,Email KH,Tên KH,Mã Booking,Số tiền giảm,Thời gian sử dụng");

            foreach (var usage in usages)
            {
                csv.AppendLine($"{usage.Id}," +
                              $"{usage.Coupon?.Code ?? ""}," +
                              $"{usage.Coupon?.Name ?? ""}," +
                              $"{usage.Customer?.Email ?? ""}," +
                              $"{usage.Customer?.FullName ?? ""}," +
                              $"{usage.Booking?.BookingCode ?? ""}," +
                              $"{usage.DiscountAmount}," +
                              $"{usage.UsedAt:yyyy-MM-dd HH:mm:ss}");
            }

            return csv.ToString();
        }

        public async Task<Coupon?> DuplicateCouponAsync(int couponId, string newCode)
        {
            var originalCoupon = await _context.Coupons
                .Include(c => c.CouponApplications)
                .FirstOrDefaultAsync(c => c.Id == couponId);

            if (originalCoupon == null)
                return null;

            // Check if new code already exists
            var existingCoupon = await GetCouponByCodeAsync(newCode);
            if (existingCoupon != null)
                throw new ArgumentException("Mã code mới đã tồn tại");

            var duplicatedCoupon = new Coupon
            {
                Code = newCode,
                Name = $"{originalCoupon.Name} (Copy)",
                Description = originalCoupon.Description,
                DiscountType = originalCoupon.DiscountType,
                DiscountValue = originalCoupon.DiscountValue,
                MaxDiscountAmount = originalCoupon.MaxDiscountAmount,
                MinOrderAmount = originalCoupon.MinOrderAmount,
                MinNights = originalCoupon.MinNights,
                ApplicableDays = originalCoupon.ApplicableDays,
                ApplicableTo = originalCoupon.ApplicableTo,
                StartDate = DateTime.UtcNow,
                EndDate = originalCoupon.EndDate,
                MaxTotalUses = originalCoupon.MaxTotalUses,
                MaxUsesPerCustomer = originalCoupon.MaxUsesPerCustomer,
                IsPublic = originalCoupon.IsPublic,
                IsFeatured = false,
                IsActive = false,
                UsedCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Coupons.Add(duplicatedCoupon);
                await _context.SaveChangesAsync();

                // Copy applications if any
                if (originalCoupon.CouponApplications.Any())
                {
                    foreach (var app in originalCoupon.CouponApplications)
                    {
                        _context.CouponApplications.Add(new CouponApplication
                        {
                            CouponId = duplicatedCoupon.Id,
                            ApplicableType = app.ApplicableType,
                            ApplicableId = app.ApplicableId
                        });
                    }
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                // Log audit
                var newValues = JsonSerializer.Serialize(new
                {
                    duplicatedCoupon.Id,
                    duplicatedCoupon.Code,
                    OriginalCouponId = couponId,
                    duplicatedCoupon.CreatedAt
                });
                await _auditLogService.LogInsertAsync("Coupon", duplicatedCoupon.Id, newValues);

                return duplicatedCoupon;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        private void ValidateCouponConstraints(Coupon coupon)
        {
            var errors = new List<string>();

            // Validate DiscountType
            if (!ValidDiscountTypes.Contains(coupon.DiscountType, StringComparer.OrdinalIgnoreCase))
            {
                errors.Add($"DiscountType phải là một trong các giá trị: {string.Join(", ", ValidDiscountTypes)}");
            }

            // Validate ApplicableTo
            if (!ValidApplicableToTypes.Contains(coupon.ApplicableTo, StringComparer.OrdinalIgnoreCase))
            {
                errors.Add($"ApplicableTo phải là một trong các giá trị: {string.Join(", ", ValidApplicableToTypes)}");
            }

            // Validate DiscountValue based on type
            switch (coupon.DiscountType.ToLower())
            {
                case "percentage":
                    if (coupon.DiscountValue <= 0 || coupon.DiscountValue > 100)
                    {
                        errors.Add("DiscountValue cho loại percentage phải trong khoảng 1-100");
                    }
                    break;
                case "fixedamount":
                    if (coupon.DiscountValue <= 0)
                    {
                        errors.Add("DiscountValue cho loại fixedAmount phải lớn hơn 0");
                    }
                    break;
                case "freenight":
                    if (coupon.DiscountValue <= 0 || coupon.DiscountValue != Math.Floor(coupon.DiscountValue))
                    {
                        errors.Add("DiscountValue cho loại freeNight phải là số nguyên dương");
                    }
                    break;
            }

            // Validate dates
            if (coupon.StartDate >= coupon.EndDate)
            {
                errors.Add("StartDate phải nhỏ hơn EndDate");
            }

            // Validate usage limits
            if (coupon.MaxTotalUses.HasValue && coupon.MaxTotalUses <= 0)
            {
                errors.Add("MaxTotalUses phải lớn hơn 0 nếu được thiết lập");
            }

            if (coupon.MaxUsesPerCustomer <= 0)
            {
                errors.Add("MaxUsesPerCustomer phải lớn hơn 0");
            }

            // Validate minimum values
            if (coupon.MinOrderAmount < 0)
            {
                errors.Add("MinOrderAmount không được âm");
            }

            if (coupon.MinNights < 1)
            {
                errors.Add("MinNights phải ít nhất là 1");
            }

            // Validate MaxDiscountAmount for percentage type
            if (coupon.DiscountType.ToLower() == "percentage" &&
                coupon.MaxDiscountAmount.HasValue && coupon.MaxDiscountAmount <= 0)
            {
                errors.Add("MaxDiscountAmount phải lớn hơn 0 nếu được thiết lập cho loại percentage");
            }

            // Validate Code format
            if (string.IsNullOrWhiteSpace(coupon.Code))
            {
                errors.Add("Code không được để trống");
            }
            else if (coupon.Code.Length < 3 || coupon.Code.Length > 20)
            {
                errors.Add("Code phải có độ dài từ 3-20 ký tự");
            }
            else if (!System.Text.RegularExpressions.Regex.IsMatch(coupon.Code, @"^[A-Za-z0-9]+$"))
            {
                errors.Add("Code chỉ được chứa chữ cái và số");
            }

            // Validate ApplicableDays format if provided
            if (!string.IsNullOrEmpty(coupon.ApplicableDays))
            {
                // Cho phép "all" hoặc danh sách các ngày hợp lệ
                if (!coupon.ApplicableDays.Equals("all", StringComparison.OrdinalIgnoreCase))
                {
                    var validDays = new[] { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };
                    var days = coupon.ApplicableDays.Split(',').Select(d => d.Trim()).ToArray();

                    foreach (var day in days)
                    {
                        if (!validDays.Contains(day, StringComparer.OrdinalIgnoreCase))
                        {
                            errors.Add($"ApplicableDays chứa ngày không hợp lệ: {day}. Các giá trị hợp lệ: all, {string.Join(", ", validDays)}");
                            break;
                        }
                    }
                }
            }

            if (errors.Any())
            {
                throw new ArgumentException($"Dữ liệu không hợp lệ: {string.Join("; ", errors)}");
            }
        }
    }
    public class PagedResult<T>
    {
        public IEnumerable<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasPrevious => Page > 1;
        public bool HasNext => Page < TotalPages;
    }
    // DTOs và Models hỗ trợ
    public class CouponValidationResult
    {
        public bool IsValid { get; set; }
        public string? ErrorMessage { get; set; }
        public Coupon? Coupon { get; set; }
        public Booking? Booking { get; set; }
    }

    public class CouponStatistics
    {
        public int CouponId { get; set; }
        public int TotalUsages { get; set; }
        public decimal TotalDiscountAmount { get; set; }
        public int UniqueCustomers { get; set; }
        public decimal AverageDiscountAmount { get; set; }
        public int? RemainingUses { get; set; }
    }
}