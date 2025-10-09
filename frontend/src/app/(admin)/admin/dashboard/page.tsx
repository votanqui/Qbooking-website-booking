'use client'

import { useEffect, useState } from 'react';
import { dashboardService } from '@/services/admin/dashboard.service';
import {
  DashboardOverview,
  RevenueChartData,
  BookingStatusData,
  TopPropertiesData,
  RecentBookingsData,
  OccupancyRateData,
  CustomerGrowthData,
  PaymentMethodsData,
  ReviewsSummaryData,
} from '@/types/admin/dashboard';
import {
  TrendingUp,
  TrendingDown,
  Home,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  Star,
  BarChart3,
  Eye,
  DollarSign,
  Building2,
  CreditCard,
  MessageSquare,
  Bed,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenueChartData | null>(null);
  const [bookingStatus, setBookingStatus] = useState<BookingStatusData | null>(null);
  const [topProperties, setTopProperties] = useState<TopPropertiesData | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBookingsData | null>(null);
  const [occupancyRate, setOccupancyRate] = useState<OccupancyRateData | null>(null);
  const [customerGrowth, setCustomerGrowth] = useState<CustomerGrowthData | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodsData | null>(null);
  const [reviewsSummary, setReviewsSummary] = useState<ReviewsSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last30Days');
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    loadDashboardData();
  }, [dateRange, chartPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const presets = dashboardService.getDateRangePresets();
      const range = presets[dateRange as keyof typeof presets];

      const [
        overviewRes,
        revenueChartRes,
        bookingStatusRes,
        topPropertiesRes,
        recentBookingsRes,
        occupancyRateRes,
        customerGrowthRes,
        paymentMethodsRes,
        reviewsSummaryRes,
      ] = await Promise.all([
        dashboardService.getOverview(range),
        dashboardService.getRevenueChart({ period: chartPeriod, ...range }),
        dashboardService.getBookingStatus(),
        dashboardService.getTopProperties({ limit: 10, ...range }),
        dashboardService.getRecentBookings({ limit: 10 }),
        dashboardService.getOccupancyRate(),
        dashboardService.getCustomerGrowth(range),
        dashboardService.getPaymentMethods(range),
        dashboardService.getReviewsSummary(range),
      ]);

      setOverview(overviewRes.data || null);
      setRevenueChart(revenueChartRes.data || null);
      setBookingStatus(bookingStatusRes.data || null);
      setTopProperties(topPropertiesRes.data || null);
      setRecentBookings(recentBookingsRes.data || null);
      setOccupancyRate(occupancyRateRes.data || null);
      setCustomerGrowth(customerGrowthRes.data || null);
      setPaymentMethods(paymentMethodsRes.data || null);
      setReviewsSummary(reviewsSummaryRes.data || null);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const COLORS = ['#ec4899', '#a855f7', '#8b5cf6', '#d946ef', '#f472b6'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 text-white shadow-xl">
        <div className="container mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard Quản Trị</h1>
          <p className="text-pink-100">Tổng quan về hoạt động kinh doanh</p>
          
          {/* Date Range Selector */}
          <div className="mt-6 flex gap-3 flex-wrap">
            {['today', 'yesterday', 'last7Days', 'last30Days', 'thisMonth', 'lastMonth'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  dateRange === range
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                {range === 'today' && 'Hôm nay'}
                {range === 'yesterday' && 'Hôm qua'}
                {range === 'last7Days' && '7 ngày qua'}
                {range === 'last30Days' && '30 ngày qua'}
                {range === 'thisMonth' && 'Tháng này'}
                {range === 'lastMonth' && 'Tháng trước'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Overview Stats */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Tổng Doanh Thu"
              value={formatCurrency(overview.totalRevenue)}
              icon={<DollarSign className="w-8 h-8" />}
              gradient="from-pink-500 to-rose-500"
            />
            <StatCard
              title="Tổng Booking"
              value={overview.totalBookings.toString()}
              icon={<Calendar className="w-8 h-8" />}
              gradient="from-purple-500 to-pink-500"
            />
            <StatCard
              title="Tổng Properties"
              value={overview.totalProperties.toString()}
              icon={<Home className="w-8 h-8" />}
              gradient="from-fuchsia-500 to-purple-500"
            />
            <StatCard
              title="Tổng Khách Hàng"
              value={overview.totalCustomers.toString()}
              icon={<Users className="w-8 h-8" />}
              gradient="from-pink-500 to-purple-500"
            />
          </div>
        )}

        {/* Secondary Stats */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MiniStatCard
              title="Booking Đang Chờ"
              value={overview.pendingBookings}
              icon={<Clock className="w-5 h-5" />}
              color="text-yellow-600"
              bgColor="bg-yellow-100"
            />
            <MiniStatCard
              title="Check-in Hôm Nay"
              value={overview.checkInsToday}
              icon={<CheckCircle className="w-5 h-5" />}
              color="text-green-600"
              bgColor="bg-green-100"
            />
            <MiniStatCard
              title="Check-out Hôm Nay"
              value={overview.checkOutsToday}
              icon={<CheckCircle className="w-5 h-5" />}
              color="text-blue-600"
              bgColor="bg-blue-100"
            />
            <MiniStatCard
              title="Yêu Cầu Hoàn Tiền"
              value={overview.activeRefundTickets}
              icon={<CreditCard className="w-5 h-5" />}
              color="text-red-600"
              bgColor="bg-red-100"
            />
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          {revenueChart && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-pink-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                  Biểu Đồ Doanh Thu
                </h2>
                <select
                  value={chartPeriod}
                  onChange={(e) => setChartPeriod(e.target.value as any)}
                  className="px-4 py-2 rounded-lg border-2 border-pink-200 focus:border-purple-500 outline-none"
                >
                  <option value="daily">Theo ngày</option>
                  <option value="weekly">Theo tuần</option>
                  <option value="monthly">Theo tháng</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0abfc" />
                  <XAxis dataKey="period" stroke="#a855f7" />
                  <YAxis stroke="#a855f7" />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), 'Doanh thu']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #ec4899',
                      borderRadius: '12px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ec4899"
                    strokeWidth={3}
                    name="Doanh thu"
                    dot={{ fill: '#a855f7', r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Booking Status */}
          {bookingStatus && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
              <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Trạng Thái Booking
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={bookingStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.status}: ${entry.count}`}
                  >
                    {bookingStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Second Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Occupancy Rate */}
          {occupancyRate && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-pink-100">
              <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                Tỷ Lệ Lấp Đầy
              </h2>
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-2">
                  {occupancyRate.occupancyPercentage}%
                </div>
                <p className="text-gray-600">Tỷ lệ lấp đầy phòng</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-pink-50 rounded-lg">
                  <div className="text-2xl font-bold text-pink-600">{occupancyRate.totalRooms}</div>
                  <div className="text-sm text-gray-600">Tổng phòng</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{occupancyRate.bookedRooms}</div>
                  <div className="text-sm text-gray-600">Đã đặt</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{occupancyRate.availableRooms}</div>
                  <div className="text-sm text-gray-600">Còn trống</div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {paymentMethods && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
              <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Phương Thức Thanh Toán
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentMethods}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0abfc" />
                  <XAxis dataKey="method" stroke="#a855f7" />
                  <YAxis stroke="#a855f7" />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), 'Tổng tiền']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #ec4899',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar dataKey="totalAmount" fill="#ec4899" name="Tổng tiền" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Properties & Recent Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Properties */}
          {topProperties && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
              <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Top Properties
              </h2>
              <div className="space-y-4">
                {topProperties.slice(0, 5).map((property, index) => (
                  <div
                    key={property.propertyId}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 transition-all"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{property.propertyName}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {formatCurrency(property.totalRevenue)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {property.bookingCount} bookings
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          {property.averageRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Summary */}
          {reviewsSummary && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-pink-100">
              <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                Đánh Giá & Điểm Số
              </h2>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-2">
                  {reviewsSummary.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(reviewsSummary.averageRating)
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-600">Từ {reviewsSummary.totalReviews} đánh giá</p>
              </div>
              
              <div className="space-y-3">
                <RatingBar label="Sạch sẽ" value={reviewsSummary.averageCleanliness} />
                <RatingBar label="Vị trí" value={reviewsSummary.averageLocation} />
                <RatingBar label="Dịch vụ" value={reviewsSummary.averageService} />
                <RatingBar label="Giá trị" value={reviewsSummary.averageValue} />
              </div>
            </div>
          )}
        </div>

        {/* Recent Bookings Table */}
        {recentBookings && (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
            <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              Booking Gần Đây
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-pink-100 to-purple-100">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-purple-900 rounded-tl-lg">
                      Mã Booking
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-purple-900">Khách Hàng</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-purple-900">Property</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-purple-900">Check-in</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-purple-900">Số Tiền</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-purple-900 rounded-tr-lg">
                      Trạng Thái
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100">
                  {recentBookings.map((booking) => (
                    <tr key={booking.bookingId} className="hover:bg-pink-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-purple-600">{booking.bookingCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{booking.customerName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{booking.propertyName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(booking.checkIn).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-pink-600">
                        {formatCurrency(booking.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  gradient,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-pink-100 hover:shadow-2xl transition-all transform hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient} text-white`}>{icon}</div>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
      <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
        {value}
      </p>
    </div>
  );
}

// Mini Stat Card Component
function MiniStatCard({
  title,
  value,
  icon,
  color,
  bgColor,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-pink-100 hover:shadow-xl transition-all">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bgColor} ${color}`}>{icon}</div>
        <div>
          <p className="text-gray-600 text-xs font-medium">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

// Rating Bar Component
function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 w-20">{label}</span>
      <div className="flex-1 mx-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full"
            style={{ width: `${(value / 5) * 100}%` }}
          ></div>
        </div>
      </div>
      <span className="text-sm font-semibold text-gray-700 w-8">{value.toFixed(1)}</span>
    </div>
  );
}