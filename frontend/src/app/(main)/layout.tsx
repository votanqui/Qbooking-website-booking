import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ToastProvider } from '@/components/ui/Toast'
import { AuthProvider } from '@/contexts/AuthContext'
import type { Metadata } from 'next'
import { ChatWidget } from '@/components/features/ChatWidget'
import { websiteSettingsService } from '@/services/admin/websitesettings.service'
import { NotificationProvider } from '@/contexts/NotificationContext' 
const inter = Inter({ subsets: ['latin'] })

// Sử dụng generateMetadata để fetch data và generate metadata động
export async function generateMetadata(): Promise<Metadata> {
  try {
    const response = await websiteSettingsService.getPublicSettings()
    
    if (response.success && response.data) {
      const settings = response.data
      
      return {
        title: settings.metaTitle || settings.siteName || "QBooking - Đặt phòng khách sạn, homestay, resort giá tốt",
        description: settings.metaDescription || settings.siteDescription || "Nền tảng đặt phòng khách sạn, homestay, resort, villa và căn hộ. Hàng ngàn ưu đãi mỗi ngày, thanh toán an toàn, trải nghiệm nhanh chóng cùng QBooking.",
        keywords: settings.metaKeywords,
        icons: {
          icon: settings.faviconUrl || "/favicon.ico",
          shortcut: settings.faviconUrl || "/favicon.ico",
          apple: settings.logoUrl || "/apple-touch-icon.png",
        },
        openGraph: {
          title: settings.metaTitle || settings.siteName,
          description: settings.metaDescription || settings.siteDescription,
          images: settings.logoUrl ? [settings.logoUrl] : [],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: settings.metaTitle || settings.siteName,
          description: settings.metaDescription || settings.siteDescription,
          images: settings.logoUrl ? [settings.logoUrl] : [],
        },
      }
    }
  } catch (error) {
    console.error('Error fetching website settings for metadata:', error)
  }
  
  // Fallback metadata nếu API call thất bại
  return {
    title: "QBooking - Đặt phòng khách sạn, homestay, resort giá tốt",
    description: "Nền tảng đặt phòng khách sạn, homestay, resort, villa và căn hộ. Hàng ngàn ưu đãi mỗi ngày, thanh toán an toàn, trải nghiệm nhanh chóng cùng QBooking.",
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <AuthProvider>
          
        <NotificationProvider> 
            <ToastProvider>
              <Header />
              <main className="pt-16">
                {children}
              </main>
              <Footer />
                <ChatWidget />
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}