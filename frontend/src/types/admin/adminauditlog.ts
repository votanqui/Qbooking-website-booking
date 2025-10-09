// types/adminauditlog.ts

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
}

export interface AuditLogDto {
  id: number;
  actionType: string;
  tableName: string;
  recordId: number | null;
  userId: number | null;
  userName: string;
  ipAddress: string;
  userAgent: string;
  actionTime: string;
  oldValues: string;
  newValues: string;
}

export interface AuditLogResponseDto {
  auditLogs: AuditLogDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GetAuditLogsRequest {
  userId?: number;
  tableName?: string;
  actionType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogStatisticsDto {
  totalActions: number;
  actionsByType: Record<string, number>;
  actionsByTable: Record<string, number>;
  topUsers: Record<string, number>;
  actionsByDay: Record<string, number>;
}

export interface GetStatisticsRequest {
  fromDate?: string;
  toDate?: string;
}

export interface ActionTrendDto {
  date: string;
  count: number;
}

export interface DashboardOverviewAuditlogDto {
  totalActions: number;
  totalUsers: number;
  totalTables: number;
  averageActionsPerDay: number;
  recentActions: AuditLogDto[];
  actionTrend: ActionTrendDto[];
}

export interface GetDashboardOverviewRequest {
  fromDate?: string;
  toDate?: string;
}

export interface UserActivityDto {
  userId: number;
  userName: string;
  email: string;
  totalActions: number;
  firstAction: string;
  lastAction: string;
  actionsByType: Record<string, number>;
  actionsByTable: Record<string, number>;
  actionsByHour: Record<number, number>;
  recentActions: AuditLogDto[];
}

export interface GetUserActivityRequest {
  userId: number;
  fromDate?: string;
  toDate?: string;
}

export interface GetRecordHistoryRequest {
  tableName: string;
  recordId: number;
}

export interface ActivityReportDto {
  fromDate: string;
  toDate: string;
  totalActions: number;
  uniqueUsers: number;
  actionsByType: Record<string, number>;
  actionsByTable: Record<string, number>;
  timeline: Record<string, number>;
}

export interface GetActivityReportRequest {
  fromDate?: string;
  toDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface SuspiciousActivityDto {
  type: string;
  userId: number | null;
  ipAddress: string | null;
  count: number;
  firstOccurrence: string | null;
  lastOccurrence: string | null;
  severity: 'Low' | 'Medium' | 'High';
  details: string | null;
}

export interface GetSuspiciousActivitiesRequest {
  fromDate?: string;
  toDate?: string;
}

export interface ExportRequest {
  userId?: number;
  tableName?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CleanupLogsRequest {
  daysToKeep?: number;
}

export interface CleanupLogsResponse {
  deletedCount: number;
  cutoffDate: string;
}