'use client';

import { useEffect, useState } from 'react';
import { analyticsService } from '@/services/admin/analytics.service';
import {
  SearchTrendsResponse,
  TopKeywordsResponse,
  PopularLocationsResponse,
  PropertyTypeDistributionResponse,
  PriceRangeAnalysisResponse,
  PropertyViewsStatsResponse,
  TopViewedPropertiesResponse,
  ConversionRateResponse,
  PeakHoursResponse,
} from '@/types/admin/analytics';

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(false);
  const [searchTrends, setSearchTrends] = useState<SearchTrendsResponse | null>(null);
  const [topKeywords, setTopKeywords] = useState<TopKeywordsResponse | null>(null);
  const [popularLocations, setPopularLocations] = useState<PopularLocationsResponse | null>(null);
  const [propertyTypes, setPropertyTypes] = useState<PropertyTypeDistributionResponse | null>(null);
  const [priceAnalysis, setPriceAnalysis] = useState<PriceRangeAnalysisResponse | null>(null);
  const [viewsStats, setViewsStats] = useState<PropertyViewsStatsResponse | null>(null);
  const [topProperties, setTopProperties] = useState<TopViewedPropertiesResponse | null>(null);
  const [conversionRate, setConversionRate] = useState<ConversionRateResponse | null>(null);
  const [peakHours, setPeakHours] = useState<PeakHoursResponse | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Load Search Trends
      const trendsResponse = await analyticsService.getSearchTrends({
        groupBy: 'day'
      });
      if (trendsResponse.success) {
        setSearchTrends(trendsResponse.data);
      }

      // 2. Load Top Keywords
      const keywordsResponse = await analyticsService.getTopKeywords({
        top: 10,
        days: 30
      });
      if (keywordsResponse.success) {
        setTopKeywords(keywordsResponse.data);
      }

      // 3. Load Popular Locations
      const locationsResponse = await analyticsService.getPopularLocations({
        top: 10
      });
      if (locationsResponse.success) {
        setPopularLocations(locationsResponse.data);
      }

      // 4. Load Property Type Distribution
      const typesResponse = await analyticsService.getPropertyTypeDistribution({
        days: 30
      });
      if (typesResponse.success) {
        setPropertyTypes(typesResponse.data);
      }

      // 5. Load Price Range Analysis
      const priceResponse = await analyticsService.getPriceRangeAnalysis();
      if (priceResponse.success) {
        setPriceAnalysis(priceResponse.data);
      }

      // 6. Load Property Views Stats
      const viewsResponse = await analyticsService.getPropertyViewsStats();
      if (viewsResponse.success) {
        setViewsStats(viewsResponse.data);
      }

      // 7. Load Top Viewed Properties
      const topPropsResponse = await analyticsService.getTopViewedProperties({
        top: 10,
        days: 30
      });
      if (topPropsResponse.success) {
        setTopProperties(topPropsResponse.data);
      }

      // 8. Load Conversion Rate
      const conversionResponse = await analyticsService.getConversionRate({
        days: 30
      });
      if (conversionResponse.success) {
        setConversionRate(conversionResponse.data);
      }

      // 9. Load Peak Hours
      const peakResponse = await analyticsService.getPeakHours({
        days: 30
      });
      if (peakResponse.success) {
        setPeakHours(peakResponse.data);
      }

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load User Journey for specific user
  const loadUserJourney = async (userId: number) => {
    try {
      const response = await analyticsService.getUserJourney(userId);
      if (response.success) {
        console.log('User Journey:', response.data);
        // Handle user journey data
      }
    } catch (error) {
      console.error('Error loading user journey:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pink-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-purple-600">Phân tích dữ liệu và hành vi người dùng</p>
        </div>

        {/* Search Trends Section */}
        {searchTrends && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-pink-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-purple-900">Xu hướng tìm kiếm</h2>
            </div>
            <p className="text-sm text-purple-600 mb-4">
              📅 {new Date(searchTrends.startDate).toLocaleDateString('vi-VN')} - {new Date(searchTrends.endDate).toLocaleDateString('vi-VN')}
            </p>
            <div className="space-y-2">
              {searchTrends.trends.map((trend, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl hover:from-pink-100 hover:to-purple-100 transition-colors">
                  <span className="font-semibold text-purple-900">{trend.period}</span>
                  <div className="text-right">
                    <div className="text-lg font-bold text-pink-600">{trend.totalSearches} tìm kiếm</div>
                    <div className="text-sm text-purple-500">{trend.uniqueUsers} người dùng • {trend.uniqueSessions} phiên</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Keywords Section */}
        {topKeywords && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-pink-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-purple-900">🔥 Top từ khóa ({topKeywords.period})</h2>
            </div>
            <div className="grid gap-3">
              {topKeywords.keywords.map((keyword, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <span className="font-bold text-purple-900">{keyword.keyword}</span>
                      <div className="text-xs text-purple-500">{keyword.uniqueUsers} người dùng</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-pink-600">{keyword.searchCount}</div>
                    <div className="text-xs text-purple-500">lượt tìm</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Locations Section */}
        {popularLocations && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-pink-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-purple-900">📍 Địa điểm phổ biến</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-pink-600 mb-3 text-lg">Top Tỉnh/Thành</h3>
                <div className="space-y-2">
                  {popularLocations.topProvinces.map((location) => (
                    <div key={location.locationId} className="p-3 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-purple-900">{location.locationName}</span>
                        <span className="font-bold text-pink-600 text-lg">{location.searchCount}</span>
                      </div>
                      <div className="text-xs text-purple-500 mt-1">{location.uniqueUsers} người dùng</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-purple-600 mb-3 text-lg">Top Quận/Huyện</h3>
                <div className="space-y-2">
                  {popularLocations.topCommunes.map((location) => (
                    <div key={location.communeId} className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-purple-900">{location.communeName}</span>
                        <span className="font-bold text-purple-600 text-lg">{location.searchCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Property Types Distribution */}
        {propertyTypes && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-pink-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-purple-900">🏠 Phân bố loại hình ({propertyTypes.period})</h2>
            </div>
            <div className="space-y-3">
              {propertyTypes.distribution.map((type, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-purple-900">{type.propertyType}</span>
                    <span className="font-bold text-pink-600 text-lg">{type.percentage}%</span>
                  </div>
                  <div className="w-full bg-purple-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-purple-500 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${type.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-purple-500 mt-2">{type.count} lượt tìm kiếm</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversion Rate */}
        {conversionRate && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-pink-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-purple-900">📊 Tỷ lệ chuyển đổi ({conversionRate.period})</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border-2 border-pink-200">
                <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent">
                  {conversionRate.totalSearches}
                </div>
                <div className="text-sm text-purple-600 font-medium mt-2">Tổng tìm kiếm</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                  {conversionRate.usersWhoViewed}
                </div>
                <div className="text-sm text-purple-600 font-medium mt-2">Người xem</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 rounded-xl border-2 border-pink-200">
                <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {conversionRate.conversionRate}%
                </div>
                <div className="text-sm text-purple-600 font-medium mt-2">Tỷ lệ chuyển đổi</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 rounded-xl border-2 border-purple-200">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {conversionRate.avgSearchesPerUser}
                </div>
                <div className="text-sm text-purple-600 font-medium mt-2">TB tìm/người</div>
              </div>
            </div>
          </div>
        )}

        {/* Peak Hours */}
        {peakHours && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-pink-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-purple-900">⏰ Giờ cao điểm ({peakHours.period})</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-6 bg-gradient-to-br from-pink-100 to-pink-50 rounded-xl text-center border-2 border-pink-200">
                <div className="text-sm text-purple-700 font-medium mb-2">🔍 Giờ tìm kiếm cao điểm</div>
                <div className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent">
                  {peakHours.peakSearchHour}:00
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl text-center border-2 border-purple-200">
                <div className="text-sm text-purple-700 font-medium mb-2">👁️ Giờ xem cao điểm</div>
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                  {peakHours.peakViewHour}:00
                </div>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {peakHours.searchesByHour.map((hour) => {
                const maxCount = Math.max(...peakHours.searchesByHour.map(h => h.count));
                const intensity = (hour.count / maxCount) * 100;
                return (
                  <div 
                    key={hour.hour} 
                    className="text-center p-3 rounded-lg transition-all hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, rgba(236, 72, 153, ${intensity/100}) 0%, rgba(168, 85, 247, ${intensity/100}) 100%)`
                    }}
                  >
                    <div className="text-xs font-medium text-purple-900">{hour.hour}h</div>
                    <div className="font-bold text-purple-900">{hour.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Viewed Properties */}
        {topProperties && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-pink-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-purple-900">🏆 Top Properties ({topProperties.period})</h2>
            </div>
            <div className="space-y-3">
              {topProperties.properties.map((property, index) => (
                <div key={property.propertyId} className="flex justify-between items-center p-4 bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 rounded-xl hover:from-pink-100 hover:via-purple-100 hover:to-pink-100 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                      'bg-gradient-to-br from-pink-500 to-purple-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <span className="font-bold text-purple-900 block">{property.propertyTitle}</span>
                      <div className="text-xs text-purple-500">{property.uniqueViewers} người xem độc nhất</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-pink-600">{property.viewCount}</div>
                    <div className="text-xs text-purple-500">lượt xem</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Views Statistics */}
        {viewsStats && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-pink-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-purple-900">📈 Thống kê lượt xem</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border border-pink-200">
                <div className="text-3xl font-bold text-pink-600">{viewsStats.totalViews}</div>
                <div className="text-sm text-purple-600 font-medium mt-1">Tổng lượt xem</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="text-3xl font-bold text-purple-600">{viewsStats.uniqueProperties}</div>
                <div className="text-sm text-purple-600 font-medium mt-1">Properties</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-purple-100 rounded-xl border border-pink-200">
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {viewsStats.uniqueUsers}
                </div>
                <div className="text-sm text-purple-600 font-medium mt-1">Người dùng</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl border border-purple-200">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {viewsStats.avgViewsPerProperty.toFixed(1)}
                </div>
                <div className="text-sm text-purple-600 font-medium mt-1">TB xem/property</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}