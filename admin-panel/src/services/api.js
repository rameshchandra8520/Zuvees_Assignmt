import { getIdToken } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper function for API requests
async function fetchWithAuth(endpoint, options = {}) {
  // Get authentication token if user is logged in
  const token = await getIdToken();
  
  // Set up headers with authentication if token exists
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Make the fetch request
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  // Parse the JSON response
  const data = await response.json();
  
  // If response is not ok, throw an error
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  
  return data;
}

// Auth API
export const authApi = {
  // Verify user is approved and has admin role
  verifyAdmin: async () => {
    try {
      const response = await fetchWithAuth('/auth/verify-admin');
      return response;
    } catch (error) {
      if (error.message.includes('not approved') || 
          error.message.includes('Insufficient permissions') ||
          error.message.includes('User not found')) {
        throw new Error('unauthorized');
      }
      throw error;
    }
  }
};

// Orders API
export const ordersApi = {
  // Get all orders (admin only)
  getAll: () => fetchWithAuth('/admin/orders'),
  
  // Get order by ID
  getById: (id) => fetchWithAuth(`/admin/orders/${id}`),
  
  // Update order status
  updateStatus: (orderId, status, riderId = null) => {
    const data = riderId 
      ? { status, rider_id: riderId } 
      : { status };
      
    return fetchWithAuth(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }
};

// Riders API
export const ridersApi = {
  // Get all riders
  getAll: () => fetchWithAuth('/admin/riders'),
  
  // Get rider by ID
  getById: (id) => fetchWithAuth(`/admin/riders/${id}`),
  
  // Get rider's assigned orders
  getAssignedOrders: (id) => fetchWithAuth(`/admin/riders/${id}/orders`),
  
  // Create new rider
  create: (riderData) => fetchWithAuth('/admin/riders', {
    method: 'POST',
    body: JSON.stringify(riderData)
  }),
  
  // Update rider
  update: (id, riderData) => fetchWithAuth(`/admin/riders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(riderData)
  }),
  
  // Delete rider
  delete: (id) => fetchWithAuth(`/admin/riders/${id}`, {
    method: 'DELETE'
  })
};

// Products API
export const adminApi = {
  // Get all products (with variants)
  getProducts: () => fetchWithAuth('/admin/products'),
  
  // Get product by ID
  getProduct: (id) => fetchWithAuth(`/admin/products/${id}`),
  
  // Create new product
  createProduct: (productData) => fetchWithAuth('/admin/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  }),
  
  // Update product
  updateProduct: (id, productData) => fetchWithAuth(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  }),
  
  // Delete product
  deleteProduct: (id) => fetchWithAuth(`/admin/products/${id}`, {
    method: 'DELETE'
  }),
  
  // Create product variant
  createVariant: (productId, variantData) => fetchWithAuth(`/admin/products/${productId}/variants`, {
    method: 'POST',
    body: JSON.stringify(variantData)
  }),
  
  // Update product variant
  updateVariant: (productId, variantId, variantData) => fetchWithAuth(`/admin/products/${productId}/variants/${variantId}`, {
    method: 'PUT',
    body: JSON.stringify(variantData)
  }),
  
  // Delete product variant
  deleteVariant: (productId, variantId) => fetchWithAuth(`/admin/products/${productId}/variants/${variantId}`, {
    method: 'DELETE'
  }),
  
  // Orders API (for convenience)
  ...ordersApi,
  
  // Riders API (for convenience)
  ...ridersApi
}; 