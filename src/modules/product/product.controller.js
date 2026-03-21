import mongoose from "mongoose";
import QRCode from "qrcode";
import { uploadToS3, checkS3FileExists, deleteFromS3, deleteMultipleFromS3 } from "../../utils/s3.js";
import slugify from "slugify";
import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { deleteOne } from "../../handlers/factor.js";
import { productModel } from "./../../../Database/models/product.model.js";
import { ApiFeatures } from "../../utils/ApiFeatures.js";

const addProduct = catchAsyncError(async (req, res, next) => {
  const payload = { ...req.body };
  console.log(payload);
  if (!payload.name) return next(new AppError("Name is required", 400));
  payload.slug = slugify(payload.name, { lower: true, strict: true });

  // Upload thumbnail to S3
  if (req.files?.thumbnail?.[0]) {
    const file = req.files.thumbnail[0];
    const ext = file.originalname.split('.').pop();
    payload.thumbnail = await uploadToS3(
      file.buffer,
      `${payload.slug}-thumbnail.${ext}`,
      file.mimetype,
      "Products"
    );
  }

  console.log(req.files)

  // Upload images array to S3
  if (req.files?.images) {
    payload.images = [];

    for (const img of req.files.images) {
      const ext = img.originalname.split('.').pop();
      const key = await uploadToS3(
        img.buffer,
        `${payload.slug}-${Date.now()}.${ext}`,
        img.mimetype,
        "Products"
      );
      payload.images.push(key);
    }
  }
  
  console.log("final payload");
  console.log(payload);

  const newProduct = await productModel.create(payload);

  res.status(201).json({
    status: "success",
    product: newProduct,
  });
});

const getAllProducts = catchAsyncError(async (req, res, next) => {
  const PAGE_NUMBER = Number(req.query.page) || 1;
  const PAGE_SIZE = Number(req.query.limit) || 10; // Default to 10 items per page

  // Build the API features (filters, search, sort)
  let apiFeature = new ApiFeatures(productModel.find(), req.query)
    .filteration()
    .search()
    .sort()
    .fields();
  
  console.log("API Feature Query Filter:", apiFeature.queryFilter);
  
  // Apply the combined filter to the query
  apiFeature.mongooseQuery.find(apiFeature.queryFilter);
  
  // Count total with the same filter
  const totalProducts = await productModel.countDocuments(apiFeature.queryFilter);
  
  // Apply pagination AFTER counting
  apiFeature.pagination(PAGE_NUMBER, PAGE_SIZE);
  
  const products = await apiFeature.mongooseQuery.lean(); // lean for performance
  console.log(`Fetched ${products.length} products out of ${totalProducts} total.`);
  
  res.status(200).json({
    page: PAGE_NUMBER,
    limit: PAGE_SIZE,
    totalPages: Math.ceil(totalProducts / PAGE_SIZE),
    totalProducts,
    status: "success",
    products,
  });
});
const getSpecificProduct = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  console.log(`Fetching product with ID: ${id}`); // Log the product ID

  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new AppError("Invalid id format", 400));

  const product = await productModel.findById(id).lean();

  console.log(`Fetched product: ${JSON.stringify(product)}`); // Log the fetched product
  if (!product) return next(new AppError("Product not found", 404));
  res.status(200).json({ status: "success", product });
});

