import mongoose from "mongoose";

const customerWarrantySchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  serialNumberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SerialNumber',
    required: true,
    unique: true, // One warranty claim per serial number
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product',
    required: true,
    index: true
  },
  warrantyStartDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  warrantyEndDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
customerWarrantySchema.index({ email: 1, phone: 1 });
customerWarrantySchema.index({ productId: 1, status: 1 });

export const CustomerWarranty = mongoose.model("CustomerWarranty", customerWarrantySchema);
