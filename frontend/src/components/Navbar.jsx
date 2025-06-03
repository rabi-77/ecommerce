import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  ShoppingCart, 
  Heart, 
  User, 
  ChevronDown, 
  LogOut, 
  Settings, 
  Menu, 
  X, 
  Home,
  ShoppingBag,
  Phone,
  Info,
  Package
} from "lucide-react";
import { clearError, logoutThunk } from "../features/authSlice";
import { toast } from "react-toastify";
import { fetchCart, resetCart } from "../features/cart/cartSlice";
import { fetchWishlist, resetWishlist } from "../features/wishlist/wishlistSlice";

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const {user}=useSelector((state)=>state.auth)
  const [,forceUpdate]=useState()
  
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get cart state from Redux
  const { count: cartItemCount } = useSelector(state => state.cart);
  const { itemsCount: wishlistItemCount } = useSelector(state => state.wishlist);

  useEffect(() => {
    // Fetch cart and wishlist data only when user is logged in
    if (user) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    }
    
    // Add scroll event listener to change navbar appearance on scroll
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);

    // Handle clicks outside of dropdown to close it
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user, dispatch]);

  const handleUserClick = (e) => {
    // Prevent event from bubbling up
    e.stopPropagation();
    
    if (!user) {
      navigate("/login");
    } else {
      setDropdownOpen(!dropdownOpen);
    }
  };
  


  const handleLogout = () => {
    dispatch(logoutThunk()).then(()=>{
      // setUser(null);
      // forceUpdate({})
      dispatch(resetCart());
      dispatch(resetWishlist())

      dispatch(clearError())
      setDropdownOpen(false);
      clearError()
      navigate('/');
    }).catch((error)=>{
      console.log(error)
      toast.error(error.message || "Logout failed")
    })  
  };

  const handleProfileNavigation = (e, path) => {
    e.stopPropagation();
    console.log('Navigating to:', path);
    setDropdownOpen(false);
    navigate(path);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-white/95 backdrop-blur-sm py-3'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 relative">
        {/* Mobile menu button - only visible on small screens */}
        <button 
          className="md:hidden flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-heading font-bold tracking-wide text-[var(--primary)] flex items-center"
        >
          <span className="text-[var(--secondary)] mr-1">V</span>ERCETTI
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex gap-8 text-sm font-alt font-medium">
          <Link to="/" className="hover:text-[var(--primary)] transition-colors py-2 border-b-2 border-transparent hover:border-[var(--primary)]">Home</Link>
          <Link to="/products" className="hover:text-[var(--primary)] transition-colors py-2 border-b-2 border-transparent hover:border-[var(--primary)]">Shop</Link>
          <Link to="/new-arrivals" className="hover:text-[var(--primary)] transition-colors py-2 border-b-2 border-transparent hover:border-[var(--primary)]">New Arrivals</Link>
          <Link to="/featured" className="hover:text-[var(--primary)] transition-colors py-2 border-b-2 border-transparent hover:border-[var(--primary)]">Featured</Link>
          <Link to="/contact" className="hover:text-[var(--primary)] transition-colors py-2 border-b-2 border-transparent hover:border-[var(--primary)]">Contact</Link>
          <Link to="/about" className="hover:text-[var(--primary)] transition-colors py-2 border-b-2 border-transparent hover:border-[var(--primary)]">About</Link>
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-4 text-[var(--text-light)]">

          
          {/* Cart */}
          
          {/* <Link to="/cart" className="relative p-2 rounded-full hover:bg-[var(--background-cream)] transition-colors"> */}
          <button onClick={()=>{
            console.log('user name and email services');
            
            if(!user){
              toast.error(<div>Please login to view your cart
                <button onClick={()=>navigate('/login')} className="ml-2 underline text-[var(--primary)]">login</button>
              </div>,{duration:5000})
            }else{
              navigate('/cart')
            }
          }} className="relative p-2 rounded-full hover:bg-[var(--background-cream)] transition-colors"
          aria-label="Cart">
            <ShoppingCart size={20} className="hover:text-[var(--primary)] transition-colors" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </button>
          {/* </Link> */}
          
          {/* Wishlist */}
          <button 
            onClick={() => {
            console.log('user name and email services');
              if (!user) {
                toast.error(
                  <div>
                    Please login to view your wishlist.
                    <button 
                      onClick={() => navigate('/login')} 
                      className="ml-2 underline text-[var(--primary)]"
                    >
                      Login
                    </button>
                    <button 
                      onClick={() => navigate('/register')} 
                      className="ml-2 underline text-[var(--primary)]"
                    >
                      Register
                    </button>
                  </div>,
                  { duration: 5000 }
                );
              } else {
                navigate('/wishlist');
              }
            }}
            className="relative p-2 rounded-full hover:bg-[var(--background-cream)] transition-colors"
            aria-label="Wishlist"
          >
            <Heart size={20} className="hover:text-[var(--primary)] transition-colors" />
            {wishlistItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--secondary)] text-[var(--text-dark)] text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                {wishlistItemCount > 99 ? '99+' : wishlistItemCount}
              </span>
            )}
          </button>
          {/* User profile */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={handleUserClick}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-1"
              type="button"
              aria-label="User account"
            >
              {user ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-200">
                    {user.image ? (
                      <img 
                        src={user.image} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </>
              ) : (
                <User size={20} />
              )}
            </button>
            
            {user && dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-200 pointer-events-auto">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium truncate font-alt">{user.username || user.name || user.email || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                
                <button 
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left cursor-pointer transition-colors"
                  onClick={(e) => handleProfileNavigation(e, '/profile')}
                  type="button"
                >
                  <User size={16} className="mr-3 text-gray-500" />
                  <span className="font-medium">My Profile</span>
                </button>
                
                <button 
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left cursor-pointer transition-colors"
                  onClick={(e) => handleProfileNavigation(e, '/orders')}
                  type="button"
                >
                  <Package size={16} className="mr-3 text-gray-500" />
                  <span className="font-medium">My Orders</span>
                </button>
                
                <button 
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left cursor-pointer transition-colors"
                  onClick={(e) => handleProfileNavigation(e, '/profile/edit')}
                  type="button"
                >
                  <Settings size={16} className="mr-3 text-gray-500" />
                  <span className="font-medium">Account Settings</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full text-left cursor-pointer transition-colors border-t border-gray-100"
                  type="button"
                >
                  <LogOut size={16} className="mr-3" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Menu - Slide in from left */}
      <div className={`fixed inset-0 z-40 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:hidden`}>
        <div className="relative flex flex-col w-full max-w-xs h-full bg-white shadow-xl overflow-y-auto">
          {/* Close button */}
          <div className="flex items-center justify-between px-4 pt-5 pb-2 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 font-heading">Menu</h2>
            <button
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Mobile navigation links */}
          <nav className="flex-1 px-2 pt-2 pb-4 space-y-1 font-alt">
            <Link 
              to="/" 
              className="flex items-center px-3 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home size={20} className="mr-4 text-gray-500" />
              Home
            </Link>
            <Link 
              to="/products" 
              className="flex items-center px-3 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ShoppingBag size={20} className="mr-4 text-gray-500" />
              Shop
            </Link>
            <Link 
              to="/new-arrivals" 
              className="flex items-center px-3 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ShoppingBag size={20} className="mr-4 text-gray-500" />
              New Arrivals
            </Link>
            <Link 
              to="/featured" 
              className="flex items-center px-3 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ShoppingBag size={20} className="mr-4 text-gray-500" />
              Featured
            </Link>
            <Link 
              to="/contact" 
              className="flex items-center px-3 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Phone size={20} className="mr-4 text-gray-500" />
              Contact
            </Link>
            <Link 
              to="/about" 
              className="flex items-center px-3 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Info size={20} className="mr-4 text-gray-500" />
              About
            </Link>
          </nav>
          
          {/* User section in mobile menu */}
          {user ? (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-200">
                    {user.image ? (
                      <img src={user.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user.username || user.name || 'User'}</div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  My Profile
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/orders');
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  My Orders
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/profile/edit');
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  Account Settings
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 p-4 space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/register');
                }}
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
      

    </header>
  );
}