const updateProduct = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const existingProduct = await productModel.findById(id);
  if (!existingProduct) return next(new AppError("Product was not found", 404));

  const payload = { ...req.body };

  // Update slug if name is changing
  if (payload.name) {
    payload.slug = slugify(payload.name, { lower: true, strict: true });
  }

  const slug = payload.slug || existingProduct.slug;

  // --- THUMBNAIL HANDLING ---
  if (req.files?.thumbnail?.[0]) {
    // New thumbnail uploaded - delete old one from S3 if exists
    if (existingProduct.thumbnail) {
      await deleteFromS3(existingProduct.thumbnail);
    }
    const file = req.files.thumbnail[0];
    const ext = file.originalname.split('.').pop();
    payload.thumbnail = await uploadToS3(
      file.buffer,
      `${slug}-thumbnail.${ext}`,
      file.mimetype,
      "Products"
    );
  } else if (req.body.existingThumbnail !== undefined) {
    // Check if thumbnail was removed (empty string) or kept
    if (req.body.existingThumbnail === '' && existingProduct.thumbnail) {
      // Thumbnail was removed - delete from S3
      await deleteFromS3(existingProduct.thumbnail);
      payload.thumbnail = '';
    } else {
      // Keep existing thumbnail
      payload.thumbnail = req.body.existingThumbnail;
    }
  }

  // --- IMAGES HANDLING ---
  // Get existing images that should be kept (sent from frontend)
  let existingImagesFromFrontend = req.body['existingImages[]'] || req.body.existingImages || [];
  
  // Ensure it's an array
  if (typeof existingImagesFromFrontend === 'string') {
    existingImagesFromFrontend = existingImagesFromFrontend ? [existingImagesFromFrontend] : [];
  }

  // Find images that were removed (exist in DB but not in frontend's list)
  const currentImages = existingProduct.images || [];
  const imagesToDelete = currentImages.filter(img => !existingImagesFromFrontend.includes(img));

  // Delete removed images from S3
  if (imagesToDelete.length > 0) {
    await deleteMultipleFromS3(imagesToDelete);
    console.log(`Deleted ${imagesToDelete.length} images from S3:`, imagesToDelete);
  }

  // Upload new images if any
  const uploadedImages = [];
  if (req.files?.images) {
    for (const img of req.files.images) {
      const ext = img.originalname.split('.').pop();
      const key = await uploadToS3(
        img.buffer,
        `${slug}-${Date.now()}.${ext}`,
        img.mimetype,
        "Products"
      );
      uploadedImages.push(key);
    }
  }

  // Set final images array: kept existing + newly uploaded
  payload.images = [...existingImagesFromFrontend, ...uploadedImages];

  const updatedProduct = await productModel.findByIdAndUpdate(id, payload, {
    new: true,
  });

  res.status(200).json({
    status: "success",
    product: updatedProduct,
  });
});


const generateOrFetchProductQr = catchAsyncError(async (req, res, next) => {
  const { productId } = req.params;

  const product = await productModel.findById(productId);
  if (!product) return next(new AppError("Product not found", 404));

  const fileKey = `qrcodes/${productId}.png`;

  // Check if QR code already exists in S3
  const exists = await checkS3FileExists(fileKey);
  let s3Url;

  if (exists) {
    s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    return res.status(200).json({
      success: true,
      message: "QR code already exists in S3",
      qrCodeUrl: s3Url,
    });
  }

  //If not exist → Generate new QR code
  const verificationUrl = `https://zsindia.com/verify/${productId}`;
  const qrBuffer = await QRCode.toBuffer(verificationUrl);

  //Upload to S3
  s3Url = await uploadToS3(qrBuffer, `${productId}.png`, "image/png", "qrcodes");

  return res.status(201).json({
    success: true,
    message: "QR code generated and uploaded successfully",
    qrCodeUrl: s3Url,
  });
});

const verifyProductQr = catchAsyncError(async (req, res, next) => {
  const { productId } = req.params;

  //Check product in MongoDB
  const product = await productModel.findById(productId);
  if (!product) return next(new AppError("Invalid or fake product!", 404));

  //Optional: Check QR file exists in S3
  const fileKey = `qrcodes/${productId}.png`;
  let qrExists = false;

  try {
    qrExists = await checkS3FileExists(fileKey);
  } catch (err) {
    console.warn("S3 check failed:", err.message);
  }

  if (!qrExists) {
    console.warn(`QR missing in S3 for productId ${productId}`);
  }

  //Return verification result
  res.status(200).json({
    verified: true,
    message: qrExists
      ? "This is a genuine ZS India product ✅"
      : "Product verified but QR not found in cloud (report if suspicious).",
    product: {
      id: product._id,
      name: product.name,
      description: product.description,
      brand: product.brand,
      category: product.category,
      thumbnail: product.thumbnail,
      verifiedAt: new Date(),
    },
    qrValidated: qrExists,
  });
});

const getTopSellingProduct = catchAsyncError(async (req, res, next) => {
  const product = await productModel.find({ isTopSellingProduct: true });

  console.log(`Fetched product: ${JSON.stringify(product)}`); // Log the fetched product
  if (!product) return next(new AppError("Product not found", 404));
  res.status(200).json({ status: "success", product });
});


const deleteProduct = deleteOne(productModel, "Product");

export {
  addProduct,
  getAllProducts,
  getSpecificProduct,
  updateProduct,
  deleteProduct,
  generateOrFetchProductQr,
  verifyProductQr,
  getTopSellingProduct,
};
