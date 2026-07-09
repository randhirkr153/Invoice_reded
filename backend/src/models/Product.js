const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  sku: {
    type: String,
    required: [true, 'Product SKU is required'],
    unique: true,
    trim: true
  },
  taxRate: {
    type: Number,
    default: 18, // standard GST rate of 18%
    min: [0, 'Tax rate cannot be negative']
  },
  hsnCode: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

productSchema.index({ sku: 1 });
productSchema.index({ name: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
