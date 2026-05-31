import { imgUrl } from '../config';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../api';
import toast from 'react-hot-toast';

const CATEGORY_EMOJI = {
  crochet: '🧶', dress: '👗', sketching: '✏️',
  stone: '🪨', mask: '🌿', other: '✨',
};

const Stars = ({ rating }) => {
  const stars = Math.round(rating || 0);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= stars ? '#c9a96e' : '#e0d0d0', fontSize: 12 }}>★</span>
      ))}
    </div>
  );
};

export default function ProductCard({ product, onLikeChange }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [liked, setLiked] = useState(product.user_liked);
  const [likeCount, setLikeCount] = useState(product.like_count || 0);
  const [inCart, setInCart] = useState(product.user_in_cart);

  const photo = product.primary_photo || product.photo_urls?.[0];
  const imgSrc = photo ? imgUrl(photo) : null;
  const discount = product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100) : null;
  const categoryKey = Object.keys(CATEGORY_EMOJI).find(k => product.category?.toLowerCase().includes(k)) || 'other';

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) { toast('Sign in to like items 💕'); return; }
    // Optimistic update — change immediately
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(c => newLiked ? c + 1 : c - 1);
    try {
      await API.post(`/products/${product.id}/like`);
      onLikeChange?.();
    } catch {
      // Revert if failed
      setLiked(!newLiked);
      setLikeCount(c => newLiked ? c - 1 : c + 1);
    }
  };

  const handleCart = async (e) => {
    e.stopPropagation();
    if (!user) { toast('Sign in to add to cart 🛒'); return; }
    // Optimistic update
    setInCart(true);
    try {
      await addToCart(product.id);
      toast.success('Added to cart! 🛍️');
    } catch {
      setInCart(false);
      toast.error('Could not add to cart');
    }
  };

  return (
    <div className="card" onClick={() => navigate(`/product/${product.id}`)}
      style={{ cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Photo */}
      <div style={{ position: 'relative', overflow: 'hidden', height: 260, background: 'var(--blush)' }}>
        {imgSrc ? (
          <img src={imgSrc} alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
            onMouseOver={e => e.target.style.transform = 'scale(1.08)'}
            onMouseOut={e => e.target.style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 60 }}>
            {CATEGORY_EMOJI[categoryKey]}
          </div>
        )}
        {/* Badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="tag" style={{ background: 'rgba(255,255,255,0.9)', fontSize: 11 }}>
            {CATEGORY_EMOJI[categoryKey]} {product.category}
          </span>
          {discount && <span className="discount-badge">-{discount}%</span>}
          {product.featured === true && (
            <span style={{ background: 'var(--gradient-gold)', color: 'white', padding: '2px 8px', borderRadius: 50, fontSize: 11, fontWeight: 600 }}>
              ⭐ Featured
            </span>
          )}
        </div>
        {/* Like button — instant response */}
        <button onClick={handleLike} style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(255,255,255,0.9)', border: 'none',
          borderRadius: '50%', width: 36, height: 36,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, transition: 'transform 0.1s',
          boxShadow: '0 2px 8px var(--shadow)',
        }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.85)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {liked ? '❤️' : '🤍'}
        </button>
        {/* Views */}
        <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.4)', color: 'white', padding: '2px 8px', borderRadius: 50, fontSize: 11 }}>
          👁 {product.views || 0}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 19, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
          {product.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Stars rating={product.avg_rating} />
          <span style={{ fontSize: 12, color: 'var(--text-light)' }}>({product.review_count || 0})</span>
          <span style={{ fontSize: 12, color: 'var(--text-light)', marginLeft: 'auto' }}>❤️ {likeCount}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <span className="price">ETB {product.price?.toLocaleString()}</span>
          {product.original_price && <span className="price-original">ETB {product.original_price?.toLocaleString()}</span>}
        </div>
        {/* Cart button — instant response */}
        <button className="btn-primary" onClick={handleCart}
          style={{ marginTop: 'auto', width: '100%', justifyContent: 'center', padding: '10px',
            background: inCart ? 'var(--gradient-gold)' : undefined }}>
          {inCart ? '✅ In Cart' : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  );
}
