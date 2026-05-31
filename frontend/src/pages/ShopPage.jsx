import React, { useState, useEffect, useCallback } from 'react';
import API from '../api';
import ProductCard from '../components/ProductCard';
import MessageModal from '../components/MessageModal';

const CATEGORIES = [
  { key:'', label:'All', emoji:'✨' },
  { key:'crochet', label:'Crochet', emoji:'🧶' },
  { key:'dress', label:'Shefon Dress', emoji:'👗' },
  { key:'sketching', label:'Sketching', emoji:'✏️' },
  { key:'stone', label:'Stone Art', emoji:'🪨' },
  { key:'mask', label:'Face Mask', emoji:'🌿' },
];
const SORTS = [
  { key:'newest', label:'Newest' },
  { key:'popular', label:'Most Viewed' },
  { key:'sales', label:'Top Sales' },
  { key:'price_asc', label:'Price ↑' },
  { key:'price_desc', label:'Price ↓' },
];

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [showMessage, setShowMessage] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      if (sort) params.set('sort', sort);
      const r = await API.get(`/products?${params}`);
      setProducts(r.data);
    } catch {}
    setLoading(false);
  }, [category, search, sort]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const topSales = [...products].sort((a,b)=>(b.sales||0)-(a.sales||0)).slice(0,3);
  const featured = products.filter(p=>p.featured===1);

  return (
    <div style={{ minHeight:'100vh' }}>
      {/* Hero */}
      <div style={s.hero}>
        <div style={{ position:'relative', zIndex:2, textAlign:'center', padding:'0 16px' }}>
          <div className="script" style={{ fontSize:17, color:'var(--rose-dark)', marginBottom:6 }}>Welcome to</div>
          <h1 style={s.heroTitle}>TUBA Gifts</h1>
          <p className="script" style={{ fontSize:18, color:'var(--rose-dark)', marginTop:4 }}>Handcrafted by Hermella ✨</p>
          <p style={{ color:'var(--text-light)', fontSize:13, marginTop:8, letterSpacing:1 }}>
            Crochet · Shefon · Sketching · Stone Art · Face Masks
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:20, flexWrap:'wrap' }}>
            <a href="https://t.me/tubagifts" target="_blank" rel="noreferrer">
              <button className="btn-primary">💬 Telegram Group</button>
            </a>
            <button className="btn-secondary" onClick={() => setShowMessage(true)}>✉️ Message Us</button>
          </div>
        </div>
      </div>

      {/* Top sales ticker */}
      {topSales.length > 0 && (
        <div style={s.ticker}>
          <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, overflowX:'auto', paddingBottom:4 }}>
              <span style={{ fontWeight:700, color:'var(--rose-dark)', whiteSpace:'nowrap', fontSize:13 }}>🔥 Top:</span>
              {topSales.map((p,i) => (
                <div key={p.id} style={s.tickerChip}>
                  <span style={{ color:'var(--gold)', fontWeight:700 }}>#{i+1}</span>
                  <span style={{ fontSize:13 }}>{p.name}</span>
                  <span style={{ color:'var(--mauve)', fontWeight:600, fontSize:13 }}>ETB {p.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="page-wrap">
        {/* Search + sort */}
        <div style={s.searchRow}>
          <div style={{ position:'relative', flex:1 }}>
            <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:16, pointerEvents:'none' }}>🔍</span>
            <input placeholder="Search items..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:42, borderRadius:50 }} />
          </div>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{ width:140, borderRadius:50, flexShrink:0 }}>
            {SORTS.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>

        {/* Categories */}
        <div style={s.cats}>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setCategory(c.key)} style={{
              ...s.catBtn,
              background: category===c.key ? 'var(--gradient-rose)' : 'white',
              color: category===c.key ? 'white' : 'var(--mauve)',
              border: `2px solid ${category===c.key ? 'transparent' : 'var(--border)'}`,
            }}>{c.emoji} {c.label}</button>
          ))}
        </div>

        {/* Featured */}
        {featured.length > 0 && !category && !search && (
          <div style={{ marginBottom:36 }}>
            <h2 style={s.secTitle}>⭐ Featured</h2>
            <div style={s.grid}>{featured.slice(0,3).map(p=><ProductCard key={p.id} product={p} onLikeChange={fetchProducts}/>)}</div>
          </div>
        )}

        {/* All items */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
          <h2 style={s.secTitle}>{CATEGORIES.find(c=>c.key===category)?.emoji||'🌸'} {CATEGORIES.find(c=>c.key===category)?.label||'All Items'}</h2>
          <span style={{ color:'var(--text-light)', fontSize:14 }}>{products.length} items</span>
        </div>

        {loading ? (
          <div style={s.grid}>{[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{ height:360, borderRadius:20 }}/>)}</div>
        ) : products.length===0 ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ fontSize:60 }}>🌸</div>
            <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, color:'var(--mauve)', marginTop:14 }}>No items found</h3>
          </div>
        ) : (
          <div style={s.grid}>{products.map(p=><ProductCard key={p.id} product={p} onLikeChange={fetchProducts}/>)}</div>
        )}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <div className="page-wrap">
          <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'clamp(24px,5vw,36px)', color:'white', textAlign:'center', marginBottom:28 }}>Connect With Us 🌸</h2>
          <div style={s.contactGrid}>
            {[
              { icon:'📞', label:'Phone 1', v:'0986813121', href:'tel:0986813121' },
              { icon:'📞', label:'Phone 2', v:'0943145745', href:'tel:0943145745' },
              { icon:'✉️', label:'Email', v:'hermellahenok94@gmail.com', href:'mailto:hermellahenok94@gmail.com' },
              { icon:'💬', label:'Telegram', v:'@H24H3', href:'https://t.me/H24H3' },
              { icon:'👥', label:'Telegram Group', v:'TUBA Gifts', href:'https://t.me/tubagifts' },
              { icon:'🎵', label:'TikTok', v:'@TUBA', href:'https://vm.tiktok.com/ZMSAAsMTf/' },
              { icon:'📍', label:'Location 1', v:'Bole Arabesa' },
              { icon:'📍', label:'Location 2', v:'Hayahulet' },
            ].map(c=>(
              <a key={c.label} href={c.href||'#'} target="_blank" rel="noreferrer" style={{ textDecoration:'none' }}>
                <div style={s.contactCard}>
                  <div style={{ fontSize:22, marginBottom:4 }}>{c.icon}</div>
                  <div style={{ color:'rgba(255,255,255,0.65)', fontSize:11, marginBottom:2 }}>{c.label}</div>
                  <div style={{ color:'white', fontSize:12, fontWeight:500, wordBreak:'break-word', textAlign:'center' }}>{c.v}</div>
                </div>
              </a>
            ))}
          </div>
          <p style={{ textAlign:'center', color:'rgba(255,255,255,0.5)', fontSize:12, marginTop:32 }}>© 2024 TUBA Team by Hermella 💕</p>
        </div>
      </div>

      {showMessage && <MessageModal onClose={() => setShowMessage(false)} />}
    </div>
  );
}

