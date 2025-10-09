// app/(admin)/layout.tsx - Layout riêng cho Admin (Modern Design)
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { userService } from '@/services/main/user.service';
import AdminHeader from '@/components/layout/AdminHeader';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast'
interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    
    // Handle responsive sidebar
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkAdminAccess = async () => {
    try {
      const response = await userService.getProfile();
      
      if (response.success && response.data) {
        const userRole = response.data.role?.toLowerCase();
        
        if (userRole === 'admin') {
          setUserProfile(response.data);
          setIsLoading(false);
        } else {
          router.push('/forbidden');
        }
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/auth/login');
    }
  };

  if (isLoading) {
    return (
      <html lang="vi">
        <body>
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-pink-800 to-rose-900">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-pink-400 mx-auto mb-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl">✨</span>
                </div>
              </div>
              <p className="text-pink-100 text-lg font-medium">Đang xác thực quyền truy cập...</p>
              <p className="text-pink-300 text-sm mt-2">Vui lòng chờ trong giây lát</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: '📊', desc: 'Tổng quan hệ thống' },
  { id: 'properties', label: 'Properties', href: '/admin/properties', icon: '🏡', desc: 'Quản lý nhà nghỉ / khách sạn' },
  { id: 'bookings', label: 'Bookings', href: '/admin/bookings', icon: '🗓️', desc: 'Quản lý đặt phòng' },
  { id: 'Location', label: 'Location', href: '/admin/andress', icon: '📍', desc: 'Quản lý địa điểm' },
  { id: 'users', label: 'Users', href: '/admin/users', icon: '👤', desc: 'Quản lý người dùng' },
  { id: 'Amenities', label: 'Amenities', href: '/admin/amenities', icon: '🛋️', desc: 'Quản lý tiện ích' },
  { id: 'Coupons', label: 'Coupons', href: '/admin/coupons', icon: '🎟️', desc: 'Quản lý mã giảm giá' },
  { id: 'Auditlogs', label: 'Audit Logs', href: '/admin/audit-logs', icon: '🕵️‍♂️', desc: 'Theo dõi hành động người dùng' },
  { id: 'notifications', label: 'Notifications', href: '/admin/notifications', icon: '🔔', desc: 'Gửi và quản lý thông báo' },
    { id: 'refund-manager', label: 'Refund Manager', href: '/admin/refund-manager', icon: '💸', desc: 'Xử lý và quản lý yêu cầu hoàn tiền' },
  { id: 'reviews', label: 'Reviews', href: '/admin/reviews', icon: '💬', desc: 'Quản lý đánh giá' },
  { id: 'favorites', label: 'Favorites', href: '/admin/favorites', icon: '❤️', desc: 'Quản lý yêu thích' },
  { id: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: '📈', desc: 'Phân tích dữ liệu' },
  { id: 'image-statistics', label: 'Image Statistics', href: '/admin/image-statistics', icon: '🖼️', desc: 'Thống kê hình ảnh' },
  { id: 'settings', label: 'Settings', href: '/admin/settings', icon: '⚙️', desc: 'Cài đặt hệ thống' }
]
;


  const isActiveRoute = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <html lang="vi">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50">
          {/* Admin Header */}
          <AdminHeader 
            userProfile={userProfile} 
            onMenuClick={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
          />

          <div className="flex">
            {/* Overlay for mobile */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                onClick={toggleSidebar}
              ></div>
            )}

            {/* Sidebar */}
            <aside 
              className={`
                fixed lg:sticky top-[73px] left-0 h-[calc(100vh-73px)] z-40
                bg-white shadow-2xl border-r border-purple-200
                transition-all duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${isSidebarOpen ? 'w-72' : 'lg:w-20'}
              `}
            >
              {/* Navigation */}
              <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-200px)]">
                {menuItems.map((item) => {
                  const isActive = isActiveRoute(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={`group flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 hover:translate-x-1'
                      }`}
                    >
                      <span className={`text-2xl transition-transform flex-shrink-0 ${
                        isActive ? 'scale-110' : 'group-hover:scale-110'
                      }`}>
                        {item.icon}
                      </span>
                      {isSidebarOpen && (
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm truncate ${
                            isActive ? 'text-white' : 'text-gray-800'
                          }`}>
                            {item.label}
                          </p>
                          <p className={`text-xs truncate ${
                            isActive ? 'text-pink-100' : 'text-gray-500'
                          }`}>
                            {item.desc}
                          </p>
                        </div>
                      )}
                      {isActive && isSidebarOpen && (
                        <div className="w-1.5 h-8 bg-white rounded-full"></div>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Quick Actions */}
              {isSidebarOpen && (
                <div className="p-4 border-t border-purple-200">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                    Thao tác nhanh
                  </h3>
                  <div className="space-y-2">
                    <button className="w-full flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-lg transition shadow-md hover:shadow-lg">
                      <span className="text-lg">➕</span>
                      <span className="text-sm font-medium">Thêm Property</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg transition shadow-md hover:shadow-lg">
                      <span className="text-lg">📊</span>
                      <span className="text-sm font-medium">Xem báo cáo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Footer Info */}
              {isSidebarOpen && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-purple-100 to-transparent">
                  <div className="text-center text-xs text-gray-500">
                    <p className="font-semibold">Qbooking Admin</p>
                    <p className="mt-1">© 2024 All Rights Reserved</p>
                  </div>
                </div>
              )}
            </aside>

            {/* Main Content */}
            <main className={`flex-1 p-4 md:p-8 transition-all duration-300 ${
              isSidebarOpen ? 'lg:ml-0' : ''
            }`}>
              <div className="max-w-7xl mx-auto">
                   <ToastProvider>
          {children}
        </ToastProvider>
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}