import mongoose from "mongoose";

const serialNumberSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verifiedCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'deactivated'],
    default: 'active',
    index: true
  },
  batchNumber: {
    type: String,
    default: null,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
serialNumberSchema.index({ productId: 1, status: 1 });

export const SerialNumber = mongoose.model("SerialNumber", serialNumberSchema);