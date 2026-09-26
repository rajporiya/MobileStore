const asyncHandler = require('express-async-handler');
const TradeInRequest = require('../models/TradeInRequest');
const Order = require('../models/Order');
const User = require('../models/User');

const LIST_POPULATE = [
  { path: 'user', select: 'name email phone address' },
  { path: 'dealer', select: 'name dealerInfo phone email' },
  { path: 'linkedOrder', select: '_id totalPrice orderStatus' },
  { path: 'approvedBy', select: 'name' },
];

const round2 = (value) => Math.round(value * 100) / 100;

// Admins may act on any request; a dealer only on requests assigned to them.
const canDecide = (request, user) =>
  user.role === 'admin' || request.dealer.toString() === user._id.toString();

// Recalculates an order that was placed against this old phone so the latest
// admin decision is always reflected in the amount the customer owes.
const syncExchangeWithOrder = async (request) => {
  if (!request.linkedOrder) return null;

  const order = await Order.findById(request.linkedOrder);
  if (!order) return null;

  const grossTotal = round2(order.itemsPrice + order.shippingPrice + order.taxPrice);
  const value =
    request.status === 'approved' || request.status === 'completed'
      ? Math.min(Math.max(request.dealerPrice || 0, 0), grossTotal)
      : 0;

  const alreadyApplied = order.tradeInValue || 0;

  order.tradeIn = {
    request: request._id,
    brand: request.brand,
    model: request.model,
    status: request.status,
    value,
    refundDue:
      order.paymentStatus === 'paid' ? round2(Math.max(0, value - alreadyApplied)) : 0,
  };
  order.tradeInValue = value;
  order.totalPrice = round2(Math.max(0, grossTotal - value));

  return order.save();
};

const withRelations = (request) => request.populate(LIST_POPULATE);

// @desc  Get active dealers (for user to select)
// @route GET /api/tradein/dealers
const getDealers = asyncHandler(async (req, res) => {
  const dealers = await User.find({
    role: 'dealer',
    'dealerInfo.isActive': true,
  }).select('name email phone dealerInfo address');

  res.json({ success: true, data: dealers });
});

// @desc  Create trade-in request (user)
// @route POST /api/tradein
const createRequest = asyncHandler(async (req, res) => {
  const { dealer, brand, model, condition, expectedPrice, description } = req.body;

  const dealerExists = await User.findOne({
    _id: dealer,
    role: 'dealer',
    'dealerInfo.isActive': true,
  });
  if (!dealerExists) {
    res.status(404);
    throw new Error('Dealer not found or inactive');
  }

  let images = [];
  if (req.files && req.files.length > 0) {
    images = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      public_id: file.filename,
    }));
  }

  const request = await TradeInRequest.create({
    user: req.user._id,
    dealer,
    brand,
    model,
    condition: condition || 'good',
    expectedPrice: expectedPrice || 0,
    description: description || '',
    images,
  });

  const populated = await request.populate([
    { path: 'user', select: 'name email phone' },
    { path: 'dealer', select: 'name dealerInfo' },
  ]);

  res.status(201).json({ success: true, data: populated });
});

// @desc  Get current user's trade-in requests
// @route GET /api/tradein/my
const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await TradeInRequest.find({ user: req.user._id })
    .populate([
      { path: 'dealer', select: 'name dealerInfo phone email' },
      { path: 'linkedOrder', select: '_id totalPrice orderStatus' },
    ])
    .sort({ createdAt: -1 });

  res.json({ success: true, data: requests });
});

// @desc  Get single trade-in request (owner / assigned dealer / admin)
// @route GET /api/tradein/:id
const getRequestById = asyncHandler(async (req, res) => {
  const request = await TradeInRequest.findById(req.params.id).populate(LIST_POPULATE);

  if (!request) {
    res.status(404);
    throw new Error('Trade-in request not found');
  }

  const isOwner = request.user._id.toString() === req.user._id.toString();
  const isDealer = request.dealer._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isDealer && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view this request');
  }

  res.json({ success: true, data: request });
});

// @desc  Get incoming requests for a dealer
// @route GET /api/tradein/dealer-requests
const getDealerRequests = asyncHandler(async (req, res) => {
  const status = req.query.status || '';
  const filter = { dealer: req.user._id };
  if (status) filter.status = status;

  const requests = await TradeInRequest.find(filter)
    .populate(LIST_POPULATE)
    .sort({ createdAt: -1 });

  res.json({ success: true, data: requests });
});

