import { useAuth } from '../contexts/AuthContext';

export default function Unauthorized() {
  const { logout, user } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-red-500 mb-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Unauthorized Access</h1>
        
        <p className="text-gray-600 mb-6">
          {user ? (
            <>
              Your account <span className="font-semibold">{user.email}</span> does not have 
              admin permissions to access this dashboard.
            </>
          ) : (
            <>
              You don't have permission to access this admin dashboard.
            </>
          )}
        </p>
        
        <button
          onClick={logout}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition w-full"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
} 