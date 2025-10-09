import type { Metadata } from 'next'
import AdminLayoutClient from './AdminLayoutClient'
import './globals.css'
export const metadata: Metadata = {
  title: 'QBooking Admin',
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
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}