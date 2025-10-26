import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8 px-6 mt-10">
      <div className="max-w-7xl mx-auto">
        {/* Newsletter Section */}
        <div className="mb-16 pb-10 border-b border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2">Join Our Newsletter</h3>
              <p className="text-gray-400">Stay updated with the latest products, exclusive offers and news</p>
            </div>
            <div>
              <form className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="flex-grow px-4 py-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200"
                  required
                />
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors flex items-center justify-center whitespace-nowrap"
                >
                  Subscribe
                  <ArrowRight size={16} className="ml-2" />
                </button>
              </form>
            </div>
          </div>
        </div>
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="text-2xl font-heading font-bold tracking-wide text-white flex items-center mb-4">
              <span className="text-blue-400 mr-1">V</span>ERCETTI
            </Link>
            <p className="text-gray-400 mb-6 pr-4">Premium footwear for every occasion. Quality, comfort, and style delivered to your doorstep.</p>
            <div className="flex space-x-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-blue-600 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-blue-600 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-blue-600 transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-gray-100">Shop</h4>
            <ul className="space-y-3">
              <li><Link to="/products" className="text-gray-400 hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/new-arrivals" className="text-gray-400 hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link to="/featured" className="text-gray-400 hover:text-white transition-colors">Featured Products</Link></li>
              <li><Link to="/products" className="text-gray-400 hover:text-white transition-colors">Best Sellers</Link></li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-gray-100">Support</h4>
            <ul className="space-y-3">
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Shipping Info</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Returns & Exchange</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">FAQs</Link></li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-gray-100">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin size={18} className="mr-2 text-gray-400 flex-shrink-0 mt-1" />
                <span className="text-gray-400">Mittayi Theruvu, Calicut, Kerala 670001, India</span>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="mr-2 text-gray-400" />
                <a href="tel:+918001234565" className="text-gray-400 hover:text-white transition-colors">+91 800 123 4565</a>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-2 text-gray-400" />
                <a href="mailto:support@vercetti.com" className="text-gray-400 hover:text-white transition-colors">support@vercetti.com</a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 text-center sm:flex sm:justify-between sm:text-left">
          <p className="text-gray-500 text-sm mb-4 sm:mb-0">&copy; {new Date().getFullYear()} Vercetti. All rights reserved.</p>
          <div className="flex justify-center sm:justify-end space-x-6">
            <Link to="/" className="text-gray-500 hover:text-gray-300 text-sm">Privacy Policy</Link>
            <Link to="/" className="text-gray-500 hover:text-gray-300 text-sm">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
  