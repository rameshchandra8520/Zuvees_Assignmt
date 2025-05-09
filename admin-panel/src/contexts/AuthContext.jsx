import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  observeAuthState, 
  signInWithGoogle, 
  signOut as firebaseSignOut,
  getIdToken
} from '../services/firebase';
import { authApi } from '../services/api';

// Create the context
const AuthContext = createContext(null);

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Verify if user is an approved admin
  const verifyAdminRole = async (firebaseUser) => {
    if (!firebaseUser) return false;
    
    try {
      await authApi.verifyAdmin();
      return true;
    } catch (error) {
      if (error.message === 'unauthorized') {
        console.error('User is not authorized as admin');
        return false;
      }
      // For other errors, we'll consider the user unauthorized to be safe
      console.error('Error verifying admin role:', error);
      return false;
    }
  };

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = observeAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await getIdToken();
        setToken(idToken);
        
        // Verify if user is an admin
        const isAdminUser = await verifyAdminRole(firebaseUser);
        
        if (isAdminUser) {
          setUser(firebaseUser);
          setIsAdmin(true);
        } else {
          // User is authenticated but not an admin
          setUser(null);
          setIsAdmin(false);
          // Redirect to unauthorized page
          navigate('/unauthorized');
        }
      } else {
        setUser(null);
        setToken(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, [navigate]);

  // Sign in method
  const login = async () => {
    try {
      const result = await signInWithGoogle();
      return result;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Sign out method
  const logout = async () => {
    try {
      await firebaseSignOut();
      setUser(null);
      setToken(null);
      setIsAdmin(false);
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Context value
  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin
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