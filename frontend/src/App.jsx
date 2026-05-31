import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import './index.css';

// Pages
import ShopPage from './pages/ShopPage';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AuthPage from './pages/AuthPage';
import OwnerDashboard from './pages/OwnerDashboard';
import PostItemPage from './pages/PostItemPage';
import OrdersPage from './pages/OrdersPage';
import MessagesPage from './pages/MessagesPage';
import MyOrdersPage from './pages/MyOrdersPage';
import Navbar from './components/Navbar';

const OwnerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:'flex',justifyContent:'center',paddingTop:'100px'}}><div className="spinner"/></div>;
  if (!user || user.role !== 'owner') return <Navigate to="/auth" />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/auth" element={user ? <Navigate to="/" /> : <AuthPage />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />
        <Route path="/owner" element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} />
        <Route path="/owner/post" element={<OwnerRoute><PostItemPage /></OwnerRoute>} />
        <Route path="/owner/orders" element={<OwnerRoute><OrdersPage /></OwnerRoute>} />
        <Route path="/owner/messages" element={<OwnerRoute><MessagesPage /></OwnerRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-center" toastOptions={{
            style: { background: 'white', color: '#3d2b2b', border: '1px solid rgba(232,160,160,0.3)', borderRadius: '12px', fontFamily: "'DM Sans', sans-serif" },
            success: { iconTheme: { primary: '#c97b7b', secondary: 'white' } }
          }} />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
