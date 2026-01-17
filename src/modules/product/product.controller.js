import mongoose from "mongoose";
import QRCode from "qrcode";
import { uploadToS3, checkS3FileExists } from "../../utils/s3.js";
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
    const thumbFile = req.files.thumbnail[0];
    const thumbUrl = await uploadToS3(
      thumbFile.buffer,
      `${payload.slug}-thumbnail.jpg`,
      thumbFile.mimetype,
      "Products"
    );
    payload.thumbnail = thumbUrl;
  }

  console.log(req.files)

  // Upload images array to S3
  if (req.files?.images) {
    const uploadedImages = [];

    for (const img of req.files.images) {
      const imgUrl = await uploadToS3(
        img.buffer,
        `${payload.slug}-${img.originalname}`,
        img.mimetype,
        "Products"
      );
      uploadedImages.push(imgUrl);
    }

    payload.images = uploadedImages;
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

  let apiFeature = new ApiFeatures(productModel.find(), req.query)
    .fields()
    .filteration()
    .search()
    .sort()
    .pagination(PAGE_NUMBER, PAGE_SIZE); // Apply pagination

  const totalProducts = await productModel.countDocuments(apiFeature.queryFilter);
  const products = await apiFeature.mongooseQuery.lean(); // lean for performance

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

  // --- THUMBNAIL UPLOAD (only if new) ---
  if (req.files?.thumbnail?.[0]) {
    const newThumb = req.files.thumbnail[0];

    // Extract current filename from stored S3 URL
    const currentThumbUrl = existingProduct.thumbnail || "";
    const currentThumbName = currentThumbUrl.split("/").pop(); // e.g., slug-thumbnail.jpg

    const newThumbName = `${slug}-thumbnail.jpg`;

    if (currentThumbName !== newThumbName) {  // ← only upload if different
      const thumbUrl = await uploadToS3(
        newThumb.buffer,
        newThumbName,
        newThumb.mimetype,
        "Products"
      );
      payload.thumbnail = thumbUrl;
    } else {
      payload.thumbnail = existingProduct.thumbnail; // keep old
    }
  }

  // --- IMAGES UPLOAD (skip ones that already exist) ---
  if (req.files?.images) {
    const existingImages = existingProduct.images || [];
    const existingImageNames = existingImages.map(url => url.split("/").pop()); // extract filenames

    const uploadedImages = [];

    for (const img of req.files.images) {
      const newImageName = `${slug}-${img.originalname}`;

      if (!existingImageNames.includes(newImageName)) { // ← upload only if NOT already present
        const imgUrl = await uploadToS3(
          img.buffer,
          newImageName,
          img.mimetype,
          "Products"
        );
        uploadedImages.push(imgUrl);
      }
    }

    // Merge old + new (without duplicates)
    payload.images = [
      ...existingImages,
      ...uploadedImages
    ].filter((v, i, a) => a.indexOf(v) === i);
  }

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
  s3Url = await uploadToS3(qrBuffer, fileKey, "image/png");

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
      ? "This is a genuine Zoom Sounds product ✅"
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