const s = {
  hero:{ position:'relative', overflow:'hidden', background:'linear-gradient(135deg,#f9eded,#fdf6f0,#f0e6f5)', padding:'60px 0 50px', borderBottom:'1px solid var(--border)' },
  heroTitle:{ fontFamily:'Cormorant Garamond,serif', fontSize:'clamp(42px,8vw,80px)', fontWeight:300, color:'var(--mauve)', letterSpacing:6, lineHeight:1 },
  ticker:{ background:'linear-gradient(135deg,#fff5f5,#fff8f0)', borderBottom:'1px solid var(--border)', padding:'14px 0' },
  tickerChip:{ display:'flex', alignItems:'center', gap:8, background:'white', border:'1px solid var(--border)', borderRadius:50, padding:'6px 14px', whiteSpace:'nowrap', boxShadow:'0 2px 6px var(--shadow)', fontSize:13 },
  searchRow:{ display:'flex', gap:10, margin:'24px 0 16px', flexWrap:'wrap' },
  cats:{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:28, overflowX:'auto', paddingBottom:4 },
  catBtn:{ padding:'8px 16px', borderRadius:50, cursor:'pointer', fontSize:13, fontWeight:500, transition:'all 0.2s', whiteSpace:'nowrap', fontFamily:'DM Sans,sans-serif', flexShrink:0 },
  secTitle:{ fontFamily:'Cormorant Garamond,serif', fontSize:'clamp(20px,4vw,26px)', fontWeight:500, color:'var(--mauve)' },
  grid:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:20, marginBottom:48 },
  footer:{ background:'linear-gradient(135deg,var(--mauve-dark),var(--mauve))', padding:'48px 0 32px' },
  contactGrid:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 },
  contactCard:{ background:'rgba(255,255,255,0.1)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:14, padding:'14px 10px', textAlign:'center', transition:'background 0.2s' },
};
