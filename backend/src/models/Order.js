import mongoose from 'mongoose'

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    selectedVariantCategory: { type: String, trim: true },
    selectedSize: { type: String, trim: true },
    selectedThickness: { type: String, trim: true },
    size: { type: String, trim: true },
  },
  { _id: false },
)

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    products: { type: [OrderItemSchema], default: [] },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, default: 'Online' },
    paymentStatus: { type: String, enum: ['paid', 'failed', 'pending'], default: 'pending', index: true },
    orderStatus: {
      type: String,
      enum: ['created', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'created',
      index: true,
    },
    address: { type: Object, required: true },
    shipping: {
      carrier: { type: String },
      trackingNumber: { type: String },
      trackingUrl: { type: String },
    },
    razorpay: {
      orderId: { type: String },
      paymentId: { type: String },
      signature: { type: String },
    },
  },
  { timestamps: true },
)

export const Order = mongoose.model('Order', OrderSchema)
