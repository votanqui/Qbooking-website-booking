'use client'

import { useState } from 'react'
import { 
  ShieldCheckIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CreditCardIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'

export default function PolicyPage() {
  const [activeSection, setActiveSection] = useState('privacy')

  const sections = [
    {
      id: 'privacy',
      title: 'Chính Sách Bảo Mật',
      icon: ShieldCheckIcon,
      content: {
        intro: 'Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn và tuân thủ các quy định về bảo mật dữ liệu.',
        items: [
          {
            title: 'Thu Thập Thông Tin',
            description: 'Chúng tôi thu thập thông tin khi bạn đăng ký tài khoản, đặt phòng, hoặc liên hệ với chúng tôi. Bao gồm: họ tên, email, số điện thoại, địa chỉ, thông tin thanh toán.'
          },
          {
            title: 'Sử Dụng Thông Tin',
            description: 'Thông tin được sử dụng để: xử lý đặt phòng, liên lạc với khách hàng, cải thiện dịch vụ, gửi thông tin khuyến mãi (nếu đồng ý).'
          },
          {
            title: 'Bảo Mật Dữ Liệu',
            description: 'Chúng tôi sử dụng SSL encryption, lưu trữ dữ liệu trên server bảo mật, thường xuyên sao lưu và cập nhật bảo mật.'
          },
          {
            title: 'Chia Sẻ Thông Tin',
            description: 'Chúng tôi không bán hoặc cho thuê thông tin cá nhân. Chỉ chia sẻ khi cần thiết với đối tác để hoàn thành dịch vụ hoặc theo yêu cầu pháp lý.'
          }
        ]
      }
    },
    {
      id: 'terms',
      title: 'Điều Khoản Sử Dụng',
      icon: DocumentTextIcon,
      content: {
        intro: 'Các điều khoản và điều kiện chi phối việc sử dụng dịch vụ booking của chúng tôi.',
        items: [
          {
            title: 'Quyền và Nghĩa Vụ Người Dùng',
            description: 'Người dùng có quyền: đặt phòng, hủy đặt phòng theo quy định, nhận hỗ trợ khách hàng. Nghĩa vụ: cung cấp thông tin chính xác, thanh toán đúng hạn, tuân thủ quy định của chỗ nghỉ.'
          },
          {
            title: 'Chính Sách Đặt Phòng',
            description: 'Đặt phòng được xác nhận qua email. Giá phòng có thể thay đổi theo thời gian thực. Một số phòng yêu cầu thanh toán ngay khi đặt.'
          },
          {
            title: 'Chính Sách Hủy Đặt Phòng',
            description: 'Chính sách hủy phòng tùy thuộc vào từng chỗ nghỉ. Hủy miễn phí, hủy có phí, hoặc không được hủy. Khách hàng nên đọc kỹ chính sách trước khi đặt.'
          },
          {
            title: 'Thanh Toán',
            description: 'Chấp nhận các hình thức: thẻ tín dụng, chuyển khoản ngân hàng, ví điện tử. Thanh toán được xử lý an toàn qua cổng thanh toán đối tác.'
          }
        ]
      }
    },
    {
      id: 'service',
      title: 'Chính Sách Dịch Vụ',
      icon: UserGroupIcon,
      content: {
        intro: 'Cam kết về chất lượng dịch vụ và quyền lợi của khách hàng khi sử dụng platform.',
        items: [
          {
            title: 'Tiêu Chuẩn Dịch Vụ',
            description: 'Chúng tôi cam kết: cung cấp thông tin chính xác về chỗ nghỉ, hỗ trợ khách hàng 24/7, xử lý khiếu nại trong 24h, bảo đảm giao dịch an toàn.'
          },
          {
            title: 'Quyền Lợi Khách Hàng',
            description: 'Được hoàn tiền nếu chỗ nghỉ không như mô tả, được hỗ trợ thay đổi đặt phòng khi có vấn đề, nhận bồi thường theo quy định khi có sự cố.'
          },
          {
            title: 'Chương Trình Khách Hàng Thân Thiết',
            description: 'Tích điểm qua mỗi lần đặt phòng, đổi điểm lấy voucher giảm giá, ưu đãi đặc biệt cho thành viên VIP, sinh nhật và các dịp lễ.'
          },
          {
            title: 'Hỗ Trợ Khách Hàng',
            description: 'Hotline 24/7, live chat trên website, email hỗ trợ, hướng dẫn chi tiết trên website, FAQ và video hướng dẫn.'
          }
        ]
      }
    },
    {
      id: 'payment',
      title: 'Chính Sách Thanh Toán',
      icon: CreditCardIcon,
      content: {
        intro: 'Thông tin chi tiết về các phương thức thanh toán và chính sách hoàn tiền.',
        items: [
          {
            title: 'Phương Thức Thanh Toán',
            description: 'Thẻ tín dụng (Visa, MasterCard, JCB), thẻ ATM nội địa, ví điện tử (MoMo, ZaloPay, VNPay), chuyển khoản ngân hàng, thanh toán tại chỗ nghỉ.'
          },
          {
            title: 'Bảo Mật Thanh Toán',
            description: 'Sử dụng công nghệ mã hóa SSL 256-bit, không lưu trữ thông tin thẻ tín dụng, xác thực 3D Secure, giám sát giao dịch 24/7.'
          },
          {
            title: 'Chính Sách Hoàn Tiền',
            description: 'Hoàn tiền trong 5-7 ngày làm việc, hoàn về tài khoản/thẻ gốc, phí hoàn tiền (nếu có) sẽ được thông báo trước, trường hợp đặc biệt xử lý trong 15 ngày.'
          },
          {
            title: 'Xử Lý Tranh Chấp',
            description: 'Khiếu nại về thanh toán được xử lý trong 24h, cung cấp đầy đủ chứng từ giao dịch, hỗ trợ làm việc với ngân hàng khi cần thiết.'
          }
        ]
      }
    }
  ]

  const getCurrentSection = () => {
    return sections.find(section => section.id === activeSection) || sections[0]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Chính Sách & Điều Khoản
            </h1>
            <p className="text-gray-600 mt-4 text-lg max-w-3xl mx-auto">
              Chúng tôi cam kết minh bạch trong mọi hoạt động và bảo vệ quyền lợi của khách hàng. 
              Vui lòng đọc kỹ các chính sách dưới đây để hiểu rõ quyền và nghĩa vụ của mình.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 sticky top-8">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh Mục</h3>
                <nav className="space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                          activeSection === section.id
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {section.title}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100">
              <div className="p-8">
                {(() => {
                  const currentSection = getCurrentSection()
                  const Icon = currentSection.icon
                  return (
                    <>
                      {/* Section Header */}
                      <div className="flex items-center mb-6">
                        <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-4">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {currentSection.title}
                        </h2>
                      </div>

                      {/* Section Intro */}
                      <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                        {currentSection.content.intro}
                      </p>

                      {/* Section Content */}
                      <div className="space-y-8">
                        {currentSection.content.items.map((item, index) => (
                          <div key={index} className="border-l-4 border-purple-300 pl-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-r-lg">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                              {item.title}
                            </h3>
                            <p className="text-gray-700 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Contact Section */}
            <div className="mt-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg text-white">
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <ExclamationTriangleIcon className="w-6 h-6 mr-3" />
                  Cần Hỗ Trợ?
                </h3>
                <p className="text-purple-100 mb-6">
                  Nếu bạn có bất kỳ câu hỏi nào về chính sách của chúng tôi, đừng ngần ngại liên hệ với team hỗ trợ.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <PhoneIcon className="w-5 h-5 mr-3 text-purple-200" />
                    <div>
                      <p className="font-medium">Hotline 24/7</p>
                      <p className="text-purple-200">0919332046</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <EnvelopeIcon className="w-5 h-5 mr-3 text-purple-200" />
                    <div>
                      <p className="font-medium">Email Hỗ Trợ</p>
                      <p className="text-purple-200">votanqui29052003@gmail.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="bg-white border-t border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <EyeIcon className="w-4 h-4 inline mr-2" />
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>
    </div>
  )
}