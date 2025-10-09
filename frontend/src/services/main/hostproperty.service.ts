// services/property.service.ts

import { 
  ApiResponse, 
  PropertyHostFilterRequest,
  GetHostPropertiesResponse,
  CreatePropertyRequest,
  CreatePropertyResponse,
  UploadPropertyImagesRequest,
  UploadPropertyImagesResponse,
  AmenityCategoryResponse,
  PropertyForEditResponse,
  UpdatePropertyRequest,
  SubmitPropertyForReviewResponse
} from '@/types/main/hostproperty';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class PropertyService {
  async getHostProperties(filters: PropertyHostFilterRequest): Promise<ApiResponse<GetHostPropertiesResponse>> {
    const params = new URLSearchParams();
    
    // Add filters to params
    if (filters.name) params.append('name', filters.name);
    if (filters.productTypeId) params.append('productTypeId', filters.productTypeId.toString());
    if (filters.provinceId) params.append('provinceId', filters.provinceId.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.isFeatured !== undefined) params.append('isFeatured', filters.isFeatured.toString());
    if (filters.createdFrom) params.append('createdFrom', filters.createdFrom);
    if (filters.createdTo) params.append('createdTo', filters.createdTo);
    if (filters.priceFrom) params.append('priceFrom', filters.priceFrom.toString());
    if (filters.priceTo) params.append('priceTo', filters.priceTo.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    
    params.append('page', filters.page.toString());
    params.append('pageSize', filters.pageSize.toString());

    const response = await fetch(`${API_BASE_URL}/Property/my-properties?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch properties');
    }

    return await response.json();
  }

async createProperty(
  request: CreatePropertyRequest
): Promise<ApiResponse<CreatePropertyResponse>> {
  console.log('Creating property with request:', request);

  const response = await fetch(`${API_BASE_URL}/Property/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(request)
  });

  console.log('Create property response status:', response.status, response.statusText);

  // Đọc body đúng 1 lần
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = data?.message || data?.error || response.statusText;
    throw new Error(msg);
  }

  // data đã có nội dung JSON nên return trực tiếp
  return data as ApiResponse<CreatePropertyResponse>;
}


  async uploadPropertyImages(propertyId: number, formData: FormData): Promise<ApiResponse<UploadPropertyImagesResponse>> {
    const response = await fetch(`${API_BASE_URL}/Property/${propertyId}/upload-images`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload property images');
    }

    return await response.json();
  }

  async getAmenityCategories(): Promise<AmenityCategoryResponse[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/Amenity/categories`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        return result.data
      } else if (Array.isArray(result)) {
        return result
      }
      
      return []
    } catch (error) {
      console.error('Error fetching amenity categories:', error)
      return []
    }
  }

  async getProductTypes(): Promise<ApiResponse<any[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/Property/product-types`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Fetched product types:', data);
    return {
      success: true,
      message: 'Lấy danh sách loại hình thành công',
      statusCode: response.status,
      data
    };
  } catch (error) {
    console.error('Error fetching product types:', error);
    return {
      success: false,
      message: 'Lỗi khi lấy danh sách loại hình',
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    }
  }
  async getPropertyForEdit(id: number): Promise<ApiResponse<PropertyForEditResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/Property/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          message: 'Bạn không có quyền truy cập property này',
          statusCode: 401
        }
      }
      if (response.status === 404) {
        return {
          success: false,
          message: 'Property không tồn tại',
          statusCode: 404
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error getting property for edit:', error)
    return {
      success: false,
      message: 'Lỗi khi tải thông tin property',
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update property
 */
async updateProperty(id: number, data: UpdatePropertyRequest): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_BASE_URL}/Property/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating property:', error)
    return {
      success: false,
      message: 'Lỗi khi cập nhật property',
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Upload property images
 */

/**
 * Delete property image
 */
async deletePropertyImage(imageId: number): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_BASE_URL}/Property/image/${imageId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error deleting property image:', error)
    return {
      success: false,
      message: 'Lỗi khi xóa ảnh property',
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Set primary property image
 */
async setPrimaryPropertyImage(imageId: number): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_BASE_URL}/Property/image/${imageId}/set-primary`, {
      method: 'PUT',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error setting primary image:', error)
    return {
      success: false,
      message: 'Lỗi khi đặt ảnh chính',
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}async deleteProperty(id: number): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_BASE_URL}/Property/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          message: 'Bạn không có quyền xóa property này',
          statusCode: 401
        }
      }
      if (response.status === 404) {
        return {
          success: false,
          message: 'Property không tồn tại',
          statusCode: 404
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error deleting property:', error)
    return {
      success: false,
      message: 'Lỗi khi xóa property',
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
async submitPropertyForReview(id: number): Promise<ApiResponse<SubmitPropertyForReviewResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/Property/${id}/submit-for-review`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          message: 'Bạn không có quyền thực hiện hành động này',
          statusCode: 401
        };
      }
      if (response.status === 404) {
        return {
          success: false,
          message: 'Property không tồn tại hoặc bạn không có quyền',
          statusCode: 404
        };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting property for review:', error);
    return {
      success: false,
      message: 'Lỗi khi gửi property để xét duyệt',
      statusCode: 500,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
}

export const propertyService = new PropertyService();