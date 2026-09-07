const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendOrderConfirmation } = require('../services/whatsappService');

// @desc  Create new order
// @route POST /api/orders
const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  // Verify products exist and calculate prices
  let itemsPrice = 0;
  const verifiedItems = [];

  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error(`Product ${item.product} not found`);
    }
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.title}`);
    }
    verifiedItems.push({
      product: product._id,
      title: product.title,
      price: product.price,
      quantity: item.quantity,
      image: product.images?.[0]?.url || '',
    });
    itemsPrice += product.price * item.quantity;
  }

  const shippingPrice = itemsPrice >= 999 ? 0 : 99;
  const taxPrice = Math.round(itemsPrice * 0.18 * 100) / 100;
  const totalPrice = Math.round((itemsPrice + shippingPrice + taxPrice) * 100) / 100;

  const order = await Order.create({
    user: req.user._id,
    orderItems: verifiedItems,
    shippingAddress,
    paymentMethod: paymentMethod || 'cod',
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  });

  // Reduce stock
  for (const item of verifiedItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity },
    });
  }

  // A message failure must never undo a successfully placed order.
  try {
    const notification = await sendOrderConfirmation(order);
    if (notification.skipped) {
      order.whatsappNotification.status = 'not_configured';
    } else {
      order.whatsappNotification.status = 'sent';
      order.whatsappNotification.messageId = notification.messageId;
      order.whatsappNotification.sentAt = new Date();
    }
  } catch (error) {
    order.whatsappNotification.status = 'failed';
    order.whatsappNotification.error = error.message;
    console.error(`WhatsApp notification failed for order ${order._id}: ${error.message}`);
  }
  await order.save();

  res.status(201).json({ success: true, data: order });
});

// @desc  Get logged-in user's orders
// @route GET /api/orders/myorders
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
});

// @desc  Get order by ID
// @route GET /api/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('orderItems.product', 'title images');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Only owner or admin can view
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json({ success: true, data: order });
});

// @desc  Update order to paid
// @route PUT /api/orders/:id/pay
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.paymentStatus = 'paid';
  order.paidAt = Date.now();
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.payer?.email_address || '',
  };

  const updated = await order.save();
  res.json({ success: true, data: updated });
});

// @desc  Get all orders (Admin)
// @route GET /api/orders
const getAllOrders = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 20;
  const page = Number(req.query.page) || 1;

  const statusFilter = req.query.status ? { orderStatus: req.query.status } : {};
  const count = await Order.countDocuments(statusFilter);

  const orders = await Order.find(statusFilter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    success: true,
    data: orders,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc  Update order status (Admin)
// @route PUT /api/orders/:id/status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.orderStatus = req.body.orderStatus || order.orderStatus;
  if (req.body.orderStatus === 'delivered') {
    order.deliveredAt = Date.now();
    order.paymentStatus = 'paid';
  }

  const updated = await order.save();
  res.json({ success: true, data: updated });
});

// @desc  Get admin dashboard stats
// @route GET /api/orders/stats
const getOrderStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const totalRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);

  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentOrders,
      ordersByStatus,
    },
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
};
