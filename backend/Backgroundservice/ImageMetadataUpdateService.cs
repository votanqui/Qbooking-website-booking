using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Drawing;
using QBooking.Data;
using QBooking.Models;
using QBooking.Services;
using System.Text.Json;

namespace QBooking.Services.BackgroundServices
{
    public class ImageMetadataUpdateService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ImageMetadataUpdateService> _logger;
        private readonly TimeSpan _interval = TimeSpan.FromMinutes(30); // Chạy mỗi 30 phút

        public ImageMetadataUpdateService(
            IServiceProvider serviceProvider,
            ILogger<ImageMetadataUpdateService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Image Metadata Update Service started");

            // Log service start
            using var scope = _serviceProvider.CreateScope();
            var auditLogService = scope.ServiceProvider.GetRequiredService<AuditLogService>();
            await auditLogService.LogActionAsync("SERVICE_START", "ImageMetadataUpdateService", null, null,
                "Image Metadata Update Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessPendingImagesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred in Image Metadata Update Service");

                    // Log error to audit
                    using var errorScope = _serviceProvider.CreateScope();
                    var errorAuditService = errorScope.ServiceProvider.GetRequiredService<AuditLogService>();
                    await errorAuditService.LogActionAsync("SERVICE_ERROR", "ImageMetadataUpdateService", null, null,
                        $"Error in metadata update service: {ex.Message}");
                }

                await Task.Delay(_interval, stoppingToken);
            }
        }

        private async Task ProcessPendingImagesAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var webHostEnvironment = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
            var auditLogService = scope.ServiceProvider.GetRequiredService<AuditLogService>();

            try
            {
                // Tìm các ảnh chưa có thông tin FileSize, Width, Height
                var pendingImages = await context.PropertyImages
                    .Where(pi => pi.FileSize == null || pi.Width == null || pi.Height == null)
                    .Take(50) // Xử lý tối đa 50 ảnh mỗi lần để tránh overload
                    .ToListAsync();

                if (!pendingImages.Any())
                {
                    _logger.LogInformation("No pending images to process");

                    // Log processing attempt with no pending images
                    await auditLogService.LogActionAsync("METADATA_PROCESS_ATTEMPT", "PropertyImage", null, null,
                        "Metadata processing attempted - no pending images found");
                    return;
                }

                _logger.LogInformation($"Processing {pendingImages.Count} pending images");

                // Log processing start
                await auditLogService.LogActionAsync("METADATA_PROCESS_START", "PropertyImage", null, null,
                    $"Started processing metadata for {pendingImages.Count} images");

                var updatedCount = 0;
                var errorCount = 0;

                foreach (var image in pendingImages)
                {
                    try
                    {
                        // Capture old values for audit
                        var oldValues = JsonSerializer.Serialize(new
                        {
                            FileSize = image.FileSize,
                            Width = image.Width,
                            Height = image.Height
                        });

                        var updated = await UpdateImageMetadataAsync(image, webHostEnvironment.WebRootPath);
                        if (updated)
                        {
                            updatedCount++;

                            // Capture new values for audit
                            var newValues = JsonSerializer.Serialize(new
                            {
                                FileSize = image.FileSize,
                                Width = image.Width,
                                Height = image.Height,
                                ImageUrl = image.ImageUrl
                            });

                            // Log individual image metadata update
                            await auditLogService.LogActionAsync("METADATA_UPDATE", "PropertyImage", image.Id,
                                oldValues, newValues);
                        }
                        else
                        {
                            // Log failed update attempt
                            await auditLogService.LogActionAsync("METADATA_UPDATE_FAILED", "PropertyImage", image.Id,
                                null, $"Failed to update metadata for image: {image.ImageUrl}");
                        }
                    }
                    catch (Exception ex)
                    {
                        errorCount++;
                        _logger.LogWarning(ex, $"Failed to update metadata for image {image.Id}: {image.ImageUrl}");

                        // Log individual image error
                        await auditLogService.LogActionAsync("METADATA_UPDATE_ERROR", "PropertyImage", image.Id,
                            null, $"Error updating metadata: {ex.Message} - ImageUrl: {image.ImageUrl}");
                    }
                }

                if (updatedCount > 0)
                {
                    await context.SaveChangesAsync();
                    _logger.LogInformation($"Updated metadata for {updatedCount} images, {errorCount} errors");
                }

                // Log processing completion
                await auditLogService.LogActionAsync("METADATA_PROCESS_COMPLETED", "PropertyImage", null, null,
                    $"Processing completed. Updated: {updatedCount} images, Errors: {errorCount}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ProcessPendingImagesAsync");

                // Log processing error
                await auditLogService.LogActionAsync("METADATA_PROCESS_ERROR", "PropertyImage", null, null,
                    $"Error during metadata processing: {ex.Message}");
            }
        }

        private async Task<bool> UpdateImageMetadataAsync(PropertyImage image, string webRootPath)
        {
            try
            {
                // Tạo đường dẫn file từ ImageUrl
                var imagePath = image.ImageUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                var fullPath = Path.Combine(webRootPath, imagePath);

                if (!File.Exists(fullPath))
                {
                    _logger.LogWarning($"Image file not found: {fullPath}");
                    return false;
                }

                // Lấy file size
                var fileInfo = new FileInfo(fullPath);
                image.FileSize = (int)fileInfo.Length;

                // Lấy kích thước ảnh
                try
                {
                    using var img = Image.FromFile(fullPath);
                    image.Width = img.Width;
                    image.Height = img.Height;
                }
                catch (OutOfMemoryException)
                {
                    // File không phải là ảnh hợp lệ
                    _logger.LogWarning($"Invalid image format: {fullPath}");
                    return false;
                }

                _logger.LogDebug($"Updated metadata for image {image.Id}: Size={image.FileSize}, Dimensions={image.Width}x{image.Height}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating metadata for image {image.Id}");
                return false;
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Image Metadata Update Service is stopping");

            // Log service stop
            using var scope = _serviceProvider.CreateScope();
            var auditLogService = scope.ServiceProvider.GetRequiredService<AuditLogService>();
            await auditLogService.LogActionAsync("SERVICE_STOP", "ImageMetadataUpdateService", null, null,
                "Image Metadata Update Service stopped");

            await base.StopAsync(stoppingToken);
        }
    }
}