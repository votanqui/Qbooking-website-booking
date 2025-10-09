// services/adminauditlog.service.ts

import {
  ApiResponse,
  AuditLogDto,
  AuditLogResponseDto,
  GetAuditLogsRequest,
  AuditLogStatisticsDto,
  GetStatisticsRequest,
  DashboardOverviewAuditlogDto,
  GetDashboardOverviewRequest,
  UserActivityDto,
  GetUserActivityRequest,
  GetRecordHistoryRequest,
  ActivityReportDto,
  GetActivityReportRequest,
  SuspiciousActivityDto,
  GetSuspiciousActivitiesRequest,
  ExportRequest,
  CleanupLogsRequest,
  CleanupLogsResponse
} from '@/types/admin/adminauditlog';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class AdminAuditLogService {
  /**
   * Get audit logs with filters and pagination
   */
  async getAuditLogs(request: GetAuditLogsRequest = {}): Promise<ApiResponse<AuditLogResponseDto>> {
    const params = new URLSearchParams();

    if (request.userId !== undefined) params.append('userId', request.userId.toString());
    if (request.tableName) params.append('tableName', request.tableName);
    if (request.actionType) params.append('actionType', request.actionType);
    if (request.fromDate) params.append('fromDate', request.fromDate);
    if (request.toDate) params.append('toDate', request.toDate);
    if (request.page) params.append('page', request.page.toString());
    if (request.pageSize) params.append('pageSize', request.pageSize.toString());

    const response = await fetch(`${API_BASE_URL}/AuditLog?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(id: number): Promise<ApiResponse<AuditLogDto>> {
    const response = await fetch(`${API_BASE_URL}/AuditLog/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(request: GetStatisticsRequest = {}): Promise<ApiResponse<AuditLogStatisticsDto>> {
    const params = new URLSearchParams();

    if (request.fromDate) params.append('fromDate', request.fromDate);
    if (request.toDate) params.append('toDate', request.toDate);

    const response = await fetch(`${API_BASE_URL}/AuditLog/statistics?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Get dashboard overview
   */
  async getDashboardOverview(request: GetDashboardOverviewRequest = {}): Promise<ApiResponse<DashboardOverviewAuditlogDto>> {
    const params = new URLSearchParams();

    if (request.fromDate) params.append('fromDate', request.fromDate);
    if (request.toDate) params.append('toDate', request.toDate);

    const response = await fetch(`${API_BASE_URL}/AuditLog/dashboard/overview?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Get user activity by user ID
   */
  async getUserActivity(request: GetUserActivityRequest): Promise<ApiResponse<UserActivityDto>> {
    const params = new URLSearchParams();

    if (request.fromDate) params.append('fromDate', request.fromDate);
    if (request.toDate) params.append('toDate', request.toDate);

    const response = await fetch(`${API_BASE_URL}/AuditLog/user/${request.userId}/activity?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Get record history
   */
  async getRecordHistory(request: GetRecordHistoryRequest): Promise<ApiResponse<AuditLogDto[]>> {
    const params = new URLSearchParams();
    params.append('tableName', request.tableName);
    params.append('recordId', request.recordId.toString());

    const response = await fetch(`${API_BASE_URL}/AuditLog/record-history?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Get activity report
   */
  async getActivityReport(request: GetActivityReportRequest = {}): Promise<ApiResponse<ActivityReportDto>> {
    const params = new URLSearchParams();

    if (request.fromDate) params.append('fromDate', request.fromDate);
    if (request.toDate) params.append('toDate', request.toDate);
    if (request.groupBy) params.append('groupBy', request.groupBy);

    const response = await fetch(`${API_BASE_URL}/AuditLog/reports/activity?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Get suspicious activities
   */
  async getSuspiciousActivities(request: GetSuspiciousActivitiesRequest = {}): Promise<ApiResponse<SuspiciousActivityDto[]>> {
    const params = new URLSearchParams();

    if (request.fromDate) params.append('fromDate', request.fromDate);
    if (request.toDate) params.append('toDate', request.toDate);

    const response = await fetch(`${API_BASE_URL}/AuditLog/security/suspicious-activities?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Get list of audited tables
   */
  async getAuditedTables(): Promise<ApiResponse<string[]>> {
    const response = await fetch(`${API_BASE_URL}/AuditLog/tables`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Get list of action types
   */
  async getActionTypes(): Promise<ApiResponse<string[]>> {
    const response = await fetch(`${API_BASE_URL}/AuditLog/action-types`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Export audit logs to CSV
   */
  async exportToCsv(request: ExportRequest = {}): Promise<Blob> {
    const params = new URLSearchParams();

    if (request.userId !== undefined) params.append('userId', request.userId.toString());
    if (request.tableName) params.append('tableName', request.tableName);
    if (request.fromDate) params.append('fromDate', request.fromDate);
    if (request.toDate) params.append('toDate', request.toDate);

    const response = await fetch(`${API_BASE_URL}/AuditLog/export/csv?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return await response.blob();
  }

  /**
   * Export audit logs to Excel (detailed report)
   */
  async exportToExcel(request: ExportRequest = {}): Promise<Blob> {
    const params = new URLSearchParams();

    if (request.fromDate) params.append('fromDate', request.fromDate);
    if (request.toDate) params.append('toDate', request.toDate);

    const response = await fetch(`${API_BASE_URL}/AuditLog/export/excel?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return await response.blob();
  }

  /**
   * Cleanup old audit logs
   */
  async cleanupOldLogs(request: CleanupLogsRequest = {}): Promise<ApiResponse<CleanupLogsResponse>> {
    const params = new URLSearchParams();

    if (request.daysToKeep !== undefined) {
      params.append('daysToKeep', request.daysToKeep.toString());
    }

    const response = await fetch(`${API_BASE_URL}/AuditLog/cleanup?${params}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Helper method to download blob as file
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const adminAuditLogService = new AdminAuditLogService();