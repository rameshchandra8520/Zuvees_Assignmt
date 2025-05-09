import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Protected route component that requires authentication and admin role
 * Redirects to login page if not authenticated
 * Redirects to unauthorized page if authenticated but not admin
 */
export const AdminProtectedRoute = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to unauthorized if not admin
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render the protected route
  return <Outlet />;
}; 