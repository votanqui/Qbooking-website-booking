// my-next-app/src/services/admin/adminfefund.service.ts
import { 
  ApiResponse, 
  RefundTicketResponse,
  RefundTicketDetailResponse,
  RefundResponse,
  RefundStatisticsResponse,
  ProcessRefundRequest,
  UpdateRefundTicketStatusRequest
} from '@/types/admin/adminrefund';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class RefundAdminService {
  /**
   * Lấy tất cả yêu cầu hoàn tiền (Admin)
   */
  async getAllRefundTickets(status?: string): Promise<ApiResponse<RefundTicketResponse[]>> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const response = await fetch(`${API_BASE_URL}/Refund/tickets?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy chi tiết một ticket (Admin)
   */
  async getRefundTicketDetail(ticketId: number): Promise<ApiResponse<RefundTicketDetailResponse>> {
    const response = await fetch(`${API_BASE_URL}/Refund/tickets/${ticketId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Xử lý hoàn tiền - tạo record Refund và cập nhật status của RefundTicket (Admin)
   */
  async processRefund(
    refundTicketId: number, 
    data: ProcessRefundRequest
  ): Promise<ApiResponse<RefundResponse>> {
    const response = await fetch(`${API_BASE_URL}/Refund/tickets/${refundTicketId}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  /**
   * Cập nhật trạng thái yêu cầu hoàn tiền (Admin) - reject ticket
   */
  async updateRefundTicketStatus(
    refundTicketId: number, 
    data: UpdateRefundTicketStatusRequest
  ): Promise<ApiResponse<RefundTicketResponse>> {
    const response = await fetch(`${API_BASE_URL}/Refund/tickets/${refundTicketId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return await response.json();
  }

  /**
   * Lấy danh sách tất cả các refund đã thực hiện (Admin)
   */
  async getRefunds(): Promise<ApiResponse<RefundResponse[]>> {
    const response = await fetch(`${API_BASE_URL}/Refund/refunds`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Thống kê refund theo khoảng thời gian (Admin)
   */
  async getRefundStatistics(
    fromDate?: Date, 
    toDate?: Date
  ): Promise<ApiResponse<RefundStatisticsResponse>> {
    const params = new URLSearchParams();
    
    if (fromDate) {
      params.append('fromDate', fromDate.toISOString());
    }
    if (toDate) {
      params.append('toDate', toDate.toISOString());
    }

    const response = await fetch(`${API_BASE_URL}/Refund/statistics?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Approve và xử lý refund nhanh (shorthand method)
   */
  async approveRefund(
    refundTicketId: number,
    refundedAmount: number,
    receiverBankName: string,
    receiverAccount: string,
    receiverName: string,
    paymentReference: string,
    notes?: string
  ): Promise<ApiResponse<RefundResponse>> {
    return this.processRefund(refundTicketId, {
      refundedAmount,
      receiverBankName,
      receiverAccount,
      receiverName,
      paymentMethod: 'bank_transfer',
      paymentReference,
      notes: notes || '',
    });
  }

  /**
   * Reject refund ticket (shorthand method)
   */
  async rejectRefund(refundTicketId: number): Promise<ApiResponse<RefundTicketResponse>> {
    return this.updateRefundTicketStatus(refundTicketId, {
      status: 'rejected',
    });
  }
}

export const refundAdminService = new RefundAdminService();