import asyncHandler from 'express-async-handler';
import Offer from '../../models/offerModel.js';
import Product from '../../models/productModel.js';
import Category from '../../models/categoryModel.js';

// Helper to validate references based on offer type
const validateRefs = async (type, product, category) => {
  if (type === 'PRODUCT') {
    if (!product) throw new Error('Product offer requires product id');
    const prod = await Product.findById(product).select('_id');
    if (!prod) throw new Error('Invalid product id');
  } else if (type === 'CATEGORY') {
    if (!category) throw new Error('Category offer requires category id');
    const cat = await Category.findById(category).select('_id');
    if (!cat) throw new Error('Invalid category id');
  }
};

// POST /admin/offers
export const createOffer = asyncHandler(async (req, res) => {
  const { type, percentage, amount, product, category, startDate, endDate } = req.body;
console.log(product,'h', typeof product);

  await validateRefs(type, product, category);

  if (!percentage && !amount) {
    res.status(400);
    throw new Error('Offer must have either percentage or amount');
  }

  const data = { type, percentage, amount, product, category, startDate, endDate };
  const offer = await Offer.create(data);
  res.status(201).json({ success: true, offer });
});

// GET /admin/offers
export const getOffers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type } = req.query;
  const filter = {};
  if (type) filter.type = type;
  const total = await Offer.countDocuments(filter);
  const offers = await Offer.find(filter)
    .populate('product', 'name images price')
    .populate('category', 'name')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });
  res.json({ offers, totalPages: Math.ceil(total / limit), currentPage: Number(page), total });
});

// GET /admin/offers/:id
export const getOfferById = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id)
    .populate('product', 'name images price')
    .populate('category', 'name');
  if (!offer) {
    res.status(404);
    throw new Error('Offer not found');
  }
  res.json(offer);
});

// PUT /admin/offers/:id
export const updateOffer = asyncHandler(async (req, res) => {
  const { type, percentage, amount, product, category, startDate, endDate, isActive } = req.body;
  await validateRefs(type ?? undefined, product, category);
  const offer = await Offer.findById(req.params.id);
  if (!offer) {
    res.status(404);
    throw new Error('Offer not found');
  }
  if (type) offer.type = type;
  if (percentage !== undefined) offer.percentage = percentage;
  if (amount !== undefined) offer.amount = amount;
  if (product !== undefined) offer.product = product;
  if (category !== undefined) offer.category = category;
  if (startDate !== undefined) offer.startDate = startDate;
  if (endDate !== undefined) offer.endDate = endDate;
  if (isActive !== undefined) offer.isActive = isActive;
  const updated = await offer.save();
  res.json({ success: true, offer: updated });
});

// PATCH /admin/offers/:id/toggle
export const toggleOfferActive = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer) {
    res.status(404);
    throw new Error('Offer not found');
  }
  offer.isActive = !offer.isActive;
  await offer.save();
  res.json({ success: true, isActive: offer.isActive });
});

// DELETE /admin/offers/:id
export const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer) {
    res.status(404);
    throw new Error('Offer not found');
  }
  await offer.deleteOne();
  res.json({ success: true });
});
