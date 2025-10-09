'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, MapPin, Search, Loader2, ChevronDown } from 'lucide-react'

interface MapModalProps {
  isOpen: boolean
  onClose: () => void
  initialLat: number
  initialLng: number
  onLocationSelect: (lat: number, lng: number, address?: string) => void
}

const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  onLocationSelect
}) => {
  const [tempLocation, setTempLocation] = useState<[number, number]>([
    initialLat || 10.8231,
    initialLng || 106.6297
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    if (initialLat && initialLng) {
      setTempLocation([initialLat, initialLng])
    }
  }, [initialLat, initialLng])

  // Initialize Leaflet map
  useEffect(() => {
    if (isOpen && mapRef.current && !mapInstanceRef.current) {
      // Load Leaflet CSS and JS
      const loadLeaflet = async () => {
        // Add Leaflet CSS
        if (!document.getElementById('leaflet-css')) {
          const leafletCSS = document.createElement('link')
          leafletCSS.id = 'leaflet-css'
          leafletCSS.rel = 'stylesheet'
          leafletCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
          document.head.appendChild(leafletCSS)
        }

        // Load Leaflet JS
        if (!window.L) {
          return new Promise((resolve) => {
            const script = document.createElement('script')
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
            script.onload = resolve
            document.head.appendChild(script)
          })
        }
      }

      loadLeaflet().then(() => {
        if (window.L && mapRef.current && !mapInstanceRef.current) {
          setMapLoaded(true)
          
          // Initialize map
          mapInstanceRef.current = window.L.map(mapRef.current).setView(tempLocation, 15)

          // Add tile layer
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(mapInstanceRef.current)

          // Add marker
          markerRef.current = window.L.marker(tempLocation, {
            draggable: true
          }).addTo(mapInstanceRef.current)

          // Handle map click
          mapInstanceRef.current.on('click', (e: any) => {
            const { lat, lng } = e.latlng
            setTempLocation([lat, lng])
            markerRef.current.setLatLng([lat, lng])
            setSelectedAddress('')
            
            // Reverse geocoding to get address
            reverseGeocode(lat, lng)
          })

          // Handle marker drag
          markerRef.current.on('dragend', (e: any) => {
            const { lat, lng } = e.target.getLatLng()
            setTempLocation([lat, lng])
            setSelectedAddress('')
            
            // Reverse geocoding to get address
            reverseGeocode(lat, lng)
          })
        }
      })
    }

    // Clean up map when modal closes
    return () => {
      if (!isOpen && mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
        setMapLoaded(false)
      }
    }
  }, [isOpen])

  // Update map when location changes externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView(tempLocation, 15)
      markerRef.current.setLatLng(tempLocation)
    }
  }, [tempLocation])

  // Reverse geocoding function
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      )
      const data = await response.json()
      if (data.display_name) {
        setSelectedAddress(data.display_name)
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }
  }

  // Search for addresses using Nominatim API
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Vietnam')}&limit=5&addressdetails=1`
      )
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchResultClick = (result: any) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    setTempLocation([lat, lng])
    setSelectedAddress(result.display_name)
    setSearchResults([])
    setSearchQuery('')
  }

  const handleConfirmLocation = () => {
    onLocationSelect(tempLocation[0], tempLocation[1], selectedAddress)
    onClose()
  }

  const handleManualLocationChange = (lat: number, lng: number) => {
    setTempLocation([lat, lng])
    setSelectedAddress('')
  }

  // Handle map click (simulate by showing coordinates input)
  const handleCoordinateInput = (type: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      if (type === 'lat') {
        handleManualLocationChange(numValue, tempLocation[1])
      } else {
        handleManualLocationChange(tempLocation[0], numValue)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[9999] overflow-y-auto">
      {/* Điều chỉnh margin-top để tránh header trên cả desktop và mobile */}
      <div className="w-full max-w-4xl mx-4 mt-16 sm:mt-20 md:mt-24 mb-4 sm:mb-8">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl max-h-[calc(100vh-5rem)] sm:max-h-[calc(100vh-7rem)] md:max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
          {/* Header - Fixed */}
          <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 bg-white">
            <h3 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Chọn vị trí trên bản đồ
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Search Section */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm sm:text-base"
                    placeholder="Tìm kiếm địa chỉ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center text-sm sm:text-base"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang tìm...
                    </>
                  ) : (
                    'Tìm kiếm'
                  )}
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="bg-gray-50 rounded-lg border max-h-48 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchResultClick(result)}
                      className="w-full text-left p-3 hover:bg-pink-50 border-b border-gray-200 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 text-pink-600 mt-1 mr-2 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{result.display_name}</p>
                          <p className="text-xs text-gray-500">
                            {parseFloat(result.lat).toFixed(6)}, {parseFloat(result.lon).toFixed(6)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Map */}
            <div className="mb-4 sm:mb-6">
              <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Bản đồ tương tác:</h4>
              <div className="relative">
                <div 
                  ref={mapRef}
                  className="h-64 sm:h-80 lg:h-96 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100"
                />
                {!mapLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="flex items-center text-gray-600">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      <span className="text-sm">Đang tải bản đồ...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Current Location Info */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
              <h4 className="font-medium text-pink-900 mb-2 text-sm sm:text-base">Vị trí hiện tại:</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div>
                  <span className="text-pink-700 font-medium">Tọa độ:</span> {tempLocation[0].toFixed(6)}, {tempLocation[1].toFixed(6)}
                </div>
                {selectedAddress && (
                  <div>
                    <span className="text-pink-700 font-medium">Địa chỉ:</span>
                    <span className="ml-1 break-words">{selectedAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base"
              >
                <span className="font-medium text-gray-900">Tùy chọn nâng cao</span>
                <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-600 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
              
              {showAdvanced && (
                <div className="mt-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Nhập tọa độ chính xác:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-600 mb-1">Vĩ độ (Latitude)</label>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        className="w-full p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm sm:text-base"
                        value={tempLocation[0]}
                        onChange={(e) => handleCoordinateInput('lat', e.target.value)}
                        placeholder="10.8231"
                      />
                      <p className="text-xs text-gray-500 mt-1">VD: 10.8231 (TP.HCM)</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-600 mb-1">Kinh độ (Longitude)</label>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        className="w-full p-2.5 sm:p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm sm:text-base"
                        value={tempLocation[1]}
                        onChange={(e) => handleCoordinateInput('lng', e.target.value)}
                        placeholder="106.6297"
                      />
                      <p className="text-xs text-gray-500 mt-1">VD: 106.6297 (TP.HCM)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">Hướng dẫn sử dụng:</h4>
              <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                <li>• <strong>Click trên bản đồ:</strong> Chọn vị trí trực tiếp</li>
                <li>• <strong>Tìm kiếm:</strong> Nhập địa chỉ để tìm vị trí</li>
                <li>• <strong>Kéo marker:</strong> Di chuyển marker đến vị trí mong muốn</li>
                <li>• <strong>Nhập tọa độ:</strong> Sử dụng tùy chọn nâng cao</li>
              </ul>
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="border-t border-gray-200 p-4 sm:p-6 bg-white">
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmLocation}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all flex items-center justify-center text-sm sm:text-base font-medium"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Xác nhận vị trí
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapModal