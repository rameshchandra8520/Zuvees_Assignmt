import { getIdToken } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper function for API requests
async function fetchWithAuth(endpoint, options = {}) {
  // Real API call logic
  const token = await getIdToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Something went wrong');
  }
  
  return response.json();
}

// Auth API
export const authApi = {
  // Verify user is approved
  verifyUser: () => fetchWithAuth('/auth/verify')
};

// Products API with real API calls
export const productsApi = {
  // Get all products
  getAll: () => fetchWithAuth('/products'),
  
  // Get product by ID
  getById: (id) => fetchWithAuth(`/products/${id}`)
};

// Orders API (real API calls)
export const ordersApi = {
  // Create a new order
  create: (orderData) => {
    try {
      // Ensure product_id and variant_id are proper integers
      const sanitizedItems = orderData.items.map(item => {
        // Handle nested objects
        const productId = typeof item.product_id === 'object' ? 
          Number(item.product_id.id) : Number(item.product_id);
          
        let variantId = null;
        if (item.variant_id) {
          variantId = typeof item.variant_id === 'object' ? 
            Number(item.variant_id.id) : Number(item.variant_id);
        }
        
        return {
          product_id: productId,
          variant_id: variantId,
          quantity: Number(item.quantity)
        };
      });

      // Create sanitized order data
      const sanitizedData = {
        items: sanitizedItems,
        total: Number(orderData.total)
      };

      console.log('Sanitized order data:', JSON.stringify(sanitizedData, null, 2));

      return fetchWithAuth('/orders', {
        method: 'POST',
        body: JSON.stringify(sanitizedData)
      });
    } catch (error) {
      console.error('Error sanitizing order data:', error);
      throw new Error('Failed to process order data. Please try again.');
    }
  },
  
  // Get user's orders
  getAll: () => fetchWithAuth('/orders')
}; 