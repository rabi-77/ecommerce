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
        <h2 className="text-2xl font-bold">Brand Management</h2>
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search brands..."
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
            Add Brand
          </button>
        </div>
        {loading ? (
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
                {brands.map((brand) => (
                  <tr key={brand._id} className="border-b">
                    <td className="p-3">{brand.name}</td>
                    <td className="p-3">{brand.description}</td>
                    <td className="p-3">
                      {brand.imageUrl ? (
                        <img
                          src={brand.imageUrl}
                          alt={brand.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        "No Image"
                      )}
                    </td>
                    <td className="p-3">
                      {new Date(brand.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 space-x-2">
                      <button
                        onClick={() => handleEdit(brand)}
                        className="p-1 bg-yellow-500 text-white rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(brand._id, brand.name)}
                        className="p-1 bg-red-500 text-white rounded"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleToggleListing(brand._id, brand.isListed)}
                        className={`p-1 rounded text-white ${brand.isListed ? 'bg-red-500' : 'bg-green-500'}`}
                      >
                        {brand.isListed ? 'Unlist' : 'List'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ReactPaginate
              previousLabel="Previous"
              nextLabel="Next"
              pageCount={Math.ceil(total / sizes)}
              onPageChange={handlePageChange}
              containerClassName="flex items-center justify-center mt-6 gap-2"
              pageClassName="px-3 py-2 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
              activeClassName="!bg-gray-800 text-white border-gray-800"
              previousClassName="px-3 py-2 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
              nextClassName="px-3 py-2 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
              disabledClassName="opacity-50 cursor-not-allowed hover:bg-white"
              breakClassName="px-3 py-2"
              forcePage={pages-1}
            />
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
  
