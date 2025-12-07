import express from "express";
import * as product from "./product.controller.js";
import { validate } from "../../middlewares/validate.js";
import {
  addProductValidation,
  deleteProductValidation,
  getSpecificProductValidation,
  updateProductValidation,
} from "./product.validation.js";
import { generateOrFetchProductQr, verifyProductQr, getTopSellingProduct } from "./product.controller.js";
import { uploadMultipleFilesInMemory } from "../../middlewares/uploads.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";

const productRouter = express.Router();

let arrFields = [
  { name: "imgCover", maxCount: 1 },
  { name: "images", maxCount: 20 },
];

productRouter
  .route("/")
  .post(
    protectedRoutes,
    allowedTo("admin", "user"),
    uploadMultipleFilesInMemory(arrFields),
    validate(addProductValidation),
    product.addProduct
  )
  .get(product.getAllProducts);

productRouter.get("/verify/:productId", verifyProductQr);

productRouter.get("/featuredproducts", getTopSellingProduct);

productRouter.get(
  "/:productId/qrcode",
  protectedRoutes,
  allowedTo("admin"),
  generateOrFetchProductQr
);

productRouter
  .route("/:id")
  .put(
    protectedRoutes,
    allowedTo("admin"),
    uploadMultipleFilesInMemory(arrFields),
    validate(updateProductValidation),
    product.updateProduct
  )
  .delete(
    protectedRoutes,
    allowedTo("admin"),
    validate(deleteProductValidation),
    product.deleteProduct
  )
  .get(validate(getSpecificProductValidation), product.getSpecificProduct);

export default productRouter;
