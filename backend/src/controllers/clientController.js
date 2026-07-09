const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const { generateInvoicePDF } = require('../services/pdfService');

/**
 * @desc    Get all invoices for the logged-in client
 * @route   GET /api/client/invoices
 * @access  Private (Client only)
 */
const getMyInvoices = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = { client: req.user.id };

    if (status) {
      query.status = status;
    }

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'My invoices retrieved successfully',
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get details of a specific client invoice
 * @route   GET /api/client/invoices/:id
 * @access  Private (Client only)
 */
const getMyInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, client: req.user.id });
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found or unauthorized'
      });
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

/**
 * @desc    Get all payment records for the logged-in client
 * @route   GET /api/client/payments
 * @access  Private (Client only)
 */
const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ client: req.user.id })
      .populate('invoice', 'invoiceNumber totalAmount')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'My payments history retrieved successfully',
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mock paying an invoice
 * @route   POST /api/client/pay
 * @access  Private (Client only)
 */
const payInvoice = async (req, res, next) => {
  try {
    const { invoice: invoiceId, paymentMethod, transactionReference, amount } = req.body;

    // Verify invoice belongs to the client and is unpaid
    const invoice = await Invoice.findOne({ _id: invoiceId, client: req.user.id });
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found or unauthorized'
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already paid'
      });
    }

    // Create payment entry
    const payment = await Payment.create({
      invoice: invoiceId,
      client: req.user.id,
      amount: amount || invoice.totalAmount,
      paymentMethod,
      transactionReference: transactionReference || `TXN-MOCK-${Date.now()}`
    });

    // Mark invoice status as paid
    invoice.status = 'paid';
    await invoice.save();

    res.status(201).json({
      success: true,
      message: 'Mock payment processed successfully and invoice marked as PAID',
      data: {
        payment,
        invoice
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download own invoice as PDF
 * @route   GET /api/client/invoices/:id/pdf
 * @access  Private (Client only)
 */
const downloadMyInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, client: req.user.id });
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found or unauthorized'
      });
    }

    // Generate or fetch PDF
    const pdfPath = await generateInvoicePDF(invoice);
    
    // Send file to client
    res.download(pdfPath, `Invoice_${invoice.invoiceNumber}.pdf`, (err) => {
      if (err) {
        console.error(`Error delivering PDF download: ${err.message}`);
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

/**
 * @desc    Get dashboard metrics for client
 * @route   GET /api/client/dashboard
 * @access  Private (Client only)
 */
const getClientDashboard = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ client: req.user.id });
    
    let totalInvoices = invoices.length;
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let overdueCount = 0;

    const now = new Date();

    invoices.forEach(inv => {
      if (inv.status === 'paid') {
        paidAmount += inv.totalAmount;
        paidCount++;
      } else if (inv.status === 'overdue' || (inv.status === 'unpaid' && new Date(inv.dueDate) < now)) {
        overdueAmount += inv.totalAmount;
        overdueCount++;
      } else {
        pendingAmount += inv.totalAmount;
        unpaidCount++;
      }
    });

    const recentInvoices = await Invoice.find({ client: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentPayments = await Payment.find({ client: req.user.id })
      .populate('invoice', 'invoiceNumber')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      message: 'Client dashboard statistics computed successfully',
      data: {
        stats: {
          totalInvoices,
          paidAmount,
          pendingAmount,
          overdueAmount,
          paidCount,
          unpaidCount,
          overdueCount
        },
        recentInvoices,
        recentPayments
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyInvoices,
  getMyInvoiceById,
  getMyPayments,
  payInvoice,
  downloadMyInvoicePDF,
  getClientDashboard
};
