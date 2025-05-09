const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const knex = require('knex');
const knexConfig = require('../knexfile');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  try {
    // Check if the path exists and is valid
    let serviceAccount;
    try {
      const fs = require('fs');
      const path = require('path');
      const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      
      if (!fs.existsSync(serviceAccountPath)) {
        console.error('Firebase service account file not found');
        console.error('Path specified was:', serviceAccountPath);
        console.error('Make sure the path is correct and the file exists');
        process.exit(1);
      }
      
      serviceAccount = require(serviceAccountPath);
      console.log('Successfully loaded Firebase service account from:', serviceAccountPath);
    } catch (error) {
      console.error('Error loading Firebase service account file:', error.message);
      if (error.code === 'MODULE_NOT_FOUND') {
        console.error('Require stack:');
        console.error(error.requireStack);
      }
      console.error('Path specified was:', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      console.error('Make sure the path is correct and the file exists');
      process.exit(1);
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    process.exit(1);
  }
} else {
  console.error('FIREBASE_SERVICE_ACCOUNT_PATH not set in environment variables');
  process.exit(1);
}

// Initialize Express app
const app = express();

// Initialize database connection
const environment = process.env.NODE_ENV || 'development';
const db = knex(knexConfig[environment]);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make db available in request object
app.use((req, res, next) => {
  req.db = db;
  req.admin = admin;
  next();
});

// Import routes
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

// Use routes
app.use('/products', productsRoutes);
app.use('/orders', ordersRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('E-commerce API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // Export for testing 