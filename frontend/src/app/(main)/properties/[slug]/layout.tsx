import type { Metadata } from 'next';
import { propertyService } from '@/services/main/property.service';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
 const { slug } = await params;


  try {
    const response = await propertyService.getPropertyBySlug(slug);


    if (response.success && response.data) {
      const p = response.data;
      return {
        title: p.metaTitle || `${p.name} – MySite`,
        description:
          p.metaDescription ||
          p.shortDescription ||
          `Đặt phòng ${p.name} giá tốt`,
        keywords: p.metaKeywords
          ? p.metaKeywords.split(', ')
          : [
              p.name,
              p.productType.name.toLowerCase(),
              'khách sạn',
              'du lịch',
              'đặt phòng',
              p.province,
            ],
      };
    }
  } catch (err) {
    console.error('Error generating metadata:', err);
  }

  return {
    title: 'Chi tiết khách sạn – MySite',
    description: 'Đặt phòng khách sạn giá tốt.',
    keywords: ['khách sạn', 'du lịch', 'đặt phòng'],
  };
}

export default function PropertyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
