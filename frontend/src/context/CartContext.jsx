import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const { user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!user) { setCart([]); return; }
    try { const r = await API.get('/cart'); setCart(r.data); } catch {}
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (product_id) => {
    await API.post('/cart', { product_id });
    fetchCart();
  };

  const removeFromCart = async (id) => {
    await API.delete(`/cart/${id}`);
    fetchCart();
  };

  const clearCart = async () => {
    await API.delete('/cart');
    setCart([]);
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, fetchCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
