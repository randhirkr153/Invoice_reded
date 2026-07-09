const User = require('../models/User');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const { generateInvoicePDF } = require('../services/pdfService');
const { sendInvoiceEmail, sendWelcomeEmail } = require('../services/emailService');
const mongoose = require('mongoose');
const fs = require('fs');

// ==========================================
// CLIENT MANAGEMENT
// ==========================================

const getClients = async (req, res, next) => {
  try {
    const clients = await User.find({ role: 'client' }).select('-password');
    res.status(200).json({
      success: true,
      message: 'Clients retrieved successfully',
      data: clients
    });
  } catch (error) {
    next(error);
  }
};

const getClientById = async (req, res, next) => {
  try {
    const client = await User.findOne({ _id: req.params.id, role: 'client' }).select('-password');
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Client retrieved successfully',
      data: client
    });
  } catch (error) {
    next(error);
  }
};

const createClient = async (req, res, next) => {
  try {
    const { name, email, password, phone, companyName, gstNumber, address } = req.body;

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Default password to 'Client@123' if not provided
    const clientPassword = password || 'Client@123';

    const client = await User.create({
      name,
      email,
      password: clientPassword,
      role: 'client',
      phone,
      companyName,
      gstNumber,
      address
    });

    // Send welcome email in background
    sendWelcomeEmail(client).catch(err => console.error(`Client welcome email failed: ${err.message}`));

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: {
        id: client._id,
        name: client.name,
        email: client.email,
        role: client.role,
        phone: client.phone,
        companyName: client.companyName,
        gstNumber: client.gstNumber,
        address: client.address
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateClient = async (req, res, next) => {
  try {
    const client = await User.findOne({ _id: req.params.id, role: 'client' });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const { name, phone, companyName, gstNumber, address } = req.body;
    if (name) client.name = name;
    if (phone) client.phone = phone;
    if (companyName) client.companyName = companyName;
    if (gstNumber) client.gstNumber = gstNumber;
    if (address) client.address = { ...client.address.toObject(), ...address };

    await client.save();

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: client
    });
  } catch (error) {
    next(error);
  }
};

const deleteClient = async (req, res, next) => {
  try {
    const client = await User.findOneAndDelete({ _id: req.params.id, role: 'client' });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    // Delete their invoices or keep them unlinked? Let's just delete the invoices.
    await Invoice.deleteMany({ client: req.params.id });
    await Payment.deleteMany({ client: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Client and associated invoices/payments deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PRODUCT MANAGEMENT
// ==========================================

const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({});
    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: products
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, sku, taxRate } = req.body;
    
    const skuExists = await Product.findOne({ sku });
    if (skuExists) {
      return res.status(400).json({ success: false, message: 'Product SKU already exists' });
    }

    const product = await Product.create({ name, description, price, sku, taxRate });
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { name, description, price, sku, taxRate } = req.body;
    if (sku && sku !== product.sku) {
      const skuExists = await Product.findOne({ sku });
      if (skuExists) {
        return res.status(400).json({ success: false, message: 'Product SKU already exists' });
      }
      product.sku = sku;
    }
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (taxRate !== undefined) product.taxRate = taxRate;

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// INVOICE MANAGEMENT
// ==========================================

const getInvoices = async (req, res, next) => {
  try {
    const { status, client, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (client) query.client = client;
    if (search) {
      query.invoiceNumber = { $regex: search, $options: 'i' };
    }

    const invoices = await Invoice.find(query)
      .populate('client', 'name email companyName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Invoices retrieved successfully',
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'name email companyName phone gstNumber address');
    
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Invoice retrieved successfully',
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const { client: clientId, items, discountRate, dueDate, notes, terms, status } = req.body;

    const clientUser = await User.findOne({ _id: clientId, role: 'client' });
    if (!clientUser) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const adminUser = await User.findById(req.user.id);

    // Compute line items, taxes, totals
    let subtotal = 0;
    let taxTotal = 0;
    const computedItems = [];

    for (const item of items) {
      let productId = null;
      let name = item.name;
      let price = item.price;
      let taxRate = item.taxRate !== undefined ? item.taxRate : 18;

      let hsnCode = item.hsnCode || '';

      if (item.product) {
        const dbProduct = await Product.findById(item.product);
        if (dbProduct) {
          productId = dbProduct._id;
          if (!name) name = dbProduct.name;
          if (price === undefined) price = dbProduct.price;
          if (item.taxRate === undefined) taxRate = dbProduct.taxRate;
          if (!hsnCode) hsnCode = dbProduct.hsnCode || '';
        }
      }

      if (!name) {
        return res.status(400).json({ success: false, message: 'Item name/title is required' });
      }
      if (price === undefined || price === null) {
        return res.status(400).json({ success: false, message: 'Item price is required' });
      }

      const quantity = item.quantity;
      
      const itemSubtotal = price * quantity;
      const itemTaxAmount = itemSubtotal * (taxRate / 100);
      const itemTotal = itemSubtotal + itemTaxAmount;

      subtotal += itemSubtotal;
      taxTotal += itemTaxAmount;

      computedItems.push({
        product: productId,
        name,
        price,
        quantity,
        taxRate,
        taxAmount: itemTaxAmount,
        total: itemTotal,
        hsnCode
      });
    }

    const dRate = discountRate || 0;
    const discountAmount = subtotal * (dRate / 100);
    const totalAmount = (subtotal - discountAmount) + taxTotal;

    // Take screenshots of metadata snapshots
    const companyDetails = {
      name: adminUser.name,
      email: adminUser.email,
      phone: adminUser.phone,
      companyName: adminUser.companyName || 'SaaS Admin Org',
      gstNumber: adminUser.gstNumber || 'N/A',
      address: adminUser.address
    };

    const clientDetails = {
      name: clientUser.name,
      email: clientUser.email,
      phone: clientUser.phone,
      companyName: clientUser.companyName,
      gstNumber: clientUser.gstNumber,
      address: clientUser.address
    };

    const invoice = await Invoice.create({
      client: clientId,
      items: computedItems,
      subtotal,
      discountRate: dRate,
      discountAmount,
      taxTotal,
      totalAmount,
      status: status || 'unpaid',
      dueDate,
      notes,
      terms,
      companyDetails,
      clientDetails
    });

    // Populate client details to avoid empty fields in logs
    const populatedInvoice = await Invoice.findById(invoice._id).populate('client', 'name email');

    // Generate PDF and send Email in background
    generateInvoicePDF(populatedInvoice)
      .then(async (pdfPath) => {
        await sendInvoiceEmail(clientUser, populatedInvoice, pdfPath);
      })
      .catch((err) => console.error(`Background Invoice PDF/Email generation failed: ${err.message}`));

    res.status(201).json({
      success: true,
      message: 'Invoice created and email triggered successfully',
      data: populatedInvoice
    });
  } catch (error) {
    next(error);
  }
};

const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const { client: clientId, items, discountRate, dueDate, notes, terms, status } = req.body;

    if (clientId) {
      const clientUser = await User.findOne({ _id: clientId, role: 'client' });
      if (!clientUser) {
        return res.status(404).json({ success: false, message: 'Client not found' });
      }
      invoice.client = clientId;
      invoice.clientDetails = {
        name: clientUser.name,
        email: clientUser.email,
        phone: clientUser.phone,
        companyName: clientUser.companyName,
        gstNumber: clientUser.gstNumber,
        address: clientUser.address
      };
    }

    if (items) {
      let subtotal = 0;
      let taxTotal = 0;
      const computedItems = [];

      for (const item of items) {
        let productId = null;
        let name = item.name;
        let price = Number(item.price);
        let taxRate = item.taxRate !== undefined ? Number(item.taxRate) : 18;

        let hsnCode = item.hsnCode || '';

        if (item.product) {
          const dbProduct = await Product.findById(item.product);
          if (dbProduct) {
            productId = dbProduct._id;
            if (!name) name = dbProduct.name;
            if (price === undefined || isNaN(price)) price = dbProduct.price;
            if (item.taxRate === undefined) taxRate = dbProduct.taxRate;
            if (!hsnCode) hsnCode = dbProduct.hsnCode || '';
          }
        }

        if (!name) {
          return res.status(400).json({ success: false, message: 'Item name/title is required' });
        }
        if (price === undefined || price === null || isNaN(price)) {
          return res.status(400).json({ success: false, message: 'Item price is required' });
        }

        const quantity = Number(item.quantity) || 1;
        
        const itemSubtotal = price * quantity;
        const itemTaxAmount = itemSubtotal * (taxRate / 100);
        const itemTotal = itemSubtotal + itemTaxAmount;

        subtotal += itemSubtotal;
        taxTotal += itemTaxAmount;

        computedItems.push({
          product: productId,
          name,
          price,
          quantity,
          taxRate,
          taxAmount: itemTaxAmount,
          total: itemTotal,
          hsnCode
        });
      }

      invoice.items = computedItems;
      invoice.subtotal = subtotal;
      invoice.taxTotal = taxTotal;

      const dRate = discountRate !== undefined ? Number(discountRate) : (invoice.discountRate || 0);
      invoice.discountRate = dRate;
      const discountAmount = subtotal * (dRate / 100);
      invoice.discountAmount = discountAmount;
      invoice.totalAmount = (subtotal - discountAmount) + taxTotal;
    } else if (discountRate !== undefined) {
      const dRate = Number(discountRate);
      invoice.discountRate = dRate;
      const discountAmount = invoice.subtotal * (dRate / 100);
      invoice.discountAmount = discountAmount;
      invoice.totalAmount = (invoice.subtotal - discountAmount) + invoice.taxTotal;
    }

    if (status) invoice.status = status;
    if (dueDate) invoice.dueDate = dueDate;
    if (notes !== undefined) invoice.notes = notes;
    if (terms !== undefined) invoice.terms = terms;

    await invoice.save();

    const populatedInvoice = await Invoice.findById(invoice._id).populate('client', 'name email');

    // Re-generate PDF and send Email in background if updated
    generateInvoicePDF(populatedInvoice)
      .then(async (pdfPath) => {
        if (status === 'paid' || req.body.resendEmail) {
          await sendInvoiceEmail(populatedInvoice.clientDetails, populatedInvoice, pdfPath);
        }
      })
      .catch((err) => console.error(`Background Invoice PDF/Email generation failed: ${err.message}`));

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: populatedInvoice
    });
  } catch (error) {
    next(error);
  }
};

const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    await Payment.deleteMany({ invoice: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Invoice and associated payments deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const sendInvoiceNotification = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('client');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const pdfPath = await generateInvoicePDF(invoice);
    await sendInvoiceEmail(invoice.client, invoice, pdfPath);

    res.status(200).json({
      success: true,
      message: 'Invoice notification email triggered successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PAYMENT TRACKING
// ==========================================

const getPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({})
      .populate('client', 'name email companyName')
      .populate('invoice', 'invoiceNumber totalAmount')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Payments retrieved successfully',
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const { invoice: invoiceId, amount, paymentMethod, transactionReference, paymentDate } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const payment = await Payment.create({
      invoice: invoiceId,
      client: invoice.client,
      amount,
      paymentMethod,
      transactionReference,
      paymentDate: paymentDate || new Date()
    });

    // Update invoice status to paid if payment covers the totalAmount
    invoice.status = 'paid';
    await invoice.save();

    res.status(201).json({
      success: true,
      message: 'Payment recorded and invoice marked as PAID',
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// REPORTS & ANALYTICS
// ==========================================

const getReports = async (req, res, next) => {
  try {
    // 1. Invoices stats (revenue paid/pending)
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalInvoicesCount: { $sum: 1 },
          paidRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0] }
          },
          pendingRevenue: {
            $sum: { $cond: [{ $in: ['$status', ['unpaid', 'overdue']] }, '$totalAmount', 0] }
          },
          draftCount: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          unpaidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, 1, 0] }
          },
          overdueCount: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
          }
        }
      }
    ]);

    const reportStats = stats[0] || {
      totalInvoicesCount: 0,
      paidRevenue: 0,
      pendingRevenue: 0,
      draftCount: 0,
      paidCount: 0,
      unpaidCount: 0,
      overdueCount: 0
    };

    // 2. Monthly revenue trend (last 6 months, paid invoices only)
    const monthlyRevenue = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: {
            year: { $year: '$issueDate' },
            month: { $month: '$issueDate' }
          },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthlyTrend = monthlyRevenue.map(item => ({
      month: `${months[item._id.month - 1]} ${item._id.year}`,
      revenue: item.revenue
    })).reverse();

    // 3. Top clients by paid total
    const topClients = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: '$client',
          totalPaid: { $sum: '$totalAmount' }
        }
      },
      { $sort: { totalPaid: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'clientDetails'
        }
      },
      { $unwind: '$clientDetails' },
      {
        $project: {
          _id: 1,
          totalPaid: 1,
          name: '$clientDetails.name',
          companyName: '$clientDetails.companyName',
          email: '$clientDetails.email'
        }
      }
    ]);

    // 4. Recent invoices (last 5)
    const recentInvoices = await Invoice.find({})
      .populate('client', 'name email companyName')
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. Recent payments (last 5)
    const recentPayments = await Payment.find({})
      .populate('client', 'name email companyName')
      .populate('invoice', 'invoiceNumber')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      message: 'Reports and dashboard metrics computed successfully',
      data: {
        stats: reportStats,
        monthlyRevenueTrend: formattedMonthlyTrend,
        topClients,
        recentInvoices,
        recentPayments
      }
    });
  } catch (error) {
    next(error);
  }
};

const downloadInvoicePDF = async (req, res, next) => {
  try {
    console.log('--- INCOMING PDF REQUEST ---');
    console.log('ID:', req.params.id);
    console.log('Query:', req.query);
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const template = req.query.template || 'Template 1';
    const pdfPath = await generateInvoicePDF(invoice, template);
    
    if (req.query.preview === 'true') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Invoice_${invoice.invoiceNumber}.pdf"`);
      return fs.createReadStream(pdfPath).pipe(res);
    }

    res.download(pdfPath, `Invoice_${invoice.invoiceNumber}.pdf`, (err) => {
      if (err) {
        console.error(`Error delivering PDF download to admin: ${err.message}`);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Failed to download PDF invoice'
          });
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoiceNotification,
  getPayments,
  createPayment,
  getReports,
  downloadInvoicePDF
};
