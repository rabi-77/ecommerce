import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchProductByIdThunk, fetchRelatedProductsThunk } from "../../features/userHomeSlice";
import { Star, ShoppingCart, Heart, Share2, TruckIcon, ShieldCheck, RotateCcw, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import ProductCard from "../../components/ProductCard";

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { product, relatedProducts, loading, error } = useSelector((state) => state.userProduct);
  console.log(relatedProducts,'relatedProducts')
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(fetchProductByIdThunk(id))
      .unwrap()
      .then((productData) => {
        // Process variants into sizeStock object
        if (productData && productData.variants) {
          const sizeStockMap = {};
          productData.variants.forEach(variant => {
            sizeStockMap[variant.size] = variant.stock;
          });
          setSelectedSize(Object.keys(sizeStockMap).find(size => sizeStockMap[size] > 0) || '');
        }
      })
      .catch(() => {
        toast.error("Product not found or unavailable");
        navigate("/products");
      });
    dispatch(fetchRelatedProductsThunk(id));
  }, [dispatch, id, navigate]);

  useEffect(() => {
    // Reset selected image when product changes
    setSelectedImage(0);
    setQuantity(1);
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    
    if (product.totalStock === 0) {
      toast.error("Product is out of stock");
      return;
    }
    
    if (!selectedSize && product.variants && product.variants.length > 0) {
      toast.error("Please select a size");
      return;
    }
    
    // Find the selected variant to check its stock
    const selectedVariant = product.variants?.find(v => v.size === selectedSize);
    if (selectedVariant && quantity > selectedVariant.stock) {
      toast.error(`Only ${selectedVariant.stock} items available in this size`);
      return;
    }
    
    if (quantity > product.totalStock) {
      toast.error(`Only ${product.totalStock} items available in stock`);
      return;
    }
    
    // Add to cart logic here
    toast.success(`${quantity} ${quantity > 1 ? 'items' : 'item'} of size ${selectedSize} added to cart`);
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    if (product && newQuantity > product.totalStock) {
      toast.warning(`Only ${product.totalStock} items available in stock`);
      setQuantity(product.totalStock);
      return;
    }
    setQuantity(newQuantity);
  };



  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg">{error}</p>
          <button
            onClick={() => navigate('/products')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  // No product found
  if (!product) return null;

  const discountedPrice = product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;
  const isOutOfStock = product.totalStock === 0;
  const isLowStock = product.totalStock > 0 && product.totalStock <= 5;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-6 text-sm text-gray-500">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight className="mx-2 h-4 w-4" />
          <Link to="/products" className="hover:text-blue-600">Products</Link>
          <ChevronRight className="mx-2 h-4 w-4" />
          <Link to={`/products?category=${product.category?._id}`} className="hover:text-blue-600">
            {product.category?.name || 'Category'}
          </Link>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="text-gray-800 font-medium truncate">{product.name}</span>
        </nav>
        
        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden">
                <Zoom>
                  <img
                    src={product.images && product.images[selectedImage] ? product.images[selectedImage] : 'https://via.placeholder.com/500?text=No+Image'}
                    alt={product.name}
                    className="w-full h-full object-center object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/500?text=No+Image';
                    }}
                  />
                </Zoom>
              </div>
              
              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto py-2">
                  {product.images.map((image, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${selectedImage === idx ? 'border-blue-500' : 'border-transparent'}`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} - Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <div className="flex flex-col">
              <div className="mb-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {product.brand?.name || 'Brand'}
                  </span>
                  <button className="text-gray-400 hover:text-red-500">
                    <Heart className="h-6 w-6" />
                  </button>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                
                <div className="flex items-center mb-4">
                  {renderStars(product.rating || 0)}
                  <span className="ml-2 text-sm text-gray-500">
                    ({product.reviewCount || 0} reviews)
                  </span>
                </div>
                
                <div className="mb-4">
                  {product.discount > 0 ? (
                    <div className="flex items-center">
                      <span className="text-3xl font-bold text-gray-900">
                        ${discountedPrice.toFixed(2)}
                      </span>
                      <span className="ml-2 text-lg text-gray-500 line-through">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                        {product.discount}% OFF
                      </span>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>
                
                {/* Stock Status */}
                <div className="mb-6">
                  {isOutOfStock ? (
                    <span className="text-red-600 font-medium flex items-center">
                      <span className="inline-block w-3 h-3 bg-red-600 rounded-full mr-2"></span>
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="text-orange-600 font-medium flex items-center">
                      <span className="inline-block w-3 h-3 bg-orange-600 rounded-full mr-2"></span>
                      Low Stock - Only {product.totalStock} left
                    </span>
                  ) : (
                    <span className="text-green-600 font-medium flex items-center">
                      <span className="inline-block w-3 h-3 bg-green-600 rounded-full mr-2"></span>
                      In Stock
                    </span>
                  )}
                </div>
                
                {/* Short Description */}
                <p className="text-gray-600 mb-6">
                  {product.shortDescription || product.description?.substring(0, 150) + '...' || 'No description available.'}
                </p>
                
                {/* Size Selection */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {['6', '7', '8', '9', '10'].map((size) => {
                      const variant = product.variants?.find(v => v.size === size);
                      const isOutOfStock = !variant || variant.stock <= 0;
                      
                      return (
                        <button
                          key={size}
                          onClick={() => !isOutOfStock && setSelectedSize(size)}
                          disabled={isOutOfStock}
                          className={`px-3 py-1 border rounded-md text-sm font-medium ${selectedSize === size ? 'border-blue-500 text-blue-500' : isOutOfStock ? 'border-gray-200 text-gray-300 opacity-60 cursor-not-allowed' : 'border-gray-300 hover:border-blue-500 hover:text-blue-500'}`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Color Selection if applicable */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Color</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          className="w-8 h-8 rounded-full border border-gray-300"
                          style={{ backgroundColor: color }}
                          title={color}
                        ></button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Add to Cart */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="flex items-center mb-4">
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.totalStock}
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="w-12 text-center border-0 focus:ring-0"
                    />
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                      disabled={quantity >= product.totalStock}
                    >
                      +
                    </button>
                  </div>
                  
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`ml-4 flex-1 flex items-center justify-center px-6 py-3 border border-transparent rounded-md font-medium text-white ${isOutOfStock ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
                
                {/* Shipping & Returns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm">
                  <div className="flex items-start">
                    <TruckIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <h4 className="font-medium">Free Shipping</h4>
                      <p className="text-gray-500">On orders over $50</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <ShieldCheck className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <h4 className="font-medium">Secure Payment</h4>
                      <p className="text-gray-500">100% secure payment</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <RotateCcw className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <h4 className="font-medium">Easy Returns</h4>
                      <p className="text-gray-500">30 day return policy</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Tabs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === 'description' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('specifications')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === 'specifications' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Specifications
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p>{product.description || 'No description available.'}</p>
              </div>
            )}
            
            {activeTab === 'specifications' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="divide-y divide-gray-200">
                    {product.specifications ? (
                      Object.entries(product.specifications).map(([key, value]) => (
                        <tr key={key}>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">{key}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">{value}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-3 px-4 text-sm text-gray-500" colSpan="2">No specifications available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
