using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QBooking.Data;
using QBooking.Models;
using Microsoft.EntityFrameworkCore;
using QBooking.Dtos.Response;

namespace QBooking.Controllers
{
    [Route("api/admin/[controller]")]
    [ApiController]
    [Authorize(Roles = "admin")] // Yêu cầu quyền Admin
    public class WebsiteSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public WebsiteSettingsController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // GET: api/admin/websitesettings
        [HttpGet]
        public async Task<ActionResult<ApiResponse<WebsiteSetting>>> GetSettings()
        {
            try
            {
                var settings = await _context.WebsiteSettings.FirstOrDefaultAsync();

                if (settings == null)
                {
                    return NotFound(new ApiResponse<WebsiteSetting>
                    {
                        Success = false,
                        Message = "Chưa có cấu hình website",
                        StatusCode = 404,
                        Data = null,
                        Error = "Settings not found"
                    });
                }

                return Ok(new ApiResponse<WebsiteSetting>
                {
                    Success = true,
                    Message = "Lấy cấu hình thành công",
                    StatusCode = 200,
                    Data = settings
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<WebsiteSetting>
                {
                    Success = false,
                    Message = "Lỗi khi lấy cấu hình",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // POST/PUT: api/admin/websitesettings
        [HttpPost]
        public async Task<ActionResult<WebsiteSetting>> UpsertSettings([FromForm] WebsiteSettingsDto dto)
        {
            try
            {
                var settings = await _context.WebsiteSettings.FirstOrDefaultAsync();
                bool isNew = settings == null;

                if (isNew)
                {
                    settings = new WebsiteSetting
                    {
                        CreatedAt = DateTime.Now
                    };
                }

                // Cập nhật thông tin chung
                settings.SiteName = dto.SiteName;
                settings.SiteDescription = dto.SiteDescription;
                settings.SupportEmail = dto.SupportEmail;
                settings.SupportPhone = dto.SupportPhone;
                settings.Address = dto.Address;

                // Cập nhật SEO
                settings.MetaTitle = dto.MetaTitle;
                settings.MetaDescription = dto.MetaDescription;
                settings.MetaKeywords = dto.MetaKeywords;

                // Cập nhật mạng xã hội
                settings.FacebookUrl = dto.FacebookUrl;
                settings.TwitterUrl = dto.TwitterUrl;
                settings.InstagramUrl = dto.InstagramUrl;
                settings.YoutubeUrl = dto.YoutubeUrl;
                settings.TiktokUrl = dto.TiktokUrl;

                // Cập nhật thông tin ngân hàng
                settings.BankName = dto.BankName;
                settings.BankAccountName = dto.BankAccountName;
                settings.BankAccountNumber = dto.BankAccountNumber;

                // Xử lý upload Logo
                if (dto.Logo != null)
                {
                    // Xóa logo cũ nếu có
                    if (!string.IsNullOrEmpty(settings.LogoUrl))
                    {
                        DeleteFile(settings.LogoUrl);
                    }
                    settings.LogoUrl = await SaveFile(dto.Logo, "logo");
                }

                // Xử lý upload Favicon
                if (dto.Favicon != null)
                {
                    // Xóa favicon cũ nếu có
                    if (!string.IsNullOrEmpty(settings.FaviconUrl))
                    {
                        DeleteFile(settings.FaviconUrl);
                    }
                    settings.FaviconUrl = await SaveFile(dto.Favicon, "favicon");
                }

                settings.UpdatedAt = DateTime.Now;

                if (isNew)
                {
                    _context.WebsiteSettings.Add(settings);
                }
                else
                {
                    _context.WebsiteSettings.Update(settings);
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = isNew ? "Tạo cấu hình website thành công" : "Cập nhật cấu hình website thành công",
                    data = settings
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lưu cấu hình", error = ex.Message });
            }
        }

        // DELETE: api/admin/websitesettings/logo
        [HttpDelete("logo")]
        public async Task<ActionResult> DeleteLogo()
        {
            var settings = await _context.WebsiteSettings.FirstOrDefaultAsync();
            if (settings == null || string.IsNullOrEmpty(settings.LogoUrl))
            {
                return NotFound(new { message = "Không tìm thấy logo" });
            }

            DeleteFile(settings.LogoUrl);
            settings.LogoUrl = null;
            settings.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Xóa logo thành công" });
        }

        // DELETE: api/admin/websitesettings/favicon
        [HttpDelete("favicon")]
        public async Task<ActionResult> DeleteFavicon()
        {
            var settings = await _context.WebsiteSettings.FirstOrDefaultAsync();
            if (settings == null || string.IsNullOrEmpty(settings.FaviconUrl))
            {
                return NotFound(new { message = "Không tìm thấy favicon" });
            }

            DeleteFile(settings.FaviconUrl);
            settings.FaviconUrl = null;
            settings.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Xóa favicon thành công" });
        }
        [HttpGet("public")]
        [AllowAnonymous] // Cho phép truy cập không cần đăng nhập
        public async Task<ActionResult<ApiResponse<PublicWebsiteSettingsDto>>> GetPublicSettings()
        {
            var settings = await _context.WebsiteSettings.FirstOrDefaultAsync();

            if (settings == null)
            {
                return NotFound(new ApiResponse<PublicWebsiteSettingsDto>
                {
                    Success = false,
                    Message = "Chưa có cấu hình website",
                    StatusCode = 404,
                    Data = null,
                    Error = "Website settings not found"
                });
            }

            // Chỉ trả về thông tin công khai, không có thông tin nhạy cảm
            var publicSettings = new PublicWebsiteSettingsDto
            {
                SiteName = settings.SiteName,
                SiteDescription = settings.SiteDescription,
                LogoUrl = settings.LogoUrl,
                FaviconUrl = settings.FaviconUrl,
                SupportEmail = settings.SupportEmail,
                SupportPhone = settings.SupportPhone,
                Address = settings.Address,

                // SEO
                MetaTitle = settings.MetaTitle,
                MetaDescription = settings.MetaDescription,
                MetaKeywords = settings.MetaKeywords,

                // Mạng xã hội
                FacebookUrl = settings.FacebookUrl,
                TwitterUrl = settings.TwitterUrl,
                InstagramUrl = settings.InstagramUrl,
                YoutubeUrl = settings.YoutubeUrl,
                TiktokUrl = settings.TiktokUrl
            };

            return Ok(new ApiResponse<PublicWebsiteSettingsDto>
            {
                Success = true,
                Message = "Lấy thông tin website thành công",
                StatusCode = 200,
                Data = publicSettings,
                Error = null
            });
        }
        #region Helper Methods

        private async Task<string> SaveFile(IFormFile file, string prefix)
        {
            if (file == null || file.Length == 0)
                return null;

            var uploadsFolder = Path.Combine(_env.WebRootPath, "settings");

            // Tạo thư mục nếu chưa tồn tại
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Tạo tên file unique
            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = $"{prefix}_{DateTime.Now:yyyyMMddHHmmss}{fileExtension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            // Lưu file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Trả về đường dẫn tương đối
            return $"/settings/{fileName}";
        }

        private void DeleteFile(string fileUrl)
        {
            if (string.IsNullOrEmpty(fileUrl))
                return;

            var filePath = Path.Combine(_env.WebRootPath, fileUrl.TrimStart('/'));

            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }

        #endregion
    }


}
