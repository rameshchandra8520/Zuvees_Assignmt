import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'))
const Orders = lazy(() => import('./pages/Orders'))

// Private route component
const PrivateRoute = ({ children }) => {
  // Note: The actual authentication check is handled inside the AuthContext
  // This is just a placeholder component for routing
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        }>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/orders" element={
              <PrivateRoute>
                <Orders />
              </PrivateRoute>
            } />
            <Route path="/" element={<Navigate replace to="/login" />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
