using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QBooking.Services.Interfaces;
using QBooking.DTOs.Requests;
using QBooking.DTOs.Responses;
using QBooking.Dtos.Response;
using System.Security.Claims;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly ILogger<ReviewController> _logger;

        public ReviewController(IReviewService reviewService, ILogger<ReviewController> logger)
        {
            _reviewService = reviewService;
            _logger = logger;
        }

        /// <summary>
        /// Admin: Get all reviews with advanced filtering
        /// </summary>
        [HttpGet("admin/reviews")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<ReviewListResponse>>> GetAllReviews([FromQuery] AdminReviewFilterRequest request)
        {
            try
            {
                var result = await _reviewService.GetAllReviewsAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all reviews");
                return StatusCode(500, new ApiResponse<ReviewListResponse>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Admin: Get review by ID
        /// </summary>
        [HttpGet("admin/reviews/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<ReviewResponse>>> GetReviewById(int id)
        {
            try
            {
                var result = await _reviewService.GetReviewByIdAsync(id);

                if (!result.Success)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting review");
                return StatusCode(500, new ApiResponse<ReviewResponse>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Admin: Update review status (published/hidden)
        /// </summary>
        [HttpPatch("admin/reviews/{id}/status")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<ReviewResponse>>> UpdateReviewStatus(int id, [FromBody] UpdateReviewStatusRequest request)
        {
            try
            {
                var result = await _reviewService.UpdateReviewStatusAsync(id, request.Status);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating review status");
                return StatusCode(500, new ApiResponse<ReviewResponse>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Admin: Toggle featured status
        /// </summary>
        [HttpPatch("admin/reviews/{id}/featured")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<ReviewResponse>>> ToggleFeaturedStatus(int id)
        {
            try
            {
                var result = await _reviewService.ToggleFeaturedStatusAsync(id);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling featured status");
                return StatusCode(500, new ApiResponse<ReviewResponse>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Admin: Delete review
        /// </summary>
        [HttpDelete("admin/reviews/{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteReview(int id)
        {
            try
            {
                var result = await _reviewService.DeleteReviewByAdminAsync(id);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting review");
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Admin: Delete host reply
        /// </summary>
        [HttpDelete("admin/reviews/{reviewId}/host-reply")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteHostReplyByAdmin(int reviewId)
        {
            try
            {
                var result = await _reviewService.DeleteHostReplyByAdminAsync(reviewId);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting host reply");
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        // ===== STATISTICS ENDPOINTS =====

        /// <summary>
        /// Admin: Get review statistics overview
        /// </summary>
        [HttpGet("admin/statistics/overview")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<ReviewStatisticsResponse>>> GetReviewStatistics([FromQuery] StatisticsFilterRequest request)
        {
            try
            {
                var result = await _reviewService.GetReviewStatisticsAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting review statistics");
                return StatusCode(500, new ApiResponse<ReviewStatisticsResponse>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Admin: Get review trends by date range
        /// </summary>
        [HttpGet("admin/statistics/trends")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<List<ReviewTrendResponse>>>> GetReviewTrends([FromQuery] TrendsFilterRequest request)
        {
            try
            {
                var result = await _reviewService.GetReviewTrendsAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting review trends");
                return StatusCode(500, new ApiResponse<List<ReviewTrendResponse>>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Admin: Get top rated properties
        /// </summary>
        [HttpGet("admin/statistics/top-properties")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<List<TopPropertyResponse>>>> GetTopRatedProperties([FromQuery] TopPropertiesFilterRequest request)
        {
            try
            {
                var result = await _reviewService.GetTopRatedPropertiesAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting top properties");
                return StatusCode(500, new ApiResponse<List<TopPropertyResponse>>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Admin: Get rating distribution
        /// </summary>
        [HttpGet("admin/statistics/rating-distribution")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<RatingDistributionResponse>>> GetRatingDistribution([FromQuery] StatisticsFilterRequest request)
        {
            try
            {
                var result = await _reviewService.GetRatingDistributionAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting rating distribution");
                return StatusCode(500, new ApiResponse<RatingDistributionResponse>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Admin: Get host response statistics
        /// </summary>
        [HttpGet("admin/statistics/host-responses")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<HostResponseStatisticsResponse>>> GetHostResponseStatistics([FromQuery] StatisticsFilterRequest request)
        {
            try
            {
                var result = await _reviewService.GetHostResponseStatisticsAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting host response statistics");
                return StatusCode(500, new ApiResponse<HostResponseStatisticsResponse>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Customer: Create a new review for a completed booking
        /// </summary>
        [HttpPost("customer/create")]
        [Authorize(Roles = "customer")]
        public async Task<ActionResult<ApiResponse<ReviewResponse>>> CreateReview([FromForm] CreateReviewRequest request)
        {
            try
            {
                var customerId = GetCurrentUserId();
                var result = await _reviewService.CreateReviewAsync(customerId, request);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return CreatedAtAction(nameof(GetMyReviewById), new { id = result.Data.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating review");
                return StatusCode(500, new ApiResponse<ReviewResponse>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Customer: Get all my reviews
        /// </summary>
        [HttpGet("customer/my-reviews")]
        [Authorize(Roles = "customer")]
        public async Task<ActionResult<ApiResponse<ReviewListResponse>>> GetMyReviews([FromQuery] ReviewFilterRequest request)
        {
            try
            {
                var customerId = GetCurrentUserId();
                var result = await _reviewService.GetMyReviewsAsync(customerId, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer reviews");
                return StatusCode(500, new ApiResponse<ReviewListResponse>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Customer: Get a specific review by ID
        /// </summary>
        [HttpGet("customer/my-reviews/{id}")]
        [Authorize(Roles = "customer")]
        public async Task<ActionResult<ApiResponse<ReviewResponse>>> GetMyReviewById(int id)
        {
            try
            {
                var customerId = GetCurrentUserId();
                var result = await _reviewService.GetMyReviewByIdAsync(id, customerId);

                if (!result.Success)
                {
                    return NotFound(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting review");
                return StatusCode(500, new ApiResponse<ReviewResponse>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Customer: Update my review
        /// </summary>
        [HttpPut("customer/my-reviews/{id}")]
        [Authorize(Roles = "customer")]
        public async Task<ActionResult<ApiResponse<ReviewResponse>>> UpdateMyReview(int id, [FromForm] UpdateReviewRequest request)
        {
            try
            {
                var customerId = GetCurrentUserId();
                var result = await _reviewService.UpdateReviewAsync(id, customerId, request);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating review");
                return StatusCode(500, new ApiResponse<ReviewResponse>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Customer: Delete my review
        /// </summary>
        [HttpDelete("customer/my-reviews/{id}")]
        [Authorize(Roles = "customer")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteMyReview(int id)
        {
            try
            {
                var customerId = GetCurrentUserId();
                var result = await _reviewService.DeleteReviewAsync(id, customerId);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting review");
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        // ===== HOST ENDPOINTS =====

        /// <summary>
        /// Host: Add reply to a review
        /// </summary>
        [HttpPost("host/reviews/{reviewId}/reply")]
        [Authorize(Roles = "host")]
        public async Task<ActionResult<ApiResponse<ReviewResponse>>> AddHostReply(int reviewId, [FromBody] HostReplyRequest request)
        {
            try
            {
                var hostId = GetCurrentUserId();
                var result = await _reviewService.AddHostReplyAsync(reviewId, hostId, request);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding host reply");
                return StatusCode(500, new ApiResponse<ReviewResponse>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Host: Update reply to a review
        /// </summary>
        [HttpPut("host/reviews/{reviewId}/reply")]
        [Authorize(Roles = "host")]
        public async Task<ActionResult<ApiResponse<ReviewResponse>>> UpdateHostReply(int reviewId, [FromBody] HostReplyRequest request)
        {
            try
            {
                var hostId = GetCurrentUserId();
                var result = await _reviewService.UpdateHostReplyAsync(reviewId, hostId, request);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating host reply");
                return StatusCode(500, new ApiResponse<ReviewResponse>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Host: Delete reply from a review
        /// </summary>
        [HttpDelete("host/reviews/{reviewId}/reply")]
        [Authorize(Roles = "host")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteHostReply(int reviewId)
        {
            try
            {
                var hostId = GetCurrentUserId();
                var result = await _reviewService.DeleteHostReplyAsync(reviewId, hostId);

                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting host reply");
                return StatusCode(500, new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Host: Get all my properties with review statistics
        /// </summary>
        [HttpGet("host/my-properties-reviews")]
        [Authorize(Roles = "host")]
        public async Task<ActionResult<ApiResponse<List<HostPropertyReviewsResponse>>>> GetMyPropertiesReviews()
        {
            try
            {
                var hostId = GetCurrentUserId();
                var result = await _reviewService.GetHostPropertiesWithRepliesAsync(hostId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting host properties reviews");
                return StatusCode(500, new ApiResponse<List<HostPropertyReviewsResponse>>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        /// <summary>
        /// Host: Get all reviews for a specific property (requires ownership)
        /// </summary>
        [HttpGet("host/property/{propertyId}/reviews")]
        [Authorize(Roles = "host")]
        public async Task<ActionResult<ApiResponse<ReviewListResponse>>> GetMyPropertyReviews(
            int propertyId,
            [FromQuery] ReviewFilterRequest request)
        {
            try
            {
                request.PropertyId = propertyId;
                var result = await _reviewService.GetPropertyReviewsAsync(propertyId, request);

                // Note: Additional authorization check should be done in service to verify property ownership
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting property reviews");
                return StatusCode(500, new ApiResponse<ReviewListResponse>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        // ===== PUBLIC ENDPOINTS =====

        /// <summary>
        /// Public: Get all reviews for a property
        /// </summary>
        [HttpGet("property/{propertyId}")]
        public async Task<ActionResult<ApiResponse<ReviewListResponse>>> GetPropertyReviews(
            int propertyId,
            [FromQuery] ReviewFilterRequest request)
        {
            try
            {
                var result = await _reviewService.GetPropertyReviewsAsync(propertyId, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting property reviews");
                return StatusCode(500, new ApiResponse<ReviewListResponse>
                {
                    Success = false,
                    Message = "Internal server error"
                });
            }
        }

        // ===== HELPER METHODS =====

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("Invalid user ID");
        }
    }
}