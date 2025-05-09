import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ordersApi } from '../services/api';

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleUpdateQuantity = (productId, variantId, newQuantity) => {
    updateQuantity(productId, variantId, newQuantity);
  };

  const handleRemoveItem = (productId, variantId) => {
    removeFromCart(productId, variantId);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Validate cart items before proceeding
      if (!cartItems.length) {
        setError('Your cart is empty');
        return;
      }

      // Check if all items have sufficient stock
      for (const item of cartItems) {
        if (item.variant && item.variant.stock < item.quantity) {
          setError(`Not enough stock for ${item.product.name} (${item.variant.name})`);
          return;
        }
      }

      // Debug the structure of cartItems
      console.log('Cart items structure:', JSON.stringify(cartItems, null, 2));

      // Extract the correct ID values
      const orderItems = cartItems.map(item => {
        // Get numeric product ID
        let productId = typeof item.product.id === 'object' 
          ? item.product.id.id   // If nested object, get id property
          : Number(item.product.id);  // Otherwise convert to number
        
        // Get numeric variant ID if exists
        let variantId = null;
        if (item.variant) {
          variantId = typeof item.variant.id === 'object'
            ? item.variant.id.id  // If nested object, get id property
            : Number(item.variant.id);  // Otherwise convert to number
        }
        
        return {
          product_id: productId,
          variant_id: variantId,
          quantity: Number(item.quantity)
        };
      });

      // Debug the formatted order items
      console.log('Formatted order items:', JSON.stringify(orderItems, null, 2));

      const total = cartItems.reduce((sum, item) => {
        const price = item.variant ? item.variant.price : item.product.price;
        return sum + (price * item.quantity);
      }, 0);

      const orderData = {
        items: orderItems,
        total: Number(total)
      };

      // Final debug output
      console.log('Order data to be sent:', JSON.stringify(orderData, null, 2));

      const response = await ordersApi.create(orderData);

      console.log('Response from API:', response);

      // Clear the cart after successful order
      clearCart();

      // Navigate to orders page with success message
      navigate('/orders', { 
        state: { 
          message: 'Order placed successfully! You can track your order status here.' 
        }
      });

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-4">Order Confirmed!</h2>
            <p className="text-gray-300 mb-8">Get ready to level up your gaming experience. Thank you for your purchase!</p>
            <Link 
              to="/"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl hover:from-blue-700 hover:to-blue-900 transition transform hover:scale-105 shadow-xl hover:shadow-blue-500/30 font-semibold"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold text-white">Your Gaming Cart</h1>
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Total: ₹{cartTotal}
          </div>
        </div>

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

        {cartItems.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full mx-auto flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
            <p className="text-gray-400 mb-8">Time to gear up! Add some gaming essentials to your cart.</p>
            <Link 
              to="/"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl hover:from-blue-700 hover:to-blue-900 transition transform hover:scale-105 shadow-xl hover:shadow-blue-500/30 font-semibold"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {cartItems.map((item, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl overflow-hidden hover:shadow-blue-500/10 transition-all duration-300 group relative"
              >
                <div 
                  className="absolute inset-0 cursor-pointer z-0"
                  onClick={() => navigate(`/product/${item.product.id}`)}
                ></div>
                <div className="p-6 flex items-center gap-6 relative z-10">
                  <div 
                    className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-xl cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/product/${item.product.id}`);
                    }}
                  >
                    <img 
                      src={item.product.image || "https://via.placeholder.com/300x300"} 
                      alt={item.product.name}
                      className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  <div className="flex-grow">
                    <h3 
                      className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product/${item.product.id}`);
                      }}
                    >
                      {item.product.name}
                    </h3>
                    {item.variant && (
                      <p className="text-gray-400 mt-1">
                        {item.variant.color} {item.variant.size && `- ${item.variant.size}`}
                      </p>
                    )}
                    <div className="flex items-center mt-2">
                      <span className="text-gray-400 mr-2">Color:</span>
                      <div 
                        className="w-5 h-5 rounded-full border border-gray-400" 
                        style={{ 
                          backgroundColor: item.variant?.color || 
                            ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'][index % 6] 
                        }}
                      ></div>
                    </div>
                    <div className="flex items-center mt-2">
                      <span className="text-gray-400 mr-2">Size:</span>
                      <span className="text-white bg-gray-700 px-2 py-1 rounded text-sm">
                        {item.variant?.size || 'Standard'}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateQuantity(
                              item.product.id, 
                              item.variant?.id, 
                              item.quantity - 1
                            );
                          }}
                          className="w-8 h-8 rounded-lg bg-gray-800 text-white hover:bg-blue-600 transition flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-white">{item.quantity}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateQuantity(
                              item.product.id, 
                              item.variant?.id, 
                              item.quantity + 1
                            );
                          }}
                          className="w-8 h-8 rounded-lg bg-gray-800 text-white hover:bg-blue-600 transition flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        ₹{(item.product.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveItem(item.product.id, item.variant?.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl p-6 mt-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={clearCart}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition transform hover:scale-105 font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear Cart
                </button>
                <div className="w-full sm:w-auto flex items-center gap-4">
                  <div className="text-gray-400">Total Amount:</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    ₹{cartTotal}
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className={`w-full sm:w-auto px-8 py-4 rounded-xl transition transform hover:scale-105 font-semibold flex items-center justify-center gap-2 ${
                    isSubmitting 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl hover:shadow-green-500/30'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Checkout Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 