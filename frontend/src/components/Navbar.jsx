import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { ShoppingCart, Heart, User, ChevronDown, LogOut, Settings } from "lucide-react";
import { logoutThunk } from "../features/authSlice";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Function to check and update user from localStorage
  const checkUserStatus = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    // Check user status on component mount
    checkUserStatus();

    // Listen for storage events (when localStorage changes)
    const handleStorageChange = (e) => {
      if (e.key === "user" || e.key === "tokenAccess" || e.key === null) {
        checkUserStatus();
      }
    };

    // Add event listener for storage changes
    window.addEventListener("storage", handleStorageChange);

    // Create an interval to check user status periodically
    const intervalId = setInterval(checkUserStatus, 1000); // Check every second

    // Handle clicks outside of dropdown to close it
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup function
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(intervalId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleUserClick = (e) => {
    // Prevent event from bubbling up
    e.stopPropagation();
    
    if (!user) {
      navigate("/login"); // or "/register"
    } else {
      console.log('Toggle dropdown');
      setDropdownOpen(!dropdownOpen);
    }
  };

  const handleLogout = () => {
    dispatch(logoutThunk());
    setUser(null);
    setDropdownOpen(false);
    navigate('/');
  };

  const handleProfileNavigation = (e, path) => {
    e.stopPropagation();
    console.log('Navigating to:', path);
    setDropdownOpen(false);
    navigate(path);
  };

  return (
    <header className="bg-[#f8f5f1] shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-serif font-bold tracking-wide uppercase"
        >
          VERCETTI
        </Link>

        {/* Menu */}
        <nav className="hidden md:flex gap-6 text-sm font-semibold uppercase">
          <Link to="/">Home</Link>
          <Link to="/products">Shop</Link>
          <Link to="/new-arrivals">New Arrivals</Link>
          <Link to="/featured">Featured</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/about">About Us</Link>
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-5 text-black text-xl">
          <Link to="/cart">
            <ShoppingCart />
          </Link>
          <Heart className="cursor-pointer" />
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={handleUserClick}
              className="flex items-center gap-1 cursor-pointer"
              type="button"
            >
              {user ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
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
                <User />
              )}
            </button>
            
            {user && dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 pointer-events-auto">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium truncate">{user.username || user.name || user.email || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                
                <button 
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left cursor-pointer"
                  onClick={(e) => handleProfileNavigation(e, '/profile')}
                  type="button"
                >
                  <User size={16} className="mr-2" />
                  My Profile
                </button>
                
                <button 
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left cursor-pointer"
                  onClick={(e) => handleProfileNavigation(e, '/profile/edit')}
                  type="button"
                >
                  <Settings size={16} className="mr-2" />
                  Edit Profile
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left cursor-pointer"
                  type="button"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
