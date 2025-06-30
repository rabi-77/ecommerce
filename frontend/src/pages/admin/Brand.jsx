import GenericModal from '../../components/GenericModal';
import {useDispatch, useSelector} from 'react-redux'
import ReactPaginate from 'react-paginate'
import {toast} from 'react-toastify'
import { useState, useEffect } from "react";
import { addBrandThunk, editBrandThunk, getBrandsThunk, deleteBrandThunk, toggleBrandListingThunk } from "../../features/admin/adminBrand/brandSlice";

const Brand = () => {
    const dispatch = useDispatch();
    const { brands, total, pages, sizes, loading, error } = useSelector((state) => state.brand);
    
    const [isDelete, setDelete] = useState(false)
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editBrand, setEditBrand] = useState(null);
  
    useEffect(() => {
      console.log(typeof total,typeof sizes,typeof pages);
      
      dispatch(getBrandsThunk({ pages, sizes, search }));
    }, [dispatch, pages, sizes, search, showModal]);
    
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
      setEditBrand(null);
      setShowModal(true);
    };
  
    const handleEdit = (brand) => {
      setEditBrand(brand);
      setShowModal(true);
    };
  
    const handleDelete = (id, name) => {
      if (window.confirm(`Delete brand ${name}?`)) {
        setDelete(true)
        dispatch(deleteBrandThunk(id)).then(() => toast.success("Brand deleted"));
      }
    };
    
  const handleToggleListing = async (id, isListed) => {
    try {
      await dispatch(toggleBrandListingThunk(id));
      toast.success(`Brand ${isListed ? 'unlisted' : 'listed'} successfully`);
    } catch (error) {
      toast.error('Failed to toggle brand listing');
    }
  };
  
    const handlePageChange = ({ selected }) => {
      dispatch(getBrandsThunk({ pages: selected + 1, sizes, search }));
    };
  
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Brand Management</h2>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search brands..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors text-sm font-medium"
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
          <button 
            onClick={handleAdd}
            className="flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded-md shadow-sm hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center justify-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Brand
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-700"></div>
          </div>
        ) : (
          <>
            {/* Horizontal scroll wrapper */}
            <div className="overflow-x-auto">
              <div className="rounded-md shadow-md">
                <table className="min-w-max w-full border-collapse bg-white">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Description</th>
                      <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Image</th>
                      <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Created At</th>
                      <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {brands.map((brand, index) => (
                      <tr key={brand._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100 transition-colors'}>
                        <td className="px-4 py-3.5 font-medium text-gray-900 text-sm">{brand.name}</td>
                        <td className="px-4 py-3.5 text-gray-700 max-w-xs truncate text-sm hidden sm:table-cell">{brand.description}</td>
                        <td className="px-4 py-3.5">
                          {brand.imageUrl ? (
                            <div className="h-12 w-12 rounded-md overflow-hidden border border-gray-200 shadow-sm">
                              <img
                                src={brand.imageUrl}
                                alt={brand.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center text-gray-500 text-xs">No Image</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-gray-700 text-sm hidden sm:table-cell">
                          {new Date(brand.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(brand)}
                              className="p-2 bg-gray-700 text-white rounded-md text-sm font-medium shadow-sm hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center justify-center"
                              title="Edit"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(brand._id, brand.name)}
                              className="p-2 bg-red-500 text-white rounded-md text-sm font-medium shadow-sm hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 flex items-center justify-center"
                              title="Delete"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleListing(brand._id, brand.isListed)}
                              className={`p-2 rounded-md text-sm font-medium shadow-sm transition-colors focus:outline-none flex items-center justify-center ${brand.isListed ? 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-2 focus:ring-gray-400' : 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-gray-500'}`}
                              title={brand.isListed ? 'Unlist' : 'List'}
                            >
                              {brand.isListed ? (
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Pagination wrapper for mobile */}
            <div className="overflow-x-auto">
            <ReactPaginate
              previousLabel="← Prev"
              nextLabel="Next →"
              pageCount={Math.ceil(total / sizes)}
              onPageChange={handlePageChange}
              containerClassName="flex items-center justify-center space-x-2 mt-6 font-medium"
              pageClassName="flex items-center justify-center h-8 w-8 rounded-md text-sm border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
              activeClassName="bg-gray-800 text-white border-gray-800 hover:bg-gray-700"
              previousClassName="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
              nextClassName="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
              disabledClassName="opacity-50 cursor-not-allowed"
              breakClassName="px-2 py-1.5 text-gray-500"
              marginPagesDisplayed={1}
              pageRangeDisplayed={3}
            />
            </div>
          </>
        )}
        {showModal && (
          <GenericModal
            entity={editBrand}
            onClose={() => setShowModal(false)}
            entityType="Brand"
            addAction={addBrandThunk}
            editAction={editBrandThunk}
          />
        )}
      </div>
    );
};
  
export default Brand;
