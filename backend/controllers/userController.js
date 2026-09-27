const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const TradeInRequest = require('../models/TradeInRequest');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc  Get all users (Admin)
// @route GET /api/users
const getAllUsers = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 20;
  const page = Number(req.query.page) || 1;

  // Admins can look across every role; the default view stays customers only.
  const role = ['user', 'admin', 'dealer'].includes(req.query.role)
    ? req.query.role
    : 'user';

  const search = req.query.search?.trim();
  const clauses = [];
  if (search) {
    const safe = escapeRegex(search);
    clauses.push(
      { name: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
      { phone: { $regex: safe, $options: 'i' } },
      { 'dealerInfo.shopName': { $regex: safe, $options: 'i' } }
    );
  }
  if (req.query.status === 'active') clauses.push({ isActive: { $ne: false } });
  if (req.query.status === 'suspended') clauses.push({ isActive: false });

  const filter = {
    role,
    ...(clauses.length ? { $or: clauses } : {}),
  };

  const count = await User.countDocuments(filter);

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    success: true,
    data: users,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc  Get single user (Admin)
// @route GET /api/users/:id
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, data: user });
});

// @desc  Everything one account has done (Admin). Keeps the account view to a
//        single request instead of four page-level calls.
// @route GET /api/users/:id/activity
const getUserActivity = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const [orders, tradeIns, spend, tradeInCount, orderCount] = await Promise.all([
    Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(20),
    TradeInRequest.find({ user: user._id })
      .populate('dealer', 'name dealerInfo')
      .sort({ createdAt: -1 })
      .limit(20),
    Order.aggregate([
      {
        $match: {
          user: user._id,
          paymentStatus: 'paid',
          orderStatus: { $ne: 'cancelled' },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
    ]),
    // The lists above are capped for display, so the lifetime totals each need
    // their own count rather than reading the array length.
    TradeInRequest.countDocuments({ user: user._id }),
    Order.countDocuments({ user: user._id }),
  ]);

  res.json({
    success: true,
    data: {
      user,
      orders,
      tradeIns,
      summary: {
        orderCount,
        paidOrderCount: spend[0]?.count || 0,
        totalSpent: spend[0]?.total || 0,
        tradeInCount,
        wishlistCount: (user.wishlist || []).length,
      },
    },
  });
});

// @desc  Suspend or restore an account (Admin)
// @route PUT /api/users/:id/status
const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot suspend your own account');
  }
  if (user.role === 'admin' && req.body.isActive === false) {
    res.status(400);
    throw new Error('Another admin must change this account');
  }

  user.isActive = req.body.isActive !== false;
  await user.save();

  const updated = await User.findById(user._id).select('-password');
  res.json({
    success: true,
    message: updated.isActive ? 'Account restored' : 'Account suspended',
    data: updated,
  });
});

// @desc  Delete user (Admin)
// @route DELETE /api/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot delete admin user');
  }
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted successfully' });
});

// @desc  Get dashboard stats (Admin)
// @route GET /api/users/stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({ role: 'user' });
  // `isActive: { $ne: false }` keeps accounts created before the flag existed
  // counted as active instead of silently disappearing from the totals.
  const activeUsers = await User.countDocuments({ role: 'user', isActive: { $ne: false } });
  const totalDealers = await User.countDocuments({ role: 'dealer' });
  const totalProducts = await Product.countDocuments();
  const totalOrders = await Order.countDocuments();
  const revenueResult = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const totalRevenue = revenueResult[0]?.total || 0;

  // Monthly revenue for chart
  const monthlyRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 6 },
  ]);

  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      suspendedUsers: totalUsers - activeUsers,
      totalDealers,
      totalProducts,
      totalOrders,
      totalRevenue,
      monthlyRevenue,
      recentOrders,
    },
  });
});

// @desc  Add product to wishlist
// @route POST /api/users/wishlist/:productId
const addToWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { productId } = req.params;

  // `wishlist` stores ObjectIds, which are never strictly equal to the string
  // from req.params — so Array.includes(productId) was always false and the
  // remove branch never ran. Compare as strings instead; filtering by string
  // also clears any duplicates earlier clicks pushed in.
  const exists = user.wishlist.some((id) => String(id) === String(productId));

  if (exists) {
    user.wishlist = user.wishlist.filter((id) => String(id) !== String(productId));
  } else {
    user.wishlist.push(productId);
  }

  await user.save();

  // Return the populated wishlist so the client can replace its state directly.
  const updated = await User.findById(user._id).populate({
    path: 'wishlist',
    populate: { path: 'category', select: 'name' },
  });
  res.json({ success: true, data: updated.wishlist });
});

