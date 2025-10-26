import { body } from 'express-validator';

// --- refactor: separate create & update rules + normalize dates ---
export const couponCreateValidationRules = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required')
    .isLength({ min: 4, max: 20 })
    .withMessage('Coupon code must be between 4 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Coupon code can only contain uppercase letters and numbers'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('discountType')
    .isIn(['percentage', 'fixed'])
    .withMessage('Invalid discount type. Must be either percentage or fixed'),

  body('discountValue')
    .isFloat({ gt: 0 })
    .withMessage('Discount value must be greater than 0')
    .custom((value, { req }) => {
      if (req.body.discountType === 'percentage' && value > 100) {
        throw new Error('Percentage discount cannot exceed 100%');
      }
      return true;
    }),

  body('minPurchaseAmount')
    .isFloat({ min: 0 })
    .withMessage('Minimum purchase amount must be 0 or greater')
    .custom((value, { req }) => {
      // For fixed discount coupons, minimum purchase should be greater than discount value
      if (req.body.discountType === 'fixed' && parseFloat(value) <= parseFloat(req.body.discountValue)) {
        throw new Error('Minimum purchase amount must be greater than the coupon discount value');
      }
      return true;
    }),

  body('maxDiscountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max discount amount must be 0 or greater')
    .custom((value, { req }) => {
      if (req.body.discountType === 'percentage' && !value) {
        throw new Error('Max discount amount is required for percentage discounts');
      }
      return true;
    }),

  body('startDate')
    .isISO8601()
    .withMessage('Invalid start date format. Use YYYY-MM-DD')
    .custom((value) => {
      const input = new Date(value);
      const today = new Date();
      // Compare by date only (ignore time) so coupons become valid from 00:00 local time
      input.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (input < today) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),

  body('expiryDate')
    .isISO8601()
    .withMessage('Invalid expiry date format. Use YYYY-MM-DD')
    .custom((value, { req }) => {
      return new Date(value) > new Date(req.body.startDate);
    }),

  body('maxUses')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max uses must be a positive integer'),
];

export const couponUpdateValidationRules = [
  body('code').optional().trim().isLength({ min: 4, max: 20 }).matches(/^[A-Z0-9]+$/),
  body('description').optional().trim().isLength({ max: 500 }),
  body('discountType').optional().isIn(['percentage', 'fixed']),
  body('discountValue').optional().isFloat({ gt: 0 }),
  body('minPurchaseAmount')
    .optional()
    .isFloat({ min: 0 })
    .custom((value, { req }) => {
      // For fixed discount coupons, minimum purchase should be greater than discount value
      if (req.body.discountType === 'fixed' && value && req.body.discountValue && parseFloat(value) <= parseFloat(req.body.discountValue)) {
        throw new Error('Minimum purchase amount must be greater than the coupon discount value');
      }
      return true;
    }),
  body('maxDiscountAmount').optional().isFloat({ min: 0 }),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format. Use YYYY-MM-DD'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiry date format. Use YYYY-MM-DD')
    .custom((value, { req }) => {
      if (req.body.startDate) {
        return new Date(value) > new Date(req.body.startDate);
      }
      return true;
    }),
  body('maxUses').optional().isInt({ min: 1 }),
];

// keep original export names for backward compatibility
export { couponCreateValidationRules as couponValidationRules };

export const validateCouponRules = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required'),

  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a valid number'),
];
