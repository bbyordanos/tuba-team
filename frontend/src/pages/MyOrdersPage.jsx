import { imgUrl } from '../config';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  pending: {
    color: '#f59e0b',
    bg: '#fef3c7',
    icon: '⏳',
    label: 'Pending',
    message: 'Your order has been received! Hermella will review it soon.',
    steps: [true, false, false, false],
  },
  accepted: {
    color: '#22c55e',
    bg: '#dcfce7',
    icon: '✅',
    label: 'Accepted',
    message: 'Great news! Hermella accepted your order and is preparing it 🌸',
    steps: [true, true, false, false],
  },
  rejected: {
    color: '#ef4444',
    bg: '#fee2e2',
    icon: '❌',
    label: 'Rejected',
    message: 'Sorry, this order was rejected. Please contact Hermella for more info.',
    steps: [true, false, false, false],
  },
  delivered: {
    color: '#8b5cf6',
    bg: '#ede9fe',
    icon: '🎀',
    label: 'Delivered',
    message: 'Your order has been delivered! Enjoy your beautiful item 💕',
    steps: [true, true, true, true],
  },
};

const STEPS = ['Order Placed', 'Accepted', 'Preparing', 'Delivered'];

function OrderCard({ order, onClick }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  return (
    <div onClick={onClick} style={styles.card}>
      {/* Header */}
      <div style={styles.cardHeader}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 3 }}>
            Order #{order.id.slice(0, 8).toUpperCase()}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
            📅 {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <span style={{ ...styles.statusBadge, background: cfg.bg, color: cfg.color }}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Progress bar */}
      {order.status !== 'rejected' && (
        <div style={styles.progressWrap}>
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{
                  ...styles.stepDot,
                  background: cfg.steps[i] ? cfg.color : '#e5e7eb',
                  boxShadow: cfg.steps[i] ? `0 0 0 3px ${cfg.bg}` : 'none',
                }}>
                  {cfg.steps[i] ? '✓' : ''}
                </div>
                <span style={{ fontSize: 10, color: cfg.steps[i] ? cfg.color : '#9ca3af', textAlign: 'center', fontWeight: cfg.steps[i] ? 600 : 400 }}>
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ ...styles.stepLine, background: cfg.steps[i + 1] ? cfg.color : '#e5e7eb', marginBottom: 18 }} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {order.status === 'rejected' && (
        <div style={{ background: '#fee2e2', borderRadius: 10, padding: '10px 14px', marginTop: 8 }}>
          <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>
            ❌ This order was rejected. Please contact Hermella for help.
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={styles.cardFooter}>
        <div>
          <span style={{ fontSize: 13, color: 'var(--text-light)' }}>{order.delivery_option} · {order.payment_method}</span>
        </div>
        <span className="price" style={{ fontSize: 20 }}>ETB {order.total?.toLocaleString()}</span>
      </div>

      <div style={{ textAlign: 'right', marginTop: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--rose-dark)', fontWeight: 500 }}>Tap to view details →</span>
      </div>
    </div>
  );
}

function OrderDetailModal({ order, onClose }) {
  const [items, setItems] = useState([]);
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  useEffect(() => {
    API.get(`/orders/${order.id}`).then(r => setItems(r.data.items || [])).catch(() => {});
  }, [order.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 20px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: 'var(--mauve)' }}>
                Order Details
              </h2>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
                #{order.id.slice(0, 8).toUpperCase()}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-light)', padding: 4 }}>✕</button>
          </div>

          {/* Big status */}
          <div style={{ ...styles.bigStatus, background: cfg.bg, borderLeft: `4px solid ${cfg.color}` }}>
            <div style={{ fontSize: 28 }}>{cfg.icon}</div>
            <div>
              <div style={{ fontWeight: 700, color: cfg.color, fontSize: 16 }}>{cfg.label}</div>
              <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 2 }}>{cfg.message}</div>
            </div>
          </div>

          {/* Progress steps */}
          {order.status !== 'rejected' && (
            <div style={{ ...styles.progressWrap, margin: '20px 0' }}>
              {STEPS.map((step, i) => (
                <React.Fragment key={step}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                    <div style={{ ...styles.stepDot, width: 28, height: 28, fontSize: 13, background: cfg.steps[i] ? cfg.color : '#e5e7eb', boxShadow: cfg.steps[i] ? `0 0 0 4px ${cfg.bg}` : 'none' }}>
                      {cfg.steps[i] ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: 11, color: cfg.steps[i] ? cfg.color : '#9ca3af', textAlign: 'center', fontWeight: cfg.steps[i] ? 600 : 400 }}>
                      {step}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ ...styles.stepLine, background: cfg.steps[i + 1] ? cfg.color : '#e5e7eb', marginBottom: 20 }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Order items */}
          {items.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: 'var(--mauve)', marginBottom: 10 }}>Items Ordered</div>
              {items.map(item => (
                <div key={item.id} style={styles.itemRow}>
                  <div style={styles.itemThumb}>
                    {item.photo
                      ? <img src={imgUrl(item.photo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 22 }}>🧶</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{item.category} · Qty: {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--mauve)', fontSize: 15 }}>
                    ETB {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Order info */}
          <div style={{ background: 'var(--blush)', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <InfoRow label="Name" value={order.customer_name} />
            <InfoRow label="Phone" value={order.customer_phone} href={`tel:${order.customer_phone}`} />
            <InfoRow label="Delivery" value={order.delivery_option} />
            {order.location && <InfoRow label="Address" value={order.location} />}
            <InfoRow label="Payment" value={order.payment_method} />
            {order.note && <InfoRow label="Note" value={order.note} />}
            <InfoRow label="Date" value={new Date(order.created_at).toLocaleString()} />
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17 }}>Total</span>
              <span className="price" style={{ fontSize: 22 }}>ETB {order.total?.toLocaleString()}</span>
            </div>
          </div>

          {/* Contact Hermella */}
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="tel:0986813121" style={{ flex: 1, textDecoration: 'none' }}>
              <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>📞 Call</button>
            </a>
            <a href="https://t.me/H24H3" target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: 'none' }}>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>💬 Telegram</button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const InfoRow = ({ label, value, href }) => (
  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
    <span style={{ color: 'var(--text-light)', fontSize: 12, minWidth: 64, paddingTop: 1 }}>{label}:</span>
    {href
      ? <a href={href} style={{ color: 'var(--mauve)', fontWeight: 500, fontSize: 13, textDecoration: 'none' }}>{value}</a>
      : <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)' }}>{value}</span>}
  </div>
);

export default function MyOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    API.get('/orders/my/orders')
      .then(r => { setOrders(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  // Auto-refresh every 10 seconds so status updates appear
  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => {
      API.get('/orders/my/orders').then(r => setOrders(r.data)).catch(() => {});
    }, 10000);
    return () => clearInterval(t);
  }, [user]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page-wrap" style={{ maxWidth: 680 }}>
      <h1 style={styles.title}>📦 My Orders</h1>
      <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 24 }}>
        Track the status of your orders in real time 🌸
      </p>

      {/* Status legend */}
      <div style={styles.legend}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ ...styles.legendDot, background: cfg.color }} />
            <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{cfg.icon} {cfg.label}</span>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 64 }}>🛍️</div>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, color: 'var(--mauve)', marginTop: 16 }}>
            No orders yet
          </h3>
          <p style={{ color: 'var(--text-light)', marginTop: 8 }}>Start shopping to see your orders here 🌸</p>
          <Link to="/">
            <button className="btn-primary" style={{ marginTop: 20 }}>Shop Now ✨</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => (
            <OrderCard key={order.id} order={order} onClick={() => setSelected(order)} />
          ))}
        </div>
      )}

      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const styles = {
  title: { fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px,6vw,36px)', color: 'var(--mauve)', marginBottom: 6 },
  legend: { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20, padding: '12px 16px', background: 'white', borderRadius: 14, boxShadow: '0 2px 10px var(--shadow)' },
  legendDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  card: {
    background: 'white', borderRadius: 20, padding: '18px 16px',
    boxShadow: '0 4px 20px var(--shadow)', cursor: 'pointer',
    transition: 'all 0.25s ease', border: '2px solid transparent',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
  statusBadge: { padding: '5px 12px', borderRadius: 50, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 },
  progressWrap: { display: 'flex', alignItems: 'center', marginBottom: 14 },
  stepDot: {
    width: 22, height: 22, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
    transition: 'all 0.3s',
  },
  stepLine: { flex: 1, height: 3, borderRadius: 2, transition: 'background 0.3s' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' },
  bigStatus: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 14, marginBottom: 8 },
  itemRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' },
  itemThumb: { width: 48, height: 48, borderRadius: 10, background: 'var(--blush)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
};
