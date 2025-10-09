using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QBooking.Dtos.Request;
using QBooking.Dtos.Response;
using QBooking.Models;
using QBooking.Services;
using System.Security.Claims;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PropertyController : ControllerBase
    {
        private readonly IPropertyService _propertyService;
        private readonly ILogger<PropertyController> _logger;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public PropertyController(
            IPropertyService propertyService,
            ILogger<PropertyController> logger,
            IWebHostEnvironment webHostEnvironment)
        {
            _propertyService = propertyService;
            _logger = logger;
            _webHostEnvironment = webHostEnvironment;
        }
        // ========== ADMIN MANAGEMENT ENDPOINTS ==========

        [HttpGet("admin/all")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAllForAdmin([FromQuery] PropertyAdminFilterRequest filter)
        {
            try
            {
                var result = await _propertyService.GetAllPropertiesForAdminAsync(filter);
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting properties for admin");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }

        [HttpGet("admin/{id}/detail")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetDetailForAdmin(int id)
        {
            try
            {
                var result = await _propertyService.GetPropertyDetailForAdminAsync(id);

                if (!result.Success)
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = result.Message,
                        StatusCode = 404
                    });

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting property detail for admin");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }

        [HttpPut("admin/{id}/reject")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> RejectProperty(int id, [FromBody] RejectPropertyRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ",
                        StatusCode = 401
                    });

                int adminId = int.Parse(userIdClaim.Value);
                var result = await _propertyService.RejectPropertyAsync(id, adminId, request.Reason);

                if (!result.Success)
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = result.Message,
                        StatusCode = 400
                    });

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting property");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }

        [HttpPut("admin/{id}/deactivate")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeactivateProperty(int id, [FromBody] DeactivatePropertyRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ",
                        StatusCode = 401
                    });

                int adminId = int.Parse(userIdClaim.Value);
                var result = await _propertyService.DeactivatePropertyAsync(id, adminId, request.Reason);

                if (!result.Success)
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = result.Message,
                        StatusCode = 400
                    });

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deactivating property");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }

        [HttpPut("admin/{id}/activate")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ActivateProperty(int id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ",
                        StatusCode = 401
                    });

                int adminId = int.Parse(userIdClaim.Value);
                var result = await _propertyService.ActivatePropertyAsync(id, adminId);

                if (!result.Success)
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = result.Message,
                        StatusCode = 400
                    });

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error activating property");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }

        [HttpGet("admin/statistics")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetStatistics()
        {
            try
            {
                var result = await _propertyService.GetPropertyStatisticsAsync();
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting statistics");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }

        [HttpGet("admin/by-status/{status}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetByStatus(string status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var result = await _propertyService.GetPropertiesByStatusAsync(status, page, pageSize);
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting properties by status");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }

        // Request DTOs
        public class RejectPropertyRequest
        {
            public string Reason { get; set; }
        }

        public class DeactivatePropertyRequest
        {
            public string Reason { get; set; }
        }
        // GET MY PROPERTIES (cho host)
        [HttpGet("my-properties")]
        [Authorize(Roles = "host")]
        public async Task<IActionResult> GetMyProperties([FromQuery] PropertyHostFilterRequest filter)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                int hostId = int.Parse(userIdClaim.Value);

                var result = await _propertyService.GetHostPropertiesAsync(filter, hostId);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting host properties");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
        // CREATE
        [HttpPost("create")]
        [Authorize(Roles = "host")]
        public async Task<IActionResult> Create([FromBody] CreatePropertyRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                int hostId = int.Parse(userIdClaim.Value);

                var result = await _propertyService.CreatePropertyAsync(request, hostId);

                if (!result.Success)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = result.Message,
                        StatusCode = 400
                    });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating property");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
        [HttpGet("approved")]
        public async Task<IActionResult> GetApprovedProperties([FromQuery] PropertyAppvoredFilterRequest filter)
        {
            try
            {
                var result = await _propertyService.GetApprovedPropertiesSortedAsync(filter);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting approved properties");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // GET FEATURED PROPERTIES
        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedProperties([FromQuery] PropertyFilterRequest filter)
        {
            try
            {
                var result = await _propertyService.GetFeaturedPropertiesAsync(filter);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting featured properties");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // SUBMIT FOR REVIEW (DRAFT TO PENDING)
        [HttpPut("{id}/submit-for-review")]
        [Authorize(Roles = "host")]
        public async Task<IActionResult> SubmitForReview(int id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                int hostId = int.Parse(userIdClaim.Value);

                var result = await _propertyService.SubmitPropertyForReviewAsync(id, hostId);

                if (!result.Success)
                {
                    return result.Message.Contains("không tồn tại hoặc") ?
                        NotFound(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 404
                        }) :
                        BadRequest(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 400
                        });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting property for review");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // APPROVE PROPERTY (PENDING TO APPROVED) - Admin only
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ApproveProperty(int id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                int approverId = int.Parse(userIdClaim.Value);

                var result = await _propertyService.ApprovePropertyAsync(id, approverId);

                if (!result.Success)
                {
                    return result.Message.Contains("không tồn tại") ?
                        NotFound(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 404
                        }) :
                        BadRequest(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 400
                        });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving property");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // TOGGLE FEATURED STATUS - Admin only
        [HttpPut("{id}/toggle-featured")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ToggleFeaturedStatus(int id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                int adminId = int.Parse(userIdClaim.Value);

                var result = await _propertyService.ToggleFeaturedStatusAsync(id, adminId);

                if (!result.Success)
                {
                    return result.Message.Contains("không tồn tại") ?
                        NotFound(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 404
                        }) :
                        BadRequest(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 400
                        });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling featured status");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
        // READ - Get All Properties
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] PropertyFilterRequest filter)
        {
            try
            {
                var result = await _propertyService.GetPropertiesAsync(filter);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting properties");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // READ - Get Property by Slug
        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            try
            {
                var result = await _propertyService.GetPropertyBySlugAsync(slug);

                if (!result.Success)
                {
                    return result.Message.Contains("không được để trống") ?
                        BadRequest(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 400
                        }) :
                        NotFound(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 404
                        });
                }

                return Ok(new ApiResponse<PropertyDetailResponse>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting property by slug: {Slug}", slug);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // UPDATE
        [HttpPut("{id}")]
        [Authorize(Roles = "host")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePropertyRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                int hostId = int.Parse(userIdClaim.Value);

                var result = await _propertyService.UpdatePropertyAsync(id, request, hostId);

                if (!result.Success)
                {
                    return result.Message.Contains("không tồn tại hoặc") ?
                        NotFound(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 404
                        }) :
                        BadRequest(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 400
                        });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating property");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // DELETE
        [HttpDelete("{id}")]
        [Authorize(Roles = "host")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                int hostId = int.Parse(userIdClaim.Value);

                // Get webRootPath
                var webRootPath = _webHostEnvironment.WebRootPath;
                if (string.IsNullOrEmpty(webRootPath))
                {
                    return StatusCode(500, new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Lỗi hệ thống: Không tìm thấy thư mục wwwroot",
                        StatusCode = 500
                    });
                }

                var result = await _propertyService.DeletePropertyAsync(id, hostId, webRootPath);

                if (!result.Success)
                {
                    return result.Message.Contains("không tồn tại hoặc") ?
                        NotFound(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 404
                        }) :
                        BadRequest(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 400
                        });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting property");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
        [HttpGet("{id}/booking")]
        [AllowAnonymous] // Cho phép truy cập không cần đăng nhập
        public async Task<IActionResult> GetPropertyForBooking(int id)
        {
            try
            {
                var result = await _propertyService.GetPropertyForBookingAsync(id);
                if (!result.Success)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = result.Message,
                        StatusCode = 404
                    });
                }

                return Ok(new ApiResponse<PropertyForBookingResponse>
                {
                    Success = true,
                    Message = "Lấy thông tin thành công",
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting property for booking by id: {Id}", id);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500
                });
            }
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                if (!int.TryParse(userIdClaim.Value, out int hostId))
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                var result = await _propertyService.GetPropertyForEditAsync(id, hostId);
                if (!result.Success)
                {
                    return result.Message.Contains("không được để trống") || result.Message.Contains("không hợp lệ") ?
                        BadRequest(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 400
                        }) :
                        NotFound(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 404
                        });
                }

                return Ok(new ApiResponse<PropertyForEditResponse>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting property for edit by id: {Id}", id);
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
        // UPLOAD IMAGES
        [HttpPost("{id}/upload-images")]
        [Authorize(Roles = "host")]
        public async Task<IActionResult> UploadImages(int id, [FromForm] UploadImageRequestAlternative request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                int hostId = int.Parse(userIdClaim.Value);

                var result = await _propertyService.UploadImagesAsync(id, request, hostId, _webHostEnvironment.WebRootPath);

                if (!result.Success)
                {
                    return result.Message.Contains("không tồn tại hoặc") ?
                        NotFound(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 404
                        }) :
                        BadRequest(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 400
                        });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading images");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // DELETE IMAGE
        [HttpDelete("image/{imageId}")]
        [Authorize(Roles = "host")]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                int hostId = int.Parse(userIdClaim.Value);

                var result = await _propertyService.DeleteImageAsync(imageId, hostId, _webHostEnvironment.WebRootPath);

                if (!result.Success)
                {
                    return result.Message.Contains("không tồn tại hoặc") ?
                        NotFound(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 404
                        }) :
                        BadRequest(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 400
                        });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // SET PRIMARY IMAGE
        [HttpPut("image/{imageId}/set-primary")]
        [Authorize(Roles = "host")]
        public async Task<IActionResult> SetPrimaryImage(int imageId)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Token không hợp lệ.",
                        StatusCode = 401
                    });
                }

                int hostId = int.Parse(userIdClaim.Value);

                var result = await _propertyService.SetPrimaryImageAsync(imageId, hostId);

                if (!result.Success)
                {
                    return result.Message.Contains("không tồn tại hoặc") ?
                        NotFound(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 404
                        }) :
                        BadRequest(new ApiResponse<object>
                        {
                            Success = false,
                            Message = result.Message,
                            StatusCode = 400
                        });
                }

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting primary image");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // PRODUCT TYPE ENDPOINTS

        [HttpGet("product-types")]
        public async Task<ActionResult<IEnumerable<ProductType>>> GetProductTypes(
            [FromQuery] bool includeInactive = false,
            [FromQuery] string? search = null)
        {
            try
            {
                var productTypes = await _propertyService.GetProductTypesAsync(includeInactive, search);
                return Ok(productTypes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product types");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy danh sách loại sản phẩm", error = ex.Message });
            }
        }

        [HttpGet("product-types/{id:int}")]
        public async Task<ActionResult<ProductType>> GetProductType(int id, [FromQuery] bool includeProperties = false)
        {
            try
            {
                var productType = await _propertyService.GetProductTypeByIdAsync(id, includeProperties);

                if (productType == null)
                {
                    return NotFound(new { message = $"Không tìm thấy loại sản phẩm với ID {id}" });
                }

                return Ok(productType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product type by ID");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy thông tin loại sản phẩm", error = ex.Message });
            }
        }

        [HttpGet("product-types/by-code/{code}")]
        public async Task<ActionResult<ProductType>> GetProductTypeByCode(string code)
        {
            try
            {
                var productType = await _propertyService.GetProductTypeByCodeAsync(code);

                if (productType == null)
                {
                    return NotFound(new { message = $"Không tìm thấy loại sản phẩm với mã {code}" });
                }

                return Ok(productType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product type by code");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi lấy thông tin loại sản phẩm", error = ex.Message });
            }
        }

        [HttpPost("product-types")]
        public async Task<ActionResult<ProductType>> CreateProductType(CreateProductTypeDto createDto)
        {
            try
            {
                var productType = await _propertyService.CreateProductTypeAsync(createDto);
                return CreatedAtAction(nameof(GetProductType), new { id = productType.Id }, productType);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product type");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi tạo loại sản phẩm", error = ex.Message });
            }
        }

        [HttpPut("product-types/{id:int}")]
        public async Task<IActionResult> UpdateProductType(int id, UpdateProductTypeDto updateDto)
        {
            try
            {
                var productType = await _propertyService.UpdateProductTypeAsync(id, updateDto);
                return Ok(new { message = "Cập nhật loại sản phẩm thành công", data = productType });
            }
            catch (ArgumentException ex)
            {
                return ex.Message.Contains("Không tìm thấy") ?
                    NotFound(new { message = ex.Message }) :
                    BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product type");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi cập nhật loại sản phẩm", error = ex.Message });
            }
        }

        [HttpDelete("product-types/{id:int}")]
        public async Task<IActionResult> DeleteProductType(int id, [FromQuery] bool forceDelete = false)
        {
            try
            {
                await _propertyService.DeleteProductTypeAsync(id, forceDelete);
                return Ok(new { message = "Xóa loại sản phẩm thành công" });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product type");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi xóa loại sản phẩm", error = ex.Message });
            }
        }

        [HttpPatch("product-types/{id:int}/toggle-active")]
        public async Task<IActionResult> ToggleActiveStatus(int id)
        {
            try
            {
                var isActive = await _propertyService.ToggleProductTypeActiveStatusAsync(id);
                var status = isActive ? "kích hoạt" : "vô hiệu hóa";
                return Ok(new
                {
                    message = $"Đã {status} loại sản phẩm thành công",
                    isActive = isActive
                });
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling product type active status");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi thay đổi trạng thái loại sản phẩm", error = ex.Message });
            }
        }

        [HttpGet("product-types/active-count")]
        public async Task<ActionResult<int>> GetActiveCount()
        {
            try
            {
                var count = await _propertyService.GetActiveProductTypesCountAsync();
                return Ok(new { activeCount = count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active product types count");
                return StatusCode(500, new { message = "Đã xảy ra lỗi khi đếm số loại sản phẩm", error = ex.Message });
            }
        }
        // GET SIMILAR PROPERTIES
        [HttpGet("{id}/similar")]
        public async Task<IActionResult> GetSimilarProperties(int id, [FromQuery] int limit = 10)
        {
            try
            {
                var result = await _propertyService.GetSimilarPropertiesAsync(id, limit);

                if (!result.Success)
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = result.Message,
                        StatusCode = 404
                    });

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting similar properties");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // GET MOST VIEWED PROPERTIES
        [HttpGet("most-viewed")]
        public async Task<IActionResult> GetMostViewedProperties([FromQuery] int limit = 10)
        {
            try
            {
                var result = await _propertyService.GetMostViewedPropertiesAsync(limit);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting most viewed properties");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        // GET MOST BOOKED PROPERTIES
        [HttpGet("most-booked")]
        public async Task<IActionResult> GetMostBookedProperties([FromQuery] int limit = 10)
        {
            try
            {
                var result = await _propertyService.GetMostBookedPropertiesAsync(limit);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = result.Message,
                    StatusCode = 200,
                    Data = result.Data
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting most booked properties");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Lỗi hệ thống",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
    }
}