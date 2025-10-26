import { useEffect, useState } from 'react';
import api from '../apis/user/api';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const HeroBanner = () => {
  const [banners, setBanners] = useState([]);
  const getTopPriorityBanners = (banners) => {
    if (!banners || banners.length === 0) return [];
    const minPriority = Math.min(...banners.map((b) => b.priority ?? 0));
    return banners.filter((b) => (b.priority ?? 0) === minPriority);
  };

  const DEFAULT_BANNER = {
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    headline: 'Step into Style',
    subtext: 'Discover our premium collection of footwear designed for comfort and fashion',
    link: '/products',
  };

  useEffect( () => {
    const fetchBanners = async () => {
    await api.get('/banners')
      .then((res) => {
        const active = getTopPriorityBanners(res.data || []);
        setBanners(active.length ? active : [DEFAULT_BANNER]);
      })
      .catch(() => {
        setBanners([DEFAULT_BANNER]);
      });
    };
    fetchBanners();
  }, []);

  if (!banners.length) return null;

  // Custom arrow components for slider
  const PrevArrow = (props) => {
    const { onClick } = props;
    return (
      <button
        onClick={onClick}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
    );
  };

  const NextArrow = (props) => {
    const { onClick } = props;
    return (
      <button
        onClick={onClick}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>
    );
  };

  // Slider settings – show dots/arrows only when >1 banner
  const sliderSettings = {
    dots: banners.length > 1,
    arrows: banners.length > 1,
    infinite: true,
    autoplay: banners.length > 1,
    autoplaySpeed: 6000,
    pauseOnHover: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    dotsClass: "slick-dots custom-dots",
    appendDots: dots => (
      <div style={{ position: 'absolute', bottom: '20px' }}>
        <ul style={{ margin: "0px" }}> {dots} </ul>
      </div>
    ),
    customPaging: i => (
      <div className="w-3 h-3 mx-1 rounded-full bg-white/50 hover:bg-white/80 transition-all"></div>
    ),
  };

  const BannerSlide = ({ b }) => (
    <div className="h-[600px] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10"></div>
      <img 
        src={b.image} 
        alt="hero" 
        className="w-full h-full object-cover transform scale-105 animate-slow-zoom" 
      />
      <div className="absolute inset-0 z-20 flex flex-col items-start justify-center text-white px-16 lg:px-24 max-w-5xl">
        {b.headline && (
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold mb-4 drop-shadow-md leading-tight"
          >
            {b.headline}
          </motion.h1>
        )}
        {b.subtext && (
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8 text-xl max-w-xl drop-shadow-sm"
          >
            {b.subtext}
          </motion.p>
        )}
        {b.link && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link 
              to={b.link} 
              className="px-8 py-4 bg-white text-gray-800 rounded-md font-medium hover:bg-gray-100 transition-all hover:shadow-lg flex items-center group"
            >
              Shop Now
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative">
      <style jsx>{`
        .custom-dots li button:before {
          display: none;
        }
        .animate-slow-zoom {
          animation: slowZoom 20s infinite alternate;
        }
        @keyframes slowZoom {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
      `}</style>
      {banners.length === 1 ? (
        <BannerSlide b={banners[0]} />
      ) : (
        <Slider {...sliderSettings} className="h-[600px]">
          {banners.map((b) => (
            <BannerSlide key={b._id || b.image} b={b} />
          ))}
        </Slider>
      )}
    </div>
  );
};

export default HeroBanner;
