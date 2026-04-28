import mongoose from 'mongoose'

const AddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false },
)

const UserSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    email: { type: String, index: true },
    addresses: { type: [AddressSchema], default: [] },
  },
  { timestamps: true },
)

export const User = mongoose.model('User', UserSchema)

