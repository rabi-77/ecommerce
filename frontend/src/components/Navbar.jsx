import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { ShoppingCart, Heart, User } from "lucide-react";
import { logout } from "../features/authSlice";

export default function Navbar() {
  const [user, setUser] = useState(null);
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

    // Cleanup function
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  const handleUserClick = () => {
    if (!user) {
      navigate("/login"); // or "/register"
    }
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
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{user.username || user.email || 'User'}</span>
              <button 
                onClick={() => {
                  dispatch(logout());
                  setUser(null);
                  navigate('/');
                }}
                className="text-xs text-gray-500 hover:text-red-500"
              >
                Logout
              </button>
            </div>
          ) : (
            <button onClick={handleUserClick}>
              <User />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
