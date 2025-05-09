import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsApi } from '../services/api';
import { useCart } from '../contexts/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [addedToCart, setAddedToCart] = useState(false);
  
  // Get unique colors from variants
  const getVariantColors = () => {
    if (!product || !product.variants || product.variants.length === 0) return [];
    
    // Extract unique colors from variants
    const uniqueColors = [...new Set(product.variants
      .filter(variant => variant.color)
      .map(variant => variant.color))];
      
    // Map colors to objects with name, value and class
    return uniqueColors.map(color => {
      // Convert color string to appropriate CSS class
      let colorClass = '';
      switch(color.toLowerCase()) {
        case 'black': colorClass = 'bg-black'; break;
        case 'white': colorClass = 'bg-white'; break;
        case 'red': colorClass = 'bg-red-500'; break;
        case 'blue': colorClass = 'bg-blue-500'; break;
        case 'green': colorClass = 'bg-green-500'; break;
        case 'yellow': colorClass = 'bg-yellow-500'; break;
        case 'purple': colorClass = 'bg-purple-500'; break;
        case 'gray': colorClass = 'bg-gray-500'; break;
        default: colorClass = 'bg-gray-500'; break;
      }
      
      return {
        name: color,
        value: color.toLowerCase(),
        class: colorClass
      };
    });
  };

  // Get unique sizes from variants
  const getVariantSizes = () => {
    if (!product || !product.variants || product.variants.length === 0) return [];
    
    // Extract unique sizes from variants
    const uniqueSizes = [...new Set(product.variants
      .filter(variant => variant.size)
      .map(variant => variant.size))];
      
    return uniqueSizes.map(size => ({
      name: size,
      value: size
    }));
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await productsApi.getAll();
        const currentProduct = data.find(p => p.id === parseInt(id));
        
        if (!currentProduct) {
          throw new Error('Product not found');
        }
        
        setProduct(currentProduct);
        
        // Get 4 random products excluding the current one
        const otherProducts = data.filter(p => p.id !== parseInt(id));
        const shuffled = otherProducts.sort(() => 0.5 - Math.random());
        setRelatedProducts(shuffled.slice(0, 4));

        // Select the first variant by default if available
        if (currentProduct.variants && currentProduct.variants.length > 0) {
          setSelectedVariant(currentProduct.variants[0]);
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError('Failed to load product details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    console.log("Quantity changed to:", value);
    if (!isNaN(value) && value >= 1 && value <= 99) {
      setQuantity(value);
    }
  };

  const increaseQuantity = () => {
    console.log("Increasing quantity");
    setQuantity(prevQuantity => prevQuantity < 99 ? prevQuantity + 1 : prevQuantity);
  };

  const decreaseQuantity = () => {
    console.log("Decreasing quantity");
    setQuantity(prevQuantity => prevQuantity > 1 ? prevQuantity - 1 : 1);
  };

  const handleColorSelect = (colorValue) => {
    // Find variants with this color
    if (!product || !product.variants) return;
    
    console.log("Color selected:", colorValue);
    
    const variantsWithColor = product.variants.filter(
      variant => variant.color && variant.color.toLowerCase() === colorValue.toLowerCase()
    );
    
    if (variantsWithColor.length > 0) {
      // Select the first variant with this color
      setSelectedVariant(variantsWithColor[0]);
    }
  };

  const handleSizeSelect = (sizeValue) => {
    // Find variants with this size and the currently selected color if any
    if (!product || !product.variants) return;
    
    console.log("Size selected:", sizeValue);
    
    let variantsWithSize = product.variants.filter(
      variant => variant.size && variant.size.toLowerCase() === sizeValue.toLowerCase()
    );
    
    // If we have a selected variant with a color, try to find a variant with both this size and the current color
    if (selectedVariant && selectedVariant.color) {
      const variantsWithSizeAndColor = variantsWithSize.filter(
        variant => variant.color && variant.color.toLowerCase() === selectedVariant.color.toLowerCase()
      );
      
      if (variantsWithSizeAndColor.length > 0) {
        setSelectedVariant(variantsWithSizeAndColor[0]);
        return;
      }
    }
    
    // If no variant matches both size and color, just select the first one with this size
    if (variantsWithSize.length > 0) {
      setSelectedVariant(variantsWithSize[0]);
    }
  };

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
  };

  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevent default behavior
    console.log("Add to Cart clicked");
    
    if (!product) return;
    
    // If no variant is selected but product has variants, select the first one
    let variantToAdd = selectedVariant;
    if (!variantToAdd && product.variants && product.variants.length > 0) {
      variantToAdd = product.variants[0];
    }
    
    console.log("Adding to cart:", product.name, variantToAdd?.name || "Default variant", quantity);
    addToCart(product, variantToAdd, quantity);
    
    // Show success message
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
    }, 2000);
  };

  const handleBuyNow = (e) => {
    e.preventDefault(); // Prevent default behavior
    console.log("Buy Now clicked");
    
    if (!product) return;
    
    // If no variant is selected but product has variants, select the first one
    let variantToAdd = selectedVariant;
    if (!variantToAdd && product.variants && product.variants.length > 0) {
      variantToAdd = product.variants[0];
    }
    
    console.log("Buying now:", product.name, variantToAdd?.name || "Default variant", quantity);
    addToCart(product, variantToAdd, quantity);
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="relative w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-full border-8 border-blue-200 rounded-full animate-ping"></div>
          <div className="absolute top-0 left-0 w-full h-full border-8 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-500/20 to-red-500/10 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-lg my-8" role="alert">
        <div className="flex items-center">
          <svg className="w-6 h-6 mr-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-bold">{error}</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition shadow-md"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-2xl shadow-2xl">
        <svg className="w-20 h-20 mx-auto text-gray-500 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-3xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Product Not Found</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">The gaming product you're looking for might be out of stock or doesn't exist.</p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-full hover:from-blue-700 hover:to-blue-900 transition transform hover:scale-105 shadow-xl hover:shadow-blue-500/30 font-semibold"
        >
          Back to Products
        </button>
      </div>
    );
  }

  // Determine price to display
  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  
  // Get variant colors and sizes
  const variantColors = product ? getVariantColors() : [];
  const variantSizes = product ? getVariantSizes() : [];
  
  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden mb-16">
      {/* Product hero section */}
      <div className="relative">
        <div className="absolute inset-0 bg-blue-600/20 mix-blend-overlay z-0"></div>
        
        {/* Back button */}
        <button 
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 z-10 bg-gray-900/70 p-2 rounded-full text-white hover:bg-gray-800 transition-all group"
        >
          <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="md:flex items-stretch">
          {/* Image section */}
          <div className="md:w-1/2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/40 to-purple-600/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
            <img 
              src={product.image || "https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=1000"} 
              alt={product.name}
              className="w-full h-[400px] md:h-[600px] object-cover object-center group-hover:scale-110 transition-transform duration-700"
            />
            
            {/* Product badges */}
            <div className="absolute top-4 right-4 z-10 space-y-2">
              {product.variants && product.variants.length > 0 && (
                <div className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  {product.variants.length} {product.variants.length === 1 ? 'variant' : 'variants'}
                </div>
              )}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg">
                GAMING GEAR
              </div>
            </div>
          </div>
          
          {/* Product details section */}
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">{product.name}</h1>
            
            <div className="flex items-center mb-6 gap-4">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                ₹{displayPrice}
              </div>
              
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-2 text-gray-400 text-sm">(132 reviews)</span>
              </div>
            </div>
            
            {/* Product variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-white">Customize Your Setup</h3>
                <div className="grid grid-cols-2 gap-3">
                  {product.variants.map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantChange(variant)}
                      className={`py-3 px-4 rounded-xl transition-all duration-300 border-2 ${
                        selectedVariant && selectedVariant.id === variant.id
                          ? 'border-blue-500 bg-blue-500/20 text-white scale-105'
                          : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="font-bold">{variant.name}</div>
                      {variant.price !== product.price && (
                        <div className="text-sm text-blue-400">₹{variant.price}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Color selector - only show if we have color variants */}
            {variantColors.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-white">Choose Color</h3>
                <div className="flex items-center space-x-3">
                  {variantColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleColorSelect(color.value);
                      }}
                      className={`w-10 h-10 rounded-full ${color.class} flex items-center justify-center transition-transform z-10 ${
                        selectedVariant && selectedVariant.color && selectedVariant.color.toLowerCase() === color.value 
                          ? 'scale-110 ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800' 
                          : 'hover:scale-105'
                      }`}
                      title={color.name}
                    >
                      {selectedVariant && selectedVariant.color && selectedVariant.color.toLowerCase() === color.value && (
                        <svg className={`w-6 h-6 ${color.value === 'white' ? 'text-black' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Size selector - only show if we have size variants */}
            {variantSizes.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-white">Choose Size</h3>
                <div className="flex items-center space-x-3">
                  {variantSizes.map((size) => (
                    <button
                      key={size.value}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSizeSelect(size.value);
                      }}
                      className={`py-2 px-4 rounded-lg border border-gray-700 flex items-center justify-center transition-transform z-10 ${
                        selectedVariant && selectedVariant.size && selectedVariant.size.toLowerCase() === size.value.toLowerCase()
                          ? 'bg-blue-600 text-white border-blue-500' 
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Current variant info display */}
            {selectedVariant && (
              <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="text-md font-semibold mb-2 text-white">Selected Option:</h3>
                <div className="text-gray-300">
                  <p>{selectedVariant.name}</p>
                  {selectedVariant.color && <p>Color: {selectedVariant.color}</p>}
                  {selectedVariant.size && <p>Size: {selectedVariant.size}</p>}
                  <p>Price: ₹{displayPrice}</p>
                  {selectedVariant.stock <= 5 && selectedVariant.stock > 0 && (
                    <p className="text-amber-500 mt-1">Only {selectedVariant.stock} left in stock!</p>
                  )}
                  {selectedVariant.stock === 0 && (
                    <p className="text-red-500 mt-1">Out of stock</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Quantity selector */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Quantity</h3>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    decreaseQuantity();
                  }}
                  className="w-10 h-10 rounded-full bg-gray-800 text-white hover:bg-gray-700 flex items-center justify-center border-2 border-gray-700 hover:border-blue-500 transition-all z-10"
                  disabled={quantity <= 1}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                  </svg>
                </button>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-20 text-center bg-gray-800 border-2 border-gray-700 rounded-lg py-2 text-white focus:border-blue-500 focus:outline-none z-10"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    increaseQuantity();
                  }}
                  className="w-10 h-10 rounded-full bg-gray-800 text-white hover:bg-gray-700 flex items-center justify-center border-2 border-gray-700 hover:border-blue-500 transition-all z-10"
                  disabled={quantity >= 99}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                type="button"
                onClick={handleAddToCart}
                className="cursor-pointer flex-1 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-blue-500/30 font-semibold transform hover:translate-y-[-2px] flex items-center justify-center z-10"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Add to Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="cursor-pointer flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-green-500/30 font-semibold transform hover:translate-y-[-2px] z-10"
              >
                Buy Now
              </button>
            </div>

            
            {/* Add to cart success message */}
            {addedToCart && (
              <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Added to cart!
              </div>
            )}
            
            {/* Product features */}
            <div className="mt-auto">
              <div className="border-t border-gray-700 pt-6">
                <div className="flex mb-6">
                  <button 
                    onClick={() => setActiveTab('description')}
                    className={`mr-6 py-2 px-1 border-b-2 transition-colors ${activeTab === 'description' ? 'text-blue-400 border-blue-400' : 'text-gray-400 border-transparent hover:text-gray-300'}`}
                  >
                    Description
                  </button>
                  <button 
                    onClick={() => setActiveTab('features')}
                    className={`mr-6 py-2 px-1 border-b-2 transition-colors ${activeTab === 'features' ? 'text-blue-400 border-blue-400' : 'text-gray-400 border-transparent hover:text-gray-300'}`}
                  >
                    Features
                  </button>
                  <button 
                    onClick={() => setActiveTab('shipping')}
                    className={`py-2 px-1 border-b-2 transition-colors ${activeTab === 'shipping' ? 'text-blue-400 border-blue-400' : 'text-gray-400 border-transparent hover:text-gray-300'}`}
                  >
                    Shipping
                  </button>
                </div>
                
                {activeTab === 'description' && (
                  <div className="text-gray-300 space-y-4">
                    <p>{product.description}</p>
                    <p>Take your gaming experience to the next level with this premium gaming {product.name.toLowerCase()}. Designed for pro gamers and enthusiasts who demand nothing but the best.</p>
                  </div>
                )}
                
                {activeTab === 'features' && (
                  <div className="text-gray-300">
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Premium quality materials for extended durability
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Ergonomic design for comfortable extended gaming sessions
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        RGB lighting with customizable effects
                      </li>
                      <li className="flex items-start">
                        <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Compatible with all major gaming platforms
                      </li>
                    </ul>
                  </div>
                )}
                
                {activeTab === 'shipping' && (
                  <div className="text-gray-300 space-y-4">
                    <p>Free shipping on all orders over ₹1000. Standard delivery time is 3-5 business days.</p>
                    <p>Express shipping available for an additional fee. Returns accepted within 30 days of purchase.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Related products section */}
      <div className="p-8 md:p-12 border-t border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-white">Gamers Also Bought</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {relatedProducts.map((relatedProduct) => (
            <Link
              key={relatedProduct.id}
              to={`/product/${relatedProduct.id}`}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg overflow-hidden hover:shadow-blue-500/20 transition-all hover:scale-105 group"
            >
              <div className="relative overflow-hidden">
                <img
                  src={relatedProduct.image}
                  alt={relatedProduct.name}
                  className="w-full h-48 object-cover transform transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{relatedProduct.name}</h3>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{relatedProduct.description}</p>
                <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  ₹{relatedProduct.price}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Customer reviews section */}
      <div className="p-8 md:p-12 border-t border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Customer Reviews</h2>
          <button className="text-blue-400 hover:text-blue-500 transition flex items-center">
            View all
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Sample reviews */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                JS
              </div>
              <div className="ml-4">
                <div className="font-semibold text-white">John S.</div>
                <div className="text-gray-400 text-sm">Verified Buyer</div>
              </div>
              <div className="ml-auto flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-gray-300">Absolute game changer! The quality is outstanding and it's helped improve my gaming performance significantly. Worth every penny.</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                AR
              </div>
              <div className="ml-4">
                <div className="font-semibold text-white">Amanda R.</div>
                <div className="text-gray-400 text-sm">Verified Buyer</div>
              </div>
              <div className="ml-auto flex">
                {[1, 2, 3, 4].map((star) => (
                  <svg key={star} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-300">Great build quality and design. Shipping was fast too. Only giving 4 stars because the software could be more intuitive, but otherwise it's fantastic.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 