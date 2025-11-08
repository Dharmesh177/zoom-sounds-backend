const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  uniqueCode: { type: String, required: true, unique: true },
  isValid: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('QRCode', qrCodeSchema);
