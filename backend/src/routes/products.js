const express = require('express');
const router = express.Router();

/**
 * @route   GET /products
 * @desc    Get all products with their variants
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const db = req.db;
    
    // Get all products
    const products = await db('products').select('*');
    
    // Get variants for all products
    const productIds = products.map(product => product.id);
    
    if (productIds.length > 0) {
      const variants = await db('product_variants')
        .whereIn('product_id', productIds)
        .select('*');
      
      // Group variants by product_id
      const variantsByProductId = variants.reduce((acc, variant) => {
        if (!acc[variant.product_id]) {
          acc[variant.product_id] = [];
        }
        acc[variant.product_id].push(variant);
        return acc;
      }, {});
      
      // Add variants to each product
      const productsWithVariants = products.map(product => ({
        ...product,
        variants: variantsByProductId[product.id] || []
      }));
      
      return res.json(productsWithVariants);
    }
    
    // Return products with empty variants array if no products found
    return res.json(products.map(product => ({ ...product, variants: [] })));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /products/:id
 * @desc    Get a product by ID with its variants
 * @access  Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = req.db;
    
    // Get product by ID
    const product = await db('products').where({ id }).first();
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Get variants for this product
    const variants = await db('product_variants')
      .where({ product_id: id })
      .select('*');
    
    return res.json({
      ...product,
      variants
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 