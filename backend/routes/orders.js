const router   = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../supabase');
const { authMiddleware, ownerOnly, optionalAuth } = require('../middleware/auth');

// Place order
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { items, customer_name, customer_phone, customer_email, delivery_option, payment_method, location, note } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'No items' });
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const orderId = uuidv4();
    const { error } = await supabase.from('orders').insert({
      id: orderId, user_id: req.user?.id || null,
      customer_name, customer_phone, customer_email,
      delivery_option, payment_method, location, note: note || '', total, status: 'pending'
    });
    if (error) throw error;
    for (const item of items) {
      await supabase.from('order_items').insert({ id: uuidv4(), order_id: orderId, product_id: item.product_id, quantity: item.quantity, price: item.price });
      const { data: prod } = await supabase.from('products').select('sales').eq('id', item.product_id).single();
      if (prod) await supabase.from('products').update({ sales: (prod.sales || 0) + item.quantity }).eq('id', item.product_id);
    }
    if (req.user?.id) await supabase.from('cart_items').delete().eq('user_id', req.user.id);
    res.json({ orderId, message: 'Order placed!' });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Get all orders (owner)
router.get('/', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase.from('orders').select('*, order_items(id)').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json((data || []).map(o => ({ ...o, item_count: (o.order_items || []).length, order_items: undefined })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// My orders (customer)
router.get('/my/orders', authMiddleware, async (req, res) => {
  const { data } = await supabase.from('orders').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
  res.json(data || []);
});

// Get single order
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: order } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'owner' && order.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const { data: items } = await supabase.from('order_items')
      .select('*, products(name, category, product_photos(url, is_primary))').eq('order_id', req.params.id);
    const mapped = (items || []).map(item => ({
      ...item,
      name: item.products?.name,
      category: item.products?.category,
      photo: item.products?.product_photos?.find(p => p.is_primary)?.url || item.products?.product_photos?.[0]?.url,
      products: undefined,
    }));
    res.json({ ...order, items: mapped });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update status (owner)
router.put('/:id/status', authMiddleware, ownerOnly, async (req, res) => {
  await supabase.from('orders').update({ status: req.body.status }).eq('id', req.params.id);
  res.json({ message: 'Updated' });
});

module.exports = router;
