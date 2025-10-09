'use client';

import { useState, useEffect } from 'react';
import { adminNotificationService } from '@/services/admin/adminNotification.service';
import { useToast } from '@/components/ui/Toast';
import {
  NotificationStatisticsResponse,
  AdminSendToAllNotificationRequest,
  AdminBroadcastNotificationRequest,
  PaginatedNotificationsResponse,
  AdminNotificationFilterRequest,
} from '@/types/admin/adminNotification';

type NotificationType = 
  | 'booking_confirmation'
  | 'thank_you'
  | 'booking_cancelled'
  | 'payment_reminder'
  | 'account_banned'
  | 'booking_no_show'
  | 'admin_announcement'
  | 'admin_warning'
  | 'admin_info'
  | 'admin_promotion'
  | 'admin_maintenance';

type PriorityType = 'low' | 'normal' | 'high' | 'urgent';

export default function AdminNotificationsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'send' | 'list' | 'stats'>('send');
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState<NotificationStatisticsResponse | null>(null);

  // Send Form
  const [sendForm, setSendForm] = useState({
    type: 'admin_announcement' as NotificationType,
    title: '',
    content: '',
    priority: 'normal' as PriorityType,
    sendEmail: false,
    sendToAll: true,
    userIds: [] as number[],
    userIdsInput: '',
  });

  // List & Filter
  const [notifications, setNotifications] = useState<PaginatedNotificationsResponse | null>(null);
  const [filter, setFilter] = useState<AdminNotificationFilterRequest>({
    pageNumber: 1,
    pageSize: 10,
  });

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'list') {
      loadNotifications();
    }
  }, [activeTab, filter]);

  const loadStats = async () => {
    try {
      const response = await adminNotificationService.getStatistics();
      if (response.success) {
        setStats(response.data);
      } else {
        showToast(response.message, 'error');
      }
    } catch (error) {
      showToast('Lỗi khi tải thống kê', 'error');
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await adminNotificationService.getNotificationsWithFilter(filter);
      if (response.success) {
        setNotifications(response.data);
      } else {
        showToast(response.message, 'error');
      }
    } catch (error) {
      showToast('Lỗi khi tải danh sách thông báo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!sendForm.title || !sendForm.content) {
      showToast('Vui lòng điền đầy đủ tiêu đề và nội dung', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (sendForm.sendToAll) {
        const request: AdminSendToAllNotificationRequest = {
          type: sendForm.type,
          title: sendForm.title,
          content: sendForm.content,
          priority: sendForm.priority,
          sendEmail: sendForm.sendEmail,
        };
        const response = await adminNotificationService.sendNotificationToAll(request);
        if (response.success) {
          showToast(`Đã gửi thông báo đến ${response.data.totalSent} người dùng`, 'success');
          resetForm();
          loadStats();
        } else {
          showToast(response.message, 'error');
        }
      } else {
        const userIds = sendForm.userIdsInput
          .split(',')
          .map(id => parseInt(id.trim()))
          .filter(id => !isNaN(id));

        if (userIds.length === 0) {
          showToast('Vui lòng nhập ít nhất một User ID', 'warning');
          return;
        }

        const request: AdminBroadcastNotificationRequest = {
          userIds,
          type: sendForm.type,
          title: sendForm.title,
          content: sendForm.content,
          priority: sendForm.priority,
          sendEmail: sendForm.sendEmail,
        };
        const response = await adminNotificationService.broadcastNotification(request);
        if (response.success) {
          showToast(`Đã gửi thông báo đến ${response.data.totalSent} người dùng`, 'success');
          resetForm();
          loadStats();
        } else {
          showToast(response.message, 'error');
        }
      }
    } catch (error) {
      showToast('Lỗi khi gửi thông báo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSendForm({
      type: 'admin_announcement',
      title: '',
      content: '',
      priority: 'normal',
      sendEmail: false,
      sendToAll: true,
      userIds: [],
      userIdsInput: '',
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      booking_confirmation: 'Xác nhận đặt chỗ',
      thank_you: 'Cảm ơn',
      booking_cancelled: 'Hủy đặt chỗ',
      payment_reminder: 'Nhắc thanh toán',
      account_banned: 'Tài khoản bị khóa',
      booking_no_show: 'Không xuất hiện',
      admin_announcement: 'Thông báo chung',
      admin_warning: 'Cảnh báo',
      admin_info: 'Thông tin',
      admin_promotion: 'Khuyến mãi',
      admin_maintenance: 'Bảo trì',
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    };
    return colors[priority] || colors.normal;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Quản lý Thông báo
          </h1>
          <p className="mt-2 text-gray-600">Gửi và quản lý thông báo cho người dùng</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-purple-100">
              <div className="text-2xl font-bold text-purple-600">{stats.totalNotifications}</div>
              <div className="text-sm text-gray-600 mt-1">Tổng thông báo</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-pink-100">
              <div className="text-2xl font-bold text-pink-600">{stats.totalRead}</div>
              <div className="text-sm text-gray-600 mt-1">Đã đọc</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-purple-100">
              <div className="text-2xl font-bold text-purple-600">{stats.totalEmailSent}</div>
              <div className="text-sm text-gray-600 mt-1">Email đã gửi</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-pink-100">
              <div className="text-2xl font-bold text-pink-600">{stats.readRate}%</div>
              <div className="text-sm text-gray-600 mt-1">Tỷ lệ đọc</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('send')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'send'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📤 Gửi thông báo
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'list'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📋 Danh sách
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 px-6 py-4 font-semibold transition-all ${
                activeTab === 'stats'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📊 Thống kê
            </button>
          </div>

          <div className="p-6">
            {/* Send Tab */}
            {activeTab === 'send' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Loại thông báo
                    </label>
                    <select
                      value={sendForm.type}
                      onChange={(e) => setSendForm({ ...sendForm, type: e.target.value as NotificationType })}
                      className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    >
                      <option value="admin_announcement">📢 Thông báo chung</option>
                      <option value="admin_warning">⚠️ Cảnh báo</option>
                      <option value="admin_info">ℹ️ Thông tin</option>
                      <option value="admin_promotion">🎁 Khuyến mãi</option>
                      <option value="admin_maintenance">🔧 Bảo trì</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Độ ưu tiên
                    </label>
                    <select
                      value={sendForm.priority}
                      onChange={(e) => setSendForm({ ...sendForm, priority: e.target.value as PriorityType })}
                      className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    >
                      <option value="low">Thấp</option>
                      <option value="normal">Bình thường</option>
                      <option value="high">Cao</option>
                      <option value="urgent">Khẩn cấp</option>
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    value={sendForm.title}
                    onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                    placeholder="Nhập tiêu đề thông báo"
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nội dung
                  </label>
                  <textarea
                    value={sendForm.content}
                    onChange={(e) => setSendForm({ ...sendForm, content: e.target.value })}
                    placeholder="Nhập nội dung thông báo"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none"
                  />
                </div>

                {/* Send Options */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="sendToAll"
                      checked={sendForm.sendToAll}
                      onChange={(e) => setSendForm({ ...sendForm, sendToAll: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-200"
                    />
                    <label htmlFor="sendToAll" className="text-sm font-medium text-gray-700">
                      Gửi đến tất cả người dùng đang hoạt động
                    </label>
                  </div>

                  {!sendForm.sendToAll && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        User IDs (phân cách bằng dấu phẩy)
                      </label>
                      <input
                        type="text"
                        value={sendForm.userIdsInput}
                        onChange={(e) => setSendForm({ ...sendForm, userIdsInput: e.target.value })}
                        placeholder="VD: 1, 2, 3, 4, 5"
                        className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="sendEmail"
                      checked={sendForm.sendEmail}
                      onChange={(e) => setSendForm({ ...sendForm, sendEmail: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-200"
                    />
                    <label htmlFor="sendEmail" className="text-sm font-medium text-gray-700">
                      Gửi kèm email
                    </label>
                  </div>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendNotification}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? 'Đang gửi...' : '🚀 Gửi thông báo'}
                </button>
              </div>
            )}

            {/* List Tab */}
            {activeTab === 'list' && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="grid md:grid-cols-3 gap-4">
                  <select
                    value={filter.type || ''}
                    onChange={(e) => setFilter({ ...filter, type: e.target.value || undefined, pageNumber: 1 })}
                    className="px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  >
                    <option value="">Tất cả loại</option>
                    <option value="admin_announcement">Thông báo chung</option>
                    <option value="admin_warning">Cảnh báo</option>
                    <option value="admin_info">Thông tin</option>
                    <option value="admin_promotion">Khuyến mãi</option>
                    <option value="admin_maintenance">Bảo trì</option>
                  </select>

                  <select
                    value={filter.priority || ''}
                    onChange={(e) => setFilter({ ...filter, priority: e.target.value || undefined, pageNumber: 1 })}
                    className="px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  >
                    <option value="">Tất cả độ ưu tiên</option>
                    <option value="low">Thấp</option>
                    <option value="normal">Bình thường</option>
                    <option value="high">Cao</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>

                  <select
                    value={filter.isRead === undefined ? '' : filter.isRead.toString()}
                    onChange={(e) => setFilter({ ...filter, isRead: e.target.value === '' ? undefined : e.target.value === 'true', pageNumber: 1 })}
                    className="px-4 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="true">Đã đọc</option>
                    <option value="false">Chưa đọc</option>
                  </select>
                </div>

                {/* Notifications List */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : notifications && notifications.notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 hover:shadow-lg transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(notif.priority)}`}>
                                {notif.priority.toUpperCase()}
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                {getTypeLabel(notif.type)}
                              </span>
                              {notif.isRead && (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                  ✓ Đã đọc
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-1">{notif.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{notif.content}</p>
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                              <span>👤 User ID: {notif.userId}</span>
                              <span>📅 {new Date(notif.createdAt).toLocaleString('vi-VN')}</span>
                              {notif.emailSent && <span>📧 Email đã gửi</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    <div className="flex justify-center items-center gap-2 mt-6">
                      <button
                        onClick={() => setFilter({ ...filter, pageNumber: filter.pageNumber - 1 })}
                        disabled={filter.pageNumber === 1}
                        className="px-4 py-2 rounded-lg bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-all"
                      >
                        Trước
                      </button>
                      <span className="px-4 py-2 text-gray-700 font-medium">
                        Trang {filter.pageNumber} / {notifications.totalPages}
                      </span>
                      <button
                        onClick={() => setFilter({ ...filter, pageNumber: filter.pageNumber + 1 })}
                        disabled={filter.pageNumber >= notifications.totalPages}
                        className="px-4 py-2 rounded-lg bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-all"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Không có thông báo nào
                  </div>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && stats && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* By Type */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                    <h3 className="font-semibold text-gray-800 mb-4">📊 Theo loại</h3>
                    <div className="space-y-3">
                      {Object.entries(stats.byType).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">{getTypeLabel(type)}</span>
                          <span className="font-semibold text-purple-600">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* By Priority */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                    <h3 className="font-semibold text-gray-800 mb-4">⚡ Theo độ ưu tiên</h3>
                    <div className="space-y-3">
                      {Object.entries(stats.byPriority).map(([priority, count]) => (
                        <div key={priority} className="flex justify-between items-center">
                          <span className="text-sm text-gray-700 capitalize">{priority}</span>
                          <span className="font-semibold text-pink-600">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Email Stats */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <h3 className="font-semibold text-gray-800 mb-4">📧 Thống kê Email</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{stats.totalEmailSent}</div>
                      <div className="text-sm text-gray-600">Email thành công</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{stats.totalEmailFailed}</div>
                      <div className="text-sm text-gray-600">Email thất bại</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.emailSuccessRate}%</div>
                      <div className="text-sm text-gray-600">Tỷ lệ thành công</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}