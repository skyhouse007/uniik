import mongoose from 'mongoose'

const PaymentAttemptSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'cancelled'],
      default: 'created',
      index: true,
    },
    amountInPaise: { type: Number, required: true, min: 100 },
    currency: { type: String, default: 'INR' },
    razorpay: {
      orderId: { type: String, required: true, index: true, unique: true },
      paymentId: { type: String },
      signature: { type: String },
      errorCode: { type: String },
      errorDescription: { type: String },
    },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true },
)

export const PaymentAttempt = mongoose.model('PaymentAttempt', PaymentAttemptSchema)

