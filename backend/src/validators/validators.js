const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Middleware to run validations and return formatted errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Input validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

const loginValidator = [
  body('email')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate
];

const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name must be less than 50 characters'),
  body('email')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['admin', 'client']).withMessage('Role must be either admin or client'),
  validate
];

const clientValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Client name is required'),
  body('email')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim(),
  body('companyName')
    .optional()
    .trim(),
  body('gstNumber')
    .optional()
    .trim(),
  body('address')
    .optional()
    .isObject().withMessage('Address must be an object'),
  body('address.street')
    .optional()
    .trim(),
  body('address.city')
    .optional()
    .trim(),
  body('address.state')
    .optional()
    .trim(),
  body('address.zip')
    .optional()
    .trim(),
  body('address.country')
    .optional()
    .trim(),
  validate
];

const productValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required'),
  body('sku')
    .trim()
    .notEmpty().withMessage('Product SKU/Code is required'),
  body('price')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('taxRate')
    .optional()
    .isFloat({ min: 0 }).withMessage('Tax rate must be a non-negative number'),
  body('hsnCode')
    .optional()
    .trim(),
  validate
];

const invoiceValidator = [
  body('client')
    .notEmpty().withMessage('Client reference ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid client ID format'),
  body('dueDate')
    .notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Due date must be a valid ISO8601 date'),
  body('items')
    .isArray({ min: 1 }).withMessage('Invoice items must be a non-empty array'),
  body('items.*.product')
    .optional({ checkFalsy: true })
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid item product ID format'),
  body('items.*.name')
    .notEmpty().withMessage('Item name/title is required')
    .trim(),
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('Quantity must be an integer greater than 0'),
  body('items.*.price')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('items.*.taxRate')
    .optional()
    .isFloat({ min: 0 }).withMessage('Item tax rate must be a non-negative number'),
  body('items.*.hsnCode')
    .optional()
    .trim(),
  body('discountRate')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Discount rate must be between 0 and 100'),
  body('notes')
    .optional()
    .trim(),
  body('terms')
    .optional()
    .trim(),
  validate
];

const paymentValidator = [
  body('invoice')
    .notEmpty().withMessage('Invoice ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid invoice ID format'),
  body('amount')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than zero'),
  body('paymentMethod')
    .isIn(['card', 'bank_transfer', 'cash', 'upi', 'other'])
    .withMessage('Payment method must be card, bank_transfer, cash, upi, or other'),
  body('transactionReference')
    .optional()
    .trim(),
  validate
];

module.exports = {
  loginValidator,
  registerValidator,
  clientValidator,
  productValidator,
  invoiceValidator,
  paymentValidator
};
