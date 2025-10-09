'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { adminAmenitiesService } from '@/services/admin/adminamenities.service'
import {
  AmenityCategoryResponse,
  AmenityResponse,
  CreateAmenityCategoryRequest,
  UpdateAmenityCategoryRequest,
  CreateAmenityRequest,
  UpdateAmenityRequest,
  AmenityStatisticsOverview,
  CategoryStatistics,
  AmenityUsageStatistics,
  UnusedAmenityResponse
} from '@/types/admin/adminamenities'
import {
  Home,
  UtensilsCrossed,
  Bath,
  Tv,
  Trees,
  Settings,
  Shield,
  Car,
  Wifi,
  Snowflake,
  Flame,
  Coffee,
  Dumbbell,
  Waves,
  Sparkles,
  Star
} from 'lucide-react'
type TabType = 'categories' | 'amenities' | 'statistics'
type ModalType = 'createCategory' | 'editCategory' | 'createAmenity' | 'editAmenity' | null
export const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    'home': Home,
    'utensils': UtensilsCrossed,
    'bath': Bath,
    'tv': Tv,
    'tree': Trees,
    'service': Settings,
    'shield': Shield,
    'car': Car,
    'wifi': Wifi,
    'snowflake': Snowflake,
    'flame': Flame,
    'coffee': Coffee,
    'dumbbell': Dumbbell,
    'waves': Waves,
    'sparkles': Sparkles,
    'star': Star,
    // Thêm các icon khác tại đây
  }
  
  const IconComponent = iconMap[iconName?.toLowerCase()] || Sparkles
  return <IconComponent className="w-5 h-5" />
}
export default function AdminAmenitiesPage() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('categories')
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState<ModalType>(null)

  // Categories State
  const [categories, setCategories] = useState<AmenityCategoryResponse[]>([])
  const [selectedCategory, setSelectedCategory] = useState<AmenityCategoryResponse | null>(null)
  const [categoryForm, setCategoryForm] = useState<CreateAmenityCategoryRequest>({
    name: '',
    slug: '',
    icon: '',
    description: '',
    sortOrder: 0
  })

  // Amenities State
  const [amenities, setAmenities] = useState<AmenityResponse[]>([])
  const [selectedAmenity, setSelectedAmenity] = useState<AmenityResponse | null>(null)
  const [amenityForm, setAmenityForm] = useState<CreateAmenityRequest>({
    categoryId: 0,
    name: '',
    slug: '',
    icon: '',
    description: '',
    isPopular: false,
    sortOrder: 0
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterCategoryId, setFilterCategoryId] = useState<number | undefined>()
  const [filterIsPopular, setFilterIsPopular] = useState<boolean | undefined>()

  // Statistics State
  const [statsOverview, setStatsOverview] = useState<AmenityStatisticsOverview | null>(null)
  const [categoryStats, setCategoryStats] = useState<CategoryStatistics[]>([])
  const [mostUsed, setMostUsed] = useState<AmenityUsageStatistics[]>([])
  const [unused, setUnused] = useState<UnusedAmenityResponse[]>([])

  useEffect(() => {
    if (activeTab === 'categories') {
      loadCategories()
    } else if (activeTab === 'amenities') {
      loadAmenities()
    } else if (activeTab === 'statistics') {
      loadStatistics()
    }
  }, [activeTab, currentPage, filterCategoryId, filterIsPopular])

  // Load Functions
  const loadCategories = async () => {
    setLoading(true)
    try {
      const response = await adminAmenitiesService.getAllCategories()
      if (response.success && response.data) {
        setCategories(response.data)
      } else {
        showToast(response.message || 'Failed to load categories', 'error')
      }
    } catch (error) {
      showToast('Error loading categories', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadAmenities = async () => {
    setLoading(true)
    try {
      const response = await adminAmenitiesService.getAmenities({
        page: currentPage,
        pageSize: 10,
        categoryId: filterCategoryId,
        isPopular: filterIsPopular
      })
      if (response.success && response.data) {
        setAmenities(response.data.items)
        setTotalPages(response.data.totalPages)
      } else {
        showToast(response.message || 'Failed to load amenities', 'error')
      }
    } catch (error) {
      showToast('Error loading amenities', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    setLoading(true)
    try {
      const [overviewRes, categoryStatsRes, mostUsedRes, unusedRes] = await Promise.all([
        adminAmenitiesService.getStatisticsOverview(),
        adminAmenitiesService.getStatisticsByCategory(),
        adminAmenitiesService.getMostUsedAmenities(10),
        adminAmenitiesService.getUnusedAmenities()
      ])

      if (overviewRes.success && overviewRes.data) setStatsOverview(overviewRes.data)
      if (categoryStatsRes.success && categoryStatsRes.data) setCategoryStats(categoryStatsRes.data)
      if (mostUsedRes.success && mostUsedRes.data) setMostUsed(mostUsedRes.data)
      if (unusedRes.success && unusedRes.data) setUnused(unusedRes.data)
    } catch (error) {
      showToast('Error loading statistics', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Category CRUD
  const handleCreateCategory = async () => {
    try {
      const response = await adminAmenitiesService.createCategory(categoryForm)
      if (response.success) {
        showToast('Category created successfully', 'success')
        setModalOpen(null)
        loadCategories()
        resetCategoryForm()
      } else {
        showToast(response.message || 'Failed to create category', 'error')
      }
    } catch (error) {
      showToast('Error creating category', 'error')
    }
  }

  const handleUpdateCategory = async () => {
    if (!selectedCategory) return
    try {
      const response = await adminAmenitiesService.updateCategory(selectedCategory.id, categoryForm as UpdateAmenityCategoryRequest)
      if (response.success) {
        showToast('Category updated successfully', 'success')
        setModalOpen(null)
        loadCategories()
        resetCategoryForm()
      } else {
        showToast(response.message || 'Failed to update category', 'error')
      }
    } catch (error) {
      showToast('Error updating category', 'error')
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      const response = await adminAmenitiesService.deleteCategory(id)
      if (response.success) {
        showToast('Category deleted successfully', 'success')
        loadCategories()
      } else {
        showToast(response.message || 'Failed to delete category', 'error')
      }
    } catch (error) {
      showToast('Error deleting category', 'error')
    }
  }

  // Amenity CRUD
  const handleCreateAmenity = async () => {
    try {
      const response = await adminAmenitiesService.createAmenity(amenityForm)
      if (response.success) {
        showToast('Amenity created successfully', 'success')
        setModalOpen(null)
        loadAmenities()
        resetAmenityForm()
      } else {
        showToast(response.message || 'Failed to create amenity', 'error')
      }
    } catch (error) {
      showToast('Error creating amenity', 'error')
    }
  }

  const handleUpdateAmenity = async () => {
    if (!selectedAmenity) return
    try {
      const response = await adminAmenitiesService.updateAmenity(selectedAmenity.id, amenityForm as UpdateAmenityRequest)
      if (response.success) {
        showToast('Amenity updated successfully', 'success')
        setModalOpen(null)
        loadAmenities()
        resetAmenityForm()
      } else {
        showToast(response.message || 'Failed to update amenity', 'error')
      }
    } catch (error) {
      showToast('Error updating amenity', 'error')
    }
  }

  const handleDeleteAmenity = async (id: number) => {
    if (!confirm('Are you sure you want to delete this amenity?')) return
    try {
      const response = await adminAmenitiesService.deleteAmenity(id)
      if (response.success) {
        showToast('Amenity deleted successfully', 'success')
        loadAmenities()
      } else {
        showToast(response.message || 'Failed to delete amenity', 'error')
      }
    } catch (error) {
      showToast('Error deleting amenity', 'error')
    }
  }

  const handleTogglePopular = async (id: number) => {
    try {
      const response = await adminAmenitiesService.toggleAmenityPopular(id)
      if (response.success) {
        showToast('Amenity popularity toggled', 'success')
        loadAmenities()
      } else {
        showToast(response.message || 'Failed to toggle popularity', 'error')
      }
    } catch (error) {
      showToast('Error toggling popularity', 'error')
    }
  }

  // Reset Forms
  const resetCategoryForm = () => {
    setCategoryForm({ name: '', slug: '', icon: '', description: '', sortOrder: 0 })
    setSelectedCategory(null)
  }

  const resetAmenityForm = () => {
    setAmenityForm({ categoryId: 0, name: '', slug: '', icon: '', description: '', isPopular: false, sortOrder: 0 })
    setSelectedAmenity(null)
  }

  // Modal Handlers
  const openCreateCategoryModal = () => {
    resetCategoryForm()
    setModalOpen('createCategory')
  }

  const openEditCategoryModal = (category: AmenityCategoryResponse) => {
    setSelectedCategory(category)
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      description: category.description,
      sortOrder: category.sortOrder
    })
    setModalOpen('editCategory')
  }

  const openCreateAmenityModal = () => {
    resetAmenityForm()
    setModalOpen('createAmenity')
  }

  const openEditAmenityModal = (amenity: AmenityResponse) => {
    setSelectedAmenity(amenity)
    setAmenityForm({
      categoryId: amenity.categoryId,
      name: amenity.name,
      slug: amenity.slug,
      icon: amenity.icon,
      description: amenity.description,
      isPopular: amenity.isPopular,
      sortOrder: amenity.sortOrder
    })
    setModalOpen('editAmenity')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
            Amenity Management
          </h1>
          <p className="text-gray-600 mt-2">Manage categories, amenities, and view statistics</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md p-2 mb-6 overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            {(['categories', 'amenities', 'statistics'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-pink-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {activeTab === 'categories' && (
              <CategoriesTab
                categories={categories}
                onCreateClick={openCreateCategoryModal}
                onEditClick={openEditCategoryModal}
                onDeleteClick={handleDeleteCategory}
              />
            )}

            {activeTab === 'amenities' && (
              <AmenitiesTab
                amenities={amenities}
                categories={categories}
                currentPage={currentPage}
                totalPages={totalPages}
                filterCategoryId={filterCategoryId}
                filterIsPopular={filterIsPopular}
                onCreateClick={openCreateAmenityModal}
                onEditClick={openEditAmenityModal}
                onDeleteClick={handleDeleteAmenity}
                onTogglePopular={handleTogglePopular}
                onPageChange={setCurrentPage}
                onFilterCategoryChange={setFilterCategoryId}
                onFilterPopularChange={setFilterIsPopular}
              />
            )}

            {activeTab === 'statistics' && (
              <StatisticsTab
                overview={statsOverview}
                categoryStats={categoryStats}
                mostUsed={mostUsed}
                unused={unused}
              />
            )}
          </>
        )}

        {/* Modals */}
        {(modalOpen === 'createCategory' || modalOpen === 'editCategory') && (
          <CategoryModal
            isEdit={modalOpen === 'editCategory'}
            form={categoryForm}
            onFormChange={setCategoryForm}
            onSubmit={modalOpen === 'editCategory' ? handleUpdateCategory : handleCreateCategory}
            onClose={() => { setModalOpen(null); resetCategoryForm(); }}
          />
        )}

        {(modalOpen === 'createAmenity' || modalOpen === 'editAmenity') && (
          <AmenityModal
            isEdit={modalOpen === 'editAmenity'}
            form={amenityForm}
            categories={categories}
            onFormChange={setAmenityForm}
            onSubmit={modalOpen === 'editAmenity' ? handleUpdateAmenity : handleCreateAmenity}
            onClose={() => { setModalOpen(null); resetAmenityForm(); }}
          />
        )}
      </div>
    </div>
  )
}

// Categories Tab Component
function CategoriesTab({ categories, onCreateClick, onEditClick, onDeleteClick }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Categories ({categories.length})</h2>
        <button
          onClick={onCreateClick}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
        >
          + Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category: AmenityCategoryResponse) => (
          <div key={category.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{getIconComponent(category.icon)}</div>
                <div>
                  <h3 className="font-bold text-gray-800">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.slug}</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                #{category.sortOrder}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4">{category.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {category.amenities?.length || 0} amenities
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEditClick(category)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteClick(category.id)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Amenities Tab Component
function AmenitiesTab({ 
  amenities, categories, currentPage, totalPages, filterCategoryId, filterIsPopular,
  onCreateClick, onEditClick, onDeleteClick, onTogglePopular, onPageChange,
  onFilterCategoryChange, onFilterPopularChange 
}: any) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h2 className="text-xl font-bold text-gray-800">Amenities</h2>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={filterCategoryId || ''}
            onChange={(e) => onFilterCategoryChange(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((cat: AmenityCategoryResponse) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={filterIsPopular === undefined ? '' : filterIsPopular.toString()}
            onChange={(e) => onFilterPopularChange(e.target.value === '' ? undefined : e.target.value === 'true')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="true">Popular Only</option>
            <option value="false">Non-Popular</option>
          </select>
          <button
            onClick={onCreateClick}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all whitespace-nowrap"
          >
            + Add Amenity
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Icon</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Sort</th>
                <th className="px-4 py-3 text-center">Popular</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {amenities.map((amenity: AmenityResponse, idx: number) => (
                <tr key={amenity.id} className={idx % 2 === 0 ? 'bg-pink-50' : 'bg-white'}>
                  <td className="px-4 py-3 text-2xl">{getIconComponent(amenity.icon)}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{amenity.name}</p>
                      <p className="text-xs text-gray-500">{amenity.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {amenity.categoryName}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">#{amenity.sortOrder}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onTogglePopular(amenity.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        amenity.isPopular
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {amenity.isPopular ? '★ Popular' : '☆'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onEditClick(amenity)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteClick(amenity.id)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-white rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 bg-white rounded-lg shadow">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-white rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

// Statistics Tab Component
function StatisticsTab({ overview, categoryStats, mostUsed, unused }: any) {
  if (!overview) return <div>Loading statistics...</div>

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Categories" value={overview.totalCategories} color="pink" />
        <StatCard title="Total Amenities" value={overview.totalAmenities} color="purple" />
        <StatCard title="Popular Amenities" value={overview.popularAmenities} color="indigo" />
        <StatCard title="Property Amenities" value={overview.totalPropertyAmenities} color="violet" />
      </div>

      {/* Most Used Amenities */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Top 10 Most Used Amenities</h3>
        <div className="space-y-2">
          {mostUsed.map((item: AmenityUsageStatistics, idx: number) => (
            <div key={item.amenityId} className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-xl">{getIconComponent(item.icon)}</span>
                <div>
                  <p className="font-medium text-gray-800">{item.amenityName}</p>
                  <p className="text-xs text-gray-500">{item.categoryName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-purple-600">{item.usageCount}</p>
                <p className="text-xs text-gray-500">{item.propertyCount} properties</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Statistics */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Statistics by Category</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-pink-100 to-purple-100">
              <tr>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-center">Amenities</th>
                <th className="px-4 py-2 text-center hidden md:table-cell">Usage</th>
                <th className="px-4 py-2 text-center hidden lg:table-cell">Avg Usage</th>
              </tr>
            </thead>
            <tbody>
              {categoryStats.map((stat: CategoryStatistics, idx: number) => (
                <tr key={stat.categoryId} className={idx % 2 === 0 ? 'bg-pink-50' : 'bg-white'}>
                  <td className="px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl"> {getIconComponent(stat.icon)}</span>
                      <span className="font-medium">{stat.categoryName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">{stat.totalAmenities}</td>
                  <td className="px-4 py-2 text-center hidden md:table-cell">{stat.totalUsage}</td>
                  <td className="px-4 py-2 text-center hidden lg:table-cell">{stat.averageUsagePerAmenity.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unused Amenities */}
      {unused.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Unused Amenities ({unused.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {unused.map((item: UnusedAmenityResponse) => (
              <div key={item.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{getIconComponent(item.icon)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.categoryName}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  const colorClasses = {
    pink: 'from-pink-500 to-pink-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
    violet: 'from-violet-500 to-violet-600'
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-xl shadow-lg p-4 text-white`}>
      <p className="text-sm opacity-90">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}

// Category Modal Component
function CategoryModal({ isEdit, form, onFormChange, onSubmit, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold">{isEdit ? 'Edit Category' : 'Create Category'}</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Enter category name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => onFormChange({ ...form, slug: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="category-slug"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon (emoji)</label>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => onFormChange({ ...form, icon: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-2xl"
              placeholder="🏠"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              rows={3}
              placeholder="Enter description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => onFormChange({ ...form, sortOrder: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onSubmit}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              {isEdit ? 'Update' : 'Create'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


// Amenity Modal Component
function AmenityModal({ isEdit, form, categories, onFormChange, onSubmit, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold">{isEdit ? 'Edit Amenity' : 'Create Amenity'}</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => onFormChange({ ...form, categoryId: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value={0}>Select a category</option>
              {categories.map((cat: AmenityCategoryResponse) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Enter amenity name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => onFormChange({ ...form, slug: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="amenity-slug"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon (emoji)</label>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => onFormChange({ ...form, icon: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-2xl"
              placeholder="🔥"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              rows={3}
              placeholder="Enter description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => onFormChange({ ...form, sortOrder: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPopular"
              checked={form.isPopular}
              onChange={(e) => onFormChange({ ...form, isPopular: e.target.checked })}
              className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
            />
            <label htmlFor="isPopular" className="ml-2 text-sm font-medium text-gray-700">
              Mark as Popular
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onSubmit}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              {isEdit ? 'Update' : 'Create'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}