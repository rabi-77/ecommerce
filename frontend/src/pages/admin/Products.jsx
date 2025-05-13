import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ReactPaginate from "react-paginate";
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

const Products = () => {
  const dispatch = useDispatch();
  const { products, total, page, size, loading, error,categories ,brands} = useSelector(
    (state) => state.product
  );
  // console.log(total,loading,categories,products,brands)
  // console.log(products);
  

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

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

  const handleDelete = (id, name) => {
    if (
      window.confirm(
        `Permanently delete product ${name}? This action cannot be undone.`
      )
    ) {
      dispatch(deleteProductThunk(id)).then(() =>
        toast.success("Product permanently deleted")
      );
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

  const handlePageChange = ({ selected }) => {
    dispatch(getProductsThunk({ page: selected + 1, size, search }));
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Product Management</h2>
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search products..."
            className="p-2 border rounded-md w-64"
          />
          <button
            onClick={clearSearch}
            className="p-2 bg-gray-500 text-white rounded-md"
          >
            Clear
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleAdd}
            className="p-2 bg-blue-500 text-white rounded-md"
          >
            Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        
        <>
          <table className="w-full border-collapse bg-white rounded-lg shadow">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 text-left"></th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Total Stock</th>
                <th className="p-3 text-left">Image</th>
                <th className="p-3 text-left">Featured</th>
                <th className="p-3 text-left">Created At</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            
            <tbody>
              {products.map((product) => (
                <>
                  <tr
                    key={product._id}
                    className={`border-b ${
                      !product.isListed ? "unlisted" : ""
                    }`}
                  >
                    <td className="p-3">
                      <button onClick={() => toggleRow(product._id)}>
                        {expandedRows[product._id] ? "−" : "+"}
                      </button>
                    </td>
                    <td className="p-3">{product.name}</td>
                    <td className="p-3">${product.price}</td>
                    <td className="p-3">{product.totalStock}</td>
                    <td className="p-3">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        "No Image"
                      )}
                    </td>
                    <td className="p-3">{product.isFeatured ? "Yes" : "No"}</td>
                    <td className="p-3">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 space-x-2">
                      <button
                        onClick={() =>
                          handleToggleList(product._id, product.isListed)
                        }
                        className={`p-1 rounded text-white ${
                          product.isListed ? "bg-red-500" : "bg-green-500"
                        }`}
                      >
                        {product.isListed ? "Unlist" : "List"}
                      </button>
                      <button
                        onClick={() =>
                          handleToggleFeatured(product._id, product.isFeatured)
                        }
                        className={`p-1 rounded text-white ${
                          product.isFeatured ? "bg-purple-500" : "bg-blue-500"
                        }`}
                      >
                        {product.isFeatured ? "Unfeature" : "Feature"}
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1 bg-yellow-500 text-white rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id, product.name)}
                        className="p-1 bg-red-500 text-white rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {expandedRows[product._id] && (
                    <tr className="border-b">
                      <td colSpan="8" className="p-3 bg-gray-50">
                        <div className="ml-6">
                          <h4 className="font-semibold">Variants:</h4>
                          <ul className="list-disc ml-4">
                            {product.variants.map((v) => (
                              <li key={v.sku}>
                                Size {v.size}: {v.stock} units (SKU: {v.sku})
                              </li>
                            ))}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
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
        <ProductModal
          product={editProduct}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Products;
