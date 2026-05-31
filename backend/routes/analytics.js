const router   = require('express').Router();
const supabase = require('../supabase');
const { authMiddleware, ownerOnly } = require('../middleware/auth');

router.get('/dashboard', authMiddleware, ownerOnly, async (req, res) => {
  try {
    const [orders, pending, products, users, convs, topSales, topViews, recent, cats] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('conversations').select('unread_owner'),
      supabase.from('products').select('id,name,category,sales,views,product_photos(url,is_primary)').order('sales', { ascending: false }).limit(5),
      supabase.from('products').select('id,name,category,sales,views,product_photos(url,is_primary)').order('views', { ascending: false }).limit(5),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('products').select('category,sales'),
    ]);

    const { data: revenueData } = await supabase.from('orders').select('total').eq('status', 'accepted');
    const totalRevenue = (revenueData || []).reduce((s, o) => s + (o.total || 0), 0);
    const unreadMessages = (convs.data || []).reduce((s, c) => s + (c.unread_owner || 0), 0);

    const mapPhoto = (p) => ({
      ...p,
      photo: p.product_photos?.find(ph => ph.is_primary)?.url || p.product_photos?.[0]?.url,
      product_photos: undefined,
    });

    // Category stats
    const catMap = {};
    (cats.data || []).forEach(p => {
      if (!catMap[p.category]) catMap[p.category] = { category: p.category, count: 0, total_sales: 0 };
      catMap[p.category].count++;
      catMap[p.category].total_sales += p.sales || 0;
    });

    res.json({
      totalOrders: orders.count || 0,
      pendingOrders: pending.count || 0,
      totalRevenue,
      totalProducts: products.count || 0,
      totalUsers: users.count || 0,
      unreadMessages,
      topSales: (topSales.data || []).map(mapPhoto),
      topViews: (topViews.data || []).map(mapPhoto),
      recentOrders: recent.data || [],
      categoryStats: Object.values(catMap),
    });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

module.exports = router;
