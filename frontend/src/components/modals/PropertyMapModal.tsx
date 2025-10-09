'use client'

import { useEffect, useState, useRef } from 'react';
import { XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';  

interface PropertyMapMarker {
  id: number;
  name: string;
  slug: string; // ✅ Thêm slug
  latitude: number;
  longitude: number;
  primaryImage: string | null;
}

interface PropertyMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: PropertyMapMarker[];
}

// Hàm xử lý đường dẫn ảnh
const getImageUrl = (imagePath: string | null) => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith('/')) {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}${imagePath}`;
  }
  
  return imagePath;
};

const PropertyMapModal = ({ isOpen, onClose, properties }: PropertyMapModalProps) => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Cleanup khi đóng modal
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = [];
      return;
    }

    if (!properties || properties.length === 0) {
      setError('Không có dữ liệu để hiển thị trên bản đồ');
      setIsLoading(false);
      return;
    }

    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Cleanup trước khi init
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        markersRef.current = [];

        const L = (await import('leaflet')).default;

        if (!mapContainerRef.current) throw new Error('Map container not found');

        // Fix icon issue với Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Tính trung tâm bản đồ dựa trên các properties
        const validProperties = properties.filter(p => p.latitude && p.longitude);
        
        if (validProperties.length === 0) {
          setError('Không có tọa độ hợp lệ để hiển thị');
          setIsLoading(false);
          return;
        }

        // Tính trung tâm bản đồ
        const avgLat = validProperties.reduce((sum, p) => sum + p.latitude, 0) / validProperties.length;
        const avgLng = validProperties.reduce((sum, p) => sum + p.longitude, 0) / validProperties.length;

        const mapInstance = L.map(mapContainerRef.current).setView([avgLat, avgLng], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(mapInstance);

        // Tạo custom icon
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="marker-pin">
              <div style="
                background: linear-gradient(135deg, #ec4899, #a855f7);
                width: 30px;
                height: 30px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              ">
                <div style="
                  transform: rotate(45deg);
                  color: white;
                  font-weight: bold;
                  font-size: 14px;
                ">🏠</div>
              </div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        });

        // Thêm markers cho mỗi property
        validProperties.forEach(property => {
          const imageUrl = getImageUrl(property.primaryImage);
          
          // ✅ Sử dụng slug thay vì id trong link
          const popupContent = `
            <div class="property-popup">
              ${imageUrl ? `
                <img src="${imageUrl}" alt="${property.name}" 
                     class="popup-image" onerror="this.style.display='none'"/>
              ` : `
                <div style="height: 150px; background: linear-gradient(135deg, #fdf2f8, #f3e8ff); 
                          display: flex; align-items: center; justify-content: center; color: #a855f7;">
                  🏠 Không có ảnh
                </div>
              `}
              <div class="popup-content">
                <div class="popup-title">${property.name}</div>
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                  📍 ${property.latitude.toFixed(4)}, ${property.longitude.toFixed(4)}
                </div>
                <div style="font-size: 11px; color: #9ca3af; margin-bottom: 12px;">
                  ID: ${property.id} • Slug: ${property.slug}
                </div>
                <a href="/properties/${property.slug}" class="popup-button">
                  Xem chi tiết
                </a>
              </div>
            </div>
          `;

          const marker = L.marker([property.latitude, property.longitude], { 
            icon: customIcon 
          })
          .addTo(mapInstance)
          .bindPopup(popupContent);

          markersRef.current.push(marker);
        });

        // Fit bounds để hiển thị tất cả markers
        if (validProperties.length > 1) {
          const group = L.featureGroup(markersRef.current);
          mapInstance.fitBounds(group.getBounds().pad(0.1));
        }

        mapRef.current = mapInstance;
        setIsLoading(false);

      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Không thể tải bản đồ. Vui lòng thử lại.');
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = [];
    };
  }, [isOpen, properties]);

  if (!isOpen) return null;

  return (
    <>
      <style jsx global>{`
        .custom-marker {
          background: none;
          border: none;
        }

        .marker-pin {
          display: flex;
          justify-content: center;
          align-items: center;
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
          cursor: pointer;
          transition: transform 0.2s;
        }

        .marker-pin:hover {
          transform: scale(1.1);
        }

        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }

        .leaflet-popup-content {
          margin: 0;
          width: 280px !important;
        }

        .property-popup {
          width: 100%;
        }

        .popup-image {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }

        .popup-content {
          padding: 12px;
        }

        .popup-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .popup-button {
          display: block;
          width: 100%;
          padding: 8px 16px;
          background: linear-gradient(to right, #ec4899, #a855f7);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          text-decoration: none;
        }

        .popup-button:hover {
          background: linear-gradient(to right, #db2777, #9333ea);
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(236, 72, 153, 0.3);
        }

        .leaflet-container a.leaflet-popup-close-button {
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          font-size: 20px;
          color: #6b7280;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .leaflet-container {
          font-family: inherit;
        }
      `}</style>

      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50">
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-6 h-6 text-pink-600" />
              <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Bản đồ chỗ nghỉ
              </h2>
              <span className="text-sm text-pink-600 ml-2">
                ({properties?.length || 0} địa điểm)
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-pink-100 rounded-lg transition-colors"
              type="button"
            >
              <XMarkIcon className="w-6 h-6 text-pink-600" />
            </button>
          </div>

          <div className="flex-1 p-4 relative">
            <div 
              ref={mapContainerRef}
              className="w-full h-full rounded-lg shadow-lg border-2 border-pink-100"
            />
            
            {isLoading && (
              <div className="absolute inset-4 flex items-center justify-center bg-white/80 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                  <p className="text-pink-600">Đang tải bản đồ...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-4 flex items-center justify-center bg-white/80 rounded-lg">
                <div className="text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50">
            <p className="text-sm text-pink-600 text-center">
              💡 Nhấn vào các điểm đánh dấu để xem thông tin chi tiết
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PropertyMapModal;