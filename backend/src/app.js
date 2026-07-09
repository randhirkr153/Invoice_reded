const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const { apiLimiter } = require('./middlewares/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const clientRoutes = require('./routes/clientRoutes');

const app = express();

// Set security headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading assets/PDFs if needed from server
}));

// Setup CORS with credentials support (cookies)
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'], // Admin and Client panel dev servers
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate limit all requests
app.use('/api', apiLimiter);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser for refresh token
app.use(cookieParser());

// Sanitize inputs against MongoDB injection queries
app.use(mongoSanitize());

// Serve generated invoices statically if required (e.g., local tests)
app.use('/temp/invoices', express.static(path.join(__dirname, '..', 'temp', 'invoices')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the SaaS Invoice Management System API'
  });
});

// Fallback middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
