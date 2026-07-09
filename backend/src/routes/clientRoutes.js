const express = require('express');
const router = express.Router();
const {
  getMyInvoices,
  getMyInvoiceById,
  getMyPayments,
  payInvoice,
  downloadMyInvoicePDF,
  getClientDashboard
} = require('../controllers/clientController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { paymentValidator } = require('../validators/validators');

// Restrict all routes in this file to authorized clients
router.use(protect);
router.use(authorize('client'));

// Client metrics dashboard
router.get('/dashboard', getClientDashboard);

// Invoice routing
router.get('/invoices', getMyInvoices);
router.get('/invoices/:id', getMyInvoiceById);
router.get('/invoices/:id/pdf', downloadMyInvoicePDF);

// Payments routing
router.get('/payments', getMyPayments);
router.post('/pay', paymentValidator, payInvoice);

module.exports = router;
