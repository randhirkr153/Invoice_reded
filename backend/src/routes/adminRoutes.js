const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { 
  clientValidator, 
  productValidator, 
  invoiceValidator, 
  paymentValidator 
} = require('../validators/validators');

// Restrict all routes in this file to authorized admins
router.use(protect);
router.use(authorize('admin'));

// Reports & Analytics dashboard metrics
router.get('/reports', getReports);

// Client management CRUD
router.get('/clients', getClients);
router.get('/clients/:id', getClientById);
router.post('/clients', clientValidator, createClient);
router.put('/clients/:id', clientValidator, updateClient);
router.delete('/clients/:id', deleteClient);

// Product management CRUD
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.post('/products', productValidator, createProduct);
router.put('/products/:id', productValidator, updateProduct);
router.delete('/products/:id', deleteProduct);

// Invoice management CRUD
router.get('/invoices', getInvoices);
router.get('/invoices/:id', getInvoiceById);
router.post('/invoices', invoiceValidator, createInvoice);
router.put('/invoices/:id', updateInvoice);
router.delete('/invoices/:id', deleteInvoice);
router.get('/invoices/:id/pdf', downloadInvoicePDF);
router.post('/invoices/:id/send', sendInvoiceNotification);

// Payments tracking
router.get('/payments', getPayments);
router.post('/payments', paymentValidator, createPayment);

module.exports = router;
