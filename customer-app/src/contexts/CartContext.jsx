import { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const CartContext = createContext(null);

// Cart provider component
export function CartProvider({ children }) {
  // Initialize cart from localStorage or empty array
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Add item to cart
  const addToCart = (product, variant, quantity = 1) => {
    setCartItems(prevItems => {
      // Check if the item is already in the cart
      const existingItemIndex = prevItems.findIndex(
        item => item.product.id === product.id && 
               (!variant || !item.variant || item.variant.id === variant.id)
      );

      if (existingItemIndex !== -1) {
        // Update quantity if item exists
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        // Add new item if it doesn't exist
        return [...prevItems, { product, variant, quantity }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (productId, variantId = null) => {
    setCartItems(prevItems => 
      prevItems.filter(item => 
        item.product.id !== productId || 
        (variantId && item.variant && item.variant.id !== variantId)
      )
    );
  };

  // Update item quantity
  const updateQuantity = (productId, variantId = null, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (
          item.product.id === productId && 
          (!variantId || !item.variant || item.variant.id === variantId)
        ) {
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  // Clear the cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Calculate cart total
  const cartTotal = cartItems.reduce(
    (total, item) => total + (item.product.price * item.quantity), 
    0
  );

  // Get total number of items in cart
  const itemCount = cartItems.reduce(
    (count, item) => count + item.quantity, 
    0
  );

  // Context value
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    itemCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook for using cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext; 