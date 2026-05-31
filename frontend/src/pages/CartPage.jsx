import { imgUrl } from '../config';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import API from '../api';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cart, removeFromCart, cartTotal, fetchCart } = useCart();
  const navigate = useNavigate();

  const updateQty = async (id, qty) => {
    if (qty < 1) return;
    await API.put(`/cart/${id}`, { quantity: qty });
    fetchCart();
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={styles.title}>🛍️ Your Cart</h1>

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 70 }}>🛒</div>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, color: 'var(--mauve)', marginTop: 16 }}>
            Your cart is empty
          </h3>
          <p style={{ color: 'var(--text-light)', marginTop: 8 }}>Discover beautiful handcrafted items 🌸</p>
          <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/')}>
            Shop Now
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {cart.map(item => (
              <div key={item.id} style={styles.cartItem}>
                <div style={styles.itemPhoto}>
                  {item.photo ? (
                    <img src={imgUrl(item.photo)} alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                  ) : <span style={{ fontSize: 36 }}>🧶</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 600 }}>{item.name}</div>
                  <div className="tag" style={{ marginTop: 4, display: 'inline-block' }}>{item.category}</div>
                  <div style={{ color: 'var(--mauve)', fontWeight: 700, fontSize: 18, marginTop: 8 }}>
                    ETB {(item.price * item.quantity).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-light)' }}>ETB {item.price} each</div>
                </div>
                <div style={styles.qtyControls}>
                  <button style={styles.qtyBtn} onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                  <span style={{ minWidth: 32, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                  <button style={styles.qtyBtn} onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                </div>
                <button onClick={() => { removeFromCart(item.id); toast.success('Removed from cart'); }}
                  style={styles.removeBtn}>✕</button>
              </div>
            ))}
          </div>

          <div style={styles.summary}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22 }}>Total</span>
              <span className="price" style={{ fontSize: 28 }}>ETB {cartTotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="btn-secondary" onClick={() => navigate('/')} style={{ flex: 1 }}>
                Continue Shopping
              </button>
              <button className="btn-primary" onClick={() => navigate('/checkout')} style={{ flex: 2, justifyContent: 'center' }}>
                💳 Proceed to Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  title: { fontFamily: 'Cormorant Garamond, serif', fontSize: 36, color: 'var(--mauve)', marginBottom: 28 },
  cartItem: {
    background: 'white', borderRadius: 16,
    padding: '20px', display: 'flex',
    alignItems: 'center', gap: 16,
    boxShadow: '0 4px 16px var(--shadow)',
    flexWrap: 'wrap',
  },
  itemPhoto: {
    width: 90, height: 90, borderRadius: 12,
    background: 'var(--blush)', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  qtyControls: { display: 'flex', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 32, height: 32, borderRadius: '50%',
    border: '2px solid var(--border)', background: 'white',
    cursor: 'pointer', fontSize: 18, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--mauve)', fontWeight: 700,
  },
  removeBtn: {
    background: 'var(--blush)', border: 'none',
    borderRadius: '50%', width: 32, height: 32,
    cursor: 'pointer', color: 'var(--rose-dark)', fontWeight: 700,
  },
  summary: {
    background: 'white', borderRadius: 20,
    padding: 24, boxShadow: '0 4px 20px var(--shadow)',
  },
};
