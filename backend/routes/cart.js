const router   = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../supabase');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  const { data } = await supabase.from('cart_items')
    .select('*, products(name, price, category, product_photos(url, is_primary))')
    .eq('user_id', req.user.id);
  res.json((data || []).map(i => ({
    ...i,
    name: i.products?.name, price: i.products?.price, category: i.products?.category,
    photo: i.products?.product_photos?.find(p => p.is_primary)?.url || i.products?.product_photos?.[0]?.url,
    products: undefined,
  })));
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const { data } = await supabase.from('cart_items').select('*').eq('user_id', req.user.id).eq('product_id', product_id).single();
    if (data) await supabase.from('cart_items').update({ quantity: data.quantity + quantity }).eq('id', data.id);
    else await supabase.from('cart_items').insert({ id: uuidv4(), user_id: req.user.id, product_id, quantity });
    res.json({ message: 'Added' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', authMiddleware, async (req, res) => {
  await supabase.from('cart_items').update({ quantity: req.body.quantity }).eq('id', req.params.id).eq('user_id', req.user.id);
  res.json({ message: 'Updated' });
});

router.delete('/:id', authMiddleware, async (req, res) => {
  await supabase.from('cart_items').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  res.json({ message: 'Removed' });
});

router.delete('/', authMiddleware, async (req, res) => {
  await supabase.from('cart_items').delete().eq('user_id', req.user.id);
  res.json({ message: 'Cleared' });
});

module.exports = router;
