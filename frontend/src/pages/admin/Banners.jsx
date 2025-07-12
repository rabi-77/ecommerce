import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactPaginate from 'react-paginate';
import { toast } from 'react-toastify';
import {
  fetchBannersThunk,
  deleteBannerThunk,
} from '../../features/admin/banner/adminBannerSlice';
import BannerModal from '../../components/BannerModal';

const Banners = () => {
  const dispatch = useDispatch();
  const { banners, total, size, loading, error, page } = useSelector((s) => s.banner);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editBanner, setEditBanner] = useState(null);

  useEffect(() => {
    dispatch(fetchBannersThunk({ page, size, search }));
  }, [dispatch, page, size, search, showModal]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const openAdd = () => {
    setEditBanner(null);
    setShowModal(true);
  };
  const openEdit = (banner) => {
    setEditBanner(banner);
    setShowModal(true);
  };
  const del = async (id) => {
    if (window.confirm('Delete banner?')) {
      await dispatch(deleteBannerThunk(id));
      toast.success('Banner deleted');
    }
  };

  const handlePageChange = ({ selected }) => {
    dispatch(fetchBannersThunk({ page: selected + 1, size, search }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Banner Management</h2>
      <div className="flex justify-between items-center mb-4 gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search headline..."
          className="border p-2 rounded-md flex-grow max-w-xs"
        />
        <button onClick={openAdd} className="px-4 py-2 bg-gray-800 text-white rounded-md">Add Banner</button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded-md">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="py-2 px-3 text-left">Image</th>
                <th className="py-2 px-3 text-left">Headline</th>
                <th className="py-2 px-3 text-left">Active</th>
                <th className="py-2 px-3 text-left">Priority</th>
                <th className="py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b._id} className="border-t">
                  <td className="py-2 px-3">
                    <img src={b.image} alt="banner" className="h-12 w-24 object-cover rounded" />
                  </td>
                  <td className="py-2 px-3">{b.headline}</td>
                  <td className="py-2 px-3">{b.isActive ? 'Yes' : 'No'}</td>
                  <td className="py-2 px-3">{b.priority}</td>
                  <td className="py-2 px-3 flex gap-2 justify-center">
                    <button onClick={() => openEdit(b)} className="p-2 bg-gray-200 rounded">✎</button>
                    <button onClick={() => del(b._id)} className="p-2 bg-red-200 rounded">🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ReactPaginate
        previousLabel="← Prev"
        nextLabel="Next →"
        pageCount={Math.ceil(total / size) || 1}
        onPageChange={handlePageChange}
        containerClassName="flex items-center justify-center space-x-2 mt-6 font-medium"
        pageClassName="flex items-center justify-center h-8 w-8 rounded-md text-sm border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200"
        activeClassName="bg-gray-800 text-white border-gray-800"
        previousClassName="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200"
        nextClassName="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200"
        disabledClassName="opacity-50 cursor-not-allowed"
        breakClassName="px-2 py-1.5 text-gray-500"
        marginPagesDisplayed={1}
        pageRangeDisplayed={3}
      />
      {showModal && <BannerModal banner={editBanner} onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Banners;
