import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Danh sách chỗ ở - QBooking",
  description: "Khám phá khách sạn, homestay, resort, villa, căn hộ và nhiều loại hình lưu trú khác trên QBooking. Đặt phòng dễ dàng, giá tốt, ưu đãi mỗi ngày.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return children  // ✅ Đúng: trả về ReactNode trực tiếp
}