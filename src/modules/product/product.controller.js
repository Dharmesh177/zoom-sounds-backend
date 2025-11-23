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

  if (!payload.name) return next(new AppError("Name is required", 400));
  payload.slug = slugify(payload.name, { lower: true, strict: true });

  if (req.files?.thumbnail?.[0]) payload.thumbnail = req.files.thumbnail[0].filename;
  if (req.files?.images) payload.images = req.files.images.map(f => f.filename);

  const newProduct = await productModel.create(payload);
  res.status(201).json({ status: "success", product: newProduct });
});


const getAllProducts = catchAsyncError(async (req, res, next) => {
  let apiFeature = new ApiFeatures(productModel.find(), req.query)
    .pagination()
    .fields()
    .filteration()
    .search()
    .sort();

  const PAGE_NUMBER = Number(req.query.page) || 1;
  const products = await apiFeature.mongooseQuery.lean(); // lean for perf

  res.status(200).json({ page: PAGE_NUMBER, status: "success", products });
});
const getSpecificProduct = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new AppError("Invalid id format", 400));

  const product = await productModel.findById(id).lean();
  if (!product) return next(new AppError("Product not found", 404));
  res.status(200).json({ status: "success", product });
});

const updateProduct = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  if (req.body.name) {
    req.body.slug = slugify(req.body.name);
  }
  const updateProduct = await productModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  updateProduct && res.status(201).json({ message: "success", updateProduct });

  !updateProduct && next(new AppError("Product was not found", 404));
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
  const verificationUrl = `https://zoomsounds.in/verify/${productId}`;
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

const deleteProduct = deleteOne(productModel, "Product");

export {
  addProduct,
  getAllProducts,
  getSpecificProduct,
  updateProduct,
  deleteProduct,
  generateOrFetchProductQr,
  verifyProductQr,
};
