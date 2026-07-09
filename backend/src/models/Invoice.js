const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  taxRate: { type: Number, default: 18, min: 0 },
  taxAmount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  hsnCode: { type: String, default: '' }
}, { _id: false });

const detailsSnapshotSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  companyName: { type: String, default: '' },
  gstNumber: { type: String, default: '' },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' },
    country: { type: String, default: '' }
  }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client reference is required']
  },
  items: {
    type: [invoiceItemSchema],
    validate: [v => Array.isArray(v) && v.length > 0, 'Invoice must contain at least one item']
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discountRate: {
    type: Number,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  taxTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'unpaid', 'paid', 'overdue', 'cancelled'],
    default: 'unpaid'
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  notes: {
    type: String,
    default: ''
  },
  terms: {
    type: String,
    default: ''
  },
  companyDetails: {
    type: detailsSnapshotSchema,
    default: () => ({})
  },
  clientDetails: {
    type: detailsSnapshotSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ client: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ issueDate: -1 });

// Pre-save hook to generate automatic invoice number sequence
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    try {
      const year = new Date().getFullYear();
      // Find the last invoice created in this year to get the sequential counter
      const lastInvoice = await this.constructor.findOne({
        invoiceNumber: new RegExp(`^INV-${year}-`)
      }).sort({ createdAt: -1 });

      let nextNumber = 1;
      if (lastInvoice && lastInvoice.invoiceNumber) {
        const parts = lastInvoice.invoiceNumber.split('-');
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) {
          nextNumber = lastSeq + 1;
        }
      }

      this.invoiceNumber = `INV-${year}-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
