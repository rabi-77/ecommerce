import CategoryModal from "../../components/categoryModal";
import {useDispatch,useSelector} from 'react-redux'
import {toast} from 'react-toastify'
import {getCategoryThunk,deleteCategoryThunk,toggleCategoryListingThunk} from '../../features/admin/adminCategory/adminCategoryslice'
import { useState,useEffect } from "react";
import Pagination from '../../components/common/Pagination'
import DataTable from '../../components/common/DataTable'
import GenericModal from '../../components/GenericModal';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import Input from '../../components/common/Input';

const Category = () => {
    const dispatch = useDispatch();
    const { categories, total, pages, size, loading, error } = useSelector((state) => state.category);
    
    const [isDelete,setDelete]= useState(false)
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editCategory, setEditCategory] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => {
      dispatch(getCategoryThunk({ pages, size, search }));
    }, [dispatch, pages, size, search,showModal]);
  
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
      setEditCategory(null);
      setShowModal(true);
    };
  
    const handleEdit = (category) => {
      setEditCategory(category);
      setShowModal(true);
    };
  
    const handleDelete = (id) => setDeleteId(id);
    const confirmDelete = () => {
      if(deleteId){
        dispatch(deleteCategoryThunk(deleteId)).then(()=>toast.success('Category deleted'));
        setDeleteId(null);
      }
    };
    
    const handleToggleListing = async (id, isListed) => {
      try {
        await dispatch(toggleCategoryListingThunk(id));
        toast.success(`Category ${isListed ? 'unlisted' : 'listed'} successfully`);
      } catch (error) {
        toast.error('Failed to toggle category listing');
      }
    };
  
    const handlePageChange = (newPage) => {
      dispatch(getCategoryThunk({ pages: newPage, size, search }));
    };

    // DataTable columns
    const columns = [
      { header: 'Name', accessor: 'name' },
      { header: 'Description', accessor: (c) => c.description || '-' },
      { header: 'Image', accessor: (c) => (
          c.imageUrl ? (<img src={c.imageUrl} alt={c.name} className="h-10 w-10 object-cover rounded" />) : 'No Image'
        )
      },
      { header: 'Created', accessor: (c) => new Date(c.createdAt).toLocaleDateString() },
      { header: 'Actions', accessor: (c) => (
          <div className="flex gap-2">
            <button onClick={() => handleEdit(c)} className="p-2 bg-gray-200 rounded" title="Edit">✎</button>
            <button onClick={() => handleDelete(c._id)} className="p-2 bg-red-200 rounded" title="Delete">🗑</button>
            <button onClick={() => handleToggleListing(c._id, c.isListed)} className={`p-2 rounded ${c.isListed ? 'bg-gray-500 text-white' : 'bg-gray-700 text-white'}`} title={c.isListed ? 'Unlist' : 'List'}>
              {c.isListed ? 'Unlist' : 'List'}
            </button>
          </div>
        )
      }
    ];

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Category Management</h2>
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
              placeholder="Search categories..."
              className="pl-10 pr-4 py-2 w-full md:w-64"
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
            className="flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded-md shadow-sm hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm font-medium"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Category
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={categories} />
            {/* Pagination wrapper for small screens */}
            <div className="overflow-x-auto">
              <Pagination
                currentPage={pages}
                totalPages={Math.ceil(total / size)}
                onPageChange={handlePageChange}
                className="mt-6"
              />
            </div>
          </>
        )}
        {showModal && (
          <CategoryModal
            category={editCategory}
            onClose={() => setShowModal(false)}
          />
        )}
        <ConfirmationDialog
          open={Boolean(deleteId)}
          title="Delete Category"
          message="Are you sure you want to delete this category?"
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={()=>setDeleteId(null)}
        />
      </div>
    );
  };

  

  
  export default Category;
