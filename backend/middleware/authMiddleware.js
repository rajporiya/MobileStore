const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  let user;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    user = await User.findById(decoded.id).select('-password');
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }

  if (!user) {
    res.status(401);
    throw new Error('Not authorized, user not found');
  }

  // Suspending an account has to take effect immediately, not on the next
  // sign-in, so an already-issued token is rejected here too. Legacy documents
  // without the field are treated as active.
  if (user.isActive === false) {
    res.status(403);
    throw new Error('Your account has been suspended. Contact an administrator.');
  }

  req.user = user;
  next();
});

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as admin');
  }
};

const dealer = (req, res, next) => {
  if (req.user && req.user.role === 'dealer') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as dealer');
  }
};

// Admins can act on any trade-in request, dealers only on their own.
const staff = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'dealer')) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized for this action');
  }
};

// Only shoppers sell an old phone. Staff review the phones customers bring in,
// they never submit one themselves.
const customer = (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    next();
  } else {
    res.status(403);
    throw new Error('Only customer accounts can sell an old phone');
  }
};

module.exports = { protect, admin, dealer, staff, customer };
