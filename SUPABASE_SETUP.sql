-- =============================================
-- TUBA TEAM — Paste this entire file into
-- Supabase SQL Editor and click RUN
-- =============================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'customer',
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  category TEXT NOT NULL,
  stock INTEGER DEFAULT 1,
  featured BOOLEAN DEFAULT FALSE,
  views INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product photos
CREATE TABLE IF NOT EXISTS product_photos (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  delivery_option TEXT,
  payment_method TEXT,
  location TEXT,
  status TEXT DEFAULT 'pending',
  total NUMERIC,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL
);

-- Cart
CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ratings
CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  product_id TEXT REFERENCES products(id),
  rating INTEGER NOT NULL,
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Likes
CREATE TABLE IF NOT EXISTS likes (
  user_id TEXT REFERENCES users(id),
  product_id TEXT REFERENCES products(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

-- Conversations (chat)
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  user_name TEXT,
  user_email TEXT,
  last_message TEXT,
  last_at TIMESTAMPTZ DEFAULT NOW(),
  unread_owner INTEGER DEFAULT 0,
  unread_user INTEGER DEFAULT 0
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  content TEXT,
  photo_url TEXT,
  photo_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable Row Level Security (backend handles auth)
ALTER TABLE users           DISABLE ROW LEVEL SECURITY;
ALTER TABLE products        DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_photos  DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders          DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items     DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items      DISABLE ROW LEVEL SECURITY;
ALTER TABLE ratings         DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes           DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations   DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages   DISABLE ROW LEVEL SECURITY;

-- Insert Hermella owner account (password: Hermella2024)
INSERT INTO users (id, name, email, phone, password, role)
VALUES (
  'owner-hermella-001',
  'Hermella',
  'hermellahenok94@gmail.com',
  '0986813121',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'owner'
) ON CONFLICT (id) DO NOTHING;
