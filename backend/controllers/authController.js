const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendRegistrationOtp } = require('../services/emailService');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @desc  Send registration verification code. No user is created at this step.
// @route POST /api/auth/register/request-otp
const requestRegistrationOtp = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide all fields');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists with this email');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const [passwordHash, otpHash] = await Promise.all([
    bcrypt.hash(password, 10),
    bcrypt.hash(otp, 10),
  ]);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await PendingRegistration.findOneAndUpdate(
    { email: normalizedEmail },
    { name: name.trim(), passwordHash, otpHash, expiresAt, attempts: 0 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendRegistrationOtp({ email: normalizedEmail, name: name.trim(), otp });
  } catch (error) {
    await PendingRegistration.deleteOne({ email: normalizedEmail });
    res.status(503);
    throw error;
  }

  res.json({ success: true, message: 'Verification code sent to your email' });
});

// @desc  Verify registration code and create user account
// @route POST /api/auth/register/verify-otp
const verifyRegistrationOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();
  const pending = await PendingRegistration.findOne({ email: normalizedEmail });

  if (!pending || pending.expiresAt < new Date()) {
    if (pending) await pending.deleteOne();
    res.status(400);
    throw new Error('This verification code has expired. Request a new code.');
  }
  if (pending.attempts >= 5) {
    await pending.deleteOne();
    res.status(429);
    throw new Error('Too many incorrect attempts. Request a new code.');
  }
  if (!(await bcrypt.compare(String(otp || ''), pending.otpHash))) {
    pending.attempts += 1;
    await pending.save();
    res.status(400);
    throw new Error('Invalid verification code');
  }

  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    await pending.deleteOne();
    res.status(400);
    throw new Error('User already exists with this email');
  }

  const user = await User.create({
    name: pending.name,
    email: pending.email,
    password: pending.passwordHash,
  });
  await pending.deleteOne();

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
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
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
  user.phone = req.body.phone || user.phone;
  if (req.body.address) {
    user.address = { ...user.address, ...req.body.address };
  }
  if (req.body.password) {
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
      address: updatedUser.address,
      token: generateToken(updatedUser._id),
    },
  });
});

module.exports = { requestRegistrationOtp, verifyRegistrationOtp, loginUser, getMe, updateProfile };
