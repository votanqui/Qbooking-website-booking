import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'QBooking Quản Lý Bookings',
  description: 'Trang quản trị hệ thống QBooking',
   icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return children  // ✅ Đúng: trả về ReactNode trực tiếp
}