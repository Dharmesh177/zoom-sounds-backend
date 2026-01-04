import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  serialNumber: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  customerName: {
    type: String,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  serialNumberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SerialNumber',
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index - MongoDB will auto-delete after expiration
  },
  attempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
otpSchema.index({ phone: 1, serialNumber: 1, isVerified: 1 });

export const OTP = mongoose.model("OTP", otpSchema);
