import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  fetchBannersThunk,
  deleteBannerThunk,
} from '../../features/admin/banner/adminBannerSlice';
import BannerModal from '../../components/BannerModal';
import Pagination from '../../components/common/Pagination';
import DataTable from '../../components/common/DataTable';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import Input from '../../components/common/Input';

const Banners = () => {
  const dispatch = useDispatch();
  const { banners, total, size, loading, error, page, deletingBanner } = useSelector((s) => s.banner);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editBanner, setEditBanner] = useState(null);
  const [delId, setDelId] = useState(null);

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
  const del = (id) => {
    setDelId(id);
  };
  const confirmDelete = async () => {
    if (delId) {
      await dispatch(deleteBannerThunk(delId));
      toast.success('Banner deleted');
      setDelId(null);
    }
  };

  const handlePageChange = (newPage) => {
    dispatch(fetchBannersThunk({ page: newPage, size, search }));
  };

  // DataTable columns
  const columns = [
    { header: 'Image', accessor: (b) => <img src={b.image} alt="banner" className="h-12 w-24 object-cover rounded" /> },
    { header: 'Headline', accessor: 'headline' },
    { header: 'Active', accessor: (b) => (b.isActive ? 'Yes' : 'No') },
    { header: 'Priority', accessor: 'priority' },
    { header: 'Actions', accessor: (b) => (
        <div className="flex gap-2 justify-center">
          <button onClick={() => openEdit(b)} className="p-2 bg-gray-200 rounded">✎</button>
          <button onClick={() => del(b._id)} className="p-2 bg-red-200 rounded">🗑</button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Banner Management</h2>
      <div className="flex justify-between items-center mb-4 gap-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search headline..."
          className="flex-grow max-w-xs"
        />
        <button onClick={openAdd} className="px-4 py-2 bg-gray-800 text-white rounded-md">Add Banner</button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <DataTable columns={columns} data={banners} />
      )}
      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / size) || 1}
        onPageChange={handlePageChange}
        className="mt-6"
      />
      {showModal && <BannerModal banner={editBanner} onClose={() => setShowModal(false)} />}
      <ConfirmationDialog
        open={Boolean(delId)}
        title="Delete Banner"
        message="Are you sure you want to delete this banner?"
        confirmLabel="Delete"
        loading={deletingBanner}
        onConfirm={confirmDelete}
        onCancel={() => setDelId(null)}
      />
    </div>
  );
};

export default Banners;
