import { 
  ApiResponse, 
  WebsiteSetting, 
  WebsiteSettingsDto,
    PublicWebsiteSetting
} from '@/types/admin/websitesettings';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin`;

class WebsiteSettingsService {
  
  /**
   * GET: Lấy thông tin cấu hình website
   */
  async getSettings(): Promise<ApiResponse<WebsiteSetting>> {
    const response = await fetch(`${API_BASE_URL}/WebsiteSettings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * POST: Tạo mới hoặc cập nhật cấu hình website
   */
  async upsertSettings(data: WebsiteSettingsDto): Promise<ApiResponse<WebsiteSetting>> {
    const formData = new FormData();

    // Thông tin chung
    formData.append('siteName', data.siteName);
    if (data.siteDescription) formData.append('siteDescription', data.siteDescription);
    if (data.supportEmail) formData.append('supportEmail', data.supportEmail);
    if (data.supportPhone) formData.append('supportPhone', data.supportPhone);
    if (data.address) formData.append('address', data.address);

    // Upload files
    if (data.logo) formData.append('logo', data.logo);
    if (data.favicon) formData.append('favicon', data.favicon);

    // SEO
    if (data.metaTitle) formData.append('metaTitle', data.metaTitle);
    if (data.metaDescription) formData.append('metaDescription', data.metaDescription);
    if (data.metaKeywords) formData.append('metaKeywords', data.metaKeywords);

    // Mạng xã hội
    if (data.facebookUrl) formData.append('facebookUrl', data.facebookUrl);
    if (data.twitterUrl) formData.append('twitterUrl', data.twitterUrl);
    if (data.instagramUrl) formData.append('instagramUrl', data.instagramUrl);
    if (data.youtubeUrl) formData.append('youtubeUrl', data.youtubeUrl);
    if (data.tiktokUrl) formData.append('tiktokUrl', data.tiktokUrl);

    // Banking / Thanh toán
    if (data.bankName) formData.append('bankName', data.bankName);
    if (data.bankAccountName) formData.append('bankAccountName', data.bankAccountName);
    if (data.bankAccountNumber) formData.append('bankAccountNumber', data.bankAccountNumber);

    const response = await fetch(`${API_BASE_URL}/WebsiteSettings`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    return await response.json();
  }

  /**
   * DELETE: Xóa logo
   */
  async deleteLogo(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/WebsiteSettings/logo`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }

  /**
   * DELETE: Xóa favicon
   */
  async deleteFavicon(): Promise<ApiResponse<any>> {
    const response = await fetch(`${API_BASE_URL}/WebsiteSettings/favicon`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return await response.json();
  }
    /**
   * GET: Lấy thông tin công khai cho trang home (Public - không cần auth)
   */
    async getPublicSettings(): Promise<ApiResponse<PublicWebsiteSetting>> {
    const response = await fetch(`${API_BASE_URL}/WebsiteSettings/public`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  }
}

export const websiteSettingsService = new WebsiteSettingsService();