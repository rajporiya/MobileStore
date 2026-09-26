const mongoose = require('mongoose');

const tradeInRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Dealer is required'],
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good',
    },
    expectedPrice: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
    images: [
      {
        url: { type: String, default: '' },
        public_id: { type: String, default: '' },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    dealerPrice: {
      type: Number,
      default: 0,
    },
    dealerNote: {
      type: String,
      default: '',
    },
    decisionAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TradeInRequest', tradeInRequestSchema);