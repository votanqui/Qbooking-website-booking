// ==================== Common Types ====================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: string;
}

// ==================== Request Types ====================

export interface ProcessRefundRequest {
  refundedAmount: number;
  receiverBankName: string;
  receiverAccount: string;
  receiverName: string;
  paymentMethod: string;
  paymentReference: string;
  notes: string;
}

export interface UpdateRefundTicketStatusRequest {
  status: RefundTicketStatus;
}

// ==================== Response Types ====================

export interface RefundTicketResponse {
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
  bookingId: number;
  bookingCode: string;
  customerId: number;
  customerName: string;
  approvedBy: number;
  refundedAmount: number;
  receiverBankName: string;
  receiverAccount: string;
  receiverName: string;
  paymentMethod: string;
  paymentReference: string;
  notes: string;
  createdAt: string;
}

export interface RefundStatisticsResponse {
  totalRefundTickets: number;
  pendingTickets: number;
  approvedTickets: number;
  rejectedTickets: number;
  cancelledTickets: number;
  totalRefundAmount: number;
  totalRefundCount: number;
  averageRefundAmount: number;
  fromDate?: string | null;
  toDate?: string | null;
}

// ==================== Enums ====================

export type RefundTicketStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type PaymentMethod = 'bank_transfer' | 'cash' | 'e_wallet';

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

export const PAYMENT_METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng' },
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'e_wallet', label: 'Ví điện tử' },
];

export const REFUND_STATUS_OPTIONS: Array<{ value: RefundTicketStatus; label: string }> = [
  { value: 'pending', label: 'Đang chờ xử lý' },
  { value: 'approved', label: 'Đã chấp thuận' },
  { value: 'rejected', label: 'Đã từ chối' },
  { value: 'cancelled', label: 'Đã hủy' },
];

// ==================== Table Columns Configuration ====================

export interface RefundTicketColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

export const REFUND_TICKET_COLUMNS: RefundTicketColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'bookingCode', label: 'Mã Booking', sortable: true, width: '150px' },
  { key: 'propertyName', label: 'Property', sortable: true },
  { key: 'customerName', label: 'Khách hàng', sortable: true },
  { key: 'requestedAmount', label: 'Số tiền yêu cầu', sortable: true, width: '150px' },
  { key: 'status', label: 'Trạng thái', sortable: true, width: '130px' },
  { key: 'createdAt', label: 'Ngày tạo', sortable: true, width: '150px' },
  { key: 'actions', label: 'Thao tác', width: '120px' },
];

export const REFUND_COLUMNS: RefundTicketColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'bookingCode', label: 'Mã Booking', sortable: true, width: '150px' },
  { key: 'customerName', label: 'Khách hàng', sortable: true },
  { key: 'refundedAmount', label: 'Số tiền hoàn', sortable: true, width: '150px' },
  { key: 'paymentMethod', label: 'Phương thức', sortable: true, width: '150px' },
  { key: 'paymentReference', label: 'Mã tham chiếu', sortable: true, width: '150px' },
  { key: 'createdAt', label: 'Ngày hoàn', sortable: true, width: '150px' },
  { key: 'actions', label: 'Thao tác', width: '100px' },
];

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

export const formatShortDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const getStatusLabel = (status: RefundTicketStatus): string => {
  return REFUND_STATUS_LABELS[status] || status;
};

export const getStatusColor = (status: RefundTicketStatus): string => {
  return REFUND_STATUS_COLORS[status] || 'default';
};

export const getPaymentMethodLabel = (method: string): string => {
  const option = PAYMENT_METHOD_OPTIONS.find(opt => opt.value === method);
  return option?.label || method;
};

export const calculateRefundPercentage = (refundedAmount: number, requestedAmount: number): number => {
  if (requestedAmount === 0) return 0;
  return Math.round((refundedAmount / requestedAmount) * 100);
};

export const getRefundStatusBadgeClass = (status: RefundTicketStatus): string => {
  const colorMap: Record<RefundTicketStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

// ==================== Validation ====================

export const validateProcessRefundRequest = (data: ProcessRefundRequest): string[] => {
  const errors: string[] = [];

  if (data.refundedAmount <= 0) {
    errors.push('Số tiền hoàn phải lớn hơn 0');
  }

  if (!data.receiverBankName?.trim()) {
    errors.push('Tên ngân hàng người nhận không được để trống');
  }

  if (!data.receiverAccount?.trim()) {
    errors.push('Số tài khoản người nhận không được để trống');
  }

  if (!data.receiverName?.trim()) {
    errors.push('Tên người nhận không được để trống');
  }

  if (!data.paymentReference?.trim()) {
    errors.push('Mã tham chiếu thanh toán không được để trống');
  }

  return errors;
};