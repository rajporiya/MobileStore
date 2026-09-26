const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const TradeInRequest = require('../models/TradeInRequest');
const { syncExchangeWithOrder } = require('./tradeInController');
const { sendOrderConfirmation } = require('../services/whatsappService');
const { sendOrderSms } = require('../services/smsService');

// @desc  Create new order
// @route POST /api/orders
const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, tradeInRequestId } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  // Verify products exist and calculate prices
  let itemsPrice = 0;
  const verifiedItems = [];
  let exchangeEligible = true;

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
    if (!product.exchangeEnabled) exchangeEligible = false;
    verifiedItems.push({
      product: product._id,
      title: product.title,
      price: product.price,
      quantity: item.quantity,
      image: product.images?.[0]?.url || '',
    });
    itemsPrice += product.price * item.quantity;
  }

  // Old phone handed in against this order. Its admin-approved value is
  // deducted from the new phone price.
  let tradeIn = null;
  let tradeInValue = 0;

  if (tradeInRequestId) {
    if (!exchangeEligible) {
      res.status(400);
      throw new Error('Exchange is not available on every phone in this cart');
    }

    const request = await TradeInRequest.findById(tradeInRequestId);

    if (!request || request.user.toString() !== req.user._id.toString()) {
      res.status(404);
      throw new Error('Trade-in request not found');
    }
    if (request.linkedOrder) {
      res.status(400);
      throw new Error('This old phone has already been used in another order');
    }
    if (request.status === 'rejected' || request.status === 'cancelled') {
      res.status(400);
      throw new Error('This old phone request cannot be used for an exchange');
    }

    tradeInValue = request.exchangeValue;
    tradeIn = {
      request: request._id,
      brand: request.brand,
      model: request.model,
      status: request.status,
      value: tradeInValue,
    };
  }

  const shippingPrice = itemsPrice >= 999 ? 0 : 99;
  const taxPrice = Math.round(itemsPrice * 0.18 * 100) / 100;
  const grossTotal = Math.round((itemsPrice + shippingPrice + taxPrice) * 100) / 100;

  tradeInValue = Math.min(tradeInValue, grossTotal);
  if (tradeIn) tradeIn.value = tradeInValue;

  const totalPrice = Math.round((grossTotal - tradeInValue) * 100) / 100;

  const order = await Order.create({
    user: req.user._id,
    orderItems: verifiedItems,
    shippingAddress,
    paymentMethod: paymentMethod || 'cod',
    itemsPrice,
    shippingPrice,
    taxPrice,
    tradeInValue,
    tradeIn,
    totalPrice,
  });

  // A trade-in request can only ever back one order.
  if (tradeIn) {
    await TradeInRequest.findByIdAndUpdate(tradeIn.request, { linkedOrder: order._id });
  }

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

  try {
    const notification = await sendOrderSms(order);
    if (notification.skipped) {
      order.smsNotification.status = 'not_configured';
    } else {
      order.smsNotification.status = 'sent';
      order.smsNotification.messageId = notification.messageId;
      order.smsNotification.sentAt = new Date();
    }
  } catch (error) {
    order.smsNotification.status = 'failed';
    order.smsNotification.error = error.message;
    console.error(`SMS notification failed for order ${order._id}: ${error.message}`);
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
    .populate('orderItems.product', 'title images')
    .populate('tradeIn.request', 'brand model status dealerPrice condition');

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

  const nextStatus = req.body.orderStatus || order.orderStatus;
  const wasCancelled = order.orderStatus === 'cancelled';
  const willCancel = nextStatus === 'cancelled' && !wasCancelled;
  const willRestore = wasCancelled && nextStatus !== 'cancelled';

  // Cancelling releases the stock and hands the old phone back to the customer,
  // so an approved trade-in becomes reusable instead of being locked forever.
  if (willCancel) {
    if (order.orderStatus !== 'delivered') {
      for (const item of order.orderItems) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } }
        );
      }
    }

    if (order.tradeIn?.request) {
      const request = await TradeInRequest.findById(order.tradeIn.request);
      if (request && request.linkedOrder?.toString() === order._id.toString()) {
        request.linkedOrder = undefined;
        if (request.status === 'approved' || request.status === 'completed') {
          request.status = 'approved';
        }
        await request.save();
      }
      // Keep the request id so the order can be restored, but drop the credit.
      order.tradeIn.value = 0;
      order.tradeIn.status = 'released';
    }

    order.tradeInValue = 0;
    order.cancelledAt = new Date();
    order.cancelReason = req.body.reason || '';
  }

  // Putting a cancelled order back means taking the stock out again.
  if (willRestore) {
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (!product || product.stock < item.quantity) {
        res.status(400);
        throw new Error(
          `Cannot restore — only ${product?.stock ?? 0} left of ${item.title}`
        );
      }
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: -item.quantity } }
      );
    }

    if (order.tradeIn?.request) {
      const request = await TradeInRequest.findById(order.tradeIn.request);
      if (request && !request.linkedOrder) {
        request.linkedOrder = order._id;
        await request.save();
        await syncExchangeWithOrder(request);
      }
    }

    order.cancelledAt = undefined;
    order.cancelReason = '';
  }

  order.orderStatus = nextStatus;
  if (nextStatus === 'delivered') {
    order.deliveredAt = Date.now();
    order.paymentStatus = 'paid';
  }

  const updated = await order.save();
  res.json({ success: true, data: updated });
});

