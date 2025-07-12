import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addBannerThunk, editBannerThunk } from '../features/admin/banner/adminBannerSlice';
import { toast } from 'react-toastify';

const BannerModal = ({ banner = null, onClose }) => {
  const dispatch = useDispatch();
  const [headline, setHeadline] = useState('');
  const [subtext, setSubtext] = useState('');
  const [link, setLink] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState(0);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (banner) {
      setHeadline(banner.headline || '');
      setSubtext(banner.subtext || '');
      setLink(banner.link || '');
      setIsActive(banner.isActive);
      setPriority(banner.priority);
    }
  }, [banner]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('headline', headline);
    formData.append('subtext', subtext);
    formData.append('link', link);
    formData.append('isActive', isActive);
    formData.append('priority', priority);
    if (imageFile) formData.append('image', imageFile);

    try {
      if (banner) {
        await dispatch(editBannerThunk({ id: banner._id, formData })).unwrap();
        toast.success('Banner updated');
      } else {
        await dispatch(addBannerThunk(formData)).unwrap();
        toast.success('Banner created');
      }
      onClose();
    } catch (err) {
      toast.error(err || 'Action failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>
          ✕
        </button>
        <h3 className="text-lg font-semibold mb-4">{banner ? 'Edit Banner' : 'Add Banner'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Headline</label>
            <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subtext</label>
            <input type="text" value={subtext} onChange={(e) => setSubtext(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link URL</label>
            <input type="text" value={link} onChange={(e) => setLink(e.target.value)} className="input" />
          </div>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} className="input w-24" />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span className="text-sm">Active</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image {banner ? '(leave blank to keep existing)' : ''}</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
          </div>
          <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded-md">
            {banner ? 'Update' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BannerModal;
