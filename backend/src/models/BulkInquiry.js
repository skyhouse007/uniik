import mongoose from 'mongoose'

const BulkInquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new', index: true },
  },
  { timestamps: true },
)

export const BulkInquiry = mongoose.model('BulkInquiry', BulkInquirySchema)
