import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customer_name: user?.name || '', customer_phone: user?.phone || '',
    customer_email: user?.email || '',
    delivery_option: 'pickup', location: '', payment_method: 'telebirr', note: '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (cart.length === 0) { navigate('/cart'); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const items = cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: i.price }));
      await API.post('/orders', { ...form, items });
      toast.success('Order placed successfully! We will contact you soon 💕');
      clearCart();
      navigate('/my-orders');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not place order');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
      <button onClick={() => navigate('/cart')} style={styles.back}>← Back to Cart</button>
      <h1 style={styles.title}>💌 Checkout</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Section title="📋 Your Info">
          <Field label="Full Name *">
            <input required value={form.customer_name} onChange={e => set('customer_name', e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Phone Number *">
            <input required value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} placeholder="09XXXXXXXX" />
          </Field>
          <Field label="Email">
            <input type="email" value={form.customer_email} onChange={e => set('customer_email', e.target.value)} placeholder="your@email.com" />
          </Field>
        </Section>

        <Section title="🚚 Delivery Option">
          <div style={styles.radioGroup}>
            <RadioCard icon="🏪" label="Pickup" desc="Bole Arabesa or Hayahulet" value="pickup"
              selected={form.delivery_option === 'pickup'} onClick={() => set('delivery_option', 'pickup')} />
            <RadioCard icon="🚚" label="Delivery" desc="We deliver to your location" value="delivery"
              selected={form.delivery_option === 'delivery'} onClick={() => set('delivery_option', 'delivery')} />
          </div>
          {form.delivery_option === 'delivery' && (
            <Field label="Delivery Address">
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Your full address" />
            </Field>
          )}
        </Section>

        <Section title="💳 Payment Method">
          <div style={styles.radioGroup}>
            {[
              { icon: '📱', label: 'TeleBirr', value: 'telebirr' },
              { icon: '🏦', label: 'CBE', value: 'cbe' },
              { icon: '🏦', label: 'BOA', value: 'boa' },
              { icon: '💵', label: 'Cash', value: 'cash' },
            ].map(pm => (
              <RadioCard key={pm.value} icon={pm.icon} label={pm.label} value={pm.value}
                selected={form.payment_method === pm.value} onClick={() => set('payment_method', pm.value)} />
            ))}
          </div>
        </Section>

        <Section title="📝 Order Note">
          <textarea value={form.note} onChange={e => set('note', e.target.value)}
            placeholder="Any special requests or notes... 💕" style={{ minHeight: 80 }} />
        </Section>

        {/* Order summary */}
        <div style={styles.summary}>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, marginBottom: 12 }}>Order Summary</h3>
          {cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, borderBottom: '1px solid var(--border)' }}>
              <span>{item.name} × {item.quantity}</span>
              <span style={{ fontWeight: 600 }}>ETB {(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20 }}>Total</span>
            <span className="price" style={{ fontSize: 24 }}>ETB {cartTotal.toLocaleString()}</span>
          </div>
        </div>

        <button type="submit" className="btn-gold" disabled={loading}
          style={{ justifyContent: 'center', padding: '16px', fontSize: 16, opacity: loading ? 0.7 : 1 }}>
          {loading ? '⏳ Placing Order...' : '💌 Place Order'}
        </button>
      </form>
    </div>
  );
}

const Section = ({ title, children }) => (
  <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 16px var(--shadow)' }}>
    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: 'var(--mauve)', marginBottom: 16 }}>{title}</h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--mauve)', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const RadioCard = ({ icon, label, desc, value, selected, onClick }) => (
  <div onClick={onClick} style={{
    flex: 1, minWidth: 120, padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
    border: `2px solid ${selected ? 'var(--rose)' : 'var(--border)'}`,
    background: selected ? 'var(--blush)' : 'white',
    textAlign: 'center', transition: 'all 0.2s',
  }}>
    <div style={{ fontSize: 24 }}>{icon}</div>
    <div style={{ fontWeight: 600, fontSize: 14, color: selected ? 'var(--mauve)' : 'var(--text)', marginTop: 4 }}>{label}</div>
    {desc && <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>{desc}</div>}
  </div>
);

const styles = {
  back: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mauve)', fontSize: 14, marginBottom: 24, fontFamily: 'DM Sans, sans-serif' },
  title: { fontFamily: 'Cormorant Garamond, serif', fontSize: 36, color: 'var(--mauve)', marginBottom: 28 },
  radioGroup: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  summary: { background: 'var(--blush)', borderRadius: 16, padding: 20 },
};
