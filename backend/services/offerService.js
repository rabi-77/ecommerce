import Offer from '../models/offerModel.js';

// Fetch active offers relevant to provided product & category ids
export const fetchActiveOffers = async (productIds = [], categoryIds = []) => {
  const now = new Date();
  const offers = await Offer.find({
    isActive: true,
    $and: [
      { $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }] },
      { startDate: { $lte: now } }
    ],
    $or: [
      { type: 'PRODUCT', product: { $in: productIds } },
      { type: 'CATEGORY', category: { $in: categoryIds } }
    ]
  }).lean();

  const productOfferMap = new Map();
  const categoryOfferMap = new Map();

  offers.forEach(off => {
    if (off.type === 'PRODUCT') productOfferMap.set(off.product.toString(), off);
    else if (off.type === 'CATEGORY') categoryOfferMap.set(off.category.toString(), off);
  });

  return { productOfferMap, categoryOfferMap };
};

// Determine best offer and effective price for a single product doc
export const applyBestOffer = (productDoc, offerMaps) => {
  const { productOfferMap, categoryOfferMap } = offerMaps;
  console.log('offerMaps',offerMaps);
  console.log('prductOfferMap',productOfferMap);
  console.log('categoryOfferMap',categoryOfferMap);
  
  const prodId = productDoc._id.toString();
  const catId = productDoc.category?._id?.toString();
  const candidates = [];
  const maybePush = (off) => off && candidates.push(off);
  maybePush(productOfferMap.get(prodId));
  maybePush(categoryOfferMap.get(catId));

  if (candidates.length === 0) {
    return { effectivePrice: productDoc.price, appliedOffer: null, discountPercent: 0, discountAmount: 0 };
  }

  // Compute absolute saving for each candidate
  const withSavings = candidates.map(o => {
    const percentSave = o.percentage ? (productDoc.price * o.percentage) / 100 : 0;
    const amountSave = o.amount || 0;

    // choose whichever yields larger monetary saving
    return { offer: o, save: Math.max(percentSave, amountSave) };
  });

  // pick the offer with greatest monetary saving
  const best = withSavings.reduce((a, b) => (b.save > a.save ? b : a));

  const rawDiscount = best.save;

  // Cap discount so that it never exceeds item price
  const discountAmount = Math.min(rawDiscount, productDoc.price);

  // Price after discount (never < 0)
  const effectivePrice = Number((productDoc.price - discountAmount).toFixed(2));

  // Percentage saving realised
  const discountPercent = Number(((discountAmount / productDoc.price) * 100).toFixed(2));

  // Return adjusted offer details for UI badges
  const appliedOffer = {
    _id: best.offer._id,
    type: best.offer.type,
    amount: discountAmount,
    percentage: best.offer.percentage ? discountPercent : undefined,
    // isActive:best.offer.isActive,
    
  };

  return { effectivePrice, appliedOffer, discountPercent, discountAmount };
};
