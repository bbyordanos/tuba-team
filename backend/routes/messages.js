const router   = require('express').Router();
const multer   = require('multer');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const supabase = require('../supabase');
const { authMiddleware, ownerOnly, optionalAuth } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

async function uploadPhoto(buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder: 'tuba-chat', resource_type: 'image' }, (err, result) => {
      if (err) reject(err); else resolve(result.secure_url);
    }).end(buffer);
  });
}

async function getOrCreateConv(db, userId, userName, userEmail) {
  let { data } = await db.from('conversations').select('*').eq('user_id', userId).single();
  if (!data) {
    const id = uuidv4();
    await db.from('conversations').insert({ id, user_id: userId, user_name: userName || 'Guest', user_email: userEmail || '' });
    const res = await db.from('conversations').select('*').eq('id', id).single();
    data = res.data;
  }
  return data;
}

// USER: get own chat
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const conv = await getOrCreateConv(supabase, req.user.id, req.user.name, req.user.email);
    const { data: messages } = await supabase.from('chat_messages').select('*').eq('conversation_id', conv.id).order('created_at', { ascending: true });
    await supabase.from('conversations').update({ unread_user: 0 }).eq('id', conv.id);
    res.json({ conversation: conv, messages: messages || [] });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// USER: send message
router.post('/my', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const conv = await getOrCreateConv(supabase, req.user.id, req.user.name, req.user.email);
    const { content, photo_type } = req.body;
    if (!content && !req.file) return res.status(400).json({ error: 'Message or photo required' });
    const photo_url = req.file ? await uploadPhoto(req.file.buffer) : null;
    const msgId = uuidv4();
    const { data: msg } = await supabase.from('chat_messages').insert({
      id: msgId, conversation_id: conv.id, sender_role: 'user',
      content: content || null, photo_url, photo_type: photo_type || null
    }).select().single();
    const preview = photo_url ? (photo_type === 'receipt' ? '📄 Receipt' : '📷 Photo') : content;
    await supabase.from('conversations').update({ last_message: preview, last_at: new Date().toISOString(), unread_owner: supabase.rpc ? undefined : (conv.unread_owner || 0) + 1 }).eq('id', conv.id);
    // simple increment
    await supabase.rpc ? null : supabase.from('conversations').update({ unread_owner: (conv.unread_owner || 0) + 1 }).eq('id', conv.id);
    res.json(msg);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// OWNER: all conversations
router.get('/', authMiddleware, ownerOnly, async (req, res) => {
  const { data } = await supabase.from('conversations').select('*').order('last_at', { ascending: false });
  res.json(data || []);
});

// OWNER: get conversation messages
router.get('/:convId', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const { data: conv } = await supabase.from('conversations').select('*').eq('id', req.params.convId).single();
    if (!conv) return res.status(404).json({ error: 'Not found' });
    const { data: messages } = await supabase.from('chat_messages').select('*').eq('conversation_id', req.params.convId).order('created_at', { ascending: true });
    await supabase.from('conversations').update({ unread_owner: 0 }).eq('id', req.params.convId);
    res.json({ conversation: conv, messages: messages || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// OWNER: reply
router.post('/:convId/reply', authMiddleware, ownerOnly, upload.single('photo'), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content && !req.file) return res.status(400).json({ error: 'Required' });
    const photo_url = req.file ? await uploadPhoto(req.file.buffer) : null;
    const { data: msg } = await supabase.from('chat_messages').insert({
      id: uuidv4(), conversation_id: req.params.convId,
      sender_role: 'owner', content: content || null, photo_url
    }).select().single();
    const preview = photo_url ? '📷 Photo' : content;
    await supabase.from('conversations').update({ last_message: preview, last_at: new Date().toISOString() }).eq('id', req.params.convId);
    res.json(msg);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Unread count
router.get('/stats/unread', authMiddleware, ownerOnly, async (req, res) => {
  const { data } = await supabase.from('conversations').select('unread_owner');
  const count = (data || []).reduce((s, c) => s + (c.unread_owner || 0), 0);
  res.json({ count });
});

module.exports = router;
