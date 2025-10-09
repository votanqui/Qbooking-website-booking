// types/loginHistory.ts
export interface LoginHistory {
  id: number;
  loginTime: string;
  ipAddress: string;
  deviceInfo: string;
  isSuccess: boolean;
  failureReason?: string;
  createdAt: string;
}

export interface LoginHistoryPagination {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface LoginHistoryResponse {
  histories: LoginHistory[];
  pagination: LoginHistoryPagination;
}

export interface GetLoginHistoryRequest {
  page?: number;
  pageSize?: number;
  fromDate?: Date;
  toDate?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
}