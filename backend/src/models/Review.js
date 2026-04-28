import mongoose from 'mongoose'

const ReviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId: { type: String, required: true, index: true }, // Clerk userId
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    comment: { type: String, required: true },
  },
  { timestamps: true },
)

ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true })

export const Review = mongoose.model('Review', ReviewSchema)

