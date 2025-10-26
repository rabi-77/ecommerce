import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const ProductDetailsBanner = () => {
  return (
    <div className="bg-gradient-to-r from-yellow-600 to-green-600 text-white py-3 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-full h-full flex items-center">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="mx-4 flex items-center">
                <span className="text-sm font-medium"> New Collection Coming Soon</span>
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
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ProductDetailsBanner;
