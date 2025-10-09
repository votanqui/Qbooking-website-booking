'use client'

import { useEffect, useState } from 'react'
import { PropertyCard } from '@/components/features/PropertyCard'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { propertyService } from '@/services/main/property.service'
import { Property } from '@/types/main/property'

export const MostViewedSection = () => {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    loadMostViewedProperties()
  }, [])

  const loadMostViewedProperties = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await propertyService.getMostViewedProperties(12)
      
      if (response.success && response.data) {
        const viewedProperties = response.data.properties.map(property => 
          propertyService.convertApiResponseToProperty(property)
        )
        setProperties(viewedProperties)
      } else {
        setError(response.message || 'Không thể tải danh sách property được xem nhiều')
      }
    } catch (err) {
      console.error('Error loading most viewed properties:', err)
      setError('Không thể tải danh sách property. Vui lòng thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  const displayedProperties = showAll ? properties : properties.slice(0, 6)

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50">
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
    <section className="py-20 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full filter blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200 rounded-full filter blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span>Được xem nhiều nhất</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Khách Sạn Được Quan Tâm
            </span>
          </h2>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto">
            Những chỗ nghỉ đang thu hút sự chú ý của đông đảo du khách
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedProperties.map((property, index) => (
            <div 
              key={property.id}
              className="transform transition-all duration-300 hover:scale-105"
              style={{ 
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards',
                opacity: 0
              }}
            >
              <PropertyCard property={property} />
            </div>
          ))}
        </div>

        {properties.length > 6 && (
          <div className="text-center mt-12">
            <Button 
              onClick={() => setShowAll(!showAll)}
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
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
                  Xem tất cả {properties.length} property
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
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  )
}