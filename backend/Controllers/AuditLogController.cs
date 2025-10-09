// Controllers/AuditLogController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QBooking.Dtos.Response;
using QBooking.Models;
using QBooking.Services;

namespace QBooking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin")] // Chỉ admin mới có quyền truy cập
    public class AuditLogController : ControllerBase
    {
        private readonly AuditLogService _auditLogService;

        public AuditLogController(AuditLogService auditLogService)
        {
            _auditLogService = auditLogService;
        }

        /// <summary>
        /// Lấy danh sách audit logs với filter và phân trang
        /// </summary>
        /// <param name="userId">ID người dùng (tùy chọn)</param>
        /// <param name="tableName">Tên bảng (tùy chọn)</param>
        /// <param name="actionType">Loại hành động (tùy chọn)</param>
        /// <param name="fromDate">Từ ngày (tùy chọn)</param>
        /// <param name="toDate">Đến ngày (tùy chọn)</param>
        /// <param name="page">Trang hiện tại (mặc định: 1)</param>
        /// <param name="pageSize">Số bản ghi trên trang (mặc định: 50, tối đa: 100)</param>
        /// <returns>Danh sách audit logs</returns>
        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<AuditLogResponseDto>>> GetAuditLogs(
            [FromQuery] int? userId = null,
            [FromQuery] string? tableName = null,
            [FromQuery] string? actionType = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                // Validate parameters
                if (page <= 0) page = 1;
                if (pageSize <= 0) pageSize = 50;
                if (pageSize > 100) pageSize = 100;

                // Validate date range
                if (fromDate.HasValue && toDate.HasValue && fromDate > toDate)
                {
                    return BadRequest(new ApiResponse<AuditLogResponseDto>
                    {
                        Success = false,
                        Message = "From date cannot be greater than to date",
                        StatusCode = 400,
                        Error = "Invalid date range"
                    });
                }

                var auditLogs = await _auditLogService.GetAuditLogsAsync(
                    userId, tableName, fromDate, toDate, page, pageSize);

                var totalCount = await _auditLogService.GetAuditLogsCountAsync(
                    userId, tableName, fromDate, toDate);

                // Filter by action type if specified
                if (!string.IsNullOrEmpty(actionType))
                {
                    auditLogs = auditLogs.Where(a => a.ActionType.Equals(actionType, StringComparison.OrdinalIgnoreCase)).ToList();
                }

                var response = new AuditLogResponseDto
                {
                    AuditLogs = auditLogs.Select(MapToDto).ToList(),
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                };

                return Ok(new ApiResponse<AuditLogResponseDto>
                {
                    Success = true,
                    Message = "Audit logs retrieved successfully",
                    StatusCode = 200,
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<AuditLogResponseDto>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy chi tiết một audit log theo ID
        /// </summary>
        /// <param name="id">ID của audit log</param>
        /// <returns>Chi tiết audit log</returns>
        [HttpGet("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<AuditLogDto>>> GetAuditLogById(int id)
        {
            try
            {
                var auditLogs = await _auditLogService.GetAuditLogsAsync();
                var auditLog = auditLogs.FirstOrDefault(a => a.Id == id);

                if (auditLog == null)
                {
                    return NotFound(new ApiResponse<AuditLogDto>
                    {
                        Success = false,
                        Message = "Audit log not found",
                        StatusCode = 404,
                        Error = $"Audit log with ID {id} does not exist"
                    });
                }

                return Ok(new ApiResponse<AuditLogDto>
                {
                    Success = true,
                    Message = "Audit log retrieved successfully",
                    StatusCode = 200,
                    Data = MapToDto(auditLog)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<AuditLogDto>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy thống kê audit logs
        /// </summary>
        /// <param name="fromDate">Từ ngày (tùy chọn)</param>
        /// <param name="toDate">Đến ngày (tùy chọn)</param>
        /// <returns>Thống kê audit logs</returns>
        [HttpGet("statistics")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<AuditLogStatisticsDto>>> GetAuditLogStatistics(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var auditLogs = await _auditLogService.GetAuditLogsAsync(
                    fromDate: fromDate, toDate: toDate, pageSize: int.MaxValue);

                var statistics = new AuditLogStatisticsDto
                {
                    TotalActions = auditLogs.Count,
                    ActionsByType = auditLogs
                        .GroupBy(a => a.ActionType)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    ActionsByTable = auditLogs
                        .GroupBy(a => a.TableName)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    TopUsers = auditLogs
                        .Where(a => a.UserId.HasValue)
                        .GroupBy(a => new {
                            a.UserId,
                            UserName = a.User?.FullName ?? "Unknown",
                            Email = a.User?.Email ?? "Unknown"
                        })
                        .OrderByDescending(g => g.Count())
                        .Take(10)
                        .ToDictionary(
                            g => $"{g.Key.UserName} ({g.Key.Email})", // key: "Tên (Email)"
                            g => g.Count()
                        ),

                    ActionsByDay = auditLogs
                        .GroupBy(a => a.ActionTime.Date)
                        .OrderBy(g => g.Key)
                        .ToDictionary(g => g.Key.ToString("yyyy-MM-dd"), g => g.Count())
                };

                return Ok(new ApiResponse<AuditLogStatisticsDto>
                {
                    Success = true,
                    Message = "Statistics retrieved successfully",
                    StatusCode = 200,
                    Data = statistics
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<AuditLogStatisticsDto>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Xuất audit logs ra file CSV
        /// </summary>
        /// <param name="userId">ID người dùng (tùy chọn)</param>
        /// <param name="tableName">Tên bảng (tùy chọn)</param>
        /// <param name="fromDate">Từ ngày (tùy chọn)</param>
        /// <param name="toDate">Đến ngày (tùy chọn)</param>
        /// <returns>File CSV</returns>
        [HttpGet("export/csv")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ExportToCsv(
            [FromQuery] int? userId = null,
            [FromQuery] string? tableName = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var auditLogs = await _auditLogService.GetAuditLogsAsync(
                    userId, tableName, fromDate, toDate, pageSize: int.MaxValue);

                var csv = GenerateCsv(auditLogs);
                var bytes = System.Text.Encoding.UTF8.GetBytes(csv);

                var fileName = $"audit_logs_{DateTime.Now:yyyyMMdd_HHmmss}.csv";

                return File(bytes, "text/csv", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Export failed",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy danh sách các bảng có audit log
        /// </summary>
        /// <returns>Danh sách tên bảng</returns>
        [HttpGet("tables")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<List<string>>>> GetAuditedTables()
        {
            try
            {
                var auditLogs = await _auditLogService.GetAuditLogsAsync(pageSize: int.MaxValue);
                var tables = auditLogs.Select(a => a.TableName).Distinct().OrderBy(t => t).ToList();

                return Ok(new ApiResponse<List<string>>
                {
                    Success = true,
                    Message = "Audited tables retrieved successfully",
                    StatusCode = 200,
                    Data = tables
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<string>>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy danh sách các loại hành động
        /// </summary>
        /// <returns>Danh sách loại hành động</returns>
        [HttpGet("action-types")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<List<string>>>> GetActionTypes()
        {
            try
            {
                var auditLogs = await _auditLogService.GetAuditLogsAsync(pageSize: int.MaxValue);
                var actionTypes = auditLogs.Select(a => a.ActionType).Distinct().OrderBy(t => t).ToList();

                return Ok(new ApiResponse<List<string>>
                {
                    Success = true,
                    Message = "Action types retrieved successfully",
                    StatusCode = 200,
                    Data = actionTypes
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<string>>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        #region Private Methods

        private static AuditLogDto MapToDto(AuditLog auditLog)
        {
            return new AuditLogDto
            {
                Id = auditLog.Id,
                ActionType = auditLog.ActionType,
                TableName = auditLog.TableName,
                RecordId = auditLog.RecordId,
                UserId = auditLog.UserId,
                UserName = auditLog.User?.FullName ?? "Unknown",
                IPAddress = auditLog.IPAddress,
                UserAgent = auditLog.UserAgent,
                ActionTime = auditLog.ActionTime,
                OldValues = auditLog.OldValues,
                NewValues = auditLog.NewValues
            };
        }

        private static string GenerateCsv(List<AuditLog> auditLogs)
        {
            var csv = new System.Text.StringBuilder();
            csv.AppendLine("Id,ActionType,TableName,RecordId,UserId,UserName,IPAddress,UserAgent,ActionTime,OldValues,NewValues");

            foreach (var log in auditLogs)
            {
                csv.AppendLine($"{log.Id}," +
                              $"\"{log.ActionType}\"," +
                              $"\"{log.TableName}\"," +
                              $"{log.RecordId}," +
                              $"{log.UserId}," +
                              $"\"{log.User?.FullName ?? "Unknown"}\"," +
                              $"\"{log.IPAddress}\"," +
                              $"\"{EscapeCsv(log.UserAgent)}\"," +
                              $"\"{log.ActionTime:yyyy-MM-dd HH:mm:ss}\"," +
                              $"\"{EscapeCsv(log.OldValues)}\"," +
                              $"\"{EscapeCsv(log.NewValues)}\"");
            }

            return csv.ToString();
        }

        private static string EscapeCsv(string field)
        {
            if (string.IsNullOrEmpty(field)) return string.Empty;
            return field.Replace("\"", "\"\"");
        }
        /// <summary>
        /// Lấy thống kê tổng quan hệ thống
        /// </summary>
        [HttpGet("dashboard/overview")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<DashboardOverviewAuditlogDto>>> GetDashboardOverview(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                fromDate ??= DateTime.UtcNow.AddDays(-30);
                toDate ??= DateTime.UtcNow;

                var auditLogs = await _auditLogService.GetAuditLogsAsync(
                    fromDate: fromDate, toDate: toDate, pageSize: int.MaxValue);

                var totalUsers = auditLogs.Where(a => a.UserId.HasValue).Select(a => a.UserId).Distinct().Count();
                var totalActions = auditLogs.Count;
                var totalTables = auditLogs.Select(a => a.TableName).Distinct().Count();

                var recentActions = auditLogs.OrderByDescending(a => a.ActionTime).Take(10);
                var actionTrend = auditLogs
                    .GroupBy(a => a.ActionTime.Date)
                    .OrderBy(g => g.Key)
                    .Select(g => new ActionTrendDto
                    {
                        Date = g.Key,
                        Count = g.Count()
                    }).ToList();

                var overview = new DashboardOverviewAuditlogDto
                {
                    TotalActions = totalActions,
                    TotalUsers = totalUsers,
                    TotalTables = totalTables,
                    AverageActionsPerDay = actionTrend.Any() ? (int)actionTrend.Average(a => a.Count) : 0,
                    RecentActions = recentActions.Select(MapToDto).ToList(),
                    ActionTrend = actionTrend
                };

                return Ok(new ApiResponse<DashboardOverviewAuditlogDto>
                {
                    Success = true,
                    Message = "Dashboard overview retrieved successfully",
                    StatusCode = 200,
                    Data = overview
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<DashboardOverviewAuditlogDto>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy hoạt động của người dùng cụ thể
        /// </summary>
        [HttpGet("user/{userId}/activity")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<UserActivityDto>>> GetUserActivity(
            int userId,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var auditLogs = await _auditLogService.GetAuditLogsAsync(
                    userId: userId, fromDate: fromDate, toDate: toDate, pageSize: int.MaxValue);

                if (!auditLogs.Any())
                {
                    return NotFound(new ApiResponse<UserActivityDto>
                    {
                        Success = false,
                        Message = "No activity found for this user",
                        StatusCode = 404
                    });
                }

                var activity = new UserActivityDto
                {
                    UserId = userId,
                    UserName = auditLogs.First().User?.FullName ?? "Unknown",
                    Email = auditLogs.First().User?.Email ?? "Unknown",
                    TotalActions = auditLogs.Count,
                    FirstAction = auditLogs.Min(a => a.ActionTime),
                    LastAction = auditLogs.Max(a => a.ActionTime),
                    ActionsByType = auditLogs.GroupBy(a => a.ActionType)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    ActionsByTable = auditLogs.GroupBy(a => a.TableName)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    RecentActions = auditLogs.OrderByDescending(a => a.ActionTime)
                        .Take(20).Select(MapToDto).ToList(),
                    ActionsByHour = auditLogs.GroupBy(a => a.ActionTime.Hour)
                        .OrderBy(g => g.Key)
                        .ToDictionary(g => g.Key, g => g.Count())
                };

                return Ok(new ApiResponse<UserActivityDto>
                {
                    Success = true,
                    Message = "User activity retrieved successfully",
                    StatusCode = 200,
                    Data = activity
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<UserActivityDto>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy lịch sử thay đổi của một bản ghi cụ thể
        /// </summary>
        [HttpGet("record-history")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<List<AuditLogDto>>>> GetRecordHistory(
            [FromQuery] string tableName,
            [FromQuery] int recordId)
        {
            try
            {
                if (string.IsNullOrEmpty(tableName))
                {
                    return BadRequest(new ApiResponse<List<AuditLogDto>>
                    {
                        Success = false,
                        Message = "Table name is required",
                        StatusCode = 400
                    });
                }

                var auditLogs = await _auditLogService.GetAuditLogsAsync(
                    tableName: tableName, pageSize: int.MaxValue);

                var recordHistory = auditLogs
                    .Where(a => a.RecordId == recordId)
                    .OrderByDescending(a => a.ActionTime)
                    .Select(MapToDto)
                    .ToList();

                if (!recordHistory.Any())
                {
                    return NotFound(new ApiResponse<List<AuditLogDto>>
                    {
                        Success = false,
                        Message = "No history found for this record",
                        StatusCode = 404
                    });
                }

                return Ok(new ApiResponse<List<AuditLogDto>>
                {
                    Success = true,
                    Message = "Record history retrieved successfully",
                    StatusCode = 200,
                    Data = recordHistory
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<AuditLogDto>>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Lấy báo cáo hoạt động theo khoảng thời gian
        /// </summary>
        [HttpGet("reports/activity")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<ActivityReportDto>>> GetActivityReport(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string groupBy = "day") // day, week, month
        {
            try
            {
                fromDate ??= DateTime.UtcNow.AddDays(-30);
                toDate ??= DateTime.UtcNow;

                var auditLogs = await _auditLogService.GetAuditLogsAsync(
                    fromDate: fromDate, toDate: toDate, pageSize: int.MaxValue);

                var report = new ActivityReportDto
                {
                    FromDate = fromDate.Value,
                    ToDate = toDate.Value,
                    TotalActions = auditLogs.Count,
                    UniqueUsers = auditLogs.Where(a => a.UserId.HasValue)
                        .Select(a => a.UserId).Distinct().Count(),
                    ActionsByType = auditLogs.GroupBy(a => a.ActionType)
                        .ToDictionary(g => g.Key, g => g.Count()),
                    ActionsByTable = auditLogs.GroupBy(a => a.TableName)
                        .ToDictionary(g => g.Key, g => g.Count())
                };

                // Group by time period
                switch (groupBy.ToLower())
                {
                    case "day":
                        report.Timeline = auditLogs.GroupBy(a => a.ActionTime.Date)
                            .OrderBy(g => g.Key)
                            .ToDictionary(g => g.Key.ToString("yyyy-MM-dd"), g => g.Count());
                        break;
                    case "week":
                        report.Timeline = auditLogs.GroupBy(a => GetWeekOfYear(a.ActionTime))
                            .OrderBy(g => g.Key)
                            .ToDictionary(g => g.Key, g => g.Count());
                        break;
                    case "month":
                        report.Timeline = auditLogs.GroupBy(a => new DateTime(a.ActionTime.Year, a.ActionTime.Month, 1))
                            .OrderBy(g => g.Key)
                            .ToDictionary(g => g.Key.ToString("yyyy-MM"), g => g.Count());
                        break;
                }

                return Ok(new ApiResponse<ActivityReportDto>
                {
                    Success = true,
                    Message = "Activity report retrieved successfully",
                    StatusCode = 200,
                    Data = report
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<ActivityReportDto>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Phát hiện hoạt động bất thường
        /// </summary>
        [HttpGet("security/suspicious-activities")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<List<SuspiciousActivityDto>>>> GetSuspiciousActivities(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                fromDate ??= DateTime.UtcNow.AddDays(-7);
                toDate ??= DateTime.UtcNow;

                var auditLogs = await _auditLogService.GetAuditLogsAsync(
                    fromDate: fromDate, toDate: toDate, pageSize: int.MaxValue);

                var suspiciousActivities = new List<SuspiciousActivityDto>();

                // 1. Nhiều lần đăng nhập thất bại
                var failedLogins = auditLogs
                    .Where(a => a.ActionType == "LOGIN_FAILED")
                    .GroupBy(a => new { a.UserId, a.IPAddress })
                    .Where(g => g.Count() >= 5)
                    .Select(g => new SuspiciousActivityDto
                    {
                        Type = "Multiple Failed Logins",
                        UserId = g.Key.UserId,
                        IPAddress = g.Key.IPAddress,
                        Count = g.Count(),
                        FirstOccurrence = g.Min(a => a.ActionTime),
                        LastOccurrence = g.Max(a => a.ActionTime),
                        Severity = g.Count() >= 10 ? "High" : "Medium"
                    });

                suspiciousActivities.AddRange(failedLogins);

                // 2. Hoạt động từ nhiều IP khác nhau trong thời gian ngắn
                var multipleIPs = auditLogs
                    .Where(a => a.UserId.HasValue)
                    .GroupBy(a => a.UserId)
                    .Select(g => new
                    {
                        UserId = g.Key,
                        IPAddresses = g.Select(a => a.IPAddress).Distinct().Count(),
                        IPs = g.Select(a => a.IPAddress).Distinct().ToList()
                    })
                    .Where(x => x.IPAddresses >= 3)
                    .Select(x => new SuspiciousActivityDto
                    {
                        Type = "Multiple IP Addresses",
                        UserId = x.UserId,
                        IPAddress = string.Join(", ", x.IPs),
                        Count = x.IPAddresses,
                        Severity = "Medium",
                        Details = $"User accessed from {x.IPAddresses} different IPs"
                    });

                suspiciousActivities.AddRange(multipleIPs);

                // 3. Nhiều thao tác DELETE trong thời gian ngắn
                var massDeletes = auditLogs
                    .Where(a => a.ActionType == "DELETE")
                    .GroupBy(a => new { a.UserId, Hour = a.ActionTime.Hour })
                    .Where(g => g.Count() >= 10)
                    .Select(g => new SuspiciousActivityDto
                    {
                        Type = "Mass Deletion",
                        UserId = g.Key.UserId,
                        Count = g.Count(),
                        FirstOccurrence = g.Min(a => a.ActionTime),
                        LastOccurrence = g.Max(a => a.ActionTime),
                        Severity = "High",
                        Details = $"Deleted {g.Count()} records in one hour"
                    });

                suspiciousActivities.AddRange(massDeletes);

                return Ok(new ApiResponse<List<SuspiciousActivityDto>>
                {
                    Success = true,
                    Message = "Suspicious activities retrieved successfully",
                    StatusCode = 200,
                    Data = suspiciousActivities.OrderByDescending(s => s.Severity).ToList()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<SuspiciousActivityDto>>
                {
                    Success = false,
                    Message = "Internal server error",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Xuất báo cáo tổng hợp ra Excel
        /// </summary>
        [HttpGet("export/excel")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ExportToExcel(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var auditLogs = await _auditLogService.GetAuditLogsAsync(
                    fromDate: fromDate, toDate: toDate, pageSize: int.MaxValue);

                // Tạo CSV với nhiều sheet (giả lập Excel đơn giản)
                var csv = GenerateDetailedCsv(auditLogs);
                var bytes = System.Text.Encoding.UTF8.GetBytes(csv);

                var fileName = $"audit_report_{DateTime.Now:yyyyMMdd_HHmmss}.csv";
                return File(bytes, "text/csv", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Export failed",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Xóa audit logs cũ (cleanup)
        /// </summary>
        [HttpDelete("cleanup")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<object>>> CleanupOldLogs(
            [FromQuery] int daysToKeep = 90)
        {
            try
            {
                if (daysToKeep < 30)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Cannot delete logs newer than 30 days",
                        StatusCode = 400
                    });
                }

                var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);
                var deletedCount = await _auditLogService.CleanupOldLogsAsync(cutoffDate);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Successfully deleted {deletedCount} old audit logs",
                    StatusCode = 200,
                    Data = new { DeletedCount = deletedCount, CutoffDate = cutoffDate }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Cleanup failed",
                    StatusCode = 500,
                    Error = ex.Message
                });
            }
        }
        #endregion
        private static string GetWeekOfYear(DateTime date)
        {
            var culture = System.Globalization.CultureInfo.CurrentCulture;
            var weekNum = culture.Calendar.GetWeekOfYear(
                date,
                System.Globalization.CalendarWeekRule.FirstFourDayWeek,
                DayOfWeek.Monday);
            return $"{date.Year}-W{weekNum:D2}";
        }

        private static string GenerateDetailedCsv(List<AuditLog> auditLogs)
        {
            var csv = new System.Text.StringBuilder();

            // Summary section
            csv.AppendLine("=== AUDIT LOG SUMMARY ===");
            csv.AppendLine($"Report Generated:,{DateTime.Now:yyyy-MM-dd HH:mm:ss}");
            csv.AppendLine($"Total Records:,{auditLogs.Count}");
            csv.AppendLine($"Date Range:,{auditLogs.Min(a => a.ActionTime):yyyy-MM-dd} to {auditLogs.Max(a => a.ActionTime):yyyy-MM-dd}");
            csv.AppendLine();

            // Actions by type
            csv.AppendLine("=== ACTIONS BY TYPE ===");
            csv.AppendLine("Action Type,Count");
            var actionsByType = auditLogs.GroupBy(a => a.ActionType)
                .OrderByDescending(g => g.Count());
            foreach (var group in actionsByType)
            {
                csv.AppendLine($"{group.Key},{group.Count()}");
            }
            csv.AppendLine();

            // Detailed logs
            csv.AppendLine("=== DETAILED LOGS ===");
            csv.AppendLine("Id,ActionType,TableName,RecordId,UserId,UserName,IPAddress,ActionTime,OldValues,NewValues");
            foreach (var log in auditLogs.OrderByDescending(a => a.ActionTime))
            {
                csv.AppendLine($"{log.Id}," +
                              $"\"{log.ActionType}\"," +
                              $"\"{log.TableName}\"," +
                              $"{log.RecordId}," +
                              $"{log.UserId}," +
                              $"\"{log.User?.FullName ?? "Unknown"}\"," +
                              $"\"{log.IPAddress}\"," +
                              $"\"{log.ActionTime:yyyy-MM-dd HH:mm:ss}\"," +
                              $"\"{EscapeCsv(log.OldValues)}\"," +
                              $"\"{EscapeCsv(log.NewValues)}\"");
            }

            return csv.ToString();
        }
    }
}

// DTOs for API responses

   
