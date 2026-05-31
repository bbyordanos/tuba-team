const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../supabase');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !password || (!email && !phone))
    return res.status(400).json({ error: 'Name, password, and email or phone are required' });
  try {
    if (email) {
      const { data } = await supabase.from('users').select('id').eq('email', email).single();
      if (data) return res.status(409).json({ error: 'Email already registered' });
    }
    if (phone) {
      const { data } = await supabase.from('users').select('id').eq('phone', phone).single();
      if (data) return res.status(409).json({ error: 'Phone already registered' });
    }
    const hashed = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    const { error } = await supabase.from('users').insert({
      id, name, email: email || null, phone: phone || null,
      password: hashed, role: 'customer'
    });
    if (error) throw error;
    const token = jwt.sign({ id, name, email, phone, role: 'customer' }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id, name, email, phone, role: 'customer' } });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ error: 'Email/phone and password required' });
  try {
    let { data: user } = await supabase.from('users').select('*').eq('email', identifier).single();
    if (!user) {
      const { data } = await supabase.from('users').select('*').eq('phone', identifier).single();
      user = data;
    }
    if (!user) return res.status(401).json({ error: 'No account found' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Wrong password' });
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
      JWT_SECRET, { expiresIn: '30d' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  const { data } = await supabase.from('users').select('id,name,email,phone,role').eq('id', req.user.id).single();
  res.json(data);
});

module.exports = router;
