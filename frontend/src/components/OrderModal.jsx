import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../api';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = ['TeleBirr', 'CBE', 'BOA', 'Cash on Delivery'];
const DELIVERY_OPTIONS = ['Pickup (Bole Arabesa)', 'Pickup (Hayahulet)', 'Delivery'];

export default function OrderModal({ product, cartItems, onClose }) {
  const { user } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customer_name: user?.name || '',
    customer_phone: user?.phone || '',
    customer_email: user?.email || '',
    delivery_option: DELIVERY_OPTIONS[0],
    payment_method: PAYMENT_METHODS[0],
    location: '',
    note: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const items = cartItems
    ? cartItems.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: i.price }))
    : [{ product_id: product.id, quantity: 1, price: product.price }];

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.customer_phone) {
      toast.error('Name and phone are required'); return;
    }
    setLoading(true);
    try {
      await API.post('/orders', { ...form, items });
      if (cartItems) await clearCart();
      setDone(true);
      toast.success('Order placed! 🎉');
      setTimeout(() => { onClose(); navigate('/my-orders'); }, 1800);
    } catch { toast.error('Could not place order'); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div style={styles.header}>
          <h2 style={styles.title}>{done ? '🎉 Order Placed!' : '📦 Place Order'}</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {done ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🌸</div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: 'var(--mauve)', marginBottom: 8 }}>
              Thank you for your order!
            </h3>
            <p style={{ color: 'var(--text-light)', marginBottom: 8 }}>
              Hermella will contact you soon to confirm your order.
            </p>
            <div style={{ background: 'var(--blush)', borderRadius: 14, padding: 16, margin: '16px 0', fontSize: 14 }}>
              <div>📞 <a href="tel:0986813121" style={{ color: 'var(--mauve)' }}>0986813121</a></div>
              <div>💬 <a href="https://t.me/H24H3" target="_blank" rel="noreferrer" style={{ color: 'var(--mauve)' }}>@H24H3</a></div>
            </div>
            <button className="btn-primary" onClick={onClose} style={{ justifyContent: 'center', width: '100%' }}>
              Continue Shopping 🛍️
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px' }}>
            {/* Order summary */}
            <div style={styles.summary}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--mauve)' }}>Order Summary</div>
              {product && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span>{product.name}</span>
                  <span style={{ fontWeight: 600 }}>ETB {product.price?.toLocaleString()}</span>
                </div>
              )}
              {cartItems?.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span>{item.name} x{item.quantity}</span>
                  <span style={{ fontWeight: 600 }}>ETB {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--mauve)' }}>
                <span>Total</span>
                <span>ETB {total.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Your Name *">
                <input value={form.customer_name} onChange={e => set('customer_name', e.target.value)} placeholder="Full name" required />
              </Field>
              <Field label="Phone Number *">
                <input value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} placeholder="09xxxxxxxx" required />
              </Field>
              <Field label="Email">
                <input value={form.customer_email} onChange={e => set('customer_email', e.target.value)} placeholder="email@example.com" type="email" />
              </Field>
              <Field label="Delivery Option">
                <select value={form.delivery_option} onChange={e => set('delivery_option', e.target.value)}>
                  {DELIVERY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              {form.delivery_option === 'Delivery' && (
                <Field label="Your Location">
                  <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Your delivery address" />
                </Field>
              )}
              <Field label="Payment Method">
                <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Note (optional)">
                <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="Any special requests..." style={{ minHeight: 60, resize: 'vertical' }} />
              </Field>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}
              style={{ marginTop: 20, width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
              {loading ? '⏳ Placing Order...' : '✨ Place Order'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const Field = ({ label, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-light)', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px' },
  title: { fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: 'var(--mauve)' },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-light)', padding: 4 },
  summary: { background: 'var(--blush)', borderRadius: 14, padding: 16, marginBottom: 20 },
};
