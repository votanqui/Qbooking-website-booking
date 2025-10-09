'use client'

import { 
  HeartIcon,
  StarIcon,
  UsersIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  TrophyIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'
import { 
  HeartIcon as HeartSolid,
  StarIcon as StarSolid
} from '@heroicons/react/24/solid'

export default function AboutPage() {
  const stats = [
    {
      icon: UsersIcon,
      label: 'Khách Hàng Hài Lòng',
      value: '500K+',
      description: 'Khách hàng đã tin tưởng'
    },
    {
      icon: GlobeAltIcon,
      label: 'Chỗ Nghỉ',
      value: '10K+',
      description: 'Trên toàn quốc'
    },
    {
      icon: TrophyIcon,
      label: 'Giải Thưởng',
      value: '25+',
      description: 'Trong ngành du lịch'
    },
    {
      icon: ShieldCheckIcon,
      label: 'Đánh Giá',
      value: '4.8/5',
      description: 'Từ khách hàng'
    }
  ]

  const values = [
    {
      icon: HeartIcon,
      title: 'Tận Tâm Phục Vụ',
      description: 'Chúng tôi luôn đặt khách hàng lên hàng đầu và cam kết mang đến trải nghiệm tuyệt vời nhất.'
    },
    {
      icon: StarIcon,
      title: 'Chất Lượng Đỉnh Cao',
      description: 'Mọi chỗ nghỉ đều được kiểm duyệt kỹ lưỡng để đảm bảo tiêu chuẩn chất lượng cao nhất.'
    },
    {
      icon: LightBulbIcon,
      title: 'Đổi Mới Sáng Tạo',
      description: 'Không ngừng cải tiến công nghệ và dịch vụ để mang lại giải pháp booking hiện đại nhất.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Tin Cậy & An Toàn',
      description: 'Bảo mật thông tin tuyệt đối và đảm bảo mọi giao dịch được thực hiện an toàn.'
    }
  ]

  const team = [
    {
      name: 'Võ Tấn Qui',
      role: 'CEO & Founder',
      image: '👨‍💼',
      description: '10+ năm kinh nghiệm trong ngành du lịch và công nghệ.'
    },
    {
    name: 'Võ Tấn Qui',
      role: 'COO',
      image: '👩‍💼',
      description: 'Chuyên gia vận hành với tâm huyết phát triển du lịch Việt Nam.'
    },
    {
    name: 'Võ Tấn Qui',
      role: 'CTO',
      image: '👨‍💻',
      description: 'Kiến trúc sư công nghệ hàng đầu, đam mê xây dựng platform.'
    },
    {
    name: 'Võ Tấn Qui',
      role: 'Head of Customer Success',
      image: '👩‍🎓',
      description: 'Chuyên gia trải nghiệm khách hàng với 8 năm kinh nghiệm.'
    }
  ]

  const achievements = [
    {
      year: '2019',
      title: 'Ra Đời Platform',
      description: 'Khởi đầu với 100 chỗ nghỉ đầu tiên tại TP.HCM'
    },
    {
      year: '2020',
      title: 'Mở Rộng Toàn Quốc',
      description: 'Có mặt tại 63 tỉnh thành với 1000+ chỗ nghỉ'
    },
    {
      year: '2021',
      title: 'Giải Thưởng Đầu Tiên',
      description: 'Top 10 Startup Du Lịch Tiềm Năng Việt Nam'
    },
    {
      year: '2022',
      title: 'Vượt 100K Khách Hàng',
      description: 'Cột mốc quan trọng với 100,000 lượt đặt phòng'
    },
    {
      year: '2023',
      title: 'Nền Tảng AI',
      description: 'Ra mắt tính năng gợi ý thông minh bằng AI'
    },
    {
      year: '2024',
      title: 'Dẫn Đầu Thị Trường',
      description: 'Trở thành platform booking hàng đầu Việt Nam'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Về Chúng Tôi
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 max-w-4xl mx-auto leading-relaxed">
              Chúng tôi là đội ngũ đam mê du lịch, cam kết mang đến trải nghiệm đặt chỗ nghỉ 
              tuyệt vời nhất cho mọi chuyến đi của bạn.
            </p>
            <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarSolid key={star} className="w-8 h-8 text-yellow-400" />
                ))}
                <span className="ml-2 text-lg">Được tin tưởng bởi hàng triệu khách hàng</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4 group-hover:scale-110 transition-transform duration-200">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-lg font-medium text-gray-700 mb-1">{stat.label}</div>
                  <div className="text-sm text-gray-500">{stat.description}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100 p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
                  <HeartSolid className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Sứ Mệnh</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                Kết nối du khách với những chỗ nghỉ tuyệt vời nhất, tạo ra những trải nghiệm 
                du lịch đáng nhớ và góp phần phát triển du lịch bền vững tại Việt Nam. 
                Chúng tôi tin rằng mỗi chuyến đi đều là một câu chuyện đáng kể.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-purple-100 p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
                  <LightBulbIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Tầm Nhìn</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                Trở thành nền tảng booking hàng đầu Đông Nam Á, nơi mọi người có thể 
                dễ dàng tìm kiếm và đặt chỗ nghỉ phù hợp với nhu cầu. Chúng tôi hướng 
                tới tương lai du lịch thông minh và bền vững.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Core Values */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Giá Trị Cốt Lõi
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Những nguyên tắc định hướng mọi hoạt động và quyết định của chúng tôi
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div key={index} className="group text-center">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 group-hover:shadow-lg transition-all duration-300">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{value.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Hành Trình Phát Triển
            </h2>
            <p className="text-gray-600 text-lg">
              Những cột mốc quan trọng trong quá trình xây dựng và phát triển
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-purple-300 to-pink-300"></div>
            
            <div className="space-y-12">
              {achievements.map((achievement, index) => (
                <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8' : 'pl-8'}`}>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 p-6">
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                          {achievement.year}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">{achievement.title}</h3>
                      </div>
                      <p className="text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                  
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-4 border-white shadow-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Đội Ngũ Lãnh Đạo
            </h2>
            <p className="text-gray-600 text-lg">
              Những con người đam mê đứng sau thành công của chúng tôi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="group">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 text-center group-hover:shadow-lg transition-all duration-300">
                  <div className="text-6xl mb-4">{member.image}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-purple-600 font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-2xl text-white overflow-hidden">
            <div className="px-8 py-12 lg:px-12 lg:py-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Tại Sao Chọn Chúng Tôi?</h2>
                <p className="text-purple-100 text-lg">
                  Những lý do khiến hàng triệu khách hàng tin tưởng lựa chọn dịch vụ của chúng tôi
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="text-center">
                  <CheckBadgeIcon className="w-12 h-12 mx-auto mb-4 text-purple-200" />
                  <h3 className="text-xl font-semibold mb-3">Được Kiểm Duyệt</h3>
                  <p className="text-purple-100">Mọi chỗ nghỉ đều được kiểm tra kỹ lưỡng về chất lượng và dịch vụ</p>
                </div>
                
                <div className="text-center">
                  <ShieldCheckIcon className="w-12 h-12 mx-auto mb-4 text-purple-200" />
                  <h3 className="text-xl font-semibold mb-3">Bảo Mật Tối Đa</h3>
                  <p className="text-purple-100">Thông tin cá nhân và thanh toán được bảo vệ bằng công nghệ tiên tiến</p>
                </div>
                
                <div className="text-center">
                  <HeartIcon className="w-12 h-12 mx-auto mb-4 text-purple-200" />
                  <h3 className="text-xl font-semibold mb-3">Hỗ Trợ 24/7</h3>
                  <p className="text-purple-100">Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ bạn mọi lúc</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Liên Hệ Với Chúng Tôi
            </h2>
            <p className="text-gray-600 text-lg">
              Chúng tôi luôn lắng nghe và sẵn sàng hỗ trợ bạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 group-hover:shadow-lg transition-all duration-300">
                <PhoneIcon className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Điện Thoại</h3>
                <p className="text-gray-600 mb-2">Hotline 24/7</p>
                <p className="text-purple-600 font-semibold text-lg">0919332046</p>
              </div>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 group-hover:shadow-lg transition-all duration-300">
                <EnvelopeIcon className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600 mb-2">Liên hệ hỗ trợ</p>
                <p className="text-purple-600 font-semibold">votanqui29052003@gmail.com</p>
              </div>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 group-hover:shadow-lg transition-all duration-300">
                <MapPinIcon className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Địa Chỉ</h3>
                <p className="text-gray-600 mb-2">Trụ sở chính</p>
                <p className="text-purple-600 font-semibold">s101 vinhome, Q9, TP.HCM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Sẵn Sàng Bắt Đầu Cuộc Phiêu Lưu?
          </h2>
          <p className="text-purple-100 text-lg mb-8">
            Khám phá hàng ngàn chỗ nghỉ tuyệt vời đang chờ đón bạn
          </p>
          <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors duration-200 shadow-lg">
            Khám Phá Ngay
          </button>
        </div>
      </div>
    </div>
  )
}