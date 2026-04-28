import mongoose from 'mongoose'

const CartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    selectedVariantCategory: { type: String, trim: true },
    selectedSize: { type: String, trim: true },
    selectedThickness: { type: String, trim: true },
    /** @deprecated use selectedSize */
    size: { type: String, trim: true },
  },
  { _id: false },
)

const CartSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    products: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true },
)

export const Cart = mongoose.model('Cart', CartSchema)
