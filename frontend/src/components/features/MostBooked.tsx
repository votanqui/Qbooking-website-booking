'use client'

import { useEffect, useState } from 'react'
import { PropertyCard } from '@/components/features/PropertyCard'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { propertyService } from '@/services/main/property.service'
import { Property } from '@/types/main/property'

export const MostBookedSection = () => {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    loadMostBookedProperties()
  }, [])

  const loadMostBookedProperties = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await propertyService.getMostBookedProperties(12)
      
      if (response.success && response.data) {
        const bookedProperties = response.data.properties.map(property => 
          propertyService.convertApiResponseToProperty(property)
        )
        setProperties(bookedProperties)
      } else {
        setError(response.message || 'Không thể tải danh sách property được đặt nhiều')
      }
    } catch (err) {
      console.error('Error loading most booked properties:', err)
      setError('Không thể tải danh sách property. Vui lòng thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  const displayedProperties = showAll ? properties : properties.slice(0, 6)

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-20">
            <Loading />
          </div>
        </div>
      </section>
    )
  }

  if (error || properties.length === 0) {
    return null
  }

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-pink-300 rounded-full filter blur-3xl opacity-20 -translate-y-1/2 -translate-x-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 rounded-full filter blur-3xl opacity-20 translate-y-1/2 translate-x-1/2"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            <span>Được đặt nhiều nhất</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              Lựa Chọn Hàng Đầu
            </span>
          </h2>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto">
            Những chỗ nghỉ được yêu thích và đặt chỗ nhiều nhất bởi khách du lịch
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-purple-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Được yêu thích</span>
            </div>
            <div className="flex items-center gap-2 text-pink-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Chất lượng cao</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedProperties.map((property, index) => (
            <div 
              key={property.id}
              className="transform transition-all duration-300 hover:scale-105 relative"
              style={{ 
                animationDelay: `${index * 100}ms`,
                animation: 'slideIn 0.6s ease-out forwards',
                opacity: 0
              }}
            >
              {index < 3 && (
                <div className="absolute -top-3 -right-3 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg transform rotate-12">
                  🔥 Top {index + 1}
                </div>
              )}
              <PropertyCard property={property} />
            </div>
          ))}
        </div>

        {properties.length > 6 && (
          <div className="text-center mt-12">
            <Button 
              onClick={() => setShowAll(!showAll)}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {showAll ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Thu gọn
                </>
              ) : (
                <>
                  Khám phá thêm {properties.length - 6} property
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  )
}