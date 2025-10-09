'use client'

import { Suspense, useEffect, useState } from 'react'
import { SearchBar } from '@/components/features/SearchBar'
import { PropertyCard } from '@/components/features/PropertyCard'
import { DiscountTicker } from '@/components/features/DiscountTicker'
import { MostViewedSection } from '@/components/features/MostViewed'
import { MostBookedSection } from '@/components/features/MostBooked'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Loading } from '@/components/ui/Loading'
import { propertyService } from '@/services/main/property.service'
import { Property } from '@/types/main/property'

interface Destination {
  name: string
  properties: number
  image: string
}

// Static destinations data - could also be fetched from API in the future
const destinations: Destination[] = [
  { name: 'Ho Chi Minh City', properties: 1240, image: '/images/villa-1.jpg' },
  { name: 'Hanoi', properties: 890, image: '/images/hotel-1.jpg' },
  { name: 'Da Nang', properties: 567, image: '/images/resort-1.jpg' },
  { name: 'Nha Trang', properties: 432, image: '/images/homestay-1.jpg' }
]

export default function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [displayedProperties, setDisplayedProperties] = useState<Property[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreProperties, setHasMoreProperties] = useState(true)
  const [totalProperties, setTotalProperties] = useState(0)
  
  const PROPERTIES_PER_LOAD = 3

  useEffect(() => {
    loadInitialProperties()
  }, [])

  const loadInitialProperties = async () => {
    try {
      setIsInitialLoading(true)
      setError(null)
      
      // Fetch first batch of featured properties
      const response = await propertyService.getFeaturedProperties({
        page: 1,
        pageSize: PROPERTIES_PER_LOAD
      })
      
      if (response.success && response.data) {
        const properties = response.data.properties.map(property => 
          propertyService.convertApiResponseToProperty(property)
        )
        
        setFeaturedProperties(properties)
        setDisplayedProperties(properties)
        setHasMoreProperties(properties.length === PROPERTIES_PER_LOAD)
        setTotalProperties(prev => Math.max(prev, properties.length))
        setCurrentPage(1)
      } else {
        setError(response.message || 'Không thể tải danh sách property')
        setHasMoreProperties(false)
      }
    } catch (err) {
      console.error('Error loading initial properties:', err)
      setError('Không thể tải danh sách property. Vui lòng thử lại sau.')
      setHasMoreProperties(false)
    } finally {
      setIsInitialLoading(false)
    }
  }

  const loadMoreProperties = async () => {
    if (isLoadingMore || !hasMoreProperties) return

    try {
      setIsLoadingMore(true)
      setError(null)
      
      const nextPage = currentPage + 1
      const response = await propertyService.getFeaturedProperties({
        page: nextPage,
        pageSize: PROPERTIES_PER_LOAD
      })
      
      if (response.success && response.data) {
        const newProperties = response.data.properties.map(property => 
          propertyService.convertApiResponseToProperty(property)
        )
        
        const updatedProperties = [...featuredProperties, ...newProperties]
        setFeaturedProperties(updatedProperties)
        setDisplayedProperties(updatedProperties)
        setCurrentPage(nextPage)
        
        const totalLoaded = updatedProperties.length
        setTotalProperties(totalLoaded)
        setHasMoreProperties(newProperties.length === PROPERTIES_PER_LOAD)
      } else {
        setError(response.message || 'Không thể tải thêm property')
      }
    } catch (err) {
      console.error('Error loading more properties:', err)
      setError('Không thể tải thêm property. Vui lòng thử lại sau.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleRetry = () => {
    if (displayedProperties.length === 0) {
      loadInitialProperties()
    } else {
      loadMoreProperties()
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Discount Ticker - Placed at the very top */}
      <DiscountTicker />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-r from-pink-600 via-purple-600 to-pink-800">
        <div className="absolute inset-0 bg-black/30"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
           backgroundImage: 'url(/images/background.png)',
            backgroundBlendMode: 'overlay'
          }}
        ></div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
            Khám phá kỳ nghỉ mơ ước của bạn
          </h1>
          <p className="text-xl md:text-2xl font-semibold mb-8 max-w-2xl mx-auto text-center">
            <span
              className="
                bg-gradient-to-r from-purple-500 to-pink-500
                bg-clip-text text-transparent
                drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]
                px-2 py-1 rounded-lg"
            >
              Khám phá những nơi lưu trú tuyệt vời quanh{" "}
              <span
                className="
                  bg-gradient-to-r from-red-600 via-red-500 to-red-700
                  bg-clip-text text-transparent
                  drop-shadow-[0_6px_12px_rgba(0,0,0,1)]
                  font-extrabold"
              >
                Việt Nam
              </span>
              . Từ biệt thự sang trọng đến căn hộ ấm cúng.
            </span>
          </p>
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <Suspense fallback={<Loading />}>
              <SearchBar />
            </Suspense>
          </div>
        </div>

        {/* Floating stats */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-8 text-white">
          <div className="text-center">
            <div className="text-3xl font-bold">10K+</div>
            <div className="text-sm opacity-80">Properties</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">50K+</div>
            <div className="text-sm opacity-80">Happy Guests</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">100+</div>
            <div className="text-sm opacity-80">Cities</div>
          </div>
        </div>
      </section>

      {/* Most Viewed Properties Section */}
      <MostViewedSection />

      {/* Most Booked Properties Section */}
      <MostBookedSection />

      {/* Featured Properties */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Khách sạn & Chỗ ở Nổi bật
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Chỗ nghỉ được lựa chọn kỹ lưỡng mang đến trải nghiệm đặc biệt và sự thoải mái vô song
            </p>
            {totalProperties > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Đã hiển thị {displayedProperties.length} property{hasMoreProperties ? '' : ' (tất cả)'}
              </p>
            )}
          </div>

          {/* Initial Loading State */}
          {isInitialLoading && (
            <div className="flex justify-center items-center py-20">
              <Loading />
            </div>
          )}

          {/* Error State */}
          {error && !isInitialLoading && displayedProperties.length === 0 && (
            <div className="text-center py-20">
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
                <div className="text-red-600 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-700 mb-4">{error}</p>
                <Button onClick={handleRetry} variant="outline">
                  Thử lại
                </Button>
              </div>
            </div>
          )}

          {/* Properties Grid */}
          {!isInitialLoading && displayedProperties.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayedProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>

              {/* Load More Section */}
              <div className="text-center mt-12">
                {hasMoreProperties && (
                  <div className="space-y-4">
                    <Button 
                      onClick={loadMoreProperties}
                      disabled={isLoadingMore}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      {isLoadingMore ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Đang tải...</span>
                        </div>
                      ) : (
                        `Xem thêm property`
                      )}
                    </Button>
                    
                    {error && (
                      <div className="text-red-600 text-sm">
                        <p>{error}</p>
                        <Button 
                          onClick={handleRetry} 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                        >
                          Thử lại
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {!hasMoreProperties && displayedProperties.length > 0 && (
                  <div className="text-gray-600">
                    <p className="mb-4">🎉 Bạn đã xem hết tất cả property nổi bật!</p>
                    <Button variant="outline" size="lg">
                      Xem tất cả property
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Empty State */}
          {!isInitialLoading && !error && displayedProperties.length === 0 && (
            <div className="text-center py-20">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg">Không có property nổi bật nào được tìm thấy.</p>
            </div>
          )}
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Popular Destinations
            </h2>
            <p className="text-gray-600 text-lg">
              Explore the most loved destinations in Vietnam
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((destination) => (
              <Card key={destination.name} className="group cursor-pointer overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative h-64">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/images/placeholder-destination.jpg'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold mb-1">{destination.name}</h3>
                    <p className="text-sm opacity-90">{destination.properties.toLocaleString()} properties</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Tại Sao Chọn Chúng Tôi?
              </span>
            </h2>
            <p className="text-gray-600 text-lg">
              Chúng tôi mang đến trải nghiệm du lịch liền mạch và đáng nhớ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-2 border-transparent hover:border-pink-200">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Chỗ Nghỉ Được Xác Minh</h3>
              <p className="text-gray-600">Tất cả các chỗ nghỉ đều được xác minh kỹ lưỡng về chất lượng và an toàn.</p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-2 border-transparent hover:border-purple-200">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Đảm Bảo Giá Tốt Nhất</h3>
              <p className="text-gray-600">Chúng tôi cam kết giá tốt nhất mà không có phí ẩn.</p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-2 border-transparent hover:border-pink-200">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Hỗ Trợ 24/7</h3>
              <p className="text-gray-600">Hỗ trợ khách hàng suốt ngày đêm cho mọi nhu cầu của bạn.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-4">Cập Nhật Tin Tức</h2>
          <p className="text-pink-100 text-lg mb-8 max-w-2xl mx-auto">
            Đăng ký nhận bản tin và nhận các ưu đãi tốt nhất cùng mẹo du lịch gửi đến hộp thư của bạn.
          </p>
          
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 px-6 py-4 rounded-lg bg-white/10 border border-pink-300/30 text-white placeholder-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 backdrop-blur-sm"
            />
            <Button className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
              Đăng ký
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}