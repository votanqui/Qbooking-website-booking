// ==================== Common Types ====================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
}

// ==================== Request Types ====================

export interface CreateRefundTicketRequest {
  bookingId: number;
  requestedAmount: number;
  reason: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

// ==================== Response Types ====================

export interface RefundTicketResponse {
  id: number;
  bookingId: number;
  bookingCode: string;
  propertyName: string;
  customerId: number;
  customerName?: string;
  customerEmail?: string;
  requestedAmount: number;
  reason: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  status: RefundTicketStatus;
  createdAt: string;
  processedAt?: string | null;
}

export interface RefundTicketDetailResponse {
  id: number;
  bookingId: number;
  bookingCode: string;
  propertyName: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  requestedAmount: number;
  reason: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  status: RefundTicketStatus;
  createdAt: string;
  processedAt?: string | null;
  refund?: RefundResponse | null;
}

export interface RefundResponse {
  id: number;
  refundTicketId: number;
  bookingId?: number;
  bookingCode?: string;
  customerId?: number;
  customerName?: string;
  approvedBy?: number;
  refundedAmount: number;
  receiverBankName: string;
  receiverAccount: string;
  receiverName: string;
  paymentMethod: string;
  paymentReference: string;
  notes: string;
  createdAt: string;
}

// ==================== Enums ====================

export type RefundTicketStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// ==================== Constants ====================

export const REFUND_STATUS_LABELS: Record<RefundTicketStatus, string> = {
  pending: 'Đang chờ xử lý',
  approved: 'Đã chấp thuận',
  rejected: 'Đã từ chối',
  cancelled: 'Đã hủy',
};

export const REFUND_STATUS_COLORS: Record<RefundTicketStatus, string> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Chuyển khoản ngân hàng',
  cash: 'Tiền mặt',
  e_wallet: 'Ví điện tử',
};

// ==================== Helper Functions ====================

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusLabel = (status: RefundTicketStatus): string => {
  return REFUND_STATUS_LABELS[status] || status;
};

export const getStatusColor = (status: RefundTicketStatus): string => {
  return REFUND_STATUS_COLORS[status] || 'default';
};

export const getPaymentMethodLabel = (method: string): string => {
  return PAYMENT_METHOD_LABELS[method] || method;
};