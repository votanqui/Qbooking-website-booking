using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using QBooking.Models;
using QBooking.Services;
using QBooking.Dtos.Request;
using QBooking.Dtos.Response;
using System.Security.Claims;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CouponsController : ControllerBase
    {
        private readonly ICouponService _couponService;

        public CouponsController(ICouponService couponService)
        {
            _couponService = couponService;
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            return null;
        }
        /// <summary>
        /// Lấy thống kê tổng quan về coupon (admin)
        /// </summary>
        [HttpGet("statistics/overview")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<CouponOverviewStatisticsResponse>>> GetCouponOverviewStatistics()
        {
            try
            {
                var statistics = await _couponService.GetCouponOverviewStatisticsAsync();

                return Ok(new ApiResponse<CouponOverviewStatisticsResponse>
                {
                    Success = true,
                    Message = "Lấy thống kê tổng quan thành công",
                    StatusCode = 200,
                    Data = statistics
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<CouponOverviewStatisticsResponse>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy thống kê chi tiết của một coupon (admin)
        /// </summary>
        [HttpGet("{id}/statistics")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<CouponDetailStatisticsResponse>>> GetCouponDetailStatistics(int id)
        {
            try
            {
                var statistics = await _couponService.GetCouponDetailStatisticsAsync(id);

                if (statistics == null)
                {
                    return NotFound(new ApiResponse<CouponDetailStatisticsResponse>
                    {
                        Success = false,
                        Message = "Không tìm thấy mã giảm giá",
                        StatusCode = 404
                    });
                }

                return Ok(new ApiResponse<CouponDetailStatisticsResponse>
                {
                    Success = true,
                    Message = "Lấy thống kê chi tiết thành công",
                    StatusCode = 200,
                    Data = statistics
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<CouponDetailStatisticsResponse>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy top coupon được sử dụng nhiều nhất (admin)
        /// </summary>
        [HttpGet("statistics/top-used")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<IEnumerable<TopUsedCouponResponse>>>> GetTopUsedCoupons(
            [FromQuery] int limit = 10,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var coupons = await _couponService.GetTopUsedCouponsAsync(limit, startDate, endDate);

                return Ok(new ApiResponse<IEnumerable<TopUsedCouponResponse>>
                {
                    Success = true,
                    Message = "Lấy top coupon thành công",
                    StatusCode = 200,
                    Data = coupons
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<IEnumerable<TopUsedCouponResponse>>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy lịch sử sử dụng coupon của tất cả khách hàng (admin)
        /// </summary>
        [HttpGet("usage-history")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<PagedResult<AdminCouponUsageHistoryResponse>>>> GetAllCouponUsageHistory(
            [FromQuery] int? couponId = null,
            [FromQuery] int? customerId = null,
            [FromQuery] string? customerEmail = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var result = await _couponService.GetAllCouponUsageHistoryAsync(
                    couponId, customerId, customerEmail, startDate, endDate, page, pageSize);

                return Ok(new ApiResponse<PagedResult<AdminCouponUsageHistoryResponse>>
                {
                    Success = true,
                    Message = "Lấy lịch sử sử dụng coupon thành công",
                    StatusCode = 200,
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<PagedResult<AdminCouponUsageHistoryResponse>>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy báo cáo hiệu quả coupon theo thời gian (admin)
        /// </summary>
        [HttpGet("statistics/performance-report")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<CouponPerformanceReportResponse>>> GetCouponPerformanceReport(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string? groupBy = "month") // day, week, month, year
        {
            try
            {
                var report = await _couponService.GetCouponPerformanceReportAsync(startDate, endDate, groupBy);

                return Ok(new ApiResponse<CouponPerformanceReportResponse>
                {
                    Success = true,
                    Message = "Lấy báo cáo hiệu quả thành công",
                    StatusCode = 200,
                    Data = report
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ApiResponse<CouponPerformanceReportResponse>
                {
                    Success = false,
                    Message = ex.Message,
                    StatusCode = 400
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<CouponPerformanceReportResponse>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy danh sách coupon sắp hết hạn (admin)
        /// </summary>
        [HttpGet("expiring-soon")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<IEnumerable<ExpiringSoonCouponResponse>>>> GetExpiringSoonCoupons(
            [FromQuery] int days = 7)
        {
            try
            {
                var coupons = await _couponService.GetExpiringSoonCouponsAsync(days);

                return Ok(new ApiResponse<IEnumerable<ExpiringSoonCouponResponse>>
                {
                    Success = true,
                    Message = "Lấy danh sách coupon sắp hết hạn thành công",
                    StatusCode = 200,
                    Data = coupons
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<IEnumerable<ExpiringSoonCouponResponse>>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy danh sách customer sử dụng coupon nhiều nhất (admin)
        /// </summary>
        [HttpGet("statistics/top-customers")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<IEnumerable<TopCouponCustomerResponse>>>> GetTopCouponCustomers(
            [FromQuery] int limit = 10,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var customers = await _couponService.GetTopCouponCustomersAsync(limit, startDate, endDate);

                return Ok(new ApiResponse<IEnumerable<TopCouponCustomerResponse>>
                {
                    Success = true,
                    Message = "Lấy danh sách khách hàng thành công",
                    StatusCode = 200,
                    Data = customers
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<IEnumerable<TopCouponCustomerResponse>>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Xuất báo cáo coupon ra CSV (admin)
        /// </summary>
        [HttpGet("export/csv")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ExportCouponsToCSV(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var csvData = await _couponService.ExportCouponsToCSVAsync(startDate, endDate);

                return File(
                    System.Text.Encoding.UTF8.GetBytes(csvData),
                    "text/csv",
                    $"coupons_report_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv"
                );
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Sao chép coupon (admin)
        /// </summary>
        [HttpPost("{id}/duplicate")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<AdminCouponResponse>>> DuplicateCoupon(
            int id,
            [FromBody] DuplicateCouponRequest request)
        {
            try
            {
                var duplicatedCoupon = await _couponService.DuplicateCouponAsync(id, request.NewCode);

                if (duplicatedCoupon == null)
                {
                    return NotFound(new ApiResponse<AdminCouponResponse>
                    {
                        Success = false,
                        Message = "Không tìm thấy mã giảm giá gốc",
                        StatusCode = 404
                    });
                }

                var response = new AdminCouponResponse
                {
                    Id = duplicatedCoupon.Id,
                    Code = duplicatedCoupon.Code,
                    Name = duplicatedCoupon.Name,
                    Description = duplicatedCoupon.Description,
                    DiscountType = duplicatedCoupon.DiscountType,
                    DiscountValue = duplicatedCoupon.DiscountValue,
                    MaxDiscountAmount = duplicatedCoupon.MaxDiscountAmount,
                    MinOrderAmount = duplicatedCoupon.MinOrderAmount,
                    MinNights = duplicatedCoupon.MinNights,
                    ApplicableDays = duplicatedCoupon.ApplicableDays,
                    ApplicableTo = duplicatedCoupon.ApplicableTo,
                    StartDate = duplicatedCoupon.StartDate,
                    EndDate = duplicatedCoupon.EndDate,
                    MaxTotalUses = duplicatedCoupon.MaxTotalUses,
                    MaxUsesPerCustomer = duplicatedCoupon.MaxUsesPerCustomer,
                    UsedCount = duplicatedCoupon.UsedCount,
                    IsPublic = duplicatedCoupon.IsPublic,
                    IsFeatured = duplicatedCoupon.IsFeatured,
                    IsActive = duplicatedCoupon.IsActive,
                    CreatedAt = duplicatedCoupon.CreatedAt,
                    UpdatedAt = duplicatedCoupon.UpdatedAt
                };

                return Ok(new ApiResponse<AdminCouponResponse>
                {
                    Success = true,
                    Message = "Sao chép coupon thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ApiResponse<AdminCouponResponse>
                {
                    Success = false,
                    Message = ex.Message,
                    StatusCode = 400
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<AdminCouponResponse>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
        /// <summary>
        /// Lấy danh sách tất cả mã giảm giá với phân trang và tìm kiếm (admin)
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<PagedResult<AdminCouponResponse>>>> GetAllCoupons(
            [FromQuery] string? keyword = null,
            [FromQuery] bool? isFeatured = null,
            [FromQuery] bool? isPublic = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] string? discountType = null,
            [FromQuery] string? applicableTo = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var result = await _couponService.GetAllCouponsAsync(
                    keyword, isFeatured, isPublic, isActive,
                    discountType, applicableTo, page, pageSize);

                return Ok(new ApiResponse<PagedResult<AdminCouponResponse>>
                {
                    Success = true,
                    Message = "Lấy danh sách mã giảm giá thành công",
                    StatusCode = 200,
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<PagedResult<AdminCouponResponse>>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy danh sách mã giảm giá công khai (public)
        /// </summary>
        [HttpGet("public")]
        public async Task<ActionResult<ApiResponse<IEnumerable<PublicCouponResponse>>>> GetPublicCoupons(
            [FromQuery] string? keyword = null,
            [FromQuery] int limit = 20)
        {
            try
            {
                var result = await _couponService.GetPublicCouponsAsync(keyword, limit);

                return Ok(new ApiResponse<IEnumerable<PublicCouponResponse>>
                {
                    Success = true,
                    Message = "Lấy danh sách mã giảm giá công khai thành công",
                    StatusCode = 200,
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<IEnumerable<PublicCouponResponse>>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy danh sách mã giảm giá nổi bật (featured)
        /// </summary>
        [HttpGet("featured")]
        public async Task<ActionResult<ApiResponse<IEnumerable<PublicCouponResponse>>>> GetFeaturedCoupons(
            [FromQuery] int limit = 10)
        {
            try
            {
                var result = await _couponService.GetFeaturedCouponsAsync(limit);

                return Ok(new ApiResponse<IEnumerable<PublicCouponResponse>>
                {
                    Success = true,
                    Message = "Lấy danh sách mã giảm giá nổi bật thành công",
                    StatusCode = 200,
                    Data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<IEnumerable<PublicCouponResponse>>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
        /// <summary>
        /// Lấy thông tin mã giảm giá theo ID (admin)
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<AdminCouponResponse>>> GetCouponById(int id)
        {
            try
            {
                var coupon = await _couponService.GetCouponByIdAsync(id);
                if (coupon == null)
                {
                    return NotFound(new ApiResponse<AdminCouponResponse>
                    {
                        Success = false,
                        Message = "Không tìm thấy mã giảm giá",
                        StatusCode = 404
                    });
                }

                var response = new AdminCouponResponse
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
                    Applications = coupon.CouponApplications?.Select(a => new CouponApplicationResponse
                    {
                        Id = a.Id,
                        ApplicableType = a.ApplicableType,
                        ApplicableId = a.ApplicableId
                    }).ToList() ?? new List<CouponApplicationResponse>()
                };

                return Ok(new ApiResponse<AdminCouponResponse>
                {
                    Success = true,
                    Message = "Lấy thông tin mã giảm giá thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<AdminCouponResponse>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy thông tin mã giảm giá theo mã code (public - chỉ thông tin cần thiết)
        /// </summary>
        [HttpGet("code/{code}")]
        public async Task<ActionResult<ApiResponse<PublicCouponResponse>>> GetCouponByCode(string code)
        {
            try
            {
                var coupon = await _couponService.GetCouponByCodeAsync(code);
                if (coupon == null || !coupon.IsActive)
                {
                    return NotFound(new ApiResponse<PublicCouponResponse>
                    {
                        Success = false,
                        Message = "Không tìm thấy mã giảm giá",
                        StatusCode = 404
                    });
                }

                var response = new PublicCouponResponse
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
                    ApplicableTo = coupon.ApplicableTo
                };

                return Ok(new ApiResponse<PublicCouponResponse>
                {
                    Success = true,
                    Message = "Lấy thông tin mã giảm giá thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<PublicCouponResponse>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Tạo mã giảm giá mới (admin)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<AdminCouponResponse>>> CreateCoupon([FromBody] CreateCouponRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<AdminCouponResponse>
                    {
                        Success = false,
                        Message = "Dữ liệu không hợp lệ",
                        StatusCode = 400,
                        Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                    });
                }

                // Kiểm tra mã code đã tồn tại
                var existingCoupon = await _couponService.GetCouponByCodeAsync(request.Code);
                if (existingCoupon != null)
                {
                    return BadRequest(new ApiResponse<AdminCouponResponse>
                    {
                        Success = false,
                        Message = "Mã giảm giá đã tồn tại",
                        StatusCode = 400
                    });
                }

                var coupon = new Coupon
                {
                    Code = request.Code,
                    Name = request.Name,
                    Description = request.Description,
                    DiscountType = request.DiscountType,
                    DiscountValue = request.DiscountValue,
                    MaxDiscountAmount = request.MaxDiscountAmount,
                    MinOrderAmount = request.MinOrderAmount,
                    MinNights = request.MinNights,
                    ApplicableDays = request.ApplicableDays,
                    ApplicableTo = request.ApplicableTo,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    MaxTotalUses = request.MaxTotalUses,
                    MaxUsesPerCustomer = request.MaxUsesPerCustomer,
                    IsPublic = request.IsPublic,
                    IsFeatured = request.IsFeatured,
                    IsActive = request.IsActive
                };

                // Tạo danh sách applications nếu có
                List<CouponApplication>? applications = null;
                if (request.Applications != null && request.Applications.Any())
                {
                    applications = request.Applications.Select(a => new CouponApplication
                    {
                        ApplicableType = a.ApplicableType,
                        ApplicableId = a.ApplicableId
                    }).ToList();
                }

                var createdCoupon = await _couponService.CreateCouponAsync(coupon, applications);

                var response = new AdminCouponResponse
                {
                    Id = createdCoupon.Id,
                    Code = createdCoupon.Code,
                    Name = createdCoupon.Name,
                    Description = createdCoupon.Description,
                    DiscountType = createdCoupon.DiscountType,
                    DiscountValue = createdCoupon.DiscountValue,
                    MaxDiscountAmount = createdCoupon.MaxDiscountAmount,
                    MinOrderAmount = createdCoupon.MinOrderAmount,
                    MinNights = createdCoupon.MinNights,
                    ApplicableDays = createdCoupon.ApplicableDays,
                    ApplicableTo = createdCoupon.ApplicableTo,
                    StartDate = createdCoupon.StartDate,
                    EndDate = createdCoupon.EndDate,
                    MaxTotalUses = createdCoupon.MaxTotalUses,
                    MaxUsesPerCustomer = createdCoupon.MaxUsesPerCustomer,
                    UsedCount = createdCoupon.UsedCount,
                    IsPublic = createdCoupon.IsPublic,
                    IsFeatured = createdCoupon.IsFeatured,
                    IsActive = createdCoupon.IsActive,
                    CreatedAt = createdCoupon.CreatedAt,
                    UpdatedAt = createdCoupon.UpdatedAt,
                    Applications = applications?.Select(a => new CouponApplicationResponse
                    {
                        ApplicableType = a.ApplicableType,
                        ApplicableId = a.ApplicableId
                    }).ToList() ?? new List<CouponApplicationResponse>()
                };

                return CreatedAtAction(nameof(GetCouponById), new { id = createdCoupon.Id },
                    new ApiResponse<AdminCouponResponse>
                    {
                        Success = true,
                        Message = "Tạo mã giảm giá thành công",
                        StatusCode = 201,
                        Data = response
                    });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ApiResponse<AdminCouponResponse>
                {
                    Success = false,
                    Message = ex.Message,
                    StatusCode = 400
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<AdminCouponResponse>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Cập nhật mã giảm giá (admin)
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<AdminCouponResponse>>> UpdateCoupon(int id, [FromBody] UpdateCouponRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<AdminCouponResponse>
                    {
                        Success = false,
                        Message = "Dữ liệu không hợp lệ",
                        StatusCode = 400,
                        Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                    });
                }

                // Kiểm tra mã code đã tồn tại cho coupon khác
                var existingCouponWithCode = await _couponService.GetCouponByCodeAsync(request.Code);
                if (existingCouponWithCode != null && existingCouponWithCode.Id != id)
                {
                    return BadRequest(new ApiResponse<AdminCouponResponse>
                    {
                        Success = false,
                        Message = "Mã giảm giá đã tồn tại",
                        StatusCode = 400
                    });
                }

                var coupon = new Coupon
                {
                    Code = request.Code,
                    Name = request.Name,
                    Description = request.Description,
                    DiscountType = request.DiscountType,
                    DiscountValue = request.DiscountValue,
                    MaxDiscountAmount = request.MaxDiscountAmount,
                    MinOrderAmount = request.MinOrderAmount,
                    MinNights = request.MinNights,
                    ApplicableDays = request.ApplicableDays,
                    ApplicableTo = request.ApplicableTo,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    MaxTotalUses = request.MaxTotalUses,
                    MaxUsesPerCustomer = request.MaxUsesPerCustomer,
                    IsPublic = request.IsPublic,
                    IsFeatured = request.IsFeatured,
                    IsActive = request.IsActive
                };

                // Tạo danh sách applications nếu có
                List<CouponApplication>? applications = null;
                if (request.Applications != null && request.Applications.Any())
                {
                    applications = request.Applications.Select(a => new CouponApplication
                    {
                        ApplicableType = a.ApplicableType,
                        ApplicableId = a.ApplicableId
                    }).ToList();
                }

                var updatedCoupon = await _couponService.UpdateCouponAsync(id, coupon, applications);
                if (updatedCoupon == null)
                {
                    return NotFound(new ApiResponse<AdminCouponResponse>
                    {
                        Success = false,
                        Message = "Không tìm thấy mã giảm giá",
                        StatusCode = 404
                    });
                }

                var response = new AdminCouponResponse
                {
                    Id = updatedCoupon.Id,
                    Code = updatedCoupon.Code,
                    Name = updatedCoupon.Name,
                    Description = updatedCoupon.Description,
                    DiscountType = updatedCoupon.DiscountType,
                    DiscountValue = updatedCoupon.DiscountValue,
                    MaxDiscountAmount = updatedCoupon.MaxDiscountAmount,
                    MinOrderAmount = updatedCoupon.MinOrderAmount,
                    MinNights = updatedCoupon.MinNights,
                    ApplicableDays = updatedCoupon.ApplicableDays,
                    ApplicableTo = updatedCoupon.ApplicableTo,
                    StartDate = updatedCoupon.StartDate,
                    EndDate = updatedCoupon.EndDate,
                    MaxTotalUses = updatedCoupon.MaxTotalUses,
                    MaxUsesPerCustomer = updatedCoupon.MaxUsesPerCustomer,
                    UsedCount = updatedCoupon.UsedCount,
                    IsPublic = updatedCoupon.IsPublic,
                    IsFeatured = updatedCoupon.IsFeatured,
                    IsActive = updatedCoupon.IsActive,
                    CreatedAt = updatedCoupon.CreatedAt,
                    UpdatedAt = updatedCoupon.UpdatedAt,
                    Applications = applications?.Select(a => new CouponApplicationResponse
                    {
                        ApplicableType = a.ApplicableType,
                        ApplicableId = a.ApplicableId
                    }).ToList() ?? new List<CouponApplicationResponse>()
                };

                return Ok(new ApiResponse<AdminCouponResponse>
                {
                    Success = true,
                    Message = "Cập nhật mã giảm giá thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ApiResponse<AdminCouponResponse>
                {
                    Success = false,
                    Message = ex.Message,
                    StatusCode = 400
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<AdminCouponResponse>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Xóa mã giảm giá (admin)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<SimpleActionResponse>>> DeleteCoupon(int id)
        {
            try
            {
                var result = await _couponService.DeleteCouponAsync(id);
                if (!result)
                {
                    return NotFound(new ApiResponse<SimpleActionResponse>
                    {
                        Success = false,
                        Message = "Không tìm thấy mã giảm giá",
                        StatusCode = 404
                    });
                }

                return Ok(new ApiResponse<SimpleActionResponse>
                {
                    Success = true,
                    Message = "Xóa mã giảm giá và các bản ghi liên quan thành công",
                    StatusCode = 200,
                    Data = new SimpleActionResponse
                    {
                        Success = true,
                        Message = "Xóa thành công"
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<SimpleActionResponse>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Bật/tắt trạng thái mã giảm giá (admin)
        /// </summary>
        [HttpPatch("{id}/toggle-status")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<SimpleActionResponse>>> ToggleCouponStatus(int id)
        {
            try
            {
                var result = await _couponService.ToggleCouponStatusAsync(id);
                if (!result)
                {
                    return NotFound(new ApiResponse<SimpleActionResponse>
                    {
                        Success = false,
                        Message = "Không tìm thấy mã giảm giá",
                        StatusCode = 404
                    });
                }

                return Ok(new ApiResponse<SimpleActionResponse>
                {
                    Success = true,
                    Message = "Cập nhật trạng thái thành công",
                    StatusCode = 200,
                    Data = new SimpleActionResponse
                    {
                        Success = true,
                        Message = "Cập nhật thành công"
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<SimpleActionResponse>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Validate mã giảm giá
        /// </summary>
        [HttpPost("validate")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<CouponValidationResponse>>> ValidateCoupon([FromBody] ValidateCouponRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<CouponValidationResponse>
                    {
                        Success = false,
                        Message = "Dữ liệu không hợp lệ",
                        StatusCode = 400,
                        Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                    });
                }

                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return Unauthorized(new ApiResponse<CouponValidationResponse>
                    {
                        Success = false,
                        Message = "Không thể xác thực người dùng",
                        StatusCode = 401
                    });
                }

                var result = await _couponService.ValidateCouponAsync(
                    request.Code,
                    currentUserId.Value,
                    request.BookingId
                );

                if (!result.IsValid)
                {
                    return BadRequest(new ApiResponse<CouponValidationResponse>
                    {
                        Success = false,
                        Message = result.ErrorMessage,
                        StatusCode = 400,
                        Data = new CouponValidationResponse
                        {
                            IsValid = false,
                            DiscountAmount = 0,
                            FinalAmount = 0
                        }
                    });
                }

                var discountAmount = await _couponService.CalculateDiscountAsync(
                    result.Coupon!,
                    result.Booking!.TotalAmount,
                    result.Booking.RoomPrice,
                    result.Booking.Nights
                );

                return Ok(new ApiResponse<CouponValidationResponse>
                {
                    Success = true,
                    Message = "Mã giảm giá hợp lệ",
                    StatusCode = 200,
                    Data = new CouponValidationResponse
                    {
                        IsValid = true,
                        DiscountAmount = discountAmount,
                        FinalAmount = result.Booking.TotalAmount - discountAmount,
                        CouponName = result.Coupon.Name,
                        DiscountType = result.Coupon.DiscountType
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<CouponValidationResponse>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Áp dụng mã giảm giá
        /// </summary>
        [HttpPost("apply")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<CouponUsageResponse>>> ApplyCoupon([FromBody] ApplyCouponRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<CouponUsageResponse>
                    {
                        Success = false,
                        Message = "Dữ liệu không hợp lệ",
                        StatusCode = 400,
                        Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                    });
                }

                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return Unauthorized(new ApiResponse<CouponUsageResponse>
                    {
                        Success = false,
                        Message = "Không thể xác thực người dùng",
                        StatusCode = 401
                    });
                }

                var usage = await _couponService.ApplyCouponAsync(
                    request.Code,
                    currentUserId.Value,
                    request.BookingId
                );

                var coupon = await _couponService.GetCouponByIdAsync(usage.CouponId);

                var response = new CouponUsageResponse
                {
                    Id = usage.Id,
                    CouponCode = coupon?.Code ?? string.Empty,
                    CouponName = coupon?.Name ?? string.Empty,
                    DiscountAmount = usage.DiscountAmount,
                    UsedAt = usage.UsedAt,
                    BookingId = usage.BookingId
                };

                return Ok(new ApiResponse<CouponUsageResponse>
                {
                    Success = true,
                    Message = "Áp dụng mã giảm giá thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ApiResponse<CouponUsageResponse>
                {
                    Success = false,
                    Message = ex.Message,
                    StatusCode = 400
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<CouponUsageResponse>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        [HttpPost("cancel/{bookingId}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> CancelCoupon(int bookingId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không thể xác thực người dùng",
                        StatusCode = 401
                    });
                }

                await _couponService.CancelCouponAsync(bookingId, currentUserId.Value);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Hủy mã giảm giá thành công",
                    StatusCode = 200
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message,
                    StatusCode = 400
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
        [HttpPost("apply-by-code")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<CouponUsageResponse>>> ApplyCouponByCode([FromBody] ApplyCouponByCodeRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<CouponUsageResponse>
                    {
                        Success = false,
                        Message = "Dữ liệu không hợp lệ",
                        StatusCode = 400,
                        Error = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
                    });
                }

                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return Unauthorized(new ApiResponse<CouponUsageResponse>
                    {
                        Success = false,
                        Message = "Không thể xác thực người dùng",
                        StatusCode = 401
                    });
                }

                var usage = await _couponService.ApplyCouponByCodeAsync(
                    request.CouponCode,
                    currentUserId.Value,
                    request.BookingCode
                );

                var coupon = await _couponService.GetCouponByIdAsync(usage.CouponId);

                var response = new CouponUsageResponse
                {
                    Id = usage.Id,
                    CouponCode = coupon?.Code ?? string.Empty,
                    CouponName = coupon?.Name ?? string.Empty,
                    DiscountAmount = usage.DiscountAmount,
                    UsedAt = usage.UsedAt,
                    BookingId = usage.BookingId
                };

                return Ok(new ApiResponse<CouponUsageResponse>
                {
                    Success = true,
                    Message = "Áp dụng mã giảm giá thành công",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ApiResponse<CouponUsageResponse>
                {
                    Success = false,
                    Message = ex.Message,
                    StatusCode = 400
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<CouponUsageResponse>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // ==================== CouponController - CancelCouponByCode ====================
        [HttpPost("cancel-by-code/{bookingCode}")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<object>>> CancelCouponByCode(string bookingCode)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Không thể xác thực người dùng",
                        StatusCode = 401
                    });
                }

                await _couponService.CancelCouponByCodeAsync(bookingCode, currentUserId.Value);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Hủy mã giảm giá thành công",
                    StatusCode = 200
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = ex.Message,
                    StatusCode = 400
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
        /// <summary>
        /// Kiểm tra tính khả dụng của mã code
        /// </summary>
        [HttpGet("check-availability/{code}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<CodeAvailabilityResponse>>> CheckCodeAvailability(string code)
        {
            try
            {
                var existingCoupon = await _couponService.GetCouponByCodeAsync(code);
                var isAvailable = existingCoupon == null;

                var response = new CodeAvailabilityResponse
                {
                    IsAvailable = isAvailable,
                    Message = isAvailable ? "Mã code khả dụng" : "Mã code đã tồn tại"
                };

                return Ok(new ApiResponse<CodeAvailabilityResponse>
                {
                    Success = true,
                    Message = response.Message,
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<CodeAvailabilityResponse>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy danh sách các loại discount hợp lệ
        /// </summary>
        [HttpGet("discount-types")]
        [Authorize(Roles = "admin")]
        public ActionResult<ApiResponse<IEnumerable<DiscountTypeResponse>>> GetDiscountTypes()
        {
            try
            {
                var discountTypes = new[]
                {
                    new DiscountTypeResponse
                    {
                        Value = "percentage",
                        Label = "Phần trăm",
                        Description = "Giảm theo % của tổng đơn hàng"
                    },
                    new DiscountTypeResponse
                    {
                        Value = "fixedAmount",
                        Label = "Số tiền cố định",
                        Description = "Giảm một số tiền cố định"
                    },
                    new DiscountTypeResponse
                    {
                        Value = "freeNight",
                        Label = "Đêm miễn phí",
                        Description = "Miễn phí một số đêm nhất định"
                    }
                };

                return Ok(new ApiResponse<IEnumerable<DiscountTypeResponse>>
                {
                    Success = true,
                    Message = "Lấy danh sách loại giảm giá thành công",
                    StatusCode = 200,
                    Data = discountTypes
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<IEnumerable<DiscountTypeResponse>>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy danh sách các loại ApplicableTo hợp lệ
        /// </summary>
        [HttpGet("applicable-to-types")]
        [Authorize(Roles = "admin")]
        public ActionResult<ApiResponse<IEnumerable<ApplicableToTypeResponse>>> GetApplicableToTypes()
        {
            try
            {
                var applicableToTypes = new[]
                {
                    new ApplicableToTypeResponse
                    {
                        Value = "all",
                        Label = "Tất cả",
                        Description = "Áp dụng cho tất cả các property"
                    },
                    new ApplicableToTypeResponse
                    {
                        Value = "property",
                        Label = "Property cụ thể",
                        Description = "Áp dụng cho các property được chỉ định"
                    },
                    new ApplicableToTypeResponse
                    {
                        Value = "propertyType",
                        Label = "Loại property",
                        Description = "Áp dụng cho các loại property (hotel, homestay, ...)"
                    },
                    new ApplicableToTypeResponse
                    {
                        Value = "location",
                        Label = "Tỉnh/thành phố",
                        Description = "Áp dụng cho các tỉnh/thành phố được chỉ định"
                    }
                };

                return Ok(new ApiResponse<IEnumerable<ApplicableToTypeResponse>>
                {
                    Success = true,
                    Message = "Lấy danh sách loại áp dụng thành công",
                    StatusCode = 200,
                    Data = applicableToTypes
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<IEnumerable<ApplicableToTypeResponse>>
                {
                    Success = false,
                    Message = "Lỗi server",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
    }
}