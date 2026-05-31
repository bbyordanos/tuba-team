const router   = require('express').Router();
const multer   = require('multer');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const supabase = require('../supabase');
const { authMiddleware, ownerOnly, optionalAuth } = require('../middleware/auth');

// Cloudinary config (for photo storage)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

async function uploadToCloudinary(buffer, folder = 'tuba-team') {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (err, result) => {
      if (err) reject(err);
      else resolve(result.secure_url);
    }).end(buffer);
  });
}

// GET all products
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let query = supabase.from('products').select(`
      *, product_photos(*),
      ratings(rating),
      likes(user_id),
      cart_items(id)
    `);
    if (category) query = query.eq('category', category);
    if (search)   query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    if (sort === 'popular')    query = query.order('views', { ascending: false });
    else if (sort === 'sales') query = query.order('sales', { ascending: false });
    else if (sort === 'price_asc')  query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    const userId = req.user?.id;
    const result = (data || []).map(p => {
      const photos = p.product_photos || [];
      const ratings = p.ratings || [];
      const avg_rating = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : null;
      const primary = photos.find(ph => ph.is_primary) || photos[0];
      return {
        ...p,
        primary_photo: primary?.url || null,
        photo_urls: photos.map(ph => ph.url),
        avg_rating,
        review_count: ratings.length,
        like_count: (p.likes || []).length,
        cart_count: (p.cart_items || []).length,
        user_liked: userId ? (p.likes || []).some(l => l.user_id === userId) : false,
        user_in_cart: userId ? (p.cart_items || []).some(c => c.user_id === userId) : false,
        product_photos: undefined, ratings: undefined, likes: undefined, cart_items: undefined,
      };
    });
    res.json(result);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// GET single product
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { data: p, error } = await supabase.from('products').select(`
      *, product_photos(*),
      ratings(*, users(name)),
      likes(user_id),
      cart_items(id)
    `).eq('id', req.params.id).single();
    if (error || !p) return res.status(404).json({ error: 'Not found' });

    // increment views
    await supabase.from('products').update({ views: (p.views || 0) + 1 }).eq('id', p.id);

    const ratings = p.ratings || [];
    const avg_rating = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : null;
    const userId = req.user?.id;
    const reviews = ratings.map(r => ({ ...r, user_name: r.users?.name }));
    const userRating = userId ? ratings.find(r => r.user_id === userId) : null;

    res.json({
      ...p,
      photos: p.product_photos || [],
      reviews,
      avg_rating,
      review_count: ratings.length,
      like_count: (p.likes || []).length,
      cart_count: (p.cart_items || []).length,
      user_liked: userId ? (p.likes || []).some(l => l.user_id === userId) : false,
      user_in_cart: userId ? (p.cart_items || []).some(c => c.user_id === userId) : false,
      user_rating: userRating || null,
      product_photos: undefined, ratings: undefined, likes: undefined, cart_items: undefined,
    });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// POST create product
router.post('/', authMiddleware, ownerOnly, upload.array('photos', 10), async (req, res) => {
  try {
    const { name, description, price, original_price, category, stock, featured } = req.body;
    if (!name || !price || !category) return res.status(400).json({ error: 'Name, price, category required' });
    const id = uuidv4();
    const { error } = await supabase.from('products').insert({
      id, name, description: description || '',
      price: parseFloat(price),
      original_price: original_price ? parseFloat(original_price) : null,
      category, stock: parseInt(stock) || 1,
      featured: featured ? true : false,
      views: 0, sales: 0,
    });
    if (error) throw error;

    if (req.files?.length) {
      for (let i = 0; i < req.files.length; i++) {
        const url = await uploadToCloudinary(req.files[i].buffer);
        await supabase.from('product_photos').insert({ id: uuidv4(), product_id: id, url, is_primary: i === 0 });
      }
    }
    res.json({ id, message: 'Product created' });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// PUT update product
router.put('/:id', authMiddleware, ownerOnly, upload.array('photos', 10), async (req, res) => {
  try {
    const { name, description, price, original_price, category, stock, featured } = req.body;
    await supabase.from('products').update({
      name, description, price: parseFloat(price),
      original_price: original_price ? parseFloat(original_price) : null,
      category, stock: parseInt(stock), featured: featured ? true : false,
      updated_at: new Date().toISOString(),
    }).eq('id', req.params.id);

    if (req.files?.length) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        await supabase.from('product_photos').insert({ id: uuidv4(), product_id: req.params.id, url, is_primary: false });
      }
    }
    res.json({ message: 'Updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE product
router.delete('/:id', authMiddleware, ownerOnly, async (req, res) => {
  await supabase.from('products').delete().eq('id', req.params.id);
  res.json({ message: 'Deleted' });
});

// DELETE photo
router.delete('/:id/photos/:photoId', authMiddleware, ownerOnly, async (req, res) => {
  await supabase.from('product_photos').delete().eq('id', req.params.photoId);
  res.json({ message: 'Photo deleted' });
});

// DELETE review
router.delete('/:id/reviews/:reviewId', authMiddleware, ownerOnly, async (req, res) => {
  await supabase.from('ratings').delete().eq('id', req.params.reviewId);
  res.json({ message: 'Review deleted' });
});

// LIKE / UNLIKE
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const { data } = await supabase.from('likes')
      .select('*').eq('user_id', req.user.id).eq('product_id', req.params.id).single();
    if (data) {
      await supabase.from('likes').delete().eq('user_id', req.user.id).eq('product_id', req.params.id);
      res.json({ liked: false });
    } else {
      await supabase.from('likes').insert({ user_id: req.user.id, product_id: req.params.id });
      res.json({ liked: true });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// RATE
router.post('/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const { data } = await supabase.from('ratings')
      .select('id').eq('user_id', req.user.id).eq('product_id', req.params.id).single();
    if (data) {
      await supabase.from('ratings').update({ rating, review: review || '' }).eq('id', data.id);
    } else {
      await supabase.from('ratings').insert({ id: uuidv4(), user_id: req.user.id, product_id: req.params.id, rating, review: review || '' });
    }
    res.json({ message: 'Rated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
