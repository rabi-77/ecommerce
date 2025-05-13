import React from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

const FilterSidebar = ({
  filters,
  categories = [],
  brands = [],
  onFilterChange,
  onClearFilters,
  isMobile = false,
  onClose = () => {}
}) => {
  const [openSection, setOpenSection] = React.useState({
    category: true,
    brand: true,
    price: true
  });

  const toggleSection = (section) => {
    setOpenSection(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${isMobile ? 'fixed inset-0 z-50 overflow-y-auto' : ''}`}>
      {isMobile && (
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="text-lg font-semibold">Filters</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Categories */}
        <div>
          <button 
            className="flex justify-between items-center w-full text-left font-medium mb-2"
            onClick={() => toggleSection('category')}
          >
            <span>Categories</span>
            {openSection.category ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {openSection.category && (
            <div className="space-y-2 pl-2">
              {categories.map(category => (
                <label key={category._id} className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value={category._id}
                    checked={filters.category === category._id}
                    onChange={onFilterChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Brands */}
        <div>
          <button 
            className="flex justify-between items-center w-full text-left font-medium mb-2"
            onClick={() => toggleSection('brand')}
          >
            <span>Brands</span>
            {openSection.brand ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {openSection.brand && (
            <div className="space-y-2 pl-2">
              {brands.map(brand => (
                <label key={brand._id} className="flex items-center">
                  <input
                    type="radio"
                    name="brand"
                    value={brand._id}
                    checked={filters.brand === brand._id}
                    onChange={onFilterChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{brand.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Price Range */}
        <div>
          <button 
            className="flex justify-between items-center w-full text-left font-medium mb-2"
            onClick={() => toggleSection('price')}
          >
            <span>Price Range</span>
            {openSection.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {openSection.price && (
            <div className="space-y-4 pl-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min</label>
                  <input
                    type="number"
                    name="priceMin"
                    value={filters.priceMin}
                    onChange={onFilterChange}
                    placeholder="$"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max</label>
                  <input
                    type="number"
                    name="priceMax"
                    value={filters.priceMax}
                    onChange={onFilterChange}
                    placeholder="$"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 mt-4 border-t">
          <button
            onClick={onClearFilters}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
