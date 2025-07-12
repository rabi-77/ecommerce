import { useEffect, useState } from 'react';
import api from '../apis/user/api';
import { Link } from 'react-router-dom';

const HeroBanner = () => {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    api.get('/banners').then((res) => setBanner(res.data[0])).catch(() => {});
  }, []);

  if (!banner) return null;

  return (
    <div className="relative h-[400px]">
      <img src={banner.image} alt="hero" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center text-white px-4">
        {banner.headline && <h1 className="text-4xl font-bold mb-2 drop-shadow-md">{banner.headline}</h1>}
        {banner.subtext && <p className="mb-4 text-lg max-w-xl drop-shadow-sm">{banner.subtext}</p>}
        {banner.link && (
          <Link to={banner.link} className="px-6 py-3 bg-white text-gray-800 rounded-md font-medium hover:bg-gray-100 transition">
            Shop Now
          </Link>
        )}
      </div>
    </div>
  );
};

export default HeroBanner;
