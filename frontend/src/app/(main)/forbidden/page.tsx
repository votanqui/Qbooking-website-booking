// app/forbidden/page.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with Icon */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-6xl">🚫</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">403</h1>
            <p className="text-xl text-white font-semibold">Vùng Đất Cấm</p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Truy Cập Bị Từ Chối
              </h2>
              <p className="text-gray-600 text-lg">
                Bạn không có quyền truy cập vào khu vực này. 
                Chỉ có <span className="font-semibold text-red-600">Administrator</span> mới được phép vào.
              </p>
            </div>

            {/* Warning Box */}
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <p className="font-semibold text-red-800 mb-1">
                    Khu vực hạn chế
                  </p>
                  <p className="text-sm text-red-700">
                    Trang này chỉ dành cho quản trị viên hệ thống. 
                    Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ với quản trị viên.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition duration-200 flex items-center justify-center space-x-2"
              >
                <span>←</span>
                <span>Quay lại</span>
              </button>
              
              <Link
                href="/"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition duration-200 flex items-center justify-center space-x-2 shadow-lg"
              >
                <span>🏠</span>
                <span>Về trang chủ</span>
              </Link>
            </div>

            {/* Additional Info */}
            <div className="pt-6 border-t border-gray-200">
              <details className="group">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center justify-center space-x-2">
                  <span>Tại sao tôi thấy trang này?</span>
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-4 text-sm text-gray-600 space-y-2 bg-gray-50 p-4 rounded-lg">
                  <p>
                    <strong>Lý do có thể:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Tài khoản của bạn không có quyền quản trị</li>
                    <li>Bạn đang cố truy cập trang dành cho admin</li>
                    <li>Phiên đăng nhập của bạn có thể đã hết hạn</li>
                  </ul>
                  <p className="mt-3">
                    <strong>Giải pháp:</strong> Đăng nhập lại hoặc liên hệ quản trị viên nếu bạn nghĩ đây là lỗi.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Mã lỗi: 403 FORBIDDEN | Admin Access Required
        </p>
      </div>
    </div>
  );
}