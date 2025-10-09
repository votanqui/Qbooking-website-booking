// components/layout/AdminHeader.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  userProfile: {
    fullName: string;
    email: string;
    avatar?: string;
    role: string;
  };
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''
export default function AdminHeader({ userProfile, onMenuClick, isSidebarOpen }: AdminHeaderProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    router.push('/auth/login');
  };

  const notifications = [
    { id: 1, title: 'Booking mới', message: 'Villa Ocean View có booking mới', time: '5 phút trước', unread: true },
    { id: 2, title: 'Property đã duyệt', message: 'Sunset Hotel đã được duyệt', time: '1 giờ trước', unread: true },
    { id: 3, title: 'Đánh giá mới', message: 'Mountain Resort nhận đánh giá 5 sao', time: '2 giờ trước', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 shadow-xl sticky top-0 z-50">
      <div className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Menu Button & Logo */}
          <div className="flex items-center space-x-3 md:space-x-6">
            {/* Menu Toggle Button */}
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
              aria-label="Toggle Menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`w-full h-0.5 bg-white rounded-full transition-all duration-300 ${
                  isSidebarOpen ? 'rotate-45 translate-y-2' : ''
                }`}></span>
                <span className={`w-full h-0.5 bg-white rounded-full transition-all duration-300 ${
                  isSidebarOpen ? 'opacity-0' : ''
                }`}></span>
                <span className={`w-full h-0.5 bg-white rounded-full transition-all duration-300 ${
                  isSidebarOpen ? '-rotate-45 -translate-y-2' : ''
                }`}></span>
              </div>
            </button>

            {/* Logo */}
            <Link href="/admin/dashboard" className="flex items-center space-x-2 md:space-x-3 group">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-xl md:text-2xl">✨</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold text-white">Qbooking</h1>
                <p className="text-xs text-pink-100">Admin Panel</p>
              </div>
            </Link>           
          </div>

          {/* Right Side - Actions & User */}
          <div className="flex items-center space-x-2 md:space-x-4">    
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition group"
              >
                <span className="text-lg md:text-xl group-hover:scale-110 transition-transform inline-block">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-pink-200 overflow-hidden animate-in slide-in-from-top-2">
                  <div className="px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Thông báo</h3>
                      <button className="text-xs hover:underline">
                        Đánh dấu đã đọc
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-pink-50 cursor-pointer transition border-b border-pink-100 ${
                          notif.unread ? 'bg-pink-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {notif.unread && (
                            <span className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-center">
                    <button className="text-sm text-pink-600 hover:text-pink-700 font-medium">
                      Xem tất cả →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* View Site Button - Hidden on mobile */}
            <Link
              href="/"
              className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg transition group"
            >
              <span className="group-hover:scale-110 transition-transform">🌐</span>
              <span className="text-sm">Trang chủ</span>
            </Link>

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 md:space-x-3 px-2 md:px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition group"
              >
                <div className="flex items-center space-x-2 md:space-x-3">
                  {userProfile.avatar ? (
                    <img
                          src={userProfile.avatar? `${API_BASE_URL}${userProfile.avatar}` : '/default-avatar.png'}  
                      alt={userProfile.fullName}
                      className="w-8 h-8 rounded-full ring-2 ring-white/50 group-hover:ring-white transition"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-pink-600 font-bold text-sm ring-2 ring-white/50 group-hover:ring-white transition">
                      {userProfile.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-white truncate max-w-[100px]">
                      {userProfile.fullName}
                    </p>
                    <p className="text-xs text-pink-100">{userProfile.role}</p>
                  </div>
                </div>
                <span className={`text-white text-xs transition-transform hidden md:inline ${showUserMenu ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-pink-200 overflow-hidden animate-in slide-in-from-top-2">
                  {/* User Info */}
                  <div className="px-4 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                    <div className="flex items-center space-x-3">
                      {userProfile.avatar ? (
                        <img
                          src={userProfile.avatar? `${API_BASE_URL}${userProfile.avatar}` : '/default-avatar.png'}                  
                         alt={userProfile.fullName}
                          className="w-12 h-12 rounded-full ring-2 ring-white"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-pink-600 font-bold text-lg ring-2 ring-white">
                          {userProfile.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {userProfile.fullName}
                        </p>
                        <p className="text-xs text-pink-100 truncate">
                          {userProfile.email}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 text-white text-xs font-semibold rounded backdrop-blur-sm">
                          ADMIN
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link
                      href="/profile"
                      className="flex items-center space-x-3 px-4 py-2.5 hover:bg-pink-50 text-gray-700 hover:text-pink-600 transition"
                    >
                      <span className="text-lg">👤</span>
                      <span className="text-sm font-medium">Hồ sơ cá nhân</span>
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="flex items-center space-x-3 px-4 py-2.5 hover:bg-pink-50 text-gray-700 hover:text-pink-600 transition"
                    >
                      <span className="text-lg">⚙️</span>
                      <span className="text-sm font-medium">Cài đặt</span>
                    </Link>
                    <Link
                      href="/admin/help"
                      className="flex items-center space-x-3 px-4 py-2.5 hover:bg-pink-50 text-gray-700 hover:text-pink-600 transition"
                    >
                      <span className="text-lg">❓</span>
                      <span className="text-sm font-medium">Trợ giúp</span>
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-pink-200 py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-red-50 text-red-600 hover:text-red-700 transition"
                    >
                      <span className="text-lg">🚪</span>
                      <span className="text-sm font-medium">Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}