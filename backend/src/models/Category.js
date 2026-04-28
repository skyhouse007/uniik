import mongoose from 'mongoose'

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    image: { type: String },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    /** Order among siblings (same parentId); lower first. */
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true },
)

export const Category = mongoose.model('Category', CategorySchema)

