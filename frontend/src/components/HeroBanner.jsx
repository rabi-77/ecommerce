import { useEffect, useState } from 'react';
import api from '../apis/user/api';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const HeroBanner = () => {
  const [banners, setBanners] = useState([]);
  const getTopPriorityBanners = (banners) => {
    if (!banners || banners.length === 0) return [];
    const minPriority = Math.min(...banners.map((b) => b.priority ?? 0));
    return banners.filter((b) => (b.priority ?? 0) === minPriority);
  };

  const DEFAULT_BANNER = {
    image: '/default-banner.jpg',
    headline: 'Welcome to our store',
    subtext: 'Discover amazing products today',
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

  // Slider settings – show dots/arrows only when >1 banner
  const sliderSettings = {
    dots: banners.length > 1,
    arrows: banners.length > 1,
    infinite: true,
    autoplay: banners.length > 1,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  const BannerSlide = ({ b }) => (
    <div className="h-[400px] relative">
      <img src={b.image} alt="hero" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center text-white px-4">
        {b.headline && <h1 className="text-4xl font-bold mb-2 drop-shadow-md">{b.headline}</h1>}
        {b.subtext && <p className="mb-4 text-lg max-w-xl drop-shadow-sm">{b.subtext}</p>}
        {b.link && (
          <Link to={b.link} className="px-6 py-3 bg-white text-gray-800 rounded-md font-medium hover:bg-gray-100 transition">
            Shop Now
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative">
      {banners.length === 1 ? (
        <BannerSlide b={banners[0]} />
      ) : (
        <Slider {...sliderSettings} className="h-[400px]">
          {banners.map((b) => (
            <BannerSlide key={b._id || b.image} b={b} />
          ))}
        </Slider>
      )}
    </div>
  );
};

export default HeroBanner;
