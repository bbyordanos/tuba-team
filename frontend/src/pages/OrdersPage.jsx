import { imgUrl } from '../config';
import React, { useState, useEffect } from 'react';
import API from '../api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: '#f59e0b', accepted: '#22c55e',
  rejected: '#ef4444', delivered: '#8b5cf6',
};

const StatusBadge = ({ status }) => (
  <span style={{
    background: STATUS_COLORS[status] || '#94a3b8',
    color: 'white', padding: '3px 12px',
    borderRadius: 50, fontSize: 12, fontWeight: 600,
  }}>{status}</span>
);

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const r = await API.get(`/orders${params}`);
      setOrders(r.data);
    } catch { toast.error('Failed to load orders'); }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/orders/${id}/status`, { status });
      toast.success(`Order marked as ${status}! ✨`);
      fetchOrders();
    } catch { toast.error('Could not update status'); }
  };

  const loadDetail = async (id) => {
    if (expanded?.id === id) { setExpanded(null); return; }
    try {
      const r = await API.get(`/orders/${id}`);
      setExpanded(r.data);
    } catch {}
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={styles.pageTitle}>📦 Orders</h1>
        <p style={{ color: 'var(--text-light)' }}>Manage and track all customer orders</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['', 'pending', 'accepted', 'delivered', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding: '8px 18px', borderRadius: 50, border: 'none',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: filter === s ? 'var(--gradient-rose)' : 'white',
              color: filter === s ? 'white' : 'var(--text-light)',
              boxShadow: '0 2px 8px var(--shadow)',
              fontFamily: 'DM Sans, sans-serif',
            }}>
            {s === '' ? 'All Orders' : s.charAt(0).toUpperCase() + s.slice(1)}
            {' '}({orders.filter(o => s === '' || o.status === s).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 60 }}>📦</div>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, marginTop: 16, color: 'var(--mauve)' }}>No orders yet</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => (
            <div key={order.id} style={styles.orderCard}>
              <div style={styles.orderHeader} onClick={() => loadDetail(order.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                  <div style={styles.orderNumber}>#{order.id.slice(0, 6).toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{order.customer_name || 'Guest'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
                      📞 {order.customer_phone} · {new Date(order.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--mauve)', fontSize: 16 }}>
                      ETB {order.total?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
                      {order.item_count} item{order.item_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                  <span style={{ color: 'var(--text-light)', fontSize: 18 }}>
                    {expanded?.id === order.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {expanded?.id === order.id && (
                <div style={styles.orderDetail}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
                    <div style={styles.detailBox}>
                      <h4 style={styles.detailTitle}>Customer Info</h4>
                      <InfoRow label="Name" value={order.customer_name} />
                      <InfoRow label="Phone" value={order.customer_phone} />
                      <InfoRow label="Email" value={order.customer_email} />
                      <InfoRow label="Location" value={order.location} />
                      {order.note && <InfoRow label="Note" value={order.note} />}
                    </div>
                    <div style={styles.detailBox}>
                      <h4 style={styles.detailTitle}>Order Details</h4>
                      <InfoRow label="Delivery" value={order.delivery_option} />
                      <InfoRow label="Payment" value={order.payment_method} />
                      <InfoRow label="Status" value={order.status} />
                      <InfoRow label="Total" value={`ETB ${order.total?.toLocaleString()}`} />
                    </div>
                  </div>

                  {/* Items */}
                  <h4 style={{ ...styles.detailTitle, marginBottom: 12 }}>Items Ordered</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {expanded.items?.map(item => (
                      <div key={item.id} style={styles.itemRow}>
                        <div style={styles.itemThumb}>
                          {item.photo
                            ? <img src={imgUrl(item.photo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: 20 }}>🧶</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{item.category}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600, color: 'var(--mauve)' }}>ETB {item.price?.toLocaleString()}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>x{item.quantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  {order.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn-primary" onClick={() => updateStatus(order.id, 'accepted')}
                        style={{ flex: 1, justifyContent: 'center' }}>
                        ✅ Accept Order
                      </button>
                      <button onClick={() => updateStatus(order.id, 'rejected')}
                        style={{ flex: 1, padding: '12px', borderRadius: 50, border: '2px solid #ef4444', background: 'white', color: '#ef4444', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>
                        ❌ Reject
                      </button>
                    </div>
                  )}
                  {order.status === 'accepted' && (
                    <button className="btn-gold" onClick={() => updateStatus(order.id, 'delivered')}
                      style={{ width: '100%', justifyContent: 'center' }}>
                      🚚 Mark as Delivered
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const InfoRow = ({ label, value }) => value ? (
  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
    <span style={{ color: 'var(--text-light)', fontSize: 13, minWidth: 70 }}>{label}:</span>
    <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
  </div>
) : null;

const styles = {
  pageTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: 36, color: 'var(--mauve)', marginBottom: 4 },
  orderCard: {
    background: 'white', borderRadius: 20,
    boxShadow: '0 4px 16px var(--shadow)', overflow: 'hidden',
  },
  orderHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', cursor: 'pointer',
    transition: 'background 0.2s',
  },
  orderNumber: {
    background: 'var(--blush)', color: 'var(--mauve)',
    padding: '4px 10px', borderRadius: 8,
    fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
  },
  orderDetail: {
    padding: '0 24px 24px',
    borderTop: '1px solid var(--border)',
    paddingTop: 20,
  },
  detailBox: {
    background: 'var(--blush)', borderRadius: 14, padding: 16,
  },
  detailTitle: {
    fontFamily: 'Cormorant Garamond, serif', fontSize: 16,
    color: 'var(--mauve)', marginBottom: 10,
  },
  itemRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'var(--blush)', borderRadius: 12, padding: '10px 14px',
  },
  itemThumb: {
    width: 48, height: 48, borderRadius: 10,
    background: 'white', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
};
