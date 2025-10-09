import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Danh sách phòng - QBooking",
  description: "Khám phá các loại phòng từ khách sạn, homestay, resort. So sánh giá, xem tiện nghi và đặt phòng trực tuyến dễ dàng trên QBooking.",
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