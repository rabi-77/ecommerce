import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  getProductsThunk,
  deleteProductThunk,
  toggleListProductThunk,
  toggleFeaturedProductThunk,
  brandThunk,
  categoryThunk,
} from "../../features/admin/adminProducts/productSlice";
import ProductModal from "../../components/ProductModal";
import Pagination from "../../components/common/Pagination";
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';

const Products = () => {
  const dispatch = useDispatch();
  const { products, total, page, size, loading, error,categories ,brands} = useSelector(
    (state) => state.product
  );
  

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {

    dispatch(getProductsThunk({ page, size, search }));
    dispatch(categoryThunk())
    dispatch(brandThunk())
  }, [dispatch, page, size, search]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const clearSearch = () => {
    setSearch("");
  };

  const handleAdd = () => {
    setEditProduct(null);
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setShowModal(true);
  };

  const handleDelete = (id) => setDeleteId(id);

  const confirmDelete = () => {
    if(deleteId){
      dispatch(deleteProductThunk(deleteId)).then(()=>toast.success('Product permanently deleted'));
      setDeleteId(null);
    }
  };

  const handleToggleList = (id, isListed) => {
    dispatch(toggleListProductThunk(id)).then(() => {
      toast.success(`Product ${isListed ? "unlisted" : "listed"} successfully`);
    });
  };

  const handleToggleFeatured = (id, isFeatured) => {
    dispatch(toggleFeaturedProductThunk(id)).then(() => {
      toast.success(
        `Product ${isFeatured ? "unfeatured" : "featured"} successfully`
      );
    });
  };

  const handlePageChange = (newPage) => {
    dispatch(getProductsThunk({ page: newPage, size, search }));
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Product Management</h2>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Input
            value={search}
            onChange={handleSearch}
            placeholder="Search products..."
            className="flex-grow max-w-xs"
          />
          {search && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div>
          <button 
            onClick={handleAdd}
            className="flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded-md shadow-sm hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm font-medium"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <Loader/>
      ) : (
        <>
          {/* Enable horizontal scrolling on small screens */}
          <div className="overflow-x-auto">
            <div className="rounded-md shadow-md">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Total Stock</th>
                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Image</th>
                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Featured</th>
                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Created At</th>
                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Actions</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product, index) => (
                    <React.Fragment key={product._id}>
                      <tr
                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100 transition-colors'} ${!product.isListed ? "bg-red-50" : ""}`}
                      >

                      <td className="px-4 py-3.5 font-medium text-gray-900 text-sm">{product.name}</td>
                      <td className="px-4 py-3.5 text-gray-700 text-sm">₹{product.price}</td>
                      <td className="px-4 py-3.5 text-gray-700 text-sm">{product.totalStock}</td>
                      <td className="px-4 py-3.5">
                        {product.images?.[0] ? (
                          <div className="h-12 w-12 rounded-md overflow-hidden border border-gray-200 shadow-sm">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center text-gray-500 text-xs">No Image</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.isFeatured ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                          {product.isFeatured ? "Featured" : "Not Featured"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 text-sm">
                        {new Date(product.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleList(product._id, product.isListed)}
                            className={`p-2 rounded-md text-sm font-medium shadow-sm transition-colors focus:outline-none flex items-center justify-center ${product.isListed ? 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-2 focus:ring-gray-400' : 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-gray-500'}`}
                            title={product.isListed ? 'Unlist' : 'List'}
                          >
                            {product.isListed ? (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => handleToggleFeatured(product._id, product.isFeatured)}
                            className={`p-2 rounded-md text-sm font-medium shadow-sm transition-colors focus:outline-none flex items-center justify-center ${product.isFeatured ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                            title={product.isFeatured ? 'Unfeature' : 'Feature'}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 bg-gray-700 text-white rounded-md text-sm font-medium shadow-sm hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center justify-center"
                            title="Edit"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-2 bg-red-200 rounded" title="Delete">🗑</button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button 
                          onClick={() => toggleRow(product._id)}
                          className={`p-2 rounded-md text-sm font-medium shadow-sm transition-colors focus:outline-none flex items-center justify-center mx-auto ${expandedRows[product._id] ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                          title="View Variants"
                        >
                          {expandedRows[product._id] ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRows[product._id] && (
                      <tr>
                        <td colSpan="9" className="px-0 py-0 border-b border-gray-200">
                          <div className="bg-indigo-50 p-4 m-2 rounded-lg shadow-inner">
                            <div className="flex items-center mb-3">
                              <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              <h4 className="font-semibold text-indigo-900">Product Variants</h4>
                            </div>
                            <div className="bg-white rounded-md p-3 shadow-sm">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {product.variants.map((v) => (
                                  <div key={v.sku} className="border border-gray-200 rounded-md p-3 bg-white hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="font-medium text-gray-800">Size: {v.size}</span>
                                      <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full">{v.stock} in stock</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">{v.sku}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
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
          </div>
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / size)}
            onPageChange={handlePageChange}
            className="mt-6"
          />
        </>
      )}
      {showModal && (
        <ProductModal
          product={editProduct}
          onClose={() => setShowModal(false)}
        />
      )}
      <ConfirmationDialog
        open={Boolean(deleteId)}
        title="Delete Product"
        message="Are you sure you want to permanently delete this product? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={()=>setDeleteId(null)}
      />
    </div>
  );
};

export default Products;