// @desc  Get admin dashboard stats
// @route GET /api/orders/stats
const getOrderStats = asyncHandler(async (req, res) => {
  // ---- Purchase orders ----
  const totalOrders = await Order.countDocuments();

  // Income only counts orders that were paid and not cancelled.
  const incomeResult = await Order.aggregate([
    { $match: { paymentStatus: 'paid', orderStatus: { $ne: 'cancelled' } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);
  const totalIncome = incomeResult[0]?.total || 0;

  const pendingResult = await Order.aggregate([
    { $match: { orderStatus: { $in: ['processing', 'confirmed', 'shipped'] } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);

  // Value of the orders the admin threw away.
  const cancelledResult = await Order.aggregate([
    { $match: { orderStatus: 'cancelled' } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        value: { $sum: '$totalPrice' },
      },
    },
  ]);

  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
  ]);

  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  const monthlyRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid', orderStatus: { $ne: 'cancelled' } } },
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

  // ---- Sell orders (customers handing in an old phone) ----
  const sellTotal = await TradeInRequest.countDocuments();
  const sellByStatus = await TradeInRequest.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const sellValueResult = await TradeInRequest.aggregate([
    { $match: { status: { $in: ['approved', 'completed'] } } },
    { $group: { _id: null, total: { $sum: '$dealerPrice' } } },
  ]);
  const recentTradeIns = await TradeInRequest.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  const statusCount = (list, status) =>
    list.find((row) => row._id === status)?.count || 0;

  // Exchange credit actually applied to purchase orders.
  const totalExchangeValue = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' } } },
    { $group: { _id: null, total: { $sum: '$tradeInValue' } } },
  ]);

  res.json({
    success: true,
    data: {
      // Purchase orders
      totalOrders,
      totalIncome,
      totalRevenue: totalIncome,
      pendingOrderValue: pendingResult[0]?.total || 0,
      pendingOrders:
        statusCount(ordersByStatus, 'processing') +
        statusCount(ordersByStatus, 'confirmed') +
        statusCount(ordersByStatus, 'shipped'),
      cancelledOrders: cancelledResult[0]?.count || 0,
      cancelledOrderValue: cancelledResult[0]?.value || 0,
      ordersByStatus,
      monthlyRevenue,
      recentOrders,
      // Sell orders
      totalSellOrders: sellTotal,
      sellPending: statusCount(sellByStatus, 'pending'),
      sellApproved: statusCount(sellByStatus, 'approved'),
      sellCompleted: statusCount(sellByStatus, 'completed'),
      sellRejected: statusCount(sellByStatus, 'rejected'),
      totalSellValue: sellValueResult[0]?.total || 0,
      totalExchangeValue: totalExchangeValue[0]?.total || 0,
      recentTradeIns,
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
