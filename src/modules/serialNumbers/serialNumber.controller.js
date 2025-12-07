import mongoose from "mongoose";
import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { productModel } from "../../../Database/models/product.model.js";
import { SerialNumber } from "../../../Database/models/serialNumber.model.js";
import { generateUniqueSerialNumbers } from "../../utils/serialNumberGenerator.js";

export const generateSerialNumbers = catchAsyncError(async (req, res, next) => {
  const { productId, quantity, batchNumber } = req.body;

  const product = await productModel.findById(productId).lean();
  if (!product) return next(new AppError("Product not found", 404));

  const serialList = await generateUniqueSerialNumbers(quantity, SerialNumber);

  const docs = serialList.map(sn => ({
    serialNumber: sn,
    productId,
    batchNumber: batchNumber || null,
    status: "active",
    isVerified: false,
    verifiedCount: 0,
  }));

  const created = await SerialNumber.insertMany(docs);

  await productModel.findByIdAndUpdate(productId, {
    $inc: { totalSerialNumbers: quantity }
  });

  res.status(201).json({
    status: "success",
    message: `${quantity} serial numbers generated successfully`,
    serialNumbers: created,
  });
});

export const getSerialsByProduct = catchAsyncError(async (req, res, next) => {
  const { productId } = req.params;

  const serials = await SerialNumber.find({ productId }).sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    count: serials.length,
    serialNumbers: serials,
  });
});

export const deactivateSerial = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const updated = await SerialNumber.findByIdAndUpdate(
    id,
    { status: "deactivated" },
    { new: true }
  );

  if (!updated) return next(new AppError("Serial number not found", 404));

  res.status(200).json({
    status: "success",
    message: "Serial number deactivated successfully",
    serialNumber: updated,
  });
});

export const verifySerial = catchAsyncError(async (req, res, next) => {
  const { serialNumber } = req.params;

  const serial = await SerialNumber.findOne({ serialNumber });
  if (!serial) return next(new AppError("Serial number not found", 404));

  if (serial.status === "deactivated")
    return next(new AppError("This serial number has been deactivated", 403));

  serial.verifiedCount += 1;
  if (!serial.isVerified) {
    serial.isVerified = true;
    serial.verifiedAt = new Date();
  }
  await serial.save();

  const product = await productModel.findById(serial.productId);
  if (!product) return next(new AppError("Associated product not found", 404));

  res.status(200).json({
    status: "success",
    valid: true,
    message: "Serial number verified successfully",
    product,
    serialData: serial,
  });
});

export const deleteSerial = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const serial = await SerialNumber.findByIdAndDelete(id);

  if (!serial) return next(new AppError("Serial number not found", 404));

  await productModel.findByIdAndUpdate(serial.productId, {
    $inc: { totalSerialNumbers: -1 },
  });

  res.status(200).json({
    status: "success",
    message: "Serial number deleted successfully",
  });
});
