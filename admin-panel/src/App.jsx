import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProtectedRoute } from './middleware/auth.jsx';
import Layout from './components/Layout';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Riders from './pages/Riders';
import Products from './pages/Products';
import Unauthorized from './pages/Unauthorized';
import './index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected routes (admin only) */}
          <Route element={<AdminProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/orders" element={<Orders />} />
              <Route path="/riders" element={<Riders />} />
              <Route path="/products" element={<Products />} />
            </Route>
          </Route>
          
          {/* Redirect home to orders */}
          <Route path="/" element={<Navigate to="/orders" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
