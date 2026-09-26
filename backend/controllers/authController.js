const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc   Register a new customer account (no verification required)
// @route  POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    res.status(400);
    throw new Error('Please provide all fields');
  }

  // Normalize to digits so +91, spaces and dashes all compare equal.
  const normalizedPhone = String(phone).replace(/\D/g, '');
  if (normalizedPhone.length < 10) {
    res.status(400);
    throw new Error('Please enter a valid mobile number');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const userExists = await User.findOne({
    $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
  });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email or mobile number');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    password: passwordHash,
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    },
  });
});

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @desc  Login user
// @route POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    // Suspended accounts keep their data but cannot sign in any more.
    if (user.isActive === false) {
      res.status(403);
      throw new Error('This account has been deactivated. Contact support.');
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
        token: generateToken(user._id),
      },
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc  Get current user profile
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json({ success: true, data: user });
});

// @desc  Update user profile
// @route PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.name = req.body.name || user.name;
  user.phone = req.body.phone ?? user.phone;
  if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
  if (req.body.address) {
    user.address = { ...user.address, ...req.body.address };
  }
  if (req.body.password) {
    // Callers that know the current password (admin settings) must prove it;
    // the customer profile form does not send one, so it stays as it was.
    if (req.body.currentPassword) {
      const matches = await user.matchPassword(req.body.currentPassword);
      if (!matches) {
        res.status(400);
        throw new Error('Current password is incorrect');
      }
    }
    if (req.body.password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }
    user.password = req.body.password;
  }

  const updatedUser = await user.save();

  res.json({
    success: true,
    data: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      address: updatedUser.address,
      token: generateToken(updatedUser._id),
    },
  });
});

module.exports = { registerUser, loginUser, getMe, updateProfile };
