import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  observeAuthState, 
  signInWithGoogle, 
  signOut as firebaseSignOut,
  getIdToken
} from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

// Create the context
const AuthContext = createContext(null);

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigate = useNavigate();

  // Initialize auth state listener - John Doe hardcoded auth but real Firestore
  useEffect(() => {
    let authUnsubscribe = null;
    
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use hardcoded John Doe user for authentication
        authUnsubscribe = observeAuthState(async (mockUser) => {
          if (mockUser) {
            try {
              // Get token for the mock user
              const idToken = await getIdToken();
              setToken(idToken);
              
              // Store the user
              setUser(mockUser);
              setAuthInitialized(true);
              
              // If on login page, redirect to orders
              if (window.location.pathname === '/login') {
                navigate('/orders');
              }
            } catch (err) {
              console.error("Auth error:", err);
              setError('Error during authentication: ' + (err.message || 'Unknown error'));
            }
          } else {
            setUser(null);
            setToken(null);
          }
          
          setLoading(false);
          setAuthInitialized(true);
        });
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setError('Authentication initialization failed: ' + (error.message || 'Unknown error'));
        setLoading(false);
        setAuthInitialized(true);
      }
    };
    
    initializeAuth();
    
    // Clean up subscription on unmount
    return () => {
      if (typeof authUnsubscribe === 'function') {
        authUnsubscribe();
      }
    };
  }, [navigate]);

  // Sign in with hardcoded John Doe
  const login = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the hardcoded user from firebase.js
      const result = await signInWithGoogle();
      
      if (result && result.token) {
        setToken(result.token);
        setUser(result.user);
      }
      
      navigate('/orders');
      return result;
    } catch (error) {
      console.error("Login error:", error);
      setError('Sign-in failed: ' + (error.message || 'Unknown error'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out method
  const logout = async () => {
    try {
      await firebaseSignOut();
      setUser(null);
      setToken(null);
      setError(null);
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      setError('Sign-out failed: ' + (error.message || 'Unknown error'));
      throw error;
    }
  };

  // Refresh token method
  const refreshToken = async () => {
    return await getIdToken(true);
  };

  // Context value
  const value = {
    user,
    token,
    loading,
    error,
    setError,
    login,
    logout,
    refreshToken,
    authInitialized,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext; 