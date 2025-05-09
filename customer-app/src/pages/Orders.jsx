import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ordersApi, productsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const OrderStatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'Paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Undelivered':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusStyles()}`}>
      {status}
    </span>
  );
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await ordersApi.getAll();
        
        // Get all product IDs from orders
        const productIds = new Set();
        response.forEach(order => {
          order.items.forEach(item => {
            if (item.product_id) {
              productIds.add(item.product_id);
            }
          });
        });
        
        // Fetch all needed products from mock data
        const productDetails = {};
        for (const productId of productIds) {
          try {
            const product = await productsApi.getById(productId);
            productDetails[productId] = product;
          } catch (err) {
            console.error(`Failed to fetch product ${productId}:`, err);
          }
        }
        
        // Add product details to each order item
        const ordersWithProducts = response.map(order => {
          const updatedItems = order.items.map(item => {
            const product = productDetails[item.product_id];
            // Find variant if applicable
            let variant = null;
            if (item.variant_id && product && product.variants) {
              variant = product.variants.find(v => v.id === item.variant_id);
            }
            
            return {
              ...item,
              product: product || { 
                id: item.product_id,
                name: `Product #${item.product_id}`,
                price: 0,
                image: null
              },
              variant: variant
            };
          });
          
          return {
            ...order,
            items: updatedItems
          };
        });
        
        setOrders(ordersWithProducts);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load your orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full mx-auto flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Please Login to View Orders</h2>
          <p className="text-gray-400 mb-8">You need to be logged in to view your order history.</p>
          <Link 
            to="/login"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl hover:from-blue-700 hover:to-blue-900 transition transform hover:scale-105 shadow-xl hover:shadow-blue-500/30 font-semibold"
          >
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white mb-8">Your Orders</h1>

        {location.state?.message && (
          <div className="bg-gradient-to-r from-green-500/20 to-green-500/10 border-l-4 border-green-500 text-green-700 p-6 rounded-lg shadow-lg mb-8" role="alert">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <p>{location.state.message}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-red-500/20 to-red-500/10 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-lg mb-8" role="alert">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>{error}</p>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full mx-auto flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">No Orders Yet</h2>
            <p className="text-gray-400 mb-8">Start shopping to create your first order!</p>
            <Link 
              to="/"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl hover:from-blue-700 hover:to-blue-900 transition transform hover:scale-105 shadow-xl hover:shadow-blue-500/30 font-semibold"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div 
                key={order.id}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl overflow-hidden hover:shadow-blue-500/10 transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Order #{order.id}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <OrderStatusBadge status={order.status} />
                      <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        ₹{order.total}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 bg-gray-800/50 rounded-xl p-4">
                        <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={item.product?.image || "https://via.placeholder.com/300x300"} 
                            alt={item.product?.name || 'Product'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-white font-medium">{item.product?.name || 'Product'}</h4>
                          {item.variant && (
                            <p className="text-gray-400 text-sm">
                              Variant: {item.variant.name}
                            </p>
                          )}
                          <p className="text-gray-400 text-sm">
                            Quantity: {item.quantity}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Price: ₹{item.price ? item.price : (item.product?.price || 0)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">
                            ₹{(item.price || item.product?.price || 0) * item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 