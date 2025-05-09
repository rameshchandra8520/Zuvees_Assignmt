const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const knex = require('knex');
const knexConfig = require('./knexfile');
const admin = require('firebase-admin');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection with Knex
const environment = process.env.NODE_ENV || 'development';
const db = knex({
  ...knexConfig[environment],
  pool: {
    min: 2,
    max: 10,
    createTimeoutMillis: 3000,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
    propagateCreateError: false
  }
});

// Handle database connection errors
db.raw('SELECT 1')
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

// Make the db instance available to routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Firebase Admin initialization
admin.initializeApp({
  credential: admin.credential.cert(require('./firebase-service-account.json')),
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

// Routes
app.get('/', (req, res) => {
  res.send('E-commerce API is running');
});

// API routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await db('products').select('*');
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db('products').where({ id: req.params.id }).first();
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const variants = await db('product_variants').where({ product_id: req.params.id });
    
    res.json({
      ...product,
      variants
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 