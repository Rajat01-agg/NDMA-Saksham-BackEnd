// models/PaymentTransaction.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentTransactionSchema = new Schema(
  {
    training_id: { type: Schema.Types.ObjectId, ref: 'TrainingSession' },
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },

    amount: { type: Number },
    txn_ref: { type: String }, // e.g. "UPI-999000"
    status: {
      type: String,
      enum: ['INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED'],
      default: 'INITIATED'
    },
    meta: { type: Schema.Types.Mixed } // gateway response, timestamps, etc.
  },
  { timestamps: true }
);

// index for quick lookups
PaymentTransactionSchema.index({ training_id: 1 });
PaymentTransactionSchema.index({ user_id: 1 });

module.exports = mongoose.model('PaymentTransaction', PaymentTransactionSchema);
