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
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    linkedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// Only an approved old phone is worth money against a new phone.
tradeInRequestSchema.virtual('exchangeValue').get(function () {
  if (this.status !== 'approved' && this.status !== 'completed') return 0;
  return this.dealerPrice || 0;
});

tradeInRequestSchema.virtual('isExchangeable').get(function () {
  return !this.linkedOrder && ['pending', 'approved'].includes(this.status);
});

module.exports = mongoose.model('TradeInRequest', tradeInRequestSchema);