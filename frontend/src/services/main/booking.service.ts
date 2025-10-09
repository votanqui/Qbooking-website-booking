// services/booking.service.ts - Updated with host methods

import { 
  ApiResponse,
  BookingDto,
  BookingDetailDto,
  GetUserBookingsRequest,
  GetUserBookingsResponse,
  BookingStatistics,
  CreateBookingRequest,
  UpdateBookingRequest,
  CancelBookingRequest,
  CreateRefundTicketRequest,
  RefundTicketResponse,
  AvailabilityParams,
  AvailabilityResult,
  AvailableDatesParams,
  AvailableDatesResult,
  PriceQuoteParams,
  PriceQuoteResult,
  CreateBookingRequestFull,
  BookingData
} from '@/types/main/booking';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class BookingService {
  
  async getMyBookings(request?: GetUserBookingsRequest): Promise<ApiResponse<BookingDto[]>> {
    const params = new URLSearchParams();
    
    if (request?.bookingCode) params.append('bookingCode', request.bookingCode);
    if (request?.propertyName) params.append('propertyName', request.propertyName);
    if (request?.fromDate) params.append('fromDate', request.fromDate);
    if (request?.toDate) params.append('toDate', request.toDate);
    if (request?.status) params.append('status', request.status);
    if (request?.paymentStatus) params.append('paymentStatus', request.paymentStatus);
    if (request?.search) {
      // Split search term to search both booking code and property name
      params.append('bookingCode', request.search);
      params.append('propertyName', request.search);
    }
    if (request?.sortBy) params.append('sortBy', request.sortBy);
    if (request?.sortOrder) params.append('sortOrder', request.sortOrder);
    if (request?.pageNumber) params.append('pageNumber', request.pageNumber.toString());
    if (request?.pageSize) params.append('pageSize', request.pageSize.toString());

    const queryString = params.toString();
    const url = queryString ? `${API_BASE_URL}/Booking/my-bookings?${queryString}` : `${API_BASE_URL}/Booking/my-bookings`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // NEW: Get host bookings
  async getHostBookings(
    status?: string,
    fromDate?: string,
    toDate?: string,
    propertyId?: number
  ): Promise<ApiResponse<BookingDto[]>> {
    const params = new URLSearchParams();
    
    if (status) params.append('status', status);
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (propertyId) params.append('propertyId', propertyId.toString());

    const queryString = params.toString();
    const url = queryString ? `${API_BASE_URL}/Booking/host/bookings?${queryString}` : `${API_BASE_URL}/Booking/host/bookings`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // NEW: Get host booking detail
  async getHostBookingById(id: number): Promise<ApiResponse<BookingDetailDto>> {
  const response = await fetch(`${API_BASE_URL}/Booking/host/${id}/detail`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // NEW: Check-in booking
  async checkInBooking(id: number): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/Booking/${id}/checkin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const json = await response.json().catch(() => ({}));

    if (json && typeof json === 'object' && !json.statusCode) {
      json.statusCode = response.status;
    }

    return json;
  }

  // NEW: Check-out booking
  async checkOutBooking(id: number): Promise<ApiResponse<any>> {
      const response = await fetch(`${API_BASE_URL}/Booking/${id}/checkout`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const json = await response.json().catch(() => ({}));

    if (json && typeof json === 'object' && !json.statusCode) {
      json.statusCode = response.status;
    }

    return json;
  }

  async getBookingById(id: number): Promise<ApiResponse<BookingDetailDto>> {
    const response = await fetch(`${API_BASE_URL}/Booking/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
 async getBookingByCode(bookingCode: string): Promise<ApiResponse<BookingDetailDto>> {
    const response = await fetch(`${API_BASE_URL}/Booking/code/${bookingCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

 

  async createBooking(data: CreateBookingRequest): Promise<ApiResponse<BookingDto>> {
    const response = await fetch(`${API_BASE_URL}/Booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async updateBooking(id: number, data: UpdateBookingRequest): Promise<ApiResponse<BookingDto>> {
    const response = await fetch(`${API_BASE_URL}/Booking/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async cancelBooking(id: number, data?: CancelBookingRequest): Promise<ApiResponse<any>> {
    console.log('Cancelling booking with ID:', id, 'and data:', data);
    const response = await fetch(`${API_BASE_URL}/Booking/${id}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data || {}),
    });

    const json = await response.json().catch(() => ({}));

    if (json && typeof json === 'object' && !json.statusCode) {
      json.statusCode = response.status;
    }

    return json;
  }

  async createRefundTicket(
    data: CreateRefundTicketRequest
  ): Promise<ApiResponse<RefundTicketResponse>> {
    console.log('Creating refund ticket with data:', data);
    const response = await fetch(`${API_BASE_URL}/Refund/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const json = await response.json().catch(() => ({}));

    if (json && typeof json === 'object' && !json.statusCode) {
      json.statusCode = response.status;
    }

    return json;
  }

  async getBookingStatistics(): Promise<ApiResponse<BookingStatistics>> {
    const response = await fetch(`${API_BASE_URL}/Booking/statistics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async downloadBookingReceipt(id: number): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/Booking/${id}/receipt`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  }
// Thêm vào booking.service.ts
async getHostBookingDetail(id: number): Promise<ApiResponse<BookingDetailDto>> {
  const response = await fetch(`${API_BASE_URL}/Booking/host/${id}/detail`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}
  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    return new Date(dateString).toLocaleDateString('vi-VN', options || defaultOptions);
  }

  formatDateTime(dateString?: string): string {
    if (!dateString) return 'Chưa cập nhật';
    
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Updated status colors to match new status values
  getStatusColor(status: string): string {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'checkedIn': 'bg-green-100 text-green-800',
      'noShow': 'bg-orange-100 text-orange-800',
      'completed': 'bg-emerald-100 text-emerald-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  }

  // Updated payment status colors to match new payment status values
  getPaymentStatusColor(status: string): string {
    const statusColors = {
      'unpaid': 'bg-orange-100 text-orange-800',
      'partial': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'refunded': 'bg-gray-100 text-gray-800',
    };
    
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  }

  // Updated status text to match new status values
  getStatusText(status: string): string {
    const statusTexts = {
      'pending': 'Đang chờ',
      'confirmed': 'Đã xác nhận',
      'checkedIn': 'Đã nhận phòng',
      'noShow': 'Không đến',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy',
    };
    
    return statusTexts[status as keyof typeof statusTexts] || status;
  }

  // Updated payment status text to match new payment status values
  getPaymentStatusText(status: string): string {
    const statusTexts = {
      'unpaid': 'Chưa thanh toán',
      'partial': 'Thanh toán một phần',
      'paid': 'Đã thanh toán',
      'refunded': 'Đã hoàn tiền',
    };
    
    return statusTexts[status as keyof typeof statusTexts] || status;
  }

  canCancelBooking(booking: BookingDto): boolean {
    return (booking.status === 'confirmed' || booking.status === 'pending') && 
           booking.paymentStatus === 'unpaid';
  }

canRequestRefund(booking: BookingDto): boolean {
  return (
    booking.paymentStatus === 'paid' &&
    booking.status !== 'completed' &&
    booking.status !== 'cancelled'
  );
}




  // NEW: Host-specific utility methods
  canCheckIn(booking: BookingDto): boolean {
    return booking.status === 'confirmed';
  }

  canCheckOut(booking: BookingDto): boolean {
    return booking.status === 'checkedIn';
  }
  async checkAvailability(params: AvailabilityParams): Promise<ApiResponse<AvailabilityResult>> {
  const queryParams = new URLSearchParams({
    propertyId: params.propertyId.toString(),
    roomTypeId: params.roomTypeId.toString(),
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    roomsCount: params.roomsCount.toString(),
    totalGuests: params.totalGuests.toString(),
    adults: params.adults.toString(),
    children: params.children.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/Booking/check-availability-detailed?${queryParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const json = await response.json().catch(() => ({}));

  if (json && typeof json === 'object' && !json.statusCode) {
    json.statusCode = response.status;
  }

  return json;
}

/**
 * Lấy danh sách ngày trống trong tháng
 */
async getAvailableDates(params: AvailableDatesParams): Promise<ApiResponse<AvailableDatesResult>> {
  const queryParams = new URLSearchParams({
    propertyId: params.propertyId.toString(),
    roomTypeId: params.roomTypeId.toString(),
    year: params.year.toString(),
    month: params.month.toString(),
    roomsCount: params.roomsCount.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/Booking/available-dates?${queryParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const json = await response.json().catch(() => ({}));

  if (json && typeof json === 'object' && !json.statusCode) {
    json.statusCode = response.status;
  }

  return json;
}
async getPriceQuote(params: PriceQuoteParams): Promise<ApiResponse<PriceQuoteResult>> {
  const queryParams = new URLSearchParams({
    propertyId: params.propertyId.toString(),
    roomTypeId: params.roomTypeId.toString(),
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    roomsCount: params.roomsCount.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/Booking/price-quote?${queryParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const json = await response.json().catch(() => ({}));

  if (json && typeof json === 'object' && !json.statusCode) {
    json.statusCode = response.status;
  }

  return json;
}

async createBookingFull(data: CreateBookingRequestFull): Promise<ApiResponse<BookingDto>> {
  console.log('Creating booking with data:', data);
  const response = await fetch(`${API_BASE_URL}/Booking`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const json = await response.json().catch(() => ({}));
 console.log("Full API response:", json);
  if (json && typeof json === 'object' && !json.statusCode) {
    json.statusCode = response.status;
  }

  return json;
}

async getPaymentQRCode(bookingCode: string): Promise<ApiResponse<BookingData>> {
    const response = await fetch(`${API_BASE_URL}/SePay/qr-code/${bookingCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const json = await response.json().catch(() => ({}));

    if (json && typeof json === 'object' && !json.statusCode) {
      json.statusCode = response.status;
    }

    return json;
  }

  // NEW: Kiểm tra trạng thái thanh toán booking
  async getBookingPaymentStatus(bookingCode: string): Promise<ApiResponse<{ paymentStatus: string }>> {
    const response = await fetch(`${API_BASE_URL}/SePay/booking-status-by-code/${bookingCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const json = await response.json().catch(() => ({}));

    if (json && typeof json === 'object' && !json.statusCode) {
      json.statusCode = response.status;
    }

    return json;
  }
}

export const bookingService = new BookingService();