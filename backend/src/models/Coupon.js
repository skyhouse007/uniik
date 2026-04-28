import mongoose from 'mongoose'

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['percent', 'flat'], required: true },
    value: { type: Number, required: true },
    minSubtotal: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
)

export const Coupon = mongoose.model('Coupon', CouponSchema)

