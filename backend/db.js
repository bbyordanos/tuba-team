const { open } = require('sqlite');
const sqlite3  = require('sqlite3');
const path     = require('path');
const fs       = require('fs');
const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

let db;

// Railway mounts a volume at /data — use it; otherwise store next to server.js
const DATA_DIR = process.env.DATA_DIR ||
  (fs.existsSync('/data') ? '/data' : path.join(__dirname, 'data'));

async function getDb() {
  if (db) return db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  db = await open({
    filename: path.join(DATA_DIR, 'tuba.db'),
    driver: sqlite3.Database,
  });
  await db.run('PRAGMA journal_mode = WAL');
  await db.run('PRAGMA foreign_keys = ON');
  await initSchema();
  await seedOwner();
  return db;
}

async function initSchema() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL,
      email TEXT UNIQUE, phone TEXT UNIQUE,
      password TEXT NOT NULL, role TEXT DEFAULT 'customer',
      avatar TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL,
      description TEXT, price REAL NOT NULL,
      original_price REAL, category TEXT NOT NULL,
      stock INTEGER DEFAULT 1, featured INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0, sales INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS product_photos (
      id TEXT PRIMARY KEY, product_id TEXT NOT NULL,
      url TEXT NOT NULL, is_primary INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, user_id TEXT,
      customer_name TEXT, customer_phone TEXT,
      customer_email TEXT, delivery_option TEXT,
      payment_method TEXT, location TEXT,
      status TEXT DEFAULT 'pending', total REAL,
      note TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY, order_id TEXT NOT NULL,
      product_id TEXT NOT NULL, quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
      product_id TEXT NOT NULL, quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
      product_id TEXT NOT NULL, rating INTEGER NOT NULL,
      review TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS likes (
      user_id TEXT NOT NULL, product_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY, user_id TEXT,
      user_name TEXT, user_email TEXT,
      last_message TEXT, last_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      unread_owner INTEGER DEFAULT 0, unread_user INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL,
      sender_role TEXT NOT NULL, content TEXT,
      photo_url TEXT, photo_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS product_views (
      id TEXT PRIMARY KEY, product_id TEXT NOT NULL,
      user_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function seedOwner() {
  const EMAIL    = 'hermellahenok94@gmail.com';
  const PHONE    = '0986813121';
  const PASSWORD = process.env.OWNER_PASSWORD || 'Hermella2024';
  const hash     = bcrypt.hashSync(PASSWORD, 10);

  const existing = await db.get("SELECT id FROM users WHERE role='owner'");
  if (!existing) {
    await db.run(
      'INSERT INTO users (id,name,email,phone,password,role) VALUES (?,?,?,?,?,?)',
      [uuidv4(), 'Hermella', EMAIL, PHONE, hash, 'owner']
    );
    console.log('✅ Owner created:', EMAIL);
  } else {
    await db.run(
      "UPDATE users SET password=?,email=?,phone=? WHERE role='owner'",
      [hash, EMAIL, PHONE]
    );
    console.log('🔄 Owner password refreshed');
  }
}

module.exports = { getDb, DATA_DIR };
