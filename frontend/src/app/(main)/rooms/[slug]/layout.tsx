// app/rooms/[slug]/layout.tsx
import { Metadata } from 'next'
import { roomService } from '@/services/main/room.service'

interface Props {
  params: { slug: string }
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params
  
  try {
    const response = await roomService.getRoomBySlug(slug)
    
    if (response.success && response.data) {
      const room = response.data
      
      // Lấy ảnh đầu tiên làm og:image
      const primaryImage = room.images.find(img => img.isPrimary) || room.images[0]
      const imageUrl = primaryImage 
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${primaryImage.imageUrl}`
        : null

      return {
        title: room.metaTitle || room.name,
        description: room.metaDescription || room.shortDescription,
        keywords: [
          room.name,
          room.propertyName,
          room.bedType,
          'khách sạn',
          'đặt phòng',
          'booking',
          ...room.amenities.map(a => a.name)
        ],
        authors: [{ name: room.propertyName }],
        openGraph: {
          title: room.metaTitle || room.name,
          description: room.metaDescription || room.shortDescription,
          type: 'website',
          locale: 'vi_VN',
          siteName: room.propertyName,
          images: imageUrl ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: room.name,
            }
          ] : [],
        },
        twitter: {
          card: 'summary_large_image',
          title: room.metaTitle || room.name,
          description: room.metaDescription || room.shortDescription,
          images: imageUrl ? [imageUrl] : [],
        },
        alternates: {
          canonical: `/rooms/${slug}`,
        },
        robots: {
          index: room.isActive,
          follow: room.isActive,
          googleBot: {
            index: room.isActive,
            follow: room.isActive,
          },
        },
        other: {
          'price:amount': room.basePrice.toString(),
          'price:currency': 'VND',
          'availability': room.totalRooms > 0 ? 'instock' : 'outofstock',
        }
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
  }

  // Fallback metadata
  return {
    title: 'Chi tiết phòng',
    description: 'Xem thông tin chi tiết phòng và đặt phòng ngay',
  }
}

export default function RoomLayout({ children }: Props) {
  return <>{children}</>
}