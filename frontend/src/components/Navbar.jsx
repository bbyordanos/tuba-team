import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwner = user?.role === 'owner';

  const handleLogout = () => { logout(); toast.success('Logged out 💕'); navigate('/'); setMenuOpen(false); };
  const close = () => setMenuOpen(false);

  return (
    <>
      <nav style={s.nav}>
        <div style={s.inner}>
          <Link to="/" style={s.logo} onClick={close}>
            <span style={{fontSize:22}}>🌸</span>
            <div>
              <div style={s.logoName}>TUBA</div>
              <div style={s.logoSub}>by Hermella</div>
            </div>
          </Link>

          {/* Desktop links */}
          <div className='desktop-links' style={s.desktopLinks}>
            {isOwner ? (
              <>
                <NL to="/owner" label="Dashboard" loc={location} />
                <NL to="/owner/post" label="+ Post" loc={location} highlight />
                <NL to="/owner/orders" label="Orders" loc={location} />
                <NL to="/owner/messages" label="Messages" loc={location} />
                <NL to="/" label="View Shop" loc={location} />
              </>
            ) : (
              <>
                <NL to="/" label="Shop" loc={location} />
                {user && <NL to="/my-orders" label="📦 My Orders" loc={location} />}
              </>
            )}
          </div>

          <div style={s.right}>
            {!isOwner && (
              <Link to="/cart" style={s.cartBtn}>
                🛒
                {cartCount > 0 && <span className="badge" style={{position:'absolute',top:-5,right:-5,fontSize:9}}>{cartCount}</span>}
              </Link>
            )}
            {user ? (
              <button style={s.avatar} onClick={() => setMenuOpen(v=>!v)}>
                {user.name?.[0]?.toUpperCase()}
              </button>
            ) : (
              <Link to="/auth"><button className="btn-primary" style={{padding:'8px 16px',fontSize:13}}>Sign In</button></Link>
            )}
            {/* Hamburger for mobile menu */}
            {user && (
              <button className='burger-btn' style={{...s.burger, display:'flex'}} onClick={() => setMenuOpen(v=>!v)} aria-label="Menu">
                <span style={{display:'block',width:20,height:2,background:'var(--mauve)',margin:'4px 0',transition:'all 0.2s'}}/>
                <span style={{display:'block',width:20,height:2,background:'var(--mauve)',margin:'4px 0'}}/>
                <span style={{display:'block',width:14,height:2,background:'var(--mauve)',margin:'4px 0'}}/>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Dropdown / mobile menu */}
      {menuOpen && (
        <>
          <div style={s.overlay} onClick={close}/>
          <div style={s.dropdown}>
            {user && (
              <div style={s.dropUser}>
                <div style={s.dropAvatar}>{user.name?.[0]?.toUpperCase()}</div>
                <div>
                  <div style={{fontWeight:600,fontSize:15}}>{user.name}</div>
                  <div style={{fontSize:12,color:'var(--text-light)'}}>{isOwner?'👑 Owner':'💕 Customer'}</div>
                </div>
              </div>
            )}
            {isOwner && (
              <div style={{padding:'8px 0'}}>
                <MobileLink to="/owner" label="📊 Dashboard" onClick={close}/>
                <MobileLink to="/owner/post" label="✨ Post New Item" onClick={close}/>
                <MobileLink to="/owner/orders" label="📦 Orders" onClick={close}/>
                <MobileLink to="/owner/messages" label="💬 Messages" onClick={close}/>
                <MobileLink to="/" label="🛍️ View Shop" onClick={close}/>
              </div>
            )}
            {!isOwner && (
              <div style={{padding:'8px 0'}}>
                <MobileLink to="/" label="🛍️ Shop" onClick={close}/>
                <MobileLink to="/my-orders" label="📦 My Orders" onClick={close}/>
              </div>
            )}
            <div style={{borderTop:'1px solid var(--border)',padding:'8px 0'}}>
              <button onClick={handleLogout} style={s.dropBtn}>🚪 Sign Out</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

const NL = ({ to, label, loc, highlight }) => (
  <Link to={to} style={{
    color: highlight?'white': loc.pathname===to?'var(--mauve)':'var(--text-light)',
    textDecoration:'none', fontWeight: loc.pathname===to?600:400,
    fontSize:14, padding:'6px 14px', borderRadius:50,
    background: highlight?'var(--gradient-rose)': loc.pathname===to?'var(--blush)':'transparent',
    transition:'all 0.2s', whiteSpace:'nowrap',
  }}>{label}</Link>
);

const MobileLink = ({ to, label, onClick }) => (
  <Link to={to} onClick={onClick} style={{display:'block',padding:'12px 20px',color:'var(--text)',textDecoration:'none',fontSize:15,borderRadius:12,transition:'background 0.2s'}}
    onMouseOver={e=>e.target.style.background='var(--blush)'}
    onMouseOut={e=>e.target.style.background='transparent'}
  >{label}</Link>
);

const s = {
  nav:{position:'sticky',top:0,zIndex:100,background:'rgba(255,255,255,0.9)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)',boxShadow:'0 2px 16px var(--shadow)'},
  inner:{maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',gap:12},
  logo:{textDecoration:'none',display:'flex',alignItems:'center',gap:8,flexShrink:0},
  logoName:{fontFamily:'Cormorant Garamond,serif',fontSize:20,fontWeight:700,color:'var(--mauve)',letterSpacing:2,lineHeight:1},
  logoSub:{fontFamily:'Dancing Script,cursive',fontSize:11,color:'var(--rose-dark)',lineHeight:1},
  desktopLinks:{display:'flex',alignItems:'center',gap:4,flex:1,justifyContent:'center',flexWrap:'wrap','@media(max-width:768px)':{display:'none'}},
  right:{display:'flex',alignItems:'center',gap:10},
  cartBtn:{position:'relative',fontSize:20,textDecoration:'none',cursor:'pointer',display:'flex',alignItems:'center',padding:4},
  avatar:{width:36,height:36,borderRadius:'50%',background:'var(--gradient-rose)',color:'white',border:'none',cursor:'pointer',fontFamily:'Cormorant Garamond,serif',fontSize:17,fontWeight:700},
  burger:{background:'none',border:'none',cursor:'pointer',padding:'4px 6px',display:'none'},
  overlay:{position:'fixed',inset:0,zIndex:150},
  dropdown:{position:'absolute',top:62,right:12,background:'white',borderRadius:18,boxShadow:'0 8px 32px var(--shadow-lg)',border:'1px solid var(--border)',minWidth:220,zIndex:200,overflow:'hidden'},
  dropUser:{display:'flex',alignItems:'center',gap:12,padding:'16px 20px',borderBottom:'1px solid var(--border)'},
  dropAvatar:{width:40,height:40,borderRadius:'50%',background:'var(--gradient-rose)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Cormorant Garamond,serif',fontSize:18,fontWeight:700,flexShrink:0},
  dropBtn:{display:'block',width:'100%',padding:'12px 20px',background:'none',border:'none',textAlign:'left',cursor:'pointer',fontSize:14,color:'var(--text)',fontFamily:'DM Sans,sans-serif'},
};

// Make desktop links hidden on mobile, burger visible
const styleTag = document.createElement('style');
styleTag.textContent = `
  @media(max-width:768px){
    nav .desktop-links { display:none !important; }
    nav .burger-btn { display:block !important; }
  }
`;
document.head.appendChild(styleTag);
