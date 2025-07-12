import Banner from '../../models/bannerModel.js';
import { uploadImagesToCloudinary } from '../../utils/imageUpload.js';

export const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ priority: 1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const listBanners = async (req, res) => {
  const { page = 1, size = 10, search = '' } = req.query;
  const query = {
    headline: { $regex: search, $options: 'i' },
  };
  try {
    const total = await Banner.countDocuments(query);
    const banners = await Banner.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * size)
      .limit(Number(size));
    res.json({ banners, total, page: Number(page), size: Number(size) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createBanner = async (req, res) => {
  const { headline, subtext, link, isActive = true, priority = 0 } = req.body;
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'Image required' });
  try {
    const [imageUrl] = await uploadImagesToCloudinary([file], 'banners');
    const banner = new Banner({ image: imageUrl, headline, subtext, link, isActive, priority });
    await banner.save();
    res.status(201).json({ message: 'Banner created', banner });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBanner = async (req, res) => {
  const { id } = req.params;
  const { headline, subtext, link, isActive, priority } = req.body;
  const file = req.file;
  try {
    let update = { headline, subtext, link, isActive, priority };
    if (file) {
      const [imageUrl] = await uploadImagesToCloudinary([file], 'banners');
      update.image = imageUrl;
    }
    const banner = await Banner.findByIdAndUpdate(id, update, { new: true });
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.json({ message: 'Banner updated', banner });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteBanner = async (req, res) => {
  const { id } = req.params;
  try {
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.json({ message: 'Banner deleted', deletedId: banner._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
