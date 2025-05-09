import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../services/api';
import { useCart } from '../contexts/CartContext';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productsApi.getAll();
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    // If product has variants, add the first one
    // Otherwise add the product without variant
    if (product.variants && product.variants.length > 0) {
      addToCart(product, product.variants[0]);
    } else {
      addToCart(product);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <div key={product.id} className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
            <div className="relative">
              <img 
                src={product.image || "https://via.placeholder.com/300x200"} 
                alt={product.name}
                className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {product.variants && product.variants.length > 0 && (
                <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                  {product.variants.length} {product.variants.length === 1 ? 'variant' : 'variants'}
                </div>
              )}
            </div>
            <div className="p-5 bg-gradient-to-b from-gray-800 to-gray-900">
              <h2 className="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">{product.name}</h2>
              <p className="text-gray-300 text-sm mb-4 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">₹{product.price}</span>
              </div>
              <div className="flex space-x-2">
                <Link 
                  to={`/product/${product.id}`}
                  className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-blue-500/30 font-medium"
                >
                  Details
                </Link>
                <button
                  onClick={() => {
                    handleAddToCart(product);
                    
                    // Create animation element
                    const animEl = document.createElement('div');
                    animEl.className = 'fixed z-50 bg-green-500 text-white text-sm font-bold rounded-full px-2 py-1 shadow-lg';
                    animEl.innerHTML = '✓ Added!';
                    animEl.style.position = 'fixed';
                    
                    // Position at click location
                    const rect = event.target.getBoundingClientRect();
                    animEl.style.left = `${rect.left + rect.width/2}px`;
                    animEl.style.top = `${rect.top}px`;
                    
                    // Add to DOM
                    document.body.appendChild(animEl);
                    
                    // Animate to cart in top right
                    setTimeout(() => {
                      animEl.style.transition = 'all 0.5s ease-in-out';
                      animEl.style.top = '1rem';
                      animEl.style.right = '30%';
                      animEl.style.left = 'auto';
                      animEl.style.transform = 'scale(1.2)';
                      
                      // Remove after animation
                      setTimeout(() => {
                        animEl.style.opacity = '0';
                        setTimeout(() => document.body.removeChild(animEl), 300);
                      }, 700);
                    }, 10);
                  }}
                  className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-green-500/30 font-medium flex items-center justify-center cursor-pointer"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {products.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <h2 className="text-xl">No products available</h2>
        </div>
      )}
    </div>
  );
} 