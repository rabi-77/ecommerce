import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaEdit, FaHistory, FaExclamationTriangle } from 'react-icons/fa';
import { 
  getInventory, 
  updateInventory, 
  getInventoryHistory, 
  getLowStockProducts,
  resetInventoryState 
} from '../../features/admin/adminInventory/adminInventorySlice';
import Pagination from '../../components/common/Pagination';

const Inventory = () => {
  const dispatch = useDispatch();
  const { 
    inventory, 
    total, 
    page, 
    size, 
    totalPages,
    loading, 
    error, 
    updating,
    updateSuccess,
    history,
    historyLoading,
    selectedProduct,
    lowStockProducts,
    lowStockLoading
  } = useSelector(state => state.adminInventory);

  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editedVariants, setEditedVariants] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [threshold, setThreshold] = useState(5);

  // Load inventory on component mount and when page, search, or sort changes
  useEffect(() => {
    dispatch(getInventory({ page, size, search, sort: sortOption }));
  }, [dispatch, page, size, search, sortOption]);

  // Handle errors and success messages
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(resetInventoryState());
    }
    
    if (updateSuccess) {
      toast.success('Inventory updated successfully');
      setEditingProduct(null);
      dispatch(resetInventoryState());
    }
  }, [error, updateSuccess, dispatch]);

  const handleSearch = () => {
    dispatch(getInventory({ page: 1, size, search, sort: sortOption }));
  };

  const clearSearch = () => {
    setSearch('');
    dispatch(getInventory({ page: 1, size, search: '', sort: sortOption }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    dispatch(getInventory({ page, size, search, sort: e.target.value }));
  };

  const handlePageChange = (newPage) => {
    dispatch(getInventory({ page: newPage, size, search, sort: sortOption }));
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setEditedVariants(product.variants.map(variant => ({ ...variant })));
  };

  const handleStockChange = (variantId, newStock) => {
    setEditedVariants(prevVariants => 
      prevVariants.map(variant => 
        variant._id === variantId 
          ? { ...variant, stock: parseInt(newStock) || 0 } 
          : variant
      )
    );
  };

  const handleUpdateInventory = () => {
    if (editingProduct) {
      dispatch(updateInventory({
        productId: editingProduct._id,
        variants: editedVariants
      }));
    }
  };

  const handleViewHistory = (productId) => {
    dispatch(getInventoryHistory(productId));
    setShowHistoryModal(true);
  };

  const handleShowLowStock = () => {
    dispatch(getLowStockProducts(threshold));
    setShowLowStockModal(true);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Inventory Management</h2>
        <button
          onClick={handleShowLowStock}
          className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
        >
          <FaExclamationTriangle className="mr-2" />
          Low Stock Items
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search */}
        <div className="md:col-span-7 flex">
          <div className="relative w-full">
            <input
              type="text"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-4 p-2.5"
              placeholder="Search by product name or SKU"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            {search && (
              <button
                type="button"
                className="absolute inset-y-0 right-12 flex items-center pr-3"
                onClick={clearSearch}
              >
                <svg className="w-4 h-4 text-gray-500 hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>
          <button
            type="button"
            className="p-2.5 ml-2 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300"
            onClick={handleSearch}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <span className="sr-only">Search</span>
          </button>
        </div>
        
        {/* Sort */}
        <div className="md:col-span-5">
          <select
            value={sortOption}
            onChange={handleSortChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          >
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
            <option value="stock-asc">Stock: Low to High</option>
            <option value="stock-desc">Stock: High to Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {inventory && inventory.length > 0 ? (
                <>
                  Showing {inventory.length} of {total} products
                </>
              ) : (
                'No products found'
              )}
            </p>
          </div>

          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Stock
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sold
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map((product) => (
                  <React.Fragment key={product._id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full object-cover" src={product.images[0]} alt={product.name} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.category?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.brand?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${product.totalStock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                          {product.totalStock}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.totalSold || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <FaEdit className="inline mr-1" /> Edit Stock
                        </button>
                        <button
                          onClick={() => handleViewHistory(product._id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaHistory className="inline mr-1" /> History
                        </button>
                      </td>
                    </tr>

                    {editingProduct && editingProduct._id === product._id && (
                      <tr className="bg-gray-100">
                        <td colSpan="6" className="px-6 py-4">
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Update Inventory for {product.name}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {editedVariants.map((variant) => (
                                <div key={variant._id} className="bg-white p-4 rounded shadow">
                                  <div className="mb-2 font-medium">Size: {variant.size}</div>
                                  <div className="mb-2 text-sm text-gray-600">SKU: {variant.sku}</div>
                                  <div className="mb-4 text-sm">
                                    <span className="font-medium">Sold: </span>
                                    {variant.sold || 0}
                                  </div>
                                  <div className="flex items-center">
                                    <label htmlFor={`stock-${variant._id}`} className="mr-2 font-medium">Stock:</label>
                                    <input
                                      id={`stock-${variant._id}`}
                                      type="number"
                                      min="0"
                                      value={variant.stock}
                                      onChange={(e) => handleStockChange(variant._id, e.target.value)}
                                      className="border border-gray-300 rounded px-3 py-1 w-20"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end space-x-3">
                              <button
                                onClick={() => setEditingProduct(null)}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleUpdateInventory}
                                disabled={updating}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                {updating ? 'Updating...' : 'Update Inventory'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="mt-6"
            />
          )}
        </>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center md:justify-center md:pl-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Inventory History for {selectedProduct?.name}
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {historyLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {history.length === 0 ? (
                  <p className="text-center py-6 text-gray-500">No history records found for this product.</p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order #
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.map((change, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(change.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {change.orderNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {change.variantSize}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={change.quantity < 0 ? 'text-red-600' : 'text-green-600'}>
                              {change.quantity > 0 ? `+${change.quantity}` : change.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {change.changeType}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Modal */}
      {showLowStockModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center md:justify-center md:pl-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Low Stock Products
              </h3>
              <button
                onClick={() => setShowLowStockModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="mb-4 flex items-center">
              <label htmlFor="threshold" className="mr-2 text-sm font-medium">
                Threshold:
              </label>
              <input
                id="threshold"
                type="number"
                min="1"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value) || 5)}
                className="border border-gray-300 rounded px-3 py-1 w-20"
              />
              <button
                onClick={() => dispatch(getLowStockProducts(threshold))}
                className="ml-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
            
            {lowStockLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {lowStockProducts.length === 0 ? (
                  <p className="text-center py-6 text-gray-500">No products with low stock found.</p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lowStockProducts.map((product) => (
                        product.variants.map((variant) => (
                          <tr key={`${product._id}-${variant._id}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img className="h-10 w-10 rounded-full object-cover" src={product.images[0]} alt={product.name} />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                  <div className="text-sm text-gray-500">{product.category?.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {variant.size}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {variant.sku}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-red-600">
                                {variant.stock}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  handleEdit(product);
                                  setShowLowStockModal(false);
                                }}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <FaEdit className="inline mr-1" /> Update Stock
                              </button>
                            </td>
                          </tr>
                        ))
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowLowStockModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
