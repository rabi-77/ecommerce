import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWishlist, removeFromWishlist, clearWishlist } from '../../features/wishlist/wishlistSlice';
import Loader from '../../components/common/Loader';
import AddToCartButton from '../../components/AddToCartButton';
import Modal from '../../components/common/Modal';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  
  const { user } = useSelector((state) => state.auth);
  
  const { items, loading, error, itemsCount } = useSelector((state) => state.wishlist);

  useEffect(() => {
    if (!user) {
      toast.error(
        <div>
          Please login to view your wishlist.
          <button 
            onClick={() => navigate('/login')} 
            className="ml-2 underline text-blue-500"
          >
            Login
          </button>
          <button 
            onClick={() => navigate('/register')} 
            className="ml-2 underline text-blue-500"
          >
            Register
          </button>
        </div>,
        { duration: 5000 }
      );
      navigate('/');
      return;
    }
    
    dispatch(fetchWishlist());
  }, [user, navigate, dispatch]);

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await dispatch(removeFromWishlist(productId)).unwrap();
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleClearWishlist = () => {
    if(items.length===0) return;
    setClearDialogOpen(true);
  };

  const confirmClearWishlist = async () => {
    try {
      await dispatch(clearWishlist()).unwrap();
      toast.success('Wishlist cleared');
    } catch (error) {
      toast.error('Failed to clear wishlist');
    }
    setClearDialogOpen(false);
  };

  const handleSizeRequired = (product) => {
    setSelectedProduct(product);
    setSelectedSize('');
    setShowSizeModal(true);
  };
  
  const closeSizeModal = () => {
    setShowSizeModal(false);
    setSelectedProduct(null);
    setSelectedSize('');
  };

  if (loading) {
    return <Loader />;
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-600">Error loading wishlist: {error}</p>
          <button 
            onClick={() => dispatch(fetchWishlist())}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Size Selection Modal */}
      {showSizeModal && selectedProduct && (
        <Modal title="Select Size" onClose={closeSizeModal}>
          <div className="p-4">
            <p className="mb-4">Please select a size for {selectedProduct.name}:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedProduct.variants
                .filter(variant => variant.stock > 0)
                .map(variant => (
                  <button
                    key={variant.size}
                    onClick={() => setSelectedSize(variant.size)}
                    className={`px-3 py-1 border rounded-md text-sm font-medium ${
                      selectedSize === variant.size
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {variant.size}
                  </button>
                ))
            }
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={closeSizeModal}
                className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <AddToCartButton
                productId={selectedProduct._id}
                size={selectedSize}
                quantity={1}
                disabled={!selectedSize}
                buttonText="Add to Cart"
                className={!selectedSize ? 'opacity-50 cursor-not-allowed' : ''}
                onSuccess={closeSizeModal}
              />
            </div>
          </div>
        </Modal>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Heart className="mr-2 text-red-500" size={24} />
          My Wishlist
        </h1>
        {items.length > 0 && (
          <button
            onClick={handleClearWishlist}
            className="text-red-500 hover:text-red-700 flex items-center"
          >
            <Trash2 size={18} className="mr-1" />
            Clear Wishlist
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <Heart className="text-gray-300" size={64} />
          </div>
          <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-gray-600 mb-6">
            Add items you love to your wishlist. Review them anytime and easily move them to the cart.
          </p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Discover Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => handleRemoveFromWishlist(item.product._id)}
                  className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow hover:bg-red-50"
                >
                  <Heart className="text-red-500" size={20} fill="currentColor" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1 truncate">
                  {item.product.name}
                </h3>
                <div className="flex text-sm text-gray-600 mb-2">
                  <span>{item.product.brand.name}</span>
                  <span className="mx-2">•</span>
                  <span>{item.product.category.name}</span>
                </div>
                <div className="font-bold text-lg mb-3">₹{item.product.price.toFixed(2)}</div>
                <AddToCartButton
                  productId={item.product._id}
                  product={item.product}
                  quantity={1}
                  fullWidth={true}
                  onSizeRequired={handleSizeRequired}
                />
                <button
                  onClick={() => navigate(`/products/${item.product._id}`)}
                  className="w-full mt-2 border border-gray-300 py-2 rounded hover:bg-gray-50 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmationDialog
        open={clearDialogOpen}
        title="Clear Wishlist"
        message="Are you sure you want to clear your wishlist?"
        confirmLabel="Clear"
        onConfirm={confirmClearWishlist}
        onCancel={()=>setClearDialogOpen(false)}
      />
    </div>
  );
};

export default Wishlist;