// @desc  Get wishlist
// @route GET /api/users/wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    populate: { path: 'category', select: 'name' },
  });
  res.json({ success: true, data: user.wishlist });
});

// @desc  Get all dealers (Admin)
// @route GET /api/users/dealers
const getAllDealers = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 20;
  const page = Number(req.query.page) || 1;

  const clauses = [];
  const search = req.query.search?.trim();
  if (search) {
    const safe = escapeRegex(search);
    clauses.push(
      { name: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
      { phone: { $regex: safe, $options: 'i' } },
      { 'dealerInfo.shopName': { $regex: safe, $options: 'i' } },
      { 'dealerInfo.city': { $regex: safe, $options: 'i' } }
    );
  }
  if (req.query.status === 'active') clauses.push({ 'dealerInfo.isActive': true });
  if (req.query.status === 'inactive') clauses.push({ 'dealerInfo.isActive': false });

  const filter = {
    role: 'dealer',
    ...(clauses.length ? { $or: clauses } : {}),
  };

  const [count, dealers] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1)),
  ]);

  res.json({
    success: true,
    data: dealers,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc  One dealer's profile plus the old phones routed to them (Admin)
// @route GET /api/users/dealers/:id/activity
const getDealerActivity = asyncHandler(async (req, res) => {
  const dealer = await User.findById(req.params.id).select('-password');
  if (!dealer) {
    res.status(404);
    throw new Error('User not found');
  }
  if (dealer.role !== 'dealer') {
    res.status(400);
    throw new Error('This account is not a dealer');
  }

  const [tradeIns, byStatus, valued, totalRequests] = await Promise.all([
    TradeInRequest.find({ dealer: dealer._id })
      .populate('user', 'name email phone')
      .populate('linkedOrder', '_id totalPrice orderStatus')
      .sort({ createdAt: -1 })
      .limit(25),
    TradeInRequest.aggregate([
      { $match: { dealer: dealer._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    TradeInRequest.aggregate([
      { $match: { dealer: dealer._id, status: { $in: ['approved', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$dealerPrice' } } },
    ]),
    // The list above is capped, so the lifetime total needs its own count.
    TradeInRequest.countDocuments({ dealer: dealer._id }),
  ]);

  res.json({
    success: true,
    data: {
      dealer,
      tradeIns,
      summary: {
        byStatus: Object.fromEntries(byStatus.map((r) => [r._id, r.count])),
        totalRequests,
        totalValued: valued[0]?.total || 0,
      },
    },
  });
});

// @desc  Promote user to dealer (Admin)
// @route POST /api/users/dealers
const promoteToDealer = asyncHandler(async (req, res) => {
  const { email, shopName, city } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(404);
    throw new Error('User not found with this email');
  }
  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot change admin role');
  }

  user.role = 'dealer';
  user.dealerInfo = {
    shopName: shopName || '',
    description: '',
    city: city || '',
    isActive: true,
  };
  await user.save();

  const updated = await User.findById(user._id).select('-password');

  res.json({ success: true, data: updated });
});

// @desc  Update dealer info (Admin)
// @route PUT /api/users/dealers/:id
const updateDealer = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role !== 'dealer') {
    res.status(400);
    throw new Error('User is not a dealer');
  }

  const { shopName, description, city, isActive } = req.body;
  if (shopName !== undefined) user.dealerInfo.shopName = shopName;
  if (description !== undefined) user.dealerInfo.description = description;
  if (city !== undefined) user.dealerInfo.city = city;
  if (isActive !== undefined) user.dealerInfo.isActive = isActive;

  await user.save();

  const updated = await User.findById(user._id).select('-password');
  res.json({ success: true, data: updated });
});

// @desc  Demote dealer to user (Admin)
// @route PUT /api/users/dealers/:id/demote
const demoteDealer = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role !== 'dealer') {
    res.status(400);
    throw new Error('User is not a dealer');
  }

  user.role = 'user';
  await user.save();
  res.json({ success: true, message: 'User demoted to regular user' });
});

module.exports = {
  getAllUsers,
  getUserById,
  getUserActivity,
  updateUserStatus,
  deleteUser,
  getDashboardStats,
  addToWishlist,
  getWishlist,
  getAllDealers,
  getDealerActivity,
  promoteToDealer,
  updateDealer,
  demoteDealer,
};
