const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const TradeInRequest = require('../models/TradeInRequest');

// Revenue chart windows offered by the admin dashboard.
const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, '180d': 180, '365d': 365 };

// An order counts as income once it is paid and has not been cancelled — the
// same rule the rest of the app already uses, so numbers always agree.
const PAID_NOT_CANCELLED = { paymentStatus: 'paid', orderStatus: { $ne: 'cancelled' } };

const startOfDay = (d) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

// A continuous series has to include days with no orders, otherwise the chart
// silently skips them and the shape lies. `series` is filled day by day and the
// aggregation is merged into it.
const buildDailySeries = (from, to, rows) => {
  const byDay = new Map(
    rows.map((row) => [row._id.day, row])
  );

  const series = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    const row = byDay.get(key);
    series.push({
      day: key,
      date: new Date(cursor),
      revenue: row?.revenue || 0,
      orders: row?.orders || 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return series;
};

// Month buckets for the longer windows, where one bar per day is unreadable.
const buildMonthlySeries = (from, rows) => {
  const byMonth = new Map(rows.map((row) => [row._id.month, row]));

  const series = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const now = new Date();
  while (cursor <= now) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    const row = byMonth.get(key);
    series.push({
      month: key,
      date: new Date(cursor),
      revenue: row?.revenue || 0,
      orders: row?.orders || 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return series;
};

const countBy = async (Model, filter, field) =>
  Model.aggregate([{ $match: filter }, { $group: { _id: `$${field}`, count: { $sum: 1 } } }]);

const countMap = (rows) =>
  Object.fromEntries(rows.map((row) => [row._id, row.count]));

// @desc  Admin dashboard aggregate (totals, revenue series, recent activity)
// @route GET /api/admin/dashboard?range=7d|30d|90d|180d|365d
const getDashboard = asyncHandler(async (req, res) => {
  const range = RANGE_DAYS[req.query.range] ? req.query.range : '30d';
  const days = RANGE_DAYS[range];

  const now = new Date();
  const from = startOfDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));
  const daily = days <= 90;

  // The window immediately before the selected one, of the same length. Without
  // it a dashboard can only ever show absolute numbers, and any "vs last month"
  // percentage would have to be invented. Same range key, so the client can
  // label the comparison without duplicating the range table.
  const previousTo = from;
  const previousFrom = new Date(from.getTime() - days * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    totalDealers,
    activeDealers,
    totalProducts,
    outOfStock,
    lowStock,
    totalOrders,
    totalIncome,
    pendingOrderValue,
    cancelledResult,
    ordersByStatus,
    paymentsByStatus,
    sellByStatus,
    sellValueResult,
    exchangeCreditResult,
    recentOrders,
    recentUsers,
    recentDealers,
    recentTradeIns,
    revenueRows,
    bestSellers,
    lowStockRows,
    newUsersInRange,
    ordersInRange,
    newProductsInRange,
    previousRevenue,
    previousOrders,
    previousUsers,
    previousProducts,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', isActive: { $ne: false } }),
    User.countDocuments({ role: 'dealer' }),
    User.countDocuments({ role: 'dealer', 'dealerInfo.isActive': true }),
    Product.countDocuments(),
    Product.countDocuments({ stock: { $lte: 0 } }),
    Product.countDocuments({ stock: { $gt: 0, $lte: 3 } }),

    Order.countDocuments(),
    Order.aggregate([
      { $match: PAID_NOT_CANCELLED },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]).then((r) => r[0]?.total || 0),
    Order.aggregate([
      { $match: { orderStatus: { $in: ['processing', 'confirmed', 'shipped'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]).then((r) => r[0]?.total || 0),
    Order.aggregate([
      { $match: { orderStatus: 'cancelled' } },
      { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$totalPrice' } } },
    ]).then((r) => r[0] || { count: 0, value: 0 }),

    countBy(Order, {}, 'orderStatus'),
    countBy(Order, {}, 'paymentStatus'),

    countBy(TradeInRequest, {}, 'status'),
    TradeInRequest.aggregate([
      { $match: { status: { $in: ['approved', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$dealerPrice' } } },
    ]).then((r) => r[0]?.total || 0),
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$tradeInValue' } } },
    ]).then((r) => r[0]?.total || 0),

    Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    User.find({ role: 'dealer' })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    TradeInRequest.find()
      .populate('user', 'name email')
      .populate('dealer', 'name dealerInfo')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),

    Order.aggregate([
      { $match: { ...PAID_NOT_CANCELLED, createdAt: { $gte: from } } },
      {
        $group: {
          _id: daily
            ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
            : { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
    ]),

    // Unwound so a product can be bought more than once inside one order.
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          title: { $first: '$orderItems.title' },
          price: { $first: '$orderItems.price' },
          image: { $first: '$orderItems.image' },
          sold: { $sum: '$orderItems.quantity' },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
        },
      },
      { $sort: { sold: -1, revenue: -1 } },
      { $limit: 6 },
    ]),

    Product.find({ stock: { $lte: 3 } })
      .populate('category', 'name')
      .sort({ stock: 1 })
      .limit(6)
      .lean(),

    User.countDocuments({ role: 'user', createdAt: { $gte: from } }),
    Order.countDocuments({ createdAt: { $gte: from } }),
    Product.countDocuments({ createdAt: { $gte: from } }),

    // Preceding window, used only for the change indicators on the stat cards.
    Order.aggregate([
      { $match: { ...PAID_NOT_CANCELLED, createdAt: { $gte: previousFrom, $lt: previousTo } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]).then((r) => r[0]?.total || 0),
    Order.countDocuments({ createdAt: { $gte: previousFrom, $lt: previousTo } }),
    User.countDocuments({ role: 'user', createdAt: { $gte: previousFrom, $lt: previousTo } }),
    Product.countDocuments({ createdAt: { $gte: previousFrom, $lt: previousTo } }),
  ]);

  const orderCounts = countMap(ordersByStatus);
  const paymentCounts = countMap(paymentsByStatus);
  const tradeInCounts = countMap(sellByStatus);
  const inFlight = ['processing', 'confirmed', 'shipped'];

  // The aggregation above can only read fields that were copied onto the order
  // line, so the category is joined afterwards. Without it the best-seller
  // table would have to guess it from the title.
  const bestSellerIds = bestSellers.map((item) => item._id);
  const categoryByProduct = new Map();
  if (bestSellerIds.length > 0) {
    const rows = await Product.find({ _id: { $in: bestSellerIds } })
      .populate('category', 'name')
      .select('_id category')
      .lean();
    rows.forEach((row) => categoryByProduct.set(String(row._id), row.category?.name || ''));
  }

  // Revenue inside the selected window. The series is gap-filled, so summing it
  // is the same number as a direct aggregate over the window.
  const revenueSeries = daily
    ? buildDailySeries(from, startOfDay(now), revenueRows)
    : buildMonthlySeries(from, revenueRows);
  const rangeRevenue = revenueSeries.reduce((sum, point) => sum + (point.revenue || 0), 0);
  const rangeOrders = revenueSeries.reduce((sum, point) => sum + (point.orders || 0), 0);

  res.json({
    success: true,
    data: {
      range,
      from,
      to: now,
      totals: {
        users: totalUsers,
        activeUsers,
        suspendedUsers: totalUsers - activeUsers,
        dealers: totalDealers,
        activeDealers,
        inactiveDealers: totalDealers - activeDealers,
        products: totalProducts,
        outOfStock,
        lowStock,
        orders: totalOrders,
        revenue: totalIncome,
        pendingOrderValue,
        cancelledOrders: cancelledResult.count,
        cancelledOrderValue: cancelledResult.value,
        pendingTradeIns: tradeInCounts.pending || 0,
        tradeIns: Object.values(tradeInCounts).reduce((a, b) => a + b, 0),
        tradeInValue: sellValueResult,
        exchangeCredit: exchangeCreditResult,
        newUsersInRange,
        ordersInRange,
        newProductsInRange,
        rangeRevenue,
        rangeOrders,
      },
      // Same-length window immediately before the selected one, so the stat
      // cards can show a real change instead of a guessed percentage.
      previous: {
        range,
        from: previousFrom,
        to: previousTo,
        revenue: previousRevenue,
        orders: previousOrders,
        users: previousUsers,
        products: previousProducts,
      },
      ordersByStatus: orderCounts,
      paymentsByStatus: paymentCounts,
      tradeInsByStatus: tradeInCounts,
      inFlight: inFlight.reduce((sum, key) => sum + (orderCounts[key] || 0), 0),
      completed: orderCounts.delivered || 0,
      revenueSeries,
      recentOrders,
      recentUsers,
      recentDealers,
      recentTradeIns,
      bestSellers: bestSellers.map((item) => ({
        ...item,
        category: categoryByProduct.get(String(item._id)) || '',
      })),
      lowStockProducts: lowStockRows,
    },
  });
});

module.exports = { getDashboard };
