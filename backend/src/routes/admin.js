const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');

/**
 * @route   GET /admin/orders
 * @desc    Get all orders (admin only)
 * @access  Private (admin only)
 */
router.get('/orders', auth, authorize(['admin']), async (req, res, next) => {
  try {
    const db = req.db;
    
    // Get all orders with user info
    const orders = await db('orders')
      .join('users', 'orders.user_id', '=', 'users.id')
      .select(
        'orders.*',
        'users.email as user_email'
      )
      .orderBy('orders.created_at', 'desc');
    
    // Get all order items
    const orderIds = orders.map(order => order.id);
    
    if (orderIds.length > 0) {
      // Get order items with product information
      const orderItems = await db('order_items')
        .whereIn('order_id', orderIds)
        .leftJoin('products', 'order_items.product_id', 'products.id')
        .leftJoin('product_variants', 'order_items.variant_id', 'product_variants.id')
        .select(
          'order_items.*',
          'products.name as product_name',
          'products.image as product_image',
          'products.price as product_price',
          'product_variants.color as variant_color',
          'product_variants.size as variant_size'
        );
      
      // Get rider assignments
      const riderAssignments = await db('order_riders')
        .whereIn('order_id', orderIds)
        .join('riders', 'order_riders.rider_id', '=', 'riders.id')
        .select(
          'order_riders.order_id',
          'order_riders.rider_id',
          'riders.name as rider_name',
          'riders.email as rider_email'
        );
      
      // Group items by order_id
      const itemsByOrderId = orderItems.reduce((acc, item) => {
        if (!acc[item.order_id]) {
          acc[item.order_id] = [];
        }
        // Format the item with product and variant info
        acc[item.order_id].push({
          id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          product: {
            id: item.product_id,
            name: item.product_name,
            image: item.product_image,
            price: item.product_price
          },
          variant: item.variant_id ? {
            id: item.variant_id,
            color: item.variant_color,
            size: item.variant_size
          } : null
        });
        return acc;
      }, {});
      
      // Group rider assignments by order_id
      const ridersByOrderId = riderAssignments.reduce((acc, assignment) => {
        acc[assignment.order_id] = {
          rider_id: assignment.rider_id,
          rider_name: assignment.rider_name,
          rider_email: assignment.rider_email
        };
        return acc;
      }, {});
      
      // Add items and rider info to each order
      const ordersWithDetails = orders.map(order => ({
        ...order,
        items: itemsByOrderId[order.id] || [],
        rider: ridersByOrderId[order.id] || null
      }));
      
      return res.json(ordersWithDetails);
    }
    
    // Return orders with empty items array if no orders found
    return res.json(orders.map(order => ({ 
      ...order, 
      items: [],
      rider: null
    })));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /admin/orders/:id/status
 * @desc    Update order status (admin only)
 * @access  Private (admin only)
 */
router.patch('/orders/:id/status', auth, authorize(['admin']), async (req, res, next) => {
  try {
    const db = req.db;
    const { id } = req.params;
    const { status, rider_id } = req.body;
    
    // Validate input
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Check if order exists
    const order = await db('orders').where({ id }).first();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Start a transaction
    await db.transaction(async trx => {
      // Update order status
      await trx('orders')
        .where({ id })
        .update({ 
          status,
          updated_at: db.fn.now()
        });
      
      // If status is Shipped and rider_id is provided, assign rider
      if (status === 'Shipped' && rider_id) {
        // Check if rider exists
        const rider = await trx('riders').where({ id: rider_id }).first();
        if (!rider) {
          throw new Error('Rider not found');
        }
        
        // Delete any existing rider assignments
        await trx('order_riders')
          .where({ order_id: id })
          .del();
        
        // Create new rider assignment
        await trx('order_riders')
          .insert({
            order_id: id,
            rider_id,
            created_at: db.fn.now(),
            updated_at: db.fn.now()
          });
      }
    });
    
    // Get updated order with rider info
    const updatedOrder = await db('orders')
      .where({ id })
      .first();
    
    // Get rider info if assigned
    if (rider_id) {
      const riderInfo = await db('riders')
        .where({ id: rider_id })
        .select('id', 'name', 'email')
        .first();
      
      if (riderInfo) {
        Object.assign(updatedOrder, {
          rider_id: riderInfo.id,
          rider_name: riderInfo.name,
          rider_email: riderInfo.email
        });
      }
    }
    
    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /admin/riders
 * @desc    Get all riders (admin only)
 * @access  Private (admin only)
 */
router.get('/riders', auth, authorize(['admin']), async (req, res, next) => {
  try {
    const db = req.db;
    
    // Get all riders
    const riders = await db('riders')
      .select('*')
      .orderBy('name');
    
    // Get assigned order counts for each rider
    const riderIds = riders.map(rider => rider.id);
    
    if (riderIds.length > 0) {
      const assignmentCounts = await db('order_riders')
        .whereIn('rider_id', riderIds)
        .select('rider_id')
        .count('order_id as assigned_orders_count')
        .groupBy('rider_id');
      
      // Create a map of rider_id to assignment count
      const countMap = assignmentCounts.reduce((acc, item) => {
        acc[item.rider_id] = parseInt(item.assigned_orders_count);
        return acc;
      }, {});
      
      // Add count to each rider
      const ridersWithCounts = riders.map(rider => ({
        ...rider,
        assigned_orders_count: countMap[rider.id] || 0
      }));
      
      return res.json(ridersWithCounts);
    }
    
    // Add zero counts if no riders or no assignments
    return res.json(riders.map(rider => ({
      ...rider,
      assigned_orders_count: 0
    })));
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /admin/riders/:id/orders
 * @desc    Get orders assigned to a specific rider (admin only)
 * @access  Private (admin only)
 */
router.get('/riders/:id/orders', auth, authorize(['admin']), async (req, res, next) => {
  try {
    const db = req.db;
    const { id } = req.params;
    
    // Check if rider exists
    const rider = await db('riders').where({ id }).first();
    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    
    // Get all orders assigned to this rider
    const assignedOrders = await db('order_riders')
      .where('rider_id', id)
      .join('orders', 'order_riders.order_id', '=', 'orders.id')
      .join('users', 'orders.user_id', '=', 'users.id')
      .select(
        'orders.*',
        'users.email as user_email',
        'order_riders.created_at as assigned_at'
      )
      .orderBy('orders.created_at', 'desc');
    
    // Get order items if there are any orders
    if (assignedOrders.length > 0) {
      const orderIds = assignedOrders.map(order => order.id);
      
      // Get items for these orders
      const orderItems = await db('order_items')
        .whereIn('order_id', orderIds)
        .select('*');
      
      // Group items by order_id
      const itemsByOrderId = orderItems.reduce((acc, item) => {
        if (!acc[item.order_id]) {
          acc[item.order_id] = [];
        }
        acc[item.order_id].push(item);
        return acc;
      }, {});
      
      // Add items to each order
      const ordersWithItems = assignedOrders.map(order => ({
        ...order,
        rider_name: rider.name,
        rider_email: rider.email,
        items: itemsByOrderId[order.id] || []
      }));
      
      return res.json(ordersWithItems);
    }
    
    return res.json([]);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /admin/riders
 * @desc    Create a new rider (admin only)
 * @access  Private (admin only)
 */
router.post('/riders', auth, authorize(['admin']), async (req, res, next) => {
  try {
    const db = req.db;
    const { name, email } = req.body;
    
    // Validate input
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    // Check if email already exists
    const existingRider = await db('riders').where({ email }).first();
    if (existingRider) {
      return res.status(400).json({ error: 'A rider with this email already exists' });
    }
    
    // Create rider
    const [riderId] = await db('riders')
      .insert({
        name,
        email,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      })
      .returning('id');
    
    // Get the created rider
    const rider = await db('riders').where({ id: riderId }).first();
    
    res.status(201).json(rider);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /admin/riders/:id
 * @desc    Delete a rider (admin only)
 * @access  Private (admin only)
 */
router.delete('/riders/:id', auth, authorize(['admin']), async (req, res, next) => {
  try {
    const db = req.db;
    const { id } = req.params;
    
    // Check if rider exists
    const rider = await db('riders').where({ id }).first();
    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }
    
    // Check if rider has orders assigned
    const assignedOrders = await db('order_riders').where({ rider_id: id }).first();
    if (assignedOrders) {
      return res.status(400).json({ 
        error: 'Cannot delete rider with assigned orders. Reassign orders first.' 
      });
    }
    
    // Delete rider
    await db('riders').where({ id }).del();
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /admin/products
 * @desc    Get all products with variants (admin only)
 * @access  Private (admin only)
 */
router.get('/products', auth, authorize(['admin']), async (req, res, next) => {
  try {
    const db = req.db;
    
    // Get all products
    const products = await db('products')
      .select('*')
      .orderBy('created_at', 'desc');
    
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
 * @route   GET /admin/products/:id
 * @desc    Get a product by ID with variants (admin only)
 * @access  Private (admin only)
 */
router.get('/products/:id', auth, authorize(['admin']), async (req, res, next) => {
  try {
    const db = req.db;
    const { id } = req.params;
    
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

/**
 * @route   POST /admin/products
 * @desc    Create a new product (admin only)
 * @access  Private (admin only)
 */
router.post('/products', auth, authorize(['admin']), async (req, res, next) => {
  try {
    const db = req.db;
    const { name, description, price, image } = req.body;
    
    // Validate input
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    // Create product
    const [productId] = await db('products')
      .insert({
        name,
        description,
        price,
        image,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      })
      .returning('id');
    
    // Get the created product
    const product = await db('products').where({ id: productId }).first();
    
    res.status(201).json({
      ...product,
      variants: []
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /admin/products/:id
 * @desc    Update a product (admin only)
 * @access  Private (admin only)
 */
router.put('/products/:id', auth, authorize(['admin']), async (req, res, next) => {
  try {
    const db = req.db;
    const { id } = req.params;
    const { name, description, price, image } = req.body;
    
    // Check if product exists
    const product = await db('products').where({ id }).first();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Validate input
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    // Update product
    await db('products')
      .where({ id })
      .update({
        name,
        description,
        price,
        image,
        updated_at: db.fn.now()
      });
    
    // Get the updated product
    const updatedProduct = await db('products').where({ id }).first();
    
    // Get variants for this product
    const variants = await db('product_variants')
      .where({ product_id: id })
      .select('*');
    
    res.json({
      ...updatedProduct,
      variants
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /admin/products/:id
 * @desc    Delete a product (admin only)
 * @access  Private (admin only)
 */
router.delete('/products/:id', auth, authorize(['admin']), async (req, res, next) => {
  try {
    const db = req.db;
    const { id } = req.params;
    
    // Check if product exists
    const product = await db('products').where({ id }).first();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Start a transaction to delete product and its variants
    await db.transaction(async trx => {
      // Delete variants first (foreign key constraint)
      await trx('product_variants').where({ product_id: id }).del();
      
      // Then delete the product
      await trx('products').where({ id }).del();
    });
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /admin/products/:id/variants
 * @desc    Add a variant to a product (admin only)
 * @access  Private (admin only)
 */
router.post('/products/:id/variants', auth, authorize(['admin']), async (req, res, next) => {
  try {
    const db = req.db;
    const { id } = req.params;
    const { name, color, size, price, stock } = req.body;
    
    // Check if product exists
    const product = await db('products').where({ id }).first();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Validate input
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    // Create variant
    const [variantId] = await db('product_variants')
      .insert({
        product_id: id,
        name,
        color,
        size,
        price,
        stock: stock || 0,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      })
      .returning('id');
    
    // Get the created variant
    const variant = await db('product_variants').where({ id: variantId }).first();
    
    res.status(201).json(variant);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /admin/products/:productId/variants/:variantId
 * @desc    Update a product variant (admin only)
 * @access  Private (admin only)
 */
router.put('/products/:productId/variants/:variantId', auth, authorize(['admin']), async (req, res, next) => {
  try {
    const db = req.db;
    const { productId, variantId } = req.params;
    const { name, color, size, price, stock } = req.body;
    
    // Check if product exists
    const product = await db('products').where({ id: productId }).first();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if variant exists and belongs to the product
    const variant = await db('product_variants')
      .where({ 
        id: variantId,
        product_id: productId 
      })
      .first();
      
    if (!variant) {
      return res.status(404).json({ error: 'Variant not found for this product' });
    }
    
    // Validate input
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    // Update variant
    await db('product_variants')
      .where({ id: variantId })
      .update({
        name,
        color,
        size,
        price,
        stock: stock || 0,
        updated_at: db.fn.now()
      });
    
    // Get the updated variant
    const updatedVariant = await db('product_variants').where({ id: variantId }).first();
    
    res.json(updatedVariant);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /admin/products/:productId/variants/:variantId
 * @desc    Delete a product variant (admin only)
 * @access  Private (admin only)
 */
router.delete('/products/:productId/variants/:variantId', auth, authorize(['admin']), async (req, res, next) => {
  try {
    const db = req.db;
    const { productId, variantId } = req.params;
    
    // Check if variant exists and belongs to the product
    const variant = await db('product_variants')
      .where({ 
        id: variantId,
        product_id: productId 
      })
      .first();
      
    if (!variant) {
      return res.status(404).json({ error: 'Variant not found for this product' });
    }
    
    // Delete the variant
    await db('product_variants').where({ id: variantId }).del();
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router; 