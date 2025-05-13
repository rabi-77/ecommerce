import CategoryModal from "../../components/categoryModal";
import {useDispatch,useSelector} from 'react-redux'
import ReactPaginate from 'react-paginate'
import {toast} from 'react-toastify'
import {getCategoryThunk,deleteCategoryThunk} from '../../features/admin/adminCategory/adminCategoryslice'
import { useState,useEffect } from "react";
import CategoryListingToggle from '../../components/admin/CategoryListingToggle';

const Category = () => {
    const dispatch = useDispatch();
    const { categories, total, pages, size, loading, error } = useSelector((state) => state.category);
    
    const [isDelete,setDelete]= useState(false)
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editCategory, setEditCategory] = useState(null);
  
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
  
    const handleDelete = (id, name) => {
      if (window.confirm(`Delete category ${name}?`)) {
        setDelete(true)
        dispatch(deleteCategoryThunk(id)).then(() => toast.success("Category deleted"));
        
      }
    };
  
    const handlePageChange = ({ selected }) => {
      dispatch(getCategoryThunk({ pages: selected + 1, size, search }));
    };
  
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Category Management</h2>
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search categories..."
              className="p-2 border rounded-md w-64"
            />
            <button
              onClick={clearSearch}
              className="p-2 bg-gray-500 text-white rounded-md"
            >
              Clear
            </button>
          </div>
          <button 
            onClick={handleAdd}
            className="p-2 bg-blue-500 text-white rounded-md"
          >
            Add Category
          </button>
        </div>
        {loading? (
          <p>Loading...</p>
        ) : (
          <>
            <table className="w-full border-collapse bg-white rounded-lg shadow">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-left">Image</th>
                  <th className="p-3 text-left">Created At</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category._id} className="border-b">
                    <td className="p-3">{category.name}</td>
                    <td className="p-3">{category.description}</td>
                    <td className="p-3">
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        "No Image"
                      )}
                    </td>
                    <td className="p-3">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-1 bg-yellow-500 text-white rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category._id, category.name)}
                        className="p-1 bg-red-500 text-white rounded"
                      >
                        Delete
                      </button>
                      <CategoryListingToggle 
                        category={category} 
                        onToggleSuccess={() => {
                          dispatch(getCategoryThunk({ pages, size, search }));
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ReactPaginate
              previousLabel="Previous"
              nextLabel="Next"
              pageCount={Math.ceil(total / size)}
              onPageChange={handlePageChange}
              containerClassName="flex space-x-2 justify-center mt-4"
              pageClassName="p-2 border rounded"
              activeClassName="bg-blue-500 text-white"
              previousClassName="p-2 border rounded"
              nextClassName="p-2 border rounded"
              disabledClassName="opacity-50"
            />
          </>
        )}
        {showModal && (
          <CategoryModal
            category={editCategory}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    );
  };
  

  
  export default Category;
  
