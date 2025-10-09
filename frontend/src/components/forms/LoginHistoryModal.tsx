// components/forms/LoginHistoryModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { loginHistoryService } from '@/services/main/loginHistory.service'
import { useToast } from '@/components/ui/Toast'
import { LoginHistory, LoginHistoryResponse, GetLoginHistoryRequest } from '@/types/main/loginHistory'

interface LoginHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginHistoryModal({ isOpen, onClose }: LoginHistoryModalProps) {
  const [histories, setHistories] = useState<LoginHistory[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [filters, setFilters] = useState<{
    fromDate: string
    toDate: string
  }>({
    fromDate: '',
    toDate: ''
  })
  const [isFiltering, setIsFiltering] = useState(false)
  
  const { showToast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchLoginHistory()
    }
  }, [isOpen, currentPage])

  const fetchLoginHistory = async (customFilters?: GetLoginHistoryRequest) => {
    setIsLoading(true)
    try {
      const request: GetLoginHistoryRequest = {
        page: customFilters?.page || currentPage,
        pageSize: customFilters?.pageSize || pageSize,
        fromDate: customFilters?.fromDate || (filters.fromDate ? new Date(filters.fromDate) : undefined),
        toDate: customFilters?.toDate || (filters.toDate ? new Date(filters.toDate) : undefined)
      }

      const response = await loginHistoryService.getMyLoginHistory(request)
      
      if (response.success && response.data) {
        setHistories(response.data.histories)
        setPagination(response.data.pagination)
      } else {
        showToast(response.message || 'Không thể tải lịch sử đăng nhập', 'error')
      }
    } catch (error) {
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (field: 'fromDate' | 'toDate', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleApplyFilters = () => {
    setIsFiltering(true)
    setCurrentPage(1)
    
    const request: GetLoginHistoryRequest = {
      page: 1,
      pageSize,
      fromDate: filters.fromDate ? new Date(filters.fromDate) : undefined,
      toDate: filters.toDate ? new Date(filters.toDate) : undefined
    }
    
    fetchLoginHistory(request).finally(() => setIsFiltering(false))
  }

  const handleClearFilters = () => {
    setFilters({ fromDate: '', toDate: '' })
    setCurrentPage(1)
    fetchLoginHistory({ page: 1, pageSize })
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleClose = () => {
    setHistories([])
    setPagination(null)
    setCurrentPage(1)
    setFilters({ fromDate: '', toDate: '' })
    onClose()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    }).format(date)
  }

  const getDeviceIcon = (deviceInfo: string) => {
    const lowerDevice = deviceInfo.toLowerCase()
    if (lowerDevice.includes('mobile') || lowerDevice.includes('android') || lowerDevice.includes('iphone')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
        </svg>
      )
    }
    if (lowerDevice.includes('tablet') || lowerDevice.includes('ipad')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  }

  const getBrowserInfo = (deviceInfo: string) => {
    const parts = deviceInfo.split(' on ')
    return {
      browser: parts[0] || 'Unknown Browser',
      os: parts[1] || 'Unknown OS'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Lịch sử đăng nhập" size="lg">
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Bộ lọc</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Từ ngày</label>
              <Input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Đến ngày</label>
              <Input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              onClick={handleApplyFilters}
              disabled={isFiltering}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isFiltering ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Đang lọc...</span>
                </div>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Áp dụng bộ lọc
                </>
              )}
            </Button>
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Xóa bộ lọc
            </Button>
          </div>
        </div>

        {/* Login History List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-gray-600">Đang tải lịch sử đăng nhập...</span>
              </div>
            </div>
          ) : histories.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có lịch sử đăng nhập</h3>
              <p className="text-gray-600">Chưa có dữ liệu lịch sử đăng nhập trong khoảng thời gian này.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {histories.map((history) => {
                const deviceInfo = getBrowserInfo(history.deviceInfo)
                return (
                  <div
                    key={history.id}
                    className={`border rounded-lg p-4 transition-all duration-200 ${
                      history.isSuccess
                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                        : 'bg-red-50 border-red-200 hover:bg-red-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${
                          history.isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {getDeviceIcon(history.deviceInfo)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              history.isSuccess 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {history.isSuccess ? (
                                <>
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Thành công
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                  Thất bại
                                </>
                              )}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(history.loginTime)}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                              </svg>
                              <span>IP: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{history.ipAddress}</code></span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{deviceInfo.browser} trên {deviceInfo.os}</span>
                            </div>
                          </div>

                          {!history.isSuccess && history.failureReason && (
                            <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700">
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span>Lý do thất bại: {history.failureReason}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-600">
              Hiển thị {((pagination.currentPage - 1) * pagination.pageSize) + 1} - {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} trong tổng số {pagination.totalCount} lần đăng nhập
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevious}
                variant="outline"
                size="sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Trước
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i
                  } else {
                    pageNum = pagination.currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      variant={pageNum === pagination.currentPage ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                variant="outline"
                size="sm"
              >
                Sau
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleClose} variant="outline">
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  )
}