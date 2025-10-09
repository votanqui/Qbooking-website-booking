import { PublicCouponResponse, DiscountDisplayItem, ApiResponse } from '@/types/main/discount';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;
class DiscountService {
  
  async getPublicDiscountCodes(keyword?: string, limit: number = 20): Promise<ApiResponse<PublicCouponResponse[]>> {
    try {
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      params.append('limit', limit.toString());

      const response = await fetch(`${API_BASE_URL}/Coupons/public?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching public discount codes:', error);
      return {
        success: false,
        message: 'Lỗi khi tải danh sách mã giảm giá',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getFeaturedDiscountCodes(limit: number = 10): Promise<ApiResponse<PublicCouponResponse[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Coupons/featured?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching featured discount codes:', error);
      return {
        success: false,
        message: 'Lỗi khi tải mã giảm giá nổi bật',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Transform API response to display format
  transformToDisplayFormat(coupons: PublicCouponResponse[]): DiscountDisplayItem[] {
    return coupons.map(coupon => {
      const displayItem: DiscountDisplayItem = {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount: this.formatDiscountValue(coupon.discountType, coupon.discountValue),
        type: this.getDisplayType(coupon.discountType, coupon.isFeatured),
        validUntil: this.formatDate(coupon.endDate),
      };

      // Phân loại applications theo type
      if (coupon.applications && coupon.applications.length > 0) {
        const locations = coupon.applications
          .filter(app => app.applicableType.toLowerCase() === 'location')
          .map(app => app.applicableName)
          .filter(name => name) as string[];

        const properties = coupon.applications
          .filter(app => app.applicableType.toLowerCase() === 'property')
          .map(app => app.applicableName)
          .filter(name => name) as string[];

        const types = coupon.applications
          .filter(app => app.applicableType.toLowerCase() === 'propertytype')
          .map(app => app.applicableName)
          .filter(name => name) as string[];

        if (locations.length > 0) displayItem.applicableLocations = locations;
        if (properties.length > 0) displayItem.applicableProperties = properties;
        if (types.length > 0) displayItem.applicableTypes = types;
      }

      // Cập nhật description để bao gồm thông tin áp dụng
      displayItem.description = this.enhanceDescription(coupon, displayItem);

      return displayItem;
    });
  }

  private formatDiscountValue(discountType: string, value: number): string {
    switch (discountType.toLowerCase()) {
      case 'percentage':
        return `${value}%`;
      case 'fixedamount':
        return this.formatCurrency(value);
      case 'freenight':
        return `${value} đêm`;
      default:
        return `${value}`;
    }
  }

  private formatCurrency(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
    }
    return amount.toString();
  }

  private getDisplayType(discountType: string, isFeatured: boolean): string {
    if (isFeatured) return 'special';
    
    switch (discountType.toLowerCase()) {
      case 'percentage':
        return 'percentage';
      case 'fixedamount':
        return 'fixed';
      case 'freenight':
        return 'special';
      default:
        return 'fixed';
    }
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }

  private enhanceDescription(coupon: PublicCouponResponse, displayItem: DiscountDisplayItem): string {
    let description = coupon.description;

    // Thêm thông tin áp dụng vào description
    const applicableInfo = [];

    if (coupon.applicableTo.toLowerCase() === 'all') {
      applicableInfo.push('Áp dụng cho tất cả');
    } else {
      if (displayItem.applicableLocations && displayItem.applicableLocations.length > 0) {
        if (displayItem.applicableLocations.length === 1) {
          applicableInfo.push(`Áp dụng tại ${displayItem.applicableLocations[0]}`);
        } else {
          applicableInfo.push(`Áp dụng tại ${displayItem.applicableLocations.length} tỉnh/thành`);
        }
      }

      if (displayItem.applicableProperties && displayItem.applicableProperties.length > 0) {
        if (displayItem.applicableProperties.length === 1) {
          applicableInfo.push(`Áp dụng cho ${displayItem.applicableProperties[0]}`);
        } else {
          applicableInfo.push(`Áp dụng cho ${displayItem.applicableProperties.length} khách sạn`);
        }
      }

      if (displayItem.applicableTypes && displayItem.applicableTypes.length > 0) {
        applicableInfo.push(`Loại: ${displayItem.applicableTypes.join(', ')}`);
      }
    }

    // Thêm thông tin đêm tối thiểu
    if (coupon.minNights > 1) {
      applicableInfo.push(`Tối thiểu ${coupon.minNights} đêm`);
    }

    if (applicableInfo.length > 0) {
      description += ` • ${applicableInfo.join(' • ')}`;
    }

    return description;
  }

  // Validate coupon code
  async validateCoupon(code: string, customerId: number, bookingId: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, customerId, bookingId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error validating coupon:', error);
      return {
        success: false,
        message: 'Lỗi khi kiểm tra mã giảm giá',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Apply coupon
  async applyCoupon(code: string, customerId: number, bookingId: number): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Coupons/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, customerId, bookingId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error applying coupon:', error);
      return {
        success: false,
        message: 'Lỗi khi áp dụng mã giảm giá',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
   async applyCouponByCode(couponCode: string, bookingCode: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Coupons/apply-by-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          bookingCode: bookingCode
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error applying coupon by code:', error);
      return {
        success: false,
        message: 'Đã xảy ra lỗi khi áp dụng mã giảm giá',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Cancel coupon by booking code (new method)
  async cancelCouponByCode(bookingCode: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/Coupons/cancel-by-code/${bookingCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error canceling coupon by code:', error);
      return {
        success: false,
        message: 'Đã xảy ra lỗi khi hủy mã giảm giá',
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

}

export const discountService = new DiscountService();