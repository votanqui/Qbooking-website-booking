// app/favorites/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FavoriteDto } from '@/types/main/favorite';
import { favoriteService } from '@/services/main/favorite.service';
import FavoriteCard from '@/components/features/FavoriteCard';
import { 
  Heart, 
  Search, 
  Filter, 
  Loader2, 
  AlertCircle, 
  Sparkles,
  Grid3X3,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';

const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteDto[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch favorites
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await favoriteService.getAllFavorites();
      setFavorites(data);
      setFilteredFavorites(data);
    } catch (err) {
      setError('Không thể tải danh sách yêu thích. Vui lòng thử lại sau.');
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Filter and sort favorites
  useEffect(() => {
    let filtered = [...favorites];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(fav => 
        fav.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fav.provinceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fav.communeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(fav => 
        fav.productTypeName.toLowerCase() === filterType.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.propertyName.localeCompare(b.propertyName);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'type':
          comparison = a.productTypeName.localeCompare(b.productTypeName);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredFavorites(filtered);
  }, [favorites, searchTerm, filterType, sortBy, sortOrder]);

  // Remove favorite
  const handleRemoveFavorite = async (favoriteId: number) => {
    if (removingIds.has(favoriteId)) return;

    setRemovingIds(prev => new Set([...prev, favoriteId]));
    
    try {
      const response = await favoriteService.removeFavoriteById(favoriteId);
      
      if (response.success) {
        setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
        // Show success message (you can add toast notification here)
      } else {
        setError(response.message || 'Không thể xóa khỏi danh sách yêu thích');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi xóa khỏi danh sách yêu thích');
      console.error('Error removing favorite:', err);
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(favoriteId);
        return newSet;
      });
    }
  };

  // Get unique product types for filter
  const productTypes = [...new Set(favorites.map(fav => fav.productTypeName))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 mr-4">
                <Heart className="h-8 w-8 fill-current" />
              </div>
              <h1 className="text-4xl font-bold">
                Danh sách yêu thích
              </h1>
            </div>
            <p className="text-pink-100 text-lg max-w-2xl mx-auto">
              Khám phá lại những bất động sản bạn đã lưu và tìm kiếm ngôi nhà mơ ước của mình
            </p>
            <div className="flex items-center justify-center mt-6 text-pink-200">
              <Sparkles className="h-5 w-5 mr-2" />
              <span>{favorites.length} bất động sản đang chờ bạn khám phá</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-pink-100">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, tỉnh thành..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all duration-200"
              />
            </div>

            {/* Filters and Controls */}
            <div className="flex items-center gap-3">
              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                >
                  <option value="all">Tất cả loại hình</option>
                  {productTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'type')}
                  className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                >
                  <option value="date">Thời gian thêm</option>
                  <option value="name">Tên</option>
                  <option value="type">Loại hình</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  {sortOrder === 'asc' ? 
                    <SortAsc className="h-4 w-4 text-gray-600" /> : 
                    <SortDesc className="h-4 w-4 text-gray-600" />
                  }
                </button>
              </div>

              {/* View Mode */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow text-pink-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-white shadow text-pink-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-pink-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Đang tải danh sách yêu thích...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
              <div>
                <h3 className="text-red-800 font-semibold">Có lỗi xảy ra</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setError(null);
                fetchFavorites();
              }}
              className="mt-4 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors duration-200"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredFavorites.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Heart className="h-12 w-12 text-pink-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {searchTerm || filterType !== 'all' ? 'Không tìm thấy kết quả' : 'Danh sách yêu thích trống'}
            </h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              {searchTerm || filterType !== 'all' 
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để tìm thấy bất động sản phù hợp.'
                : 'Hãy bắt đầu khám phá và thêm những bất động sản yêu thích vào danh sách của bạn!'
              }
            </p>
            {(searchTerm || filterType !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}

        {/* Results Info */}
        {!loading && !error && filteredFavorites.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <div className="text-gray-600">
              Hiển thị <span className="font-semibold text-pink-600">{filteredFavorites.length}</span> 
              {filteredFavorites.length !== favorites.length && (
                <> trong tổng số <span className="font-semibold">{favorites.length}</span></>
              )} bất động sản
            </div>
          </div>
        )}

        {/* Favorites Grid/List */}
        {!loading && !error && filteredFavorites.length > 0 && (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredFavorites.map((favorite) => (
              <FavoriteCard
                key={favorite.id}
                favorite={favorite}
                onRemove={handleRemoveFavorite}
                isRemoving={removingIds.has(favorite.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;