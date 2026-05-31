import { imgUrl } from '../config';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import toast from 'react-hot-toast';

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ background: 'white', borderRadius: 16, padding: '20px 16px', boxShadow: '0 4px 16px var(--shadow)', textAlign: 'center', borderTop: `4px solid ${color}` }}>
    <div style={{ fontSize: 30, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 700, color, lineHeight: 1 }}>
      {value}
    </div>
    <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 6 }}>{label}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = { pending: '#f59e0b', accepted: '#22c55e', rejected: '#ef4444', delivered: '#8b5cf6' };
  return (
    <span style={{ background: colors[status] || '#94a3b8', color: 'white', padding: '3px 10px', borderRadius: 50, fontSize: 11, fontWeight: 600 }}>
      {status}
    </span>
  );
};

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    API.get('/analytics/dashboard')
      .then(r => { setData(r.data); setLoading(false); })
      .catch(err => {
        const msg = err.response?.data?.error || err.userMessage || 'Could not load dashboard';
        setError(msg);
        setLoading(false);
        toast.error('Dashboard error: ' + msg);
      });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div className="spinner" />
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, color: 'var(--mauve)', marginTop: 16 }}>Dashboard Error</h2>
      <div style={{ background: '#fee2e2', borderRadius: 12, padding: '14px 16px', marginTop: 16, fontSize: 14, color: '#dc2626', textAlign: 'left' }}>
        {error}
      </div>
      <p style={{ color: 'var(--text-light)', fontSize: 13, marginTop: 12 }}>
        Make sure the backend is running and you are logged in as owner.
      </p>
      <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => window.location.reload()}>
        🔄 Retry
      </button>
    </div>
  );

  const d = data || {};

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(26px,5vw,36px)', color: 'var(--mauve)' }}>
          👑 Owner Dashboard
        </h1>
        <p style={{ color: 'var(--text-light)', fontSize: 14, marginTop: 4 }}>
          Welcome back, Hermella! Here's your shop overview 🌸
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
        <Link to="/owner/post"><button className="btn-primary">✨ Post New Item</button></Link>
        <Link to="/owner/orders"><button className="btn-secondary">📦 Orders</button></Link>
        <Link to="/owner/messages"><button className="btn-secondary">
          💬 Messages {d.unreadMessages > 0 ? `(${d.unreadMessages} new)` : ''}
        </button></Link>
        <Link to="/"><button className="btn-secondary">🛍️ View Shop</button></Link>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, marginBottom: 32 }}>
        <StatCard icon="📦" label="Total Orders"    value={d.totalOrders   ?? 0} color="var(--rose)" />
        <StatCard icon="⏳" label="Pending"          value={d.pendingOrders ?? 0} color="#f59e0b" />
        <StatCard icon="💰" label="Revenue (ETB)"    value={(d.totalRevenue ?? 0).toLocaleString()} color="var(--sage)" />
        <StatCard icon="🛍️" label="Products"        value={d.totalProducts ?? 0} color="var(--mauve)" />
        <StatCard icon="👥" label="Customers"        value={d.totalUsers    ?? 0} color="var(--gold)" />
        <StatCard icon="💬" label="Unread Messages"  value={d.unreadMessages ?? 0} color="var(--rose-dark)" />
      </div>

      {/* Top Sales + Top Views side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
        <TableCard title="🔥 Top Sales">
          {!d.topSales?.length ? (
            <EmptyRow text="No products yet" />
          ) : d.topSales.map((p, i) => (
            <div key={p.id} style={ts.row}>
              <span style={ts.rank}>#{i + 1}</span>
              <Thumb src={imgUrl(p.photo)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={ts.name}>{p.name}</div>
                <div style={ts.sub}>{p.category}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ color: 'var(--mauve)', fontWeight: 700, fontSize: 14 }}>{p.sales || 0} sold</div>
                {p.avg_rating > 0 && <div style={{ fontSize: 12, color: 'var(--gold)' }}>★ {Number(p.avg_rating).toFixed(1)}</div>}
              </div>
            </div>
          ))}
        </TableCard>

        <TableCard title="👁️ Most Viewed">
          {!d.topViews?.length ? (
            <EmptyRow text="No products yet" />
          ) : d.topViews.map((p, i) => (
            <div key={p.id} style={ts.row}>
              <span style={ts.rank}>#{i + 1}</span>
              <Thumb src={imgUrl(p.photo)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={ts.name}>{p.name}</div>
                <div style={ts.sub}>{p.category}</div>
              </div>
              <div style={{ color: 'var(--mauve)', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {p.views || 0} views
              </div>
            </div>
          ))}
        </TableCard>
      </div>

      {/* Category stats */}
      {d.categoryStats?.length > 0 && (
        <div style={{ ...ts.card, marginBottom: 24 }}>
          <h2 style={ts.cardTitle}>📊 Category Performance</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
            {d.categoryStats.map(cat => (
              <div key={cat.category} style={{ background: 'var(--blush)', borderRadius: 14, padding: '14px 18px', textAlign: 'center', flex: '1 1 130px' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: 'var(--mauve)', fontWeight: 600, textTransform: 'capitalize' }}>
                  {cat.category}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
                  {cat.count} items · {cat.total_sales || 0} sold
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div style={ts.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={ts.cardTitle}>📦 Recent Orders</h2>
          <Link to="/owner/orders" style={{ color: 'var(--rose-dark)', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
            View All →
          </Link>
        </div>
        {!d.recentOrders?.length ? (
          <EmptyRow text="No orders yet 🌸" />
        ) : d.recentOrders.map(o => (
          <div key={o.id} style={ts.row}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={ts.name}>{o.customer_name || 'Guest'}</div>
              <div style={ts.sub}>
                {o.customer_phone} · {new Date(o.created_at).toLocaleDateString()}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ color: 'var(--mauve)', fontWeight: 700, fontSize: 15 }}>
                ETB {(o.total || 0).toLocaleString()}
              </div>
              <StatusBadge status={o.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TableCard = ({ title, children }) => (
  <div style={ts.card}>
    <h2 style={{ ...ts.cardTitle, marginBottom: 4 }}>{title}</h2>
    {children}
  </div>
);

const Thumb = ({ src }) => (
  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--blush)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
    {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🧶'}
  </div>
);

const EmptyRow = ({ text }) => (
  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-light)', fontSize: 14 }}>{text}</div>
);

const ts = {
  card: { background: 'white', borderRadius: 20, padding: '20px 16px', boxShadow: '0 4px 16px var(--shadow)' },
  cardTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: 'var(--mauve)' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' },
  rank: { fontWeight: 800, color: 'var(--gold)', minWidth: 28, fontSize: 14 },
  name: { fontWeight: 600, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sub: { fontSize: 12, color: 'var(--text-light)', marginTop: 2 },
};
