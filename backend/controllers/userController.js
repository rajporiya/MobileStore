const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc  Get all users (Admin)
// @route GET /api/users
const getAllUsers = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 20;
  const page = Number(req.query.page) || 1;
  const count = await User.countDocuments({ role: 'user' });

  const users = await User.find({ role: 'user' })
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

  if (user.wishlist.includes(productId)) {
    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
  } else {
    user.wishlist.push(productId);
  }

  await user.save();
  res.json({ success: true, data: user.wishlist });
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
  const dealers = await User.find({ role: 'dealer' })
    .select('-password')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: dealers });
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
  deleteUser,
  getDashboardStats,
  addToWishlist,
  getWishlist,
  getAllDealers,
  promoteToDealer,
  updateDealer,
  demoteDealer,
};
