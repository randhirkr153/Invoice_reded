const path = require('path');
// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = require('./app');
const connectDB = async () => {
  const connect = require('./config/db');
  await connect();
};

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Listen on PORT
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections gracefully
  process.on('unhandledRejection', (err, promise) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
};

startServer();