// @desc  Approve trade-in request and set the old phone value (admin or assigned dealer)
// @route PUT /api/tradein/:id/approve
const approveRequest = asyncHandler(async (req, res) => {
  const { dealerPrice, note } = req.body;
  const request = await TradeInRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Trade-in request not found');
  }
  if (!canDecide(request, req.user)) {
    res.status(403);
    throw new Error('Not authorized for this request');
  }
  if (request.status !== 'pending' && request.status !== 'approved') {
    res.status(400);
    throw new Error(`Cannot approve a ${request.status} request`);
  }

  request.status = 'approved';
  request.dealerPrice = Number(dealerPrice) || request.expectedPrice || 0;
  request.dealerNote = note !== undefined ? note : request.dealerNote;
  request.decisionAt = new Date();
  request.approvedBy = req.user._id;

  const updated = await request.save();
  await syncExchangeWithOrder(updated);

  res.json({
    success: true,
    message: `Old phone valued at ₹${updated.dealerPrice}`,
    data: await withRelations(updated),
  });
});

// @desc  Reject trade-in request (admin or assigned dealer)
// @route PUT /api/tradein/:id/reject
const rejectRequest = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const request = await TradeInRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Trade-in request not found');
  }
  if (!canDecide(request, req.user)) {
    res.status(403);
    throw new Error('Not authorized for this request');
  }
  if (request.status !== 'pending' && request.status !== 'approved') {
    res.status(400);
    throw new Error(`Cannot reject a ${request.status} request`);
  }

  request.status = 'rejected';
  request.dealerPrice = 0;
  request.dealerNote = note || '';
  request.decisionAt = new Date();
  request.approvedBy = req.user._id;

  const updated = await request.save();
  await syncExchangeWithOrder(updated);

  res.json({
    success: true,
    message: 'Request rejected',
    data: await withRelations(updated),
  });
});

// @desc  Mark trade-in as completed (dealer paid the user & took the phone)
// @route PUT /api/tradein/:id/complete
const completeRequest = asyncHandler(async (req, res) => {
  const request = await TradeInRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Trade-in request not found');
  }
  if (!canDecide(request, req.user)) {
    res.status(403);
    throw new Error('Not authorized for this request');
  }
  if (request.status !== 'approved') {
    res.status(400);
    throw new Error('Only approved requests can be completed');
  }

  request.status = 'completed';
  request.decisionAt = new Date();

  const updated = await request.save();
  await syncExchangeWithOrder(updated);

  res.json({ success: true, data: await withRelations(updated) });
});

// @desc  Cancel trade-in request (user)
// @route PUT /api/tradein/:id/cancel
const cancelRequest = asyncHandler(async (req, res) => {
  const request = await TradeInRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Trade-in request not found');
  }
  if (request.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to cancel this request');
  }
  if (request.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending requests can be cancelled');
  }

  request.status = 'cancelled';
  const updated = await request.save();
  res.json({ success: true, data: updated });
});

// @desc  Get all trade-in requests (admin)
// @route GET /api/tradein/admin
const getAllRequests = asyncHandler(async (req, res) => {
  const status = req.query.status || '';
  const filter = status ? { status } : {};

  const requests = await TradeInRequest.find(filter)
    .populate(LIST_POPULATE)
    .sort({ createdAt: -1 });

  res.json({ success: true, data: requests });
});

// @desc  Get dealer dashboard stats
// @route GET /api/tradein/stats/dealer
const getDealerStats = asyncHandler(async (req, res) => {
  const filter = { dealer: req.user._id };
  const [pending, approved, rejected, completed, total] = await Promise.all([
    TradeInRequest.countDocuments({ ...filter, status: 'pending' }),
    TradeInRequest.countDocuments({ ...filter, status: 'approved' }),
    TradeInRequest.countDocuments({ ...filter, status: 'rejected' }),
    TradeInRequest.countDocuments({ ...filter, status: 'completed' }),
    TradeInRequest.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { total, pending, approved, rejected, completed },
  });
});

// @desc  Delete trade-in request (admin)
// @route DELETE /api/tradein/:id
const deleteRequest = asyncHandler(async (req, res) => {
  const request = await TradeInRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Trade-in request not found');
  }
  if (request.linkedOrder) {
    res.status(400);
    throw new Error('Cancel the exchange on the linked order before deleting this request');
  }
  await request.deleteOne();
  res.json({ success: true, message: 'Trade-in request deleted' });
});

module.exports = {
  getDealers,
  createRequest,
  getMyRequests,
  getRequestById,
  getDealerRequests,
  approveRequest,
  rejectRequest,
  completeRequest,
  cancelRequest,
  getAllRequests,
  getDealerStats,
  deleteRequest,
};