import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';

const AnnouncementBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Announcements to display
  const announcements = [
    "999 ന് മുകളിലുള്ള ഓർഡറുകൾക്ക് ഷിപ്പിംഗ് സൗജന്യമാണ്",
    "Flash Sale Coming Next Week - Up to 70% Off!",
    "Free Shipping on Orders Over ₹999",
    "Sign Up for Our Newsletter and Get 10% Off Your First Order"
  ];

  if (!isVisible) return null;
  
  return (
    <div className="bg-gradient-to-r from-yellow-600 via-red-600 to-green-600 text-white py-3 relative overflow-hidden" style={{ zIndex: 60 }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-full h-full flex items-center">
          <div className="flex animate-marquee whitespace-nowrap">
            {/* Repeat each announcement multiple times for continuous scrolling */}
            {announcements.map((announcement, index) => (
              <div key={`announcement-${index}`} className="mx-8 flex items-center">
                <span className="text-sm font-medium">{announcement}</span>
                <ArrowRight size={14} className="ml-2" />
              </div>
            ))}
            {announcements.map((announcement, index) => (
              <div key={`announcement-repeat-${index}`} className="mx-8 flex items-center">
                <span className="text-sm font-medium">{announcement}</span>
                <ArrowRight size={14} className="ml-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
      `}</style>
      
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white z-10"
        aria-label="Close announcement"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default AnnouncementBanner;
