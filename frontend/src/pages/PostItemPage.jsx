import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import toast from 'react-hot-toast';

const CATEGORIES = ['crochet', 'dress', 'sketching', 'stone', 'mask', 'other'];
const CAT_LABELS = { crochet: '🧶 Crochet', dress: '👗 Shefon Dress', sketching: '✏️ Sketching', stone: '🪨 Stone Art', mask: '🌿 Face Mask', other: '✨ Other' };

export default function PostItemPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef();
  const [form, setForm] = useState({ name: '', description: '', price: '', original_price: '', category: 'crochet', stock: '1', featured: false });
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removePhoto = (i) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) { toast.error('Name, price and category are required'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      photos.forEach(ph => fd.append('photos', ph));
      await API.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Item posted successfully! 🌸');
      navigate('/owner');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not post item');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
      <button onClick={() => navigate('/owner')} style={styles.back}>← Dashboard</button>
      <h1 style={styles.title}>✨ Post New Item</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Photos */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📸 Photos</h3>
          <div style={styles.photoGrid}>
            {previews.map((src, i) => (
              <div key={i} style={styles.photoPreview}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                {i === 0 && <span style={styles.primaryBadge}>Primary</span>}
                <button type="button" onClick={() => removePhoto(i)} style={styles.removePhotoBtn}>✕</button>
              </div>
            ))}
            <button type="button" onClick={() => fileInputRef.current.click()} style={styles.addPhotoBtn}>
              <span style={{ fontSize: 32 }}>📷</span>
              <span style={{ fontSize: 13, color: 'var(--text-light)' }}>Add Photos</span>
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handlePhotos} />
          <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 8 }}>
            First photo will be the primary display image. You can add up to 10 photos.
          </p>
        </div>

        {/* Basic Info */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📝 Item Details</h3>
          <Field label="Item Name *">
            <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Handmade Crochet Bag" />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Describe your beautiful item... materials, size, colors, care instructions 💕"
              style={{ minHeight: 120, resize: 'vertical', marginTop: 0 }} />
          </Field>
        </div>

        {/* Category */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🏷️ Category</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} type="button" onClick={() => set('category', c)} style={{
                padding: '9px 18px', borderRadius: 50, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
                background: form.category === c ? 'var(--gradient-rose)' : 'white',
                color: form.category === c ? 'white' : 'var(--mauve)',
                border: `2px solid ${form.category === c ? 'transparent' : 'var(--border)'}`,
                transition: 'all 0.2s',
              }}>{CAT_LABELS[c]}</button>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>💰 Pricing</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Price (ETB) *">
              <input required type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="500" />
            </Field>
            <Field label="Original Price (ETB)">
              <input type="number" min="0" value={form.original_price} onChange={e => set('original_price', e.target.value)} placeholder="650 (for discounts)" />
            </Field>
          </div>
          {form.original_price && form.price && Number(form.original_price) > Number(form.price) && (
            <div style={{ background: '#fff3f3', borderRadius: 12, padding: '10px 16px', marginTop: 8, fontSize: 13, color: '#c97b7b' }}>
              🎉 {Math.round((1 - form.price / form.original_price) * 100)}% discount will be shown!
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
            <Field label="Stock">
              <input type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} />
            </Field>
            <Field label="Featured Item">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--rose)' }} />
                  Show as Featured ⭐
                </label>
              </div>
            </Field>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}
          style={{ justifyContent: 'center', padding: '16px', fontSize: 16, opacity: loading ? 0.7 : 1 }}>
          {loading ? '⏳ Posting...' : '🌸 Post Item'}
        </button>
      </form>
    </div>
  );
}

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 4 }}>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--mauve)', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const styles = {
  back: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mauve)', fontSize: 14, marginBottom: 24, fontFamily: 'DM Sans, sans-serif' },
  title: { fontFamily: 'Cormorant Garamond, serif', fontSize: 36, color: 'var(--mauve)', marginBottom: 28 },
  section: { background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 16px var(--shadow)', display: 'flex', flexDirection: 'column', gap: 12 },
  sectionTitle: { fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: 'var(--mauve)', marginBottom: 4 },
  photoGrid: { display: 'flex', flexWrap: 'wrap', gap: 12 },
  photoPreview: {
    width: 120, height: 120, borderRadius: 12,
    overflow: 'hidden', position: 'relative',
    border: '2px solid var(--border)',
  },
  primaryBadge: {
    position: 'absolute', bottom: 4, left: 4,
    background: 'var(--gradient-rose)', color: 'white',
    fontSize: 10, padding: '2px 6px', borderRadius: 50, fontWeight: 600,
  },
  removePhotoBtn: {
    position: 'absolute', top: 4, right: 4,
    background: 'rgba(0,0,0,0.5)', color: 'white',
    border: 'none', borderRadius: '50%',
    width: 24, height: 24, cursor: 'pointer', fontSize: 12,
  },
  addPhotoBtn: {
    width: 120, height: 120, borderRadius: 12,
    border: '2px dashed var(--border)', background: 'var(--blush)',
    cursor: 'pointer', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
};
