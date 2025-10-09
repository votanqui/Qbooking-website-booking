using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using QBooking.Data;
using QBooking.Models;
using QBooking.Services;
using QBooking.Dtos.Request;
using QBooking.Dtos.Response;
using Newtonsoft.Json;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AuthService _authService;
        private readonly AuditLogService _auditLogService;
        private readonly HistoryLoginService _historyLoginService;
        private readonly ILogger<AuthController> _logger;
        private readonly IEmailService _emailService;
        public AuthController(ApplicationDbContext context, AuthService authService,
                            AuditLogService auditLogService, HistoryLoginService historyLoginService,
                            IEmailService emailService,
                            ILogger<AuthController> logger)
        {
            _context = context;
            _authService = authService;
            _auditLogService = auditLogService;
            _historyLoginService = historyLoginService;
            _emailService = emailService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                {
                    await _historyLoginService.LogFailedLoginAsync(request.Email ?? "", "Email hoặc mật khẩu trống");

                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Email và mật khẩu là bắt buộc.",
                        StatusCode = 400
                    });
                }

                // Kiểm tra số lần đăng nhập thất bại gần đây
                var recentFailedAttempts = await _historyLoginService.GetRecentFailedAttemptsAsync(request.Email);
                if (recentFailedAttempts >= 5)
                {
                    await _historyLoginService.LogFailedLoginAsync(request.Email, "Tài khoản tạm thời bị khóa do quá nhiều lần đăng nhập thất bại");

                    return StatusCode(429, new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Tài khoản tạm thời bị khóa do quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.",
                        StatusCode = 429
                    });
                }

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                if (user == null)
                {
                    await _historyLoginService.LogFailedLoginAsync(request.Email, "Email không tồn tại");

                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Sai email hoặc mật khẩu!",
                        StatusCode = 401
                    });
                }

                if (!_authService.VerifyPassword(request.Password, user.PasswordHash))
                {
                    await _historyLoginService.LogFailedLoginAsync(request.Email, "Sai mật khẩu");

                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Sai email hoặc mật khẩu!",
                        StatusCode = 401
                    });
                }

                if (!user.IsActive)
                {
                    await _historyLoginService.LogFailedLoginAsync(request.Email, "Tài khoản bị vô hiệu hóa");

                    return StatusCode(403, new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Tài khoản của bạn đã bị vô hiệu hóa.",
                        StatusCode = 403
                    });
                }

                if (!user.IsEmailVerified)
                {
                    await _historyLoginService.LogFailedLoginAsync(request.Email, "Email chưa được xác nhận");

                    return StatusCode(403, new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Vui lòng xác nhận email trước khi đăng nhập.",
                        StatusCode = 403
                    });
                }

                var token = _authService.GenerateJwtToken(user);
                _authService.SetJwtToken(token);


             
                await _historyLoginService.LogSuccessfulLoginAsync(user.Id, user.FullName);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Đăng nhập thành công",
                    StatusCode = 200,
                    Data = new
                    {
                        token,
                        email = user.Email,
                        role = user.Role,
                        fullName = user.FullName,
                        id = user.Id
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login attempt");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest registerModel)
        {
            try
            {
                if (string.IsNullOrEmpty(registerModel.Email) || string.IsNullOrEmpty(registerModel.Password))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Email và mật khẩu là bắt buộc.",
                        statusCode = 400
                    });
                }

                if (string.IsNullOrEmpty(registerModel.FullName))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Họ tên là bắt buộc.",
                        statusCode = 400
                    });
                }

                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == registerModel.Email);

                if (existingUser != null)
                {
                    return Conflict(new
                    {
                        success = false,
                        message = "Email đã được sử dụng bởi tài khoản khác.",
                        statusCode = 409
                    });
                }

                var emailRegex = new System.Text.RegularExpressions.Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$");
                if (!emailRegex.IsMatch(registerModel.Email))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Email không hợp lệ.",
                        statusCode = 400
                    });
                }

                if (!string.IsNullOrEmpty(registerModel.Phone))
                {
                    var phoneRegex = new System.Text.RegularExpressions.Regex(@"^(0\d{9}|(\+84)\d{9})$");
                    if (!phoneRegex.IsMatch(registerModel.Phone))
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Số điện thoại không hợp lệ.",
                            statusCode = 400
                        });
                    }

                    var phoneExists = await _context.Users
                        .AnyAsync(u => u.Phone == registerModel.Phone);

                    if (phoneExists)
                    {
                        return Conflict(new
                        {
                            success = false,
                            message = "Số điện thoại đã được sử dụng bởi tài khoản khác.",
                            statusCode = 409
                        });
                    }
                }

                var province = await _context.Provinces.FindAsync(registerModel.ProvinceId);
                if (province == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Tỉnh/Thành phố không tồn tại.",
                        statusCode = 400
                    });
                }

                var commune = await _context.Communes.FindAsync(registerModel.CommuneId);
                if (commune == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Xã/Phường không tồn tại.",
                        statusCode = 400
                    });
                }

                if (commune.ProvinceId != registerModel.ProvinceId)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Xã/Phường không thuộc Tỉnh/Thành phố đã chọn.",
                        statusCode = 400
                    });
                }

                var user = new User
                {
                    Email = registerModel.Email,
                    PasswordHash = _authService.HashPassword(registerModel.Password),
                    FullName = registerModel.FullName,
                    Phone = registerModel.Phone,
                    Role = "customer",
                    DateOfBirth = registerModel.DateOfBirth,
                    Gender = registerModel.Gender,
                    AddressDetail = registerModel.AddressDetail,
                    CommuneId = registerModel.CommuneId,
                    ProvinceId = registerModel.ProvinceId,
                    IsEmailVerified = false,
                    IsActive = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var newUserData = JsonConvert.SerializeObject(new
                {
                    user.Id,
                    user.Email,
                    user.FullName,
                    user.Phone,
                    user.Role,
                    user.DateOfBirth,
                    user.Gender,
                    user.AddressDetail,
                    user.CommuneId,
                    user.ProvinceId,
                    user.IsEmailVerified,
                    user.IsActive,
                    user.CreatedAt,
                    user.UpdatedAt
                });

                await _auditLogService.LogInsertAsync("User", user.Id, newUserData);

                var emailToken = _authService.GenerateEmailVerificationToken();
                var userToken = new UserToken
                {
                    UserId = user.Id,
                    Token = emailToken,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(24),
                    IsUsed = false
                };

                _context.UserTokens.Add(userToken);
                await _context.SaveChangesAsync();

                // Gửi email xác nhận
                await _emailService.SendEmailVerificationAsync(user.Email, user.FullName, emailToken);

                return StatusCode(201, new
                {
                    success = true,
                    message = "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
                    statusCode = 201,
                    data = new
                    {
                        userId = user.Id,
                        email = user.Email,
                        fullName = user.FullName,
                        needEmailVerification = true
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Lỗi hệ thống",
                    statusCode = 500,
                    error = ex.Message
                });
            }
        }
        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerificationEmail([FromBody] ResendVerificationRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Email))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Email là bắt buộc.",
                        StatusCode = 400
                    });
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (user == null)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Email không tồn tại trong hệ thống.",
                        StatusCode = 400
                    });
                }

                if (user.IsEmailVerified)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Email đã được xác nhận.",
                        StatusCode = 400
                    });
                }

                // Vô hiệu hóa các token cũ
                var oldTokens = await _context.UserTokens
                    .Where(ut => ut.UserId == user.Id && !ut.IsUsed)
                    .ToListAsync();

                foreach (var oldToken in oldTokens)
                {
                    oldToken.IsUsed = true;
                    oldToken.UsedAt = DateTime.UtcNow;
                }

                // Tạo token mới
                var emailToken = _authService.GenerateEmailVerificationToken();
                var userToken = new UserToken
                {
                    UserId = user.Id,
                    Token = emailToken,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(24),
                    IsUsed = false
                };

                _context.UserTokens.Add(userToken);
                await _context.SaveChangesAsync();

                // Gửi email
                await _emailService.SendEmailVerificationAsync(user.Email, user.FullName, emailToken);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Email xác nhận đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.",
                    StatusCode = 200
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during resending verification email");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Email))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Email là bắt buộc.",
                        StatusCode = 400
                    });
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (user == null)
                {
                    // Vì lý do bảo mật, không tiết lộ email có tồn tại hay không
                    return Ok(new ApiResponse<object>
                    {
                        Success = true,
                        Message = "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.",
                        StatusCode = 200
                    });
                }

                if (!user.IsActive)
                {
                    return Ok(new ApiResponse<object>
                    {
                        Success = true,
                        Message = "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.",
                        StatusCode = 200
                    });
                }

                // Vô hiệu hóa các token reset password cũ
                var oldResetTokens = await _context.UserTokens
                    .Where(ut => ut.UserId == user.Id && !ut.IsUsed)
                    .ToListAsync();

                foreach (var oldToken in oldResetTokens)
                {
                    oldToken.IsUsed = true;
                    oldToken.UsedAt = DateTime.UtcNow;
                }

                // Tạo token reset password mới
                var resetToken = _authService.GeneratePasswordResetToken();
                var userToken = new UserToken
                {
                    UserId = user.Id,
                    Token = resetToken,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(1), // Token reset chỉ có hiệu lực 1 giờ
                    IsUsed = false
                };

                _context.UserTokens.Add(userToken);
                await _context.SaveChangesAsync();

                // Gửi email reset password
                await _emailService.SendPasswordResetAsync(user.Email, user.FullName, resetToken);

                await _auditLogService.LogPasswordResetRequestAsync(user.Id);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.",
                    StatusCode = 200
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during forgot password request");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.NewPassword))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token và mật khẩu mới là bắt buộc.",
                        StatusCode = 400
                    });
                }

                if (request.NewPassword.Length < 6)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Mật khẩu phải có ít nhất 6 ký tự.",
                        StatusCode = 400
                    });
                }

                var userToken = await _context.UserTokens
                    .Include(ut => ut.User)
                    .FirstOrDefaultAsync(ut => ut.Token == request.Token && !ut.IsUsed);

                if (userToken == null)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.",
                        StatusCode = 400
                    });
                }

                if (userToken.ExpiresAt < DateTime.UtcNow)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.",
                        StatusCode = 400
                    });
                }

                var user = userToken.User;
                if (!user.IsActive)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Tài khoản đã bị vô hiệu hóa.",
                        StatusCode = 400
                    });
                }

                // Cập nhật mật khẩu
                user.PasswordHash = _authService.HashPassword(request.NewPassword);
                user.UpdatedAt = DateTime.UtcNow;

                // Đánh dấu token đã sử dụng
                userToken.IsUsed = true;
                userToken.UsedAt = DateTime.UtcNow;

                // Vô hiệu hóa tất cả token khác của user (logout khỏi các thiết bị khác)
                var otherTokens = await _context.UserTokens
                    .Where(ut => ut.UserId == user.Id && ut.Id != userToken.Id && !ut.IsUsed)
                    .ToListAsync();

                foreach (var otherToken in otherTokens)
                {
                    otherToken.IsUsed = true;
                    otherToken.UsedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                // Gửi email thông báo đổi mật khẩu thành công
                await _emailService.SendPasswordResetSuccessAsync(user.Email, user.FullName);

                await _auditLogService.LogPasswordResetSuccessAsync(user.Id);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.",
                    StatusCode = 200,
                    Data = new
                    {
                        email = user.Email,
                        fullName = user.FullName
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password reset");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Token))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token xác minh là bắt buộc.",
                        StatusCode = 400
                    });
                }

                // Tìm token trong DB
                var userToken = await _context.UserTokens
                    .Include(ut => ut.User)
                    .FirstOrDefaultAsync(ut =>
                        ut.Token == request.Token &&
                        !ut.IsUsed);

                if (userToken == null)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token xác minh không hợp lệ hoặc đã được sử dụng.",
                        StatusCode = 400
                    });
                }

                if (userToken.ExpiresAt < DateTime.UtcNow)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token xác minh đã hết hạn.",
                        StatusCode = 400
                    });
                }

                var user = userToken.User;
                user.IsEmailVerified = true;
                user.UpdatedAt = DateTime.UtcNow;

                // Đánh dấu token đã dùng
                userToken.IsUsed = true;
                userToken.UsedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await _auditLogService.LogActionAsync(
                                             "EMAIL_VERIFIED",
                                             "User",
                                             user.Id,
                                             null,
                                             "User verified email successfully"
                                         );


                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Xác minh email thành công! Bạn có thể đăng nhập.",
                    StatusCode = 200
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during email verification");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                int? userId = null;

                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int parsedUserId))
                {
                    userId = parsedUserId;
                }

                Response.Cookies.Delete("jwt", new CookieOptions
                {
                    Path = "/",
                    Secure = true,
                    HttpOnly = true,
                    SameSite = SameSiteMode.None
                });

                if (userId.HasValue)
                {
                    await _auditLogService.LogLogoutAsync(userId.Value);
                }

                return Ok(new
                {
                    success = true,
                    message = "Đăng xuất thành công.",
                    statusCode = 200
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Lỗi hệ thống",
                    statusCode = 500,
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy thông tin profile của user hiện tại kèm thống kê đăng nhập
        /// </summary>
     
    }
}