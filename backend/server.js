require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const supabase = require('./supabase');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' }));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', message: '🌸 TUBA Team is running!' })
);

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/cart',      require('./routes/cart'));
app.use('/api/messages',  require('./routes/messages'));
app.use('/api/analytics', require('./routes/analytics'));

// Serve React frontend
const builds = [
  path.join(__dirname, '..', 'frontend', 'build'),
  path.join(__dirname, 'frontend', 'build'),
];
const frontendBuild = builds.find(p => fs.existsSync(p));
if (frontendBuild) {
  app.use(express.static(frontendBuild));
  app.get('*', (req, res) => res.sendFile(path.join(frontendBuild, 'index.html')));
  console.log('🎨 Serving frontend from:', frontendBuild);
}

// Seed owner on startup
async function seedOwner() {
  try {
    const EMAIL    = 'hermellahenok94@gmail.com';
    const PHONE    = '0986813121';
    const PASSWORD = process.env.OWNER_PASSWORD || 'Hermella2024';
    const hash     = bcrypt.hashSync(PASSWORD, 10);
    const { data } = await supabase.from('users').select('id').eq('role', 'owner').single();
    if (!data) {
      await supabase.from('users').insert({ id: uuidv4(), name: 'Hermella', email: EMAIL, phone: PHONE, password: hash, role: 'owner' });
      console.log('✅ Owner created');
    } else {
      await supabase.from('users').update({ password: hash }).eq('role', 'owner');
      console.log('🔄 Owner refreshed');
    }
  } catch (e) { console.log('Owner seed error (may be ok):', e.message); }
}

seedOwner().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 TUBA Team running on port ${PORT}`);
  });
});
