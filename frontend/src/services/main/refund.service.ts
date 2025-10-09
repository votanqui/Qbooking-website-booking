import { 
  ApiResponse, 
  RefundTicketResponse,
  RefundTicketDetailResponse,
  CreateRefundTicketRequest
} from '@/types/main/refund';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class RefundService {
  // ==================== CUSTOMER APIs ====================
  
  /**
   * Tạo yêu cầu hoàn tiền (Customer)
   */
  async createRefundTicket(data: CreateRefundTicketRequest): Promise<ApiResponse<RefundTicketResponse>> {
    const response = await fetch(`${API_BASE_URL}/Refund/tickets`, {
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
   * Lấy danh sách yêu cầu hoàn tiền của customer hiện tại
   */
  async getMyRefundTickets(): Promise<ApiResponse<RefundTicketResponse[]>> {
    const response = await fetch(`${API_BASE_URL}/Refund/tickets/my`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Lấy chi tiết một ticket của customer
   */
  async getMyRefundTicketDetail(ticketId: number): Promise<ApiResponse<RefundTicketDetailResponse>> {
    const response = await fetch(`${API_BASE_URL}/Refund/tickets/my/${ticketId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Hủy yêu cầu hoàn tiền của mình (Customer) - chỉ khi còn pending
   */
  async cancelRefundTicket(ticketId: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Refund/tickets/${ticketId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  // ==================== HOST APIs ====================

  /**
   * Host xem danh sách ticket của property mình quản lý
   */
  async getHostRefundTickets(status?: string): Promise<ApiResponse<RefundTicketResponse[]>> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const response = await fetch(`${API_BASE_URL}/Refund/tickets/host/properties?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * Host xem chi tiết ticket của property mình quản lý
   */
  async getHostRefundTicketDetail(ticketId: number): Promise<ApiResponse<RefundTicketDetailResponse>> {
    const response = await fetch(`${API_BASE_URL}/Refund/tickets/host/${ticketId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }
}

export const refundService = new RefundService();