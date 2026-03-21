import { AppError } from "../utils/AppError.js";
import { catchAsyncError } from "../utils/catchAsyncError.js";
import { SerialNumber } from "../../Database/models/serialNumber.model.js";
import { deleteFromS3, deleteMultipleFromS3 } from "../utils/s3.js";

export const deleteOne = (model, name) => {
  return catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    if (name == "Product") {
      // Get product first to access images
      const product = await model.findById(id);
      
      if (product) {
        // Delete images from S3
        const imagesToDelete = [...(product.images || [])];
        if (product.thumbnail) {
          imagesToDelete.push(product.thumbnail);
        }
        
        if (imagesToDelete.length > 0) {
          await deleteMultipleFromS3(imagesToDelete);
          console.log(`Deleted ${imagesToDelete.length} images from S3 for product ${id}`);
        }
      }
      
      // Delete associated serial numbers
      await SerialNumber.deleteMany({ productId: id });
    }

    const document = await model.findByIdAndDelete(id, {
      new: true,
    });

    let response = {};
    response[name] = document;
    console.log(response);
    console.log({ ...response });
    console.log(name);
    document && res.status(201).json({ message: "success", ...response });

    !document && next(new AppError(`${name} was not found`, 404));
  });
};
