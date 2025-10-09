// components/features/FilterPanel.tsx

import React, { useState } from 'react';
import { PropertyHostFilterRequest } from '@/types/main/hostproperty';

interface FilterPanelProps {
  filters: PropertyHostFilterRequest;
  onFiltersChange: (filters: PropertyHostFilterRequest) => void;
  onReset: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFiltersChange, onReset }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (key: keyof PropertyHostFilterRequest, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const sortOptions = [
    { value: 'created', label: 'Created Date' },
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
    { value: 'views', label: 'Views' },
    { value: 'bookings', label: 'Bookings' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-pink-100 mb-6">
      <div className="p-4 border-b border-pink-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            🔍 Filter Properties
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-pink-600 hover:text-pink-700 transition-colors"
          >
            {isExpanded ? '⬆️ Collapse' : '⬇️ Expand'}
          </button>
        </div>
      </div>

      <div className={`transition-all duration-300 ${isExpanded ? 'max-h-none' : 'max-h-0 overflow-hidden'}`}>
        <div className="p-4 space-y-4">
          {/* Search and Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🏠 Property Name
              </label>
              <input
                type="text"
                value={filters.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Search by name or slug..."
                className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📋 Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-colors"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🔄 Sort By
              </label>
              <div className="flex space-x-2">
                <select
                  value={filters.sortBy || 'created'}
                  onChange={(e) => handleInputChange('sortBy', e.target.value)}
                  className="flex-1 px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-colors"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.sortOrder || 'desc'}
                  onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                  className="px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-colors"
                >
                  <option value="asc">↑ ASC</option>
                  <option value="desc">↓ DESC</option>
                </select>
              </div>
            </div>
          </div>

          {/* Toggle Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.isActive === true}
                  onChange={(e) => handleInputChange('isActive', e.target.checked ? true : undefined)}
                  className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
                />
                <span className="ml-2 text-sm text-gray-700">✅ Active Only</span>
              </label>
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.isFeatured === true}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked ? true : undefined)}
                  className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
                />
                <span className="ml-2 text-sm text-gray-700">⭐ Featured Only</span>
              </label>
            </div>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                💰 Price From
              </label>
              <input
                type="number"
                value={filters.priceFrom || ''}
                onChange={(e) => handleInputChange('priceFrom', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Min price..."
                className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                💰 Price To
              </label>
              <input
                type="number"
                value={filters.priceTo || ''}
                onChange={(e) => handleInputChange('priceTo', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Max price..."
                className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📅 Created From
              </label>
              <input
                type="date"
                value={filters.createdFrom || ''}
                onChange={(e) => handleInputChange('createdFrom', e.target.value)}
                className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📅 Created To
              </label>
              <input
                type="date"
                value={filters.createdTo || ''}
                onChange={(e) => handleInputChange('createdTo', e.target.value)}
                className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-pink-100">
            <button
              onClick={onReset}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              🔄 Reset
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              ✨ Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;