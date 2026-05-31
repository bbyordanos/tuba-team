import { imgUrl } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import OrderModal from '../components/OrderModal';

const Stars = ({ rating, onRate, interactive }) => {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          onClick={() => interactive && onRate?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          style={{ fontSize: interactive ? 28 : 16, color: i <= (hover || rating || 0) ? '#c9a96e' : '#e0d0d0', cursor: interactive ? 'pointer' : 'default', transition: 'color 0.15s' }}>
          ★
        </span>
      ))}
    </div>
  );
};

const CATEGORIES = ['crochet','dress','sketching','stone','mask','other'];
const CAT_LABELS = { crochet:'🧶 Crochet', dress:'👗 Shefon Dress', sketching:'✏️ Sketching', stone:'🪨 Stone Art', mask:'🌿 Face Mask', other:'✨ Other' };

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const isOwner = user?.role === 'owner';

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showOrder, setShowOrder] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const [lightbox, setLightbox] = useState(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [newPhotos, setNewPhotos] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const load = async () => {
    try {
      const r = await API.get(`/products/${id}`);
      setProduct(r.data);
      setLiked(r.data.user_liked);
      setLikeCount(r.data.like_count || 0);
      setUserRating(r.data.user_rating?.rating || 0);
      setEditForm({ name: r.data.name, description: r.data.description||'', price: r.data.price, original_price: r.data.original_price||'', category: r.data.category, stock: r.data.stock, featured: r.data.featured===1 });
    } catch { toast.error('Product not found'); navigate('/'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleLike = async () => {
    if (!user) { toast('Sign in to like 💕'); return; }
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(c => newLiked ? c + 1 : c - 1);
    try {
      await API.post(`/products/${id}/like`);
    } catch {
      setLiked(!newLiked);
      setLikeCount(c => newLiked ? c - 1 : c + 1);
    }
  };

  const handleCart = async () => {
    if (!user) { toast('Sign in to add to cart 🛒'); return; }
    await addToCart(id); toast.success('Added to cart! 🛍️');
  };

  const submitRating = async () => {
    if (!user) { toast('Sign in to review 💕'); return; }
    setSubmittingRating(true);
    try {
      await API.post(`/products/${id}/rate`, { rating: userRating, review });
      toast.success('Review submitted! 💕'); setReview(''); load();
    } catch { toast.error('Could not submit'); }
    setSubmittingRating(false);
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    await API.delete(`/products/${id}/reviews/${reviewId}`);
    toast.success('Review deleted'); load();
  };

  const deleteProduct = async () => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    await API.delete(`/products/${id}`);
    toast.success('Product deleted');
    navigate('/owner');
  };

  const deletePhoto = async (photoId) => {
    if (!window.confirm('Remove this photo?')) return;
    await API.delete(`/products/${id}/photos/${photoId}`);
    toast.success('Photo removed'); load();
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(editForm).forEach(([k,v]) => fd.append(k, v));
      newPhotos.forEach(ph => fd.append('photos', ph));
      await API.put(`/products/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Saved! 🌸'); setEditing(false); setNewPhotos([]); setNewPreviews([]); load();
    } catch { toast.error('Could not save'); }
    setSaving(false);
  };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:100 }}><div className="spinner"/></div>;
  if (!product) return null;

  const photos = product.photos || [];

  return (
    <div className="page-wrap">
      {/* Back + owner actions */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <button onClick={() => navigate(-1)} style={s.back}>← Back</button>
        {isOwner && !editing && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button onClick={() => setEditing(true)} className="btn-secondary" style={{ padding:'8px 16px' }}>✏️ Edit</button>
            <button onClick={deleteProduct} className="btn-danger">🗑️ Delete</button>
          </div>
        )}
        {isOwner && editing && (
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => { setEditing(false); setNewPhotos([]); setNewPreviews([]); }} className="btn-secondary" style={{ padding:'8px 16px' }}>Cancel</button>
            <button onClick={saveEdit} className="btn-primary" disabled={saving} style={{ padding:'8px 20px' }}>
              {saving ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div style={s.layout}>
        {/* Photos */}
        <div style={s.photoSection}>
          <div style={s.mainPhoto}>
            {photos[selectedPhoto]?.url ? (
              <img
                src={imgUrl(photos[selectedPhoto].url)}
                alt={product.name}
                onClick={() => !editing && setLightbox(selectedPhoto)}
                style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:20, cursor: editing ? 'default' : 'zoom-in' }}
              />
            ) : (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', fontSize:70 }}>🧶</div>
            )}
            <button onClick={handleLike} style={s.likeBtn}>{liked ? '❤️' : '🤍'} {likeCount}</button>
            {!editing && photos[selectedPhoto]?.url && (
              <button onClick={() => setLightbox(selectedPhoto)} style={s.expandBtn} title="View fullscreen">⤢</button>
            )}
          </div>
          {photos.length > 1 && (
            <div style={s.thumbs}>
              {photos.map((ph, i) => (
                <div key={ph.id} style={{ position:'relative' }}>
                  <div
                    onClick={() => { setSelectedPhoto(i); if (!editing) setLightbox(i); }}
                    style={{ ...s.thumb, border:`3px solid ${i===selectedPhoto?'var(--rose)':'transparent'}` }}>
                    <img src={imgUrl(ph.url)} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10 }} />
                  </div>
                  {isOwner && editing && (
                    <button onClick={() => deletePhoto(ph.id)} style={s.delPhotoBtn}>✕</button>
                  )}
                </div>
              ))}
              {isOwner && editing && (
                <>
                  {newPreviews.map((src, i) => (
                    <div key={i} style={{ ...s.thumb, border:'2px dashed var(--rose)', opacity:0.7 }}>
                      <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:10 }} />
                    </div>
                  ))}
                  <button onClick={() => fileRef.current.click()} style={s.addPhotoThumb}>+</button>
                  <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => {
                    const files = Array.from(e.target.files);
                    setNewPhotos(prev => [...prev, ...files]);
                    setNewPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
                  }} />
                </>
              )}
            </div>
          )}
          {isOwner && editing && photos.length === 0 && (
            <div>
              <button onClick={() => fileRef.current.click()} className="btn-secondary" style={{ width:'100%', marginTop:10 }}>📷 Add Photos</button>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => {
                const files = Array.from(e.target.files);
                setNewPhotos(prev => [...prev, ...files]);
                setNewPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
              }} />
            </div>
          )}
        </div>

        {/* Info */}
        <div style={s.info}>
          {editing ? (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <EditField label="Name">
                <input value={editForm.name} onChange={e => setEditForm(f=>({...f,name:e.target.value}))} />
              </EditField>
              <EditField label="Category">
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {CATEGORIES.map(c => (
                    <button key={c} type="button" onClick={() => setEditForm(f=>({...f,category:c}))} style={{
                      padding:'7px 14px', borderRadius:50, cursor:'pointer', fontSize:13,
                      fontFamily:'DM Sans,sans-serif',
                      background: editForm.category===c ? 'var(--gradient-rose)' : 'white',
                      color: editForm.category===c ? 'white' : 'var(--mauve)',
                      border:`2px solid ${editForm.category===c?'transparent':'var(--border)'}`,
                    }}>{CAT_LABELS[c]}</button>
                  ))}
                </div>
              </EditField>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <EditField label="Price (ETB)">
                  <input type="number" value={editForm.price} onChange={e => setEditForm(f=>({...f,price:e.target.value}))} />
                </EditField>
                <EditField label="Original Price">
                  <input type="number" value={editForm.original_price} onChange={e => setEditForm(f=>({...f,original_price:e.target.value}))} placeholder="for discount" />
                </EditField>
              </div>
              <EditField label="Stock">
                <input type="number" value={editForm.stock} onChange={e => setEditForm(f=>({...f,stock:e.target.value}))} />
              </EditField>
              <EditField label="Description">
                <textarea value={editForm.description} onChange={e => setEditForm(f=>({...f,description:e.target.value}))} style={{ minHeight:100, resize:'vertical' }} />
              </EditField>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14 }}>
                <input type="checkbox" checked={editForm.featured} onChange={e => setEditForm(f=>({...f,featured:e.target.checked}))} style={{ width:18, height:18, accentColor:'var(--rose)' }} />
                ⭐ Featured item
              </label>
            </div>
          ) : (
            <>
              <span className="tag" style={{ display:'inline-block', marginBottom:10 }}>{product.category}</span>
              <h1 style={s.name}>{product.name}</h1>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <Stars rating={product.avg_rating} />
                <span style={{ color:'var(--text-light)', fontSize:14 }}>
                  {product.avg_rating ? Number(product.avg_rating).toFixed(1) : 'No ratings'} ({product.review_count||0})
                </span>
              </div>
              <div style={{ marginBottom:16 }}>
                <span className="price" style={{ fontSize:28 }}>ETB {product.price?.toLocaleString()}</span>
                {product.original_price && <span className="price-original" style={{ marginLeft:12, fontSize:16 }}>ETB {product.original_price?.toLocaleString()}</span>}
              </div>
              <div style={s.statsRow}>
                <Stat icon="👁" v={product.views||0} label="Views" />
                <Stat icon="🛒" v={product.sales||0} label="Sold" />
                <Stat icon="❤️" v={likeCount} label="Likes" />
                <Stat icon="🛍️" v={product.cart_count||0} label="Carts" />
              </div>
              <div style={s.desc}>
                <div style={s.descTitle}>Description</div>
                <p style={{ color:'var(--text-light)', lineHeight:1.7, fontSize:15 }}>{product.description || 'No description yet.'}</p>
              </div>
              {!isOwner && (
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
                  <button className="btn-primary" onClick={handleCart} style={{ flex:1, justifyContent:'center', minWidth:140 }}>🛒 Add to Cart</button>
                  <button className="btn-gold" onClick={() => setShowOrder(true)} style={{ flex:1, justifyContent:'center', minWidth:140 }}>📦 Order Now</button>
                </div>
              )}
              <div style={s.contactBox}>
                <div style={s.descTitle}>📞 Contact & Order</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <CR icon="📞" label="Phone 1" v="0986813121" href="tel:0986813121" />
                  <CR icon="📞" label="Phone 2" v="0943145745" href="tel:0943145745" />
                  <CR icon="✉️" label="Email" v="hermellahenok94@gmail.com" href="mailto:hermellahenok94@gmail.com" />
                  <CR icon="💬" label="Telegram" v="@H24H3" href="https://t.me/H24H3" />
                  <CR icon="👥" label="Group" v="TUBA Gifts" href="https://t.me/tubagifts" />
                  <CR icon="🎵" label="TikTok" v="@TUBA" href="https://vm.tiktok.com/ZMSAAsMTf/" />
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
                  {['📍 Bole Arabesa','📍 Hayahulet','🚚 Delivery','💳 TeleBirr','💳 CBE','💳 BOA','💵 Cash'].map(t=>(
                    <span key={t} className="tag" style={{ fontSize:12 }}>{t}</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div style={s.reviewsSection}>
        <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:28, color:'var(--mauve)', marginBottom:20 }}>Customer Reviews 💬</h2>
        {user && !isOwner && (
          <div style={s.addReview}>
            <h4 style={{ marginBottom:10, color:'var(--mauve)', fontSize:16 }}>Rate This Item</h4>
            <Stars rating={userRating} onRate={setUserRating} interactive />
            <textarea placeholder="Share your experience 💕" value={review} onChange={e=>setReview(e.target.value)} style={{ marginTop:10, minHeight:70, resize:'vertical' }} />
            <button className="btn-primary" onClick={submitRating} disabled={!userRating||submittingRating} style={{ marginTop:10, opacity:(!userRating||submittingRating)?0.6:1 }}>
              {submittingRating ? '⏳...' : '✨ Submit Review'}
            </button>
          </div>
        )}
        {product.reviews?.length === 0 ? (
          <p style={{ color:'var(--text-light)', textAlign:'center', padding:'32px 0' }}>No reviews yet 🌸</p>
        ) : product.reviews?.map(r => (
          <div key={r.id} style={s.reviewCard}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
              <div style={s.reviewAvatar}>{r.user_name?.[0]?.toUpperCase()}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{r.user_name}</div>
                <div style={{ fontSize:12, color:'var(--text-light)' }}>{new Date(r.created_at).toLocaleDateString()}</div>
              </div>
              <Stars rating={r.rating} />
              {isOwner && (
                <button onClick={() => deleteReview(r.id)} className="btn-danger" style={{ padding:'4px 10px', fontSize:12 }}>🗑️ Delete</button>
              )}
            </div>
            {r.review && <p style={{ color:'var(--text-light)', fontSize:14, lineHeight:1.6 }}>{r.review}</p>}
          </div>
        ))}
      </div>

      {showOrder && <OrderModal product={product} onClose={() => setShowOrder(false)} />}

      {/* Fullscreen lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <Lightbox
          photos={photos}
          index={lightbox}
          onChange={setLightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

const Stat = ({ icon, v, label }) => (
  <div style={{ textAlign:'center', background:'var(--blush)', borderRadius:12, padding:'10px 12px', flex:1, minWidth:60 }}>
    <div style={{ fontSize:18 }}>{icon}</div>
    <div style={{ fontSize:18, fontWeight:700, color:'var(--mauve)' }}>{v}</div>
    <div style={{ fontSize:11, color:'var(--text-light)' }}>{label}</div>
  </div>
);

const CR = ({ icon, label, v, href }) => (
  <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:8 }}>
    <span style={{ fontSize:16 }}>{icon}</span>
    <span style={{ color:'var(--text-light)', fontSize:12, minWidth:60 }}>{label}:</span>
    <span style={{ color:'var(--mauve)', fontWeight:500, fontSize:13 }}>{v}</span>
  </a>
);

const EditField = ({ label, children }) => (
  <div>
    <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--mauve)', marginBottom:5 }}>{label}</label>
    {children}
  </div>
);

const s = {
  back:{ background:'none', border:'none', cursor:'pointer', color:'var(--mauve)', fontSize:14, fontFamily:'DM Sans,sans-serif' },
  layout:{ display:'grid', gridTemplateColumns:'1fr', gap:24, marginBottom:36 },
  photoSection:{ display:'flex', flexDirection:'column', gap:10 },
  mainPhoto:{ position:'relative', height:320, background:'var(--blush)', borderRadius:20, overflow:'hidden' },
  expandBtn:{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,0.85)', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px var(--shadow)', backdropFilter:'blur(4px)' },
  thumbs:{ display:'flex', gap:8, flexWrap:'wrap' },
  thumb:{ width:72, height:72, borderRadius:10, overflow:'hidden', cursor:'pointer', transition:'border 0.15s', position:'relative' },
  delPhotoBtn:{ position:'absolute', top:-6, right:-6, background:'#ef4444', color:'white', border:'none', borderRadius:'50%', width:20, height:20, cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, zIndex:2 },
  addPhotoThumb:{ width:72, height:72, borderRadius:10, background:'var(--blush)', border:'2px dashed var(--border)', cursor:'pointer', fontSize:24, display:'flex', alignItems:'center', justifyContent:'center' },
  info:{ display:'flex', flexDirection:'column' },
  name:{ fontFamily:'Cormorant Garamond,serif', fontSize:'clamp(24px,5vw,36px)', fontWeight:500, color:'var(--text)', marginBottom:10, lineHeight:1.2 },
  statsRow:{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' },
  desc:{ background:'var(--blush)', borderRadius:14, padding:16, marginBottom:16 },
  descTitle:{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'var(--mauve)', marginBottom:7 },
  contactBox:{ background:'linear-gradient(135deg,#fff5f5,#fff8f0)', border:'1px solid var(--border)', borderRadius:14, padding:16 },
  reviewsSection:{ background:'white', borderRadius:20, padding:'24px 20px', boxShadow:'0 4px 20px var(--shadow)' },
  addReview:{ background:'var(--blush)', borderRadius:14, padding:18, marginBottom:20 },
  reviewCard:{ background:'var(--blush)', borderRadius:14, padding:16, marginBottom:12 },
  reviewAvatar:{ width:38, height:38, borderRadius:'50%', background:'var(--gradient-rose)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Cormorant Garamond,serif', fontSize:17, fontWeight:700, flexShrink:0 },
};

// Responsive 2-col layout on larger screens
const mediaStyle = document.createElement('style');
mediaStyle.textContent = `@media(min-width:768px){ .pd-layout { grid-template-columns: 1fr 1fr !important; } .pd-main-photo { height: 460px !important; } }`;
document.head.appendChild(mediaStyle);

function Lightbox({ photos, index, onChange, onClose }) {
  const total = photos.length;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onChange(i => (i + 1) % total);
      if (e.key === 'ArrowLeft') onChange(i => (i - 1 + total) % total);
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [total]);

  const touchStart = React.useRef(null);
  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) onChange(i => (i + 1) % total);
      else onChange(i => (i - 1 + total) % total);
    }
    touchStart.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <button onClick={onClose} style={lb.closeBtn}>✕</button>

      {total > 1 && (
        <div style={lb.counter}>{index + 1} / {total}</div>
      )}

      {total > 1 && (
        <button onClick={e => { e.stopPropagation(); onChange(i => (i - 1 + total) % total); }} style={{ ...lb.arrow, left: 12 }}>
          ‹
        </button>
      )}

      <img
        src={imgUrl(photos[index].url)}
        alt=""
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '92vw', maxHeight: '88vh',
          objectFit: 'contain', borderRadius: 12,
          boxShadow: '0 8px 60px rgba(0,0,0,0.6)',
          userSelect: 'none', display: 'block',
        }}
      />

      {total > 1 && (
        <button onClick={e => { e.stopPropagation(); onChange(i => (i + 1) % total); }} style={{ ...lb.arrow, right: 12 }}>
          ›
        </button>
      )}

      {total > 1 && (
        <div style={lb.strip} onClick={e => e.stopPropagation()}>
          {photos.map((ph, i) => (
            <div key={ph.id} onClick={() => onChange(i)} style={{
              ...lb.stripThumb,
              border: `3px solid ${i === index ? '#e8a0a0' : 'rgba(255,255,255,0.25)'}`,
              opacity: i === index ? 1 : 0.5,
            }}>
              <img src={imgUrl(ph.url)} alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const lb = {
  closeBtn: {
    position: 'absolute', top: 16, right: 16,
    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
    border: 'none', color: 'white', borderRadius: '50%',
    width: 44, height: 44, fontSize: 22, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10, fontWeight: 300,
  },
  counter: {
    position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
    color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500,
    background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: 50,
    zIndex: 10,
  },
  arrow: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.15)', color: 'white',
    borderRadius: '50%', width: 48, height: 48,
    fontSize: 34, cursor: 'pointer', zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 200,
  },
  strip: {
    position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: 8, zIndex: 10,
    background: 'rgba(0,0,0,0.45)', padding: '8px 12px', borderRadius: 16,
    backdropFilter: 'blur(8px)', maxWidth: '90vw', overflowX: 'auto',
  },
  stripThumb: {
    width: 52, height: 52, borderRadius: 8,
    overflow: 'hidden', cursor: 'pointer',
    transition: 'all 0.2s', flexShrink: 0,
  },
};
