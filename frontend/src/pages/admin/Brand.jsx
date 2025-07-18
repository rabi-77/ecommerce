import GenericModal from '../../components/GenericModal';
import {useDispatch, useSelector} from 'react-redux'
import {toast} from 'react-toastify'
import { useState, useEffect } from "react";
import { addBrandThunk, editBrandThunk, getBrandsThunk, deleteBrandThunk, toggleBrandListingThunk } from "../../features/admin/adminBrand/brandSlice";
import Pagination from '../../components/common/Pagination'
import DataTable from '../../components/common/DataTable'
import ConfirmationDialog from '../../components/common/ConfirmationDialog'
import Input from '../../components/common/Input'

const Brand = () => {
    const dispatch = useDispatch();
    const { brands, total, pages, sizes, loading, error } = useSelector((state) => state.brand);
    
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editBrand, setEditBrand] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
  
    useEffect(() => {
      
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
  
    const handleDelete = (id) => {
      setDeleteId(id);
    };
    
    const confirmDelete = () => {
      if (deleteId) {
        dispatch(deleteBrandThunk(deleteId)).then(() => toast.success('Brand deleted'));
        setDeleteId(null);
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
  
    const handlePageChange = (newPage) => {
      dispatch(getBrandsThunk({ pages: newPage, sizes, search }));
    };

    // DataTable columns
    const columns = [
      { header: 'Logo', accessor: (brand) => (
          <img src={brand.imageUrl} alt={brand.name} className="h-10 w-10 object-contain" />
        )
      },
      { header: 'Name', accessor: 'name' },
      { header: 'Listed', accessor: (brand) => brand.isListed ? 'Yes' : 'No' },
      { header: 'Actions', accessor: (brand) => (
          <div className="flex gap-2">
            <button onClick={() => handleEdit(brand)} className="p-2 bg-gray-200 rounded" title="Edit">✎</button>
            <button onClick={() => handleDelete(brand._id)} className="p-2 bg-red-200 rounded" title="Delete">🗑</button>
            <button
              onClick={() => handleToggleListing(brand._id, brand.isListed)}
              className={`p-2 rounded ${brand.isListed ? 'bg-gray-500 text-white' : 'bg-gray-700 text-white'}`}
              title={brand.isListed ? 'Unlist' : 'List'}
            >
              {brand.isListed ? 'Unlist' : 'List'}
            </button>
          </div>
        )
      }
    ];

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
            <Input
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
            <DataTable columns={columns} data={brands} />
            {/* Pagination wrapper for mobile */}
            <div className="overflow-x-auto">
              <Pagination
                currentPage={pages}
                totalPages={Math.ceil(total / sizes)}
                onPageChange={handlePageChange}
                className="mt-6"
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
        <ConfirmationDialog
          open={Boolean(deleteId)}
          title="Delete Brand"
          message="Are you sure you want to delete this brand?"
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      </div>
    );
};
  
export default Brand;
