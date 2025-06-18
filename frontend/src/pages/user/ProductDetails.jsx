import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  fetchProductByIdThunk,
  fetchProductsThunk,
  fetchRelatedProductsThunk,
} from "../../features/userHomeSlice";
import { Star } from "lucide-react";
import { toast } from "react-toastify";
import WishlistButton from "../../components/user/WishlistButton";
import AddToCartButton from "../../components/AddToCartButton";
import ProductCard from "../../components/ProductCard";

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { product, products, relatedProducts, loading, error } = useSelector(
    (state) => state.userProduct
  );
  const newProduct = products.find((p) => p._id === id);
  console.log(newProduct, "newProduct");

  const relateIds = relatedProducts.map((p) => p._id);

  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [sizeError, setSizeError] = useState("");
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(fetchProductsThunk()).unwrap();
    dispatch(fetchProductByIdThunk(id))
      .unwrap()
      .then((productData) => {
        if (productData && !productData.isListed) {
          toast.error("This product is currently unavailable", {
            autoClose: 5000,
            position: "top-center",
            hideProgressBar: false,
          });
          navigate("/products");
          return;
        }

        if (productData && productData.images?.[0]) {
          setSelectedImage(productData.images[0]);
        }
      })
      .catch(() => {
        toast.error("Product not found or unavailable", {
          autoClose: 5000,
          position: "top-center",
        });
        navigate("/products");
      });
    dispatch(fetchRelatedProductsThunk(id));
  }, [dispatch, id, navigate]);

  useEffect(() => {
    // Reset quantity when product changes
    setQuantity(1);
    setSizeError("");
  }, [product]);

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;

    if (newQuantity < 1) return;

    if (product?.totalStock && newQuantity > product.totalStock) {
      toast.error(`Only ${product.totalStock} items available in stock`);
      return;
    }

    setQuantity(newQuantity);
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    setSizeError("");
    setQuantity(1);
  };

  const validateSize = () => {
    if (!selectedSize && product?.variants?.length > 0) {
      setSizeError("Please select a size");
      return false;
    }
    return true;
  };

  const renderPrice = () => {
    if (newProduct.effectivePrice) {
      return (
        <div className="flex items-center space-x-3">
          <span className="text-gray-500 line-through text-xl">
            ₹{newProduct.price}
          </span>
          <span className="text-3xl font-bold text-gray-900">
            ₹{newProduct.effectivePrice}
          </span>
          {newProduct.appliedOffer && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
              {newProduct.appliedOffer.percentage
                ? `${newProduct.appliedOffer.percentage}% OFF`
                : `₹${newProduct.appliedOffer.amount} OFF`}
            </span>
          )}
        </div>
      );
    }
    return (
      <span className="text-3xl font-bold text-gray-900">
        ₹{product.price}lol
      </span>
    );
  };

  const renderStockStatus = () => {
    const isOutOfStock = product.totalStock <= 0;
    const isLowStock = product.totalStock > 0 && product.totalStock <= 5;

    if (isOutOfStock) {
      return (
        <span className="text-red-600 font-medium flex items-center">
          <span className="inline-block w-3 h-3 bg-red-600 rounded-full mr-2"></span>
          Out of Stock
        </span>
      );
    }

    if (isLowStock) {
      return (
        <span className="text-orange-600 font-medium flex items-center">
          <span className="inline-block w-3 h-3 bg-orange-600 rounded-full mr-2"></span>
          Low Stock - Only {product.totalStock} left
        </span>
      );
    }

    return (
      <span className="text-green-600 font-medium flex items-center">
        <span className="inline-block w-3 h-3 bg-green-600 rounded-full mr-2"></span>
        In Stock
      </span>
    );
  };

  const renderProductDetails = () => {
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="bg-gray-200 rounded-lg aspect-square animate-pulse"></div>
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-md animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="flex space-x-3">
                  <div className="flex-1 h-12 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={() => navigate("/products")}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Back to Products
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!product) return null;

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg overflow-hidden aspect-square shadow-md">
              <img
                src={
                  selectedImage ||
                  product.images?.[0] ||
                  "https://via.placeholder.com/600?text=No+Image"
                }
                alt={product.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://via.placeholder.com/600?text=No+Image";
                }}
              />
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(image)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                      selectedImage === image
                        ? "border-blue-500"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://via.placeholder.com/100?text=Error";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Breadcrumbs */}
            <nav className="flex text-sm text-gray-500 mb-4">
              <Link to="/" className="hover:text-blue-600">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link to="/products" className="hover:text-blue-600">
                Products
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{product.name}</span>
            </nav>

            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>

              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-gray-500 ml-2">(0 reviews)</span>
              </div>

              {renderPrice()}

              <div className="flex items-center space-x-2 mb-4">
                {renderStockStatus()}

                {product.isFeatured && (
                  <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                    Featured
                  </span>
                )}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants?.map((variant) => (
                  <button
                    key={variant.size}
                    onClick={() => handleSizeChange(variant.size)}
                    className={`px-3 py-1 border rounded-md text-sm font-medium ${
                      selectedSize === variant.size
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : variant.stock > 0
                        ? "border-gray-300 text-gray-700 hover:border-gray-400"
                        : "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                    }`}
                    disabled={variant.stock === 0}
                  >
                    {variant.size}
                    {variant.stock === 0 && " (Out of Stock)"}
                  </button>
                ))}
              </div>
              {sizeError && (
                <p className="text-red-600 text-sm mt-1">{sizeError}</p>
              )}
            </div>

            {/* Quantity */}
            {selectedSize && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
                <div className="mt-2 flex items-center">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <span className="text-gray-500">-</span>
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center border-t border-b border-gray-300 bg-white text-gray-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={
                      selectedSize &&
                      (quantity >=
                        product.variants.find((v) => v.size === selectedSize)
                          ?.stock ||
                        quantity >= 10)
                    }
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <span className="text-gray-500">+</span>
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart & Wishlist */}
            <div className="flex space-x-4 mb-6">
              <div className="flex flex-col space-y-4">
                <AddToCartButton
                  productId={product._id}
                  size={selectedSize}
                  quantity={quantity}
                  fullWidth={true}
                  validateSize={validateSize}
                  className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                />
                <WishlistButton
                  productId={product._id}
                  product={product}
                  className="border border-gray-300 hover:border-blue-600 hover:text-blue-600 transition-colors"
                />
              </div>
            </div>

            {/* Tabs */}
            <nav className="flex space-x-4 mb-6">
              <button
                onClick={() => setActiveTab("description")}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === "description"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab("specifications")}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === "specifications"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Specifications
              </button>
            </nav>

            <div className="p-6">
              {activeTab === "description" && (
                <div className="prose max-w-none">
                  <p>{product.description || "No description available."}</p>
                </div>
              )}

              {activeTab === "specifications" && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="divide-y divide-gray-200">
                      {product.specifications ? (
                        Object.entries(product.specifications).map(
                          ([key, value]) => (
                            <tr key={key}>
                              <td className="py-3 px-4 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                                {key}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-500">
                                {value}
                              </td>
                            </tr>
                          )
                        )
                      ) : (
                        <tr>
                          <td
                            className="py-3 px-4 text-sm text-gray-500"
                            colSpan="2"
                          >
                            No specifications available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {renderProductDetails()}

        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => {
                let ad = products.find((p) => p._id === relatedProduct._id);
                console.log(ad);
                
                const productshow = ad || relatedProduct;
                console.log('productshow',productshow);
                
               return <ProductCard key={relatedProduct._id} product={productshow} />;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
