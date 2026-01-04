import mongoose from "mongoose";
import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { productModel } from "../../../Database/models/product.model.js";
import { SerialNumber } from "../../../Database/models/serialNumber.model.js";
import { CustomerWarranty } from "../../../Database/models/customerWarranty.model.js";
import { OTP } from "../../../Database/models/otp.model.js";
import { generateUniqueSerialNumbers } from "../../utils/serialNumberGenerator.js";
import { generateOTP, sendOTPViaSNS } from "../../utils/snsService.js";

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

  // Increment verification count
  serial.verifiedCount += 1;
  if (!serial.isVerified) {
    serial.isVerified = true;
    serial.verifiedAt = new Date();
  }
  await serial.save();

  const product = await productModel.findById(serial.productId);
  if (!product) return next(new AppError("Associated product not found", 404));

  // Check if warranty is already claimed
  const warrantyData = await CustomerWarranty.findOne({ serialNumberId: serial._id });
  
  if (serial.claimedWarranty && warrantyData) {
    // Warranty already claimed - calculate remaining warranty time
    const currentTime = new Date();
    const warrantyEndDate = warrantyData.warrantyEndDate;
    const timeRemainingMs = warrantyEndDate - currentTime;
    
    // Convert to days, hours, minutes
    const daysRemaining = Math.max(0, Math.floor(timeRemainingMs / (1000 * 60 * 60 * 24)));
    const hoursRemaining = Math.max(0, Math.floor((timeRemainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    
    const isExpired = timeRemainingMs <= 0;
    
    res.status(200).json({
      status: "success",
      valid: true,
      claimed: true,
      claimedWarranty: true,
      message: isExpired ? "Warranty has expired" : "Warranty is active",
      warrantyStatus: isExpired ? "expired" : "active",
      warrantyExpireTime: {
        daysRemaining,
        hoursRemaining,
        totalDays: product.warranty || 0,
        startDate: warrantyData.warrantyStartDate,
        endDate: warrantyEndDate,
        isExpired
      },
      customerInfo: {
        name: warrantyData.customerName,
        email: warrantyData.email,
        phone: warrantyData.phone,
        claimedAt: serial.claimedAt
      },
      product,
      serialData: serial,
    });
  } else {
    // First time verification or warranty not claimed yet
    res.status(200).json({
      status: "success",
      valid: true,
      claimed: false,
      claimedWarranty: false,
      message: "Serial number verified successfully. Please claim your warranty.",
      warrantyExpireTime: {
        totalDays: product.warranty || 0,
        warrantyPeriod: `${product.warranty || 0} days from claim date`
      },
      product,
      serialData: serial,
    });
  }
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

// ==================== WARRANTY CLAIM ENDPOINTS ====================

/**
 * Step 1: Initiate warranty claim - Send OTP to customer's phone
 */
export const initiateWarrantyClaim = catchAsyncError(async (req, res, next) => {
  const { serialNumber, customerName, email, phone } = req.body;

  // Find serial number
  const serial = await SerialNumber.findOne({ serialNumber });
  if (!serial) return next(new AppError("Serial number not found", 404));

  if (serial.status === "deactivated")
    return next(new AppError("This serial number has been deactivated", 403));

  // Check if warranty already claimed
  if (serial.claimedWarranty) {
    return next(new AppError("Warranty has already been claimed for this serial number", 400));
  }

  // Get product details
  const product = await productModel.findById(serial.productId);
  if (!product) return next(new AppError("Associated product not found", 404));

  // Generate OTP
  const otp = generateOTP();
  console.log("otp", otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Delete any existing OTPs for this phone and serial number
  await OTP.deleteMany({ phone, serialNumber });

  // Save OTP to database
  await OTP.create({
    phone,
    otp,
    serialNumber,
    email,
    customerName,
    productId: product._id,
    serialNumberId: serial._id,
    expiresAt,
    isVerified: false,
    attempts: 0
  });

  // Send OTP via SNS
  try {
    await sendOTPViaSNS(phone, otp);
    
    res.status(200).json({
      status: "success",
      message: "OTP sent successfully to your phone number",
      data: {
        phone,
        expiresIn: "10 minutes"
      }
    });
  } catch (error) {
    // Clean up OTP if sending failed
    await OTP.deleteOne({ phone, serialNumber, otp });
    return next(new AppError(error.message || "Failed to send OTP", 500));
  }
});

/**
 * Step 2: Verify OTP and complete warranty claim
 */
export const verifyOTPAndClaimWarranty = catchAsyncError(async (req, res, next) => {
  const { serialNumber, phone, otp } = req.body;

  // Find the OTP record
  const otpRecord = await OTP.findOne({ 
    phone, 
    serialNumber, 
    isVerified: false 
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    return next(new AppError("No pending OTP found. Please request a new OTP.", 404));
  }

  // Check if OTP is expired
  if (new Date() > otpRecord.expiresAt) {
    await OTP.deleteOne({ _id: otpRecord._id });
    return next(new AppError("OTP has expired. Please request a new OTP.", 400));
  }

  // Check attempts limit (max 3 attempts)
  if (otpRecord.attempts >= 3) {
    await OTP.deleteOne({ _id: otpRecord._id });
    return next(new AppError("Maximum verification attempts exceeded. Please request a new OTP.", 400));
  }

  // Verify OTP
  if (otpRecord.otp !== otp) {
    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();
    
    const remainingAttempts = 3 - otpRecord.attempts;
    return next(new AppError(`Invalid OTP. ${remainingAttempts} attempts remaining.`, 400));
  }

  // OTP is valid - Mark as verified
  otpRecord.isVerified = true;
  await otpRecord.save();

  // Get serial number and product
  const serial = await SerialNumber.findById(otpRecord.serialNumberId);
  const product = await productModel.findById(otpRecord.productId);

  if (!serial || !product) {
    return next(new AppError("Serial number or product not found", 404));
  }

  // Check if already claimed (double-check)
  const existingWarranty = await CustomerWarranty.findOne({ serialNumberId: serial._id });
  if (existingWarranty) {
    return next(new AppError("Warranty has already been claimed", 400));
  }

  // Calculate warranty dates
  const warrantyStartDate = new Date();
  
  // Ensure warranty is a valid number, default to 365 days if not
  let warrantyDays = parseInt(product.warranty);
  if (isNaN(warrantyDays) || warrantyDays <= 0) {
    warrantyDays = 365; // Default 1 year
  }
  
  const warrantyEndDate = new Date(warrantyStartDate);
  warrantyEndDate.setDate(warrantyEndDate.getDate() + warrantyDays);
  
  // Validate the calculated date
  if (isNaN(warrantyEndDate.getTime())) {
    return next(new AppError("Failed to calculate warranty end date. Please contact support.", 500));
  }

  console.log("=== Creating CustomerWarranty Record ===");
  console.log("Data to save:", {
    customerName: otpRecord.customerName,
    email: otpRecord.email,
    phone: otpRecord.phone,
    serialNumberId: serial._id,
    productId: product._id,
    warrantyStartDate,
    warrantyEndDate,
    status: 'active'
  });

  // Create customer warranty record with explicit error handling
  let customerWarranty;
  try {
    customerWarranty = await CustomerWarranty.create({
      customerName: otpRecord.customerName,
      email: otpRecord.email,
      phone: otpRecord.phone,
      serialNumberId: serial._id,
      productId: product._id,
      warrantyStartDate,
      warrantyEndDate,
      status: 'active'
    });
    
    console.log("✅ CustomerWarranty created successfully:", customerWarranty._id);
    console.log("Full warranty record:", JSON.stringify(customerWarranty, null, 2));
  } catch (error) {
    console.error("❌ Error creating CustomerWarranty:", error);
    console.error("Error details:", error.message);
    console.error("Validation errors:", error.errors);
    return next(new AppError(`Failed to create warranty record: ${error.message}`, 500));
  }

  // Update serial number - mark warranty as claimed
  serial.claimedWarranty = true;
  serial.claimedAt = new Date();
  await serial.save();
  console.log("✅ Serial number updated as claimed");

  // Clean up OTP records
  await OTP.deleteMany({ phone, serialNumber });
  console.log("✅ OTP records cleaned up");

  res.status(200).json({
    status: "success",
    message: "Warranty claimed successfully!",
    data: {
      customer: {
        name: customerWarranty.customerName,
        email: customerWarranty.email,
        phone: customerWarranty.phone
      },
      warranty: {
        startDate: warrantyStartDate,
        endDate: warrantyEndDate,
        durationDays: warrantyDays,
        status: 'active'
      },
      product: {
        name: product.name,
        category: product.category
      },
      serialNumber: serial.serialNumber
    }
  });
});

/**
 * Get warranty details by serial number
 */
export const getWarrantyDetails = catchAsyncError(async (req, res, next) => {
  const { serialNumber } = req.params;

  const serial = await SerialNumber.findOne({ serialNumber });
  if (!serial) return next(new AppError("Serial number not found", 404));

  if (!serial.claimedWarranty) {
    return res.status(200).json({
      status: "success",
      claimed: false,
      message: "Warranty has not been claimed yet"
    });
  }

  const warrantyData = await CustomerWarranty.findOne({ serialNumberId: serial._id })
    .populate('productId', 'name category warranty price images');

  if (!warrantyData) {
    return next(new AppError("Warranty data not found", 404));
  }

  const currentTime = new Date();
  const timeRemainingMs = warrantyData.warrantyEndDate - currentTime;
  const daysRemaining = Math.max(0, Math.floor(timeRemainingMs / (1000 * 60 * 60 * 24)));
  const isExpired = timeRemainingMs <= 0;

  res.status(200).json({
    status: "success",
    claimed: true,
    data: {
      customer: {
        name: warrantyData.customerName,
        email: warrantyData.email,
        phone: warrantyData.phone
      },
      warranty: {
        status: isExpired ? 'expired' : 'active',
        startDate: warrantyData.warrantyStartDate,
        endDate: warrantyData.warrantyEndDate,
        daysRemaining,
        isExpired,
        claimedAt: serial.claimedAt
      },
      product: warrantyData.productId,
      serialNumber: serial.serialNumber
    }
  });
});

/**
 * Resend OTP
 */
export const resendOTP = catchAsyncError(async (req, res, next) => {
  const { serialNumber, phone } = req.body;

  // Find the latest OTP record
  const existingOTP = await OTP.findOne({ phone, serialNumber })
    .sort({ createdAt: -1 });

  if (!existingOTP) {
    return next(new AppError("No OTP request found. Please initiate warranty claim first.", 404));
  }

  // Check if already verified
  if (existingOTP.isVerified) {
    return next(new AppError("OTP already verified. Please proceed with claim.", 400));
  }

  // Generate new OTP
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Delete old OTPs
  await OTP.deleteMany({ phone, serialNumber });

  // Create new OTP
  await OTP.create({
    phone,
    otp,
    serialNumber,
    email: existingOTP.email,
    customerName: existingOTP.customerName,
    productId: existingOTP.productId,
    serialNumberId: existingOTP.serialNumberId,
    expiresAt,
    isVerified: false,
    attempts: 0
  });

  // Send OTP
  try {
    await sendOTPViaSNS(phone, otp);
    
    res.status(200).json({
      status: "success",
      message: "OTP resent successfully",
      data: {
        phone,
        expiresIn: "10 minutes"
      }
    });
  } catch (error) {
    return next(new AppError(error.message || "Failed to resend OTP", 500));
  }
});

/**
 * Get all customer warranty details with pagination
 */
export const getAllCustomerWarranties = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  console.log("Started::::")
  // Optional filters
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.email) {
    filter.email = new RegExp(req.query.email, 'i');
  }
  if (req.query.phone) {
    filter.phone = req.query.phone;
  }

  // Get total count for pagination
  const totalCount = await CustomerWarranty.countDocuments(filter);
  console.log("totalCount", totalCount);
  // Get warranties with pagination
  const warranties = await CustomerWarranty.find(filter)
    .populate('productId', 'name category warranty price images')
    .populate('serialNumberId', 'serialNumber isVerified verifiedAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  console.log("warranties", warranties);
  // Calculate warranty status and remaining time for each record
  const currentTime = new Date();
  const warrantiesWithStatus = warranties.map(warranty => {
    const timeRemainingMs = warranty.warrantyEndDate - currentTime;
    const daysRemaining = Math.max(0, Math.floor(timeRemainingMs / (1000 * 60 * 60 * 24)));
    const isExpired = timeRemainingMs <= 0;

    return {
      _id: warranty._id,
      customer: {
        name: warranty.customerName,
        email: warranty.email,
        phone: warranty.phone
      },
      warranty: {
        status: isExpired ? 'expired' : warranty.status,
        startDate: warranty.warrantyStartDate,
        endDate: warranty.warrantyEndDate,
        daysRemaining,
        isExpired
      },
      product: warranty.productId,
      serialNumber: warranty.serialNumberId,
      createdAt: warranty.createdAt,
      updatedAt: warranty.updatedAt
    };
  });

  const totalPages = Math.ceil(totalCount / limit);

  res.status(200).json({
    status: "success",
    results: warranties.length,
    pagination: {
      currentPage: page,
      totalPages,
      totalRecords: totalCount,
      recordsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    },
    data: warrantiesWithStatus
  });
});
