// Services/AuditLogService.cs
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using QBooking.Data;
using QBooking.Models;

namespace QBooking.Services
{
    public class AuditLogService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuditLogService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task LogActionAsync(string actionType, string tableName, int? recordId = null,
                                       string? oldValues = null, string? newValues = null)
        {
            var userId = GetCurrentUserId();
            var ipAddress = GetClientIpAddress();
            var userAgent = GetUserAgent();

            var log = new AuditLog
            {
                ActionType = actionType,
                TableName = tableName,
                RecordId = recordId,
                UserId = userId,
                IPAddress = ipAddress ?? "Unknown",
                UserAgent = userAgent ?? "Unknown",
                OldValues = oldValues ?? string.Empty,
                NewValues = newValues ?? string.Empty,
                ActionTime = DateTime.UtcNow
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            return null;
        }

        private string? GetClientIpAddress()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return null;

            // Check for forwarded IP first (in case of proxy/load balancer)
            var forwardedFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                return forwardedFor.Split(',')[0].Trim();
            }

            // Check for real IP
            var realIp = httpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(realIp))
            {
                return realIp;
            }

            // Fall back to connection remote IP
            return httpContext.Connection?.RemoteIpAddress?.ToString();
        }

        private string? GetUserAgent()
        {
            return _httpContextAccessor.HttpContext?.Request?.Headers["User-Agent"].ToString();
        }

        // Helper methods for common audit actions
        public async Task LogInsertAsync(string tableName, int recordId, string newValues)
        {
            await LogActionAsync("INSERT", tableName, recordId, null, newValues);
        }

        public async Task LogUpdateAsync(string tableName, int recordId, string oldValues, string newValues)
        {
            await LogActionAsync("UPDATE", tableName, recordId, oldValues, newValues);
        }

        public async Task LogDeleteAsync(string tableName, int recordId, string oldValues)
        {
            await LogActionAsync("DELETE", tableName, recordId, oldValues, null);
        }

        public async Task LogLoginAsync(int userId)
        {
            await LogActionAsync("LOGIN", "User", userId, null, $"User {userId} logged in");
        }

        public async Task LogLogoutAsync(int userId)
        {
            await LogActionAsync("LOGOUT", "User", userId, null, $"User {userId} logged out");
        }

        // Get audit logs with optional filtering
        public async Task<List<AuditLog>> GetAuditLogsAsync(int? userId = null, string? tableName = null,
                                                           DateTime? fromDate = null, DateTime? toDate = null,
                                                           int page = 1, int pageSize = 50)
        {
            var query = _context.AuditLogs.Include(a => a.User).AsQueryable();

            if (userId.HasValue)
            {
                query = query.Where(a => a.UserId == userId);
            }

            if (!string.IsNullOrEmpty(tableName))
            {
                query = query.Where(a => a.TableName == tableName);
            }

            if (fromDate.HasValue)
            {
                query = query.Where(a => a.ActionTime >= fromDate);
            }

            if (toDate.HasValue)
            {
                query = query.Where(a => a.ActionTime <= toDate);
            }

            return await query
                .OrderByDescending(a => a.ActionTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<int> GetAuditLogsCountAsync(int? userId = null, string? tableName = null,
                                                     DateTime? fromDate = null, DateTime? toDate = null)
        {
            var query = _context.AuditLogs.AsQueryable();

            if (userId.HasValue)
            {
                query = query.Where(a => a.UserId == userId);
            }

            if (!string.IsNullOrEmpty(tableName))
            {
                query = query.Where(a => a.TableName == tableName);
            }

            if (fromDate.HasValue)
            {
                query = query.Where(a => a.ActionTime >= fromDate);
            }

            if (toDate.HasValue)
            {
                query = query.Where(a => a.ActionTime <= toDate);
            }

            return await query.CountAsync();
        }
        public async Task LogPasswordResetRequestAsync(int userId)
        {
            await LogActionAsync(
                actionType: "PASSWORD_RESET_REQUEST",
                tableName: "User",
                recordId: userId,
                oldValues: null,
                newValues: "User requested password reset");
        }

        public async Task LogPasswordResetSuccessAsync(int userId)
        {
            await LogActionAsync(
                actionType: "PASSWORD_RESET_SUCCESS",
                tableName: "User",
                recordId: userId,
                oldValues: null,
                newValues: "User successfully reset password");
        }
        public async Task<int> CleanupOldLogsAsync(DateTime cutoffDate)
        {
            var oldLogs = await _context.AuditLogs
                .Where(a => a.ActionTime < cutoffDate)
                .ToListAsync();

            if (oldLogs.Any())
            {
                _context.AuditLogs.RemoveRange(oldLogs);
                await _context.SaveChangesAsync();
            }

            return oldLogs.Count;
        }

        public async Task LogLoginFailedAsync(int? userId, string reason)
        {
            await LogActionAsync(
                actionType: "LOGIN_FAILED",
                tableName: "User",
                recordId: userId,
                oldValues: null,
                newValues: reason);
        }
    }
}