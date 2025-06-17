import { body } from 'express-validator';

export const couponValidationRules = [
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
    .withMessage('Minimum purchase amount must be 0 or greater'),

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
    .withMessage('Invalid start date format. Use ISO 8601 format (YYYY-MM-DD)')
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();

      // Set both dates to midnight (00:00:00)
      inputDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (inputDate < today) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),

  body('expiryDate')
    .isISO8601()
    .withMessage('Invalid expiry date format. Use ISO 8601 format (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('Expiry date must be after start date');
      }
      return true;
    }),

  body('maxUses')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max uses must be a positive integer'),
];

export const validateCouponRules = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required'),
  
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a valid number'),
];
