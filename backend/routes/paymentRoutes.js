const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/authMiddleware');

// @desc  Create Razorpay order
// @route POST /api/payment/razorpay
router.post(
  '/razorpay',
  protect,
  asyncHandler(async (req, res) => {
    const { amount } = req.body;

    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'your_razorpay_key_id') {
      return res.json({
        success: true,
        data: {
          id: `order_demo_${Date.now()}`,
          amount: amount * 100,
          currency: 'INR',
          key: 'rzp_test_demo',
        },
      });
    }

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({
      success: true,
      data: { ...order, key: process.env.RAZORPAY_KEY_ID },
    });
  })
);

// @desc  Create Stripe payment intent
// @route POST /api/payment/stripe
router.post(
  '/stripe',
  protect,
  asyncHandler(async (req, res) => {
    const { amount } = req.body;

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'your_stripe_secret_key') {
      return res.json({
        success: true,
        data: { clientSecret: `pi_demo_secret_${Date.now()}` },
      });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'inr',
      automatic_payment_methods: { enabled: true },
    });

    res.json({ success: true, data: { clientSecret: paymentIntent.client_secret } });
  })
);

module.exports = router;
