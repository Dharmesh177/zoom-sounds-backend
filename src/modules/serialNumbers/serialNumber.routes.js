import express from "express";
import * as serial from "./serialNumber.controller.js";
import { validate } from "../../middlewares/validate.js";
import {
  generateSerialValidation,
  getByProductValidation,
  deactivateSerialValidation,
  verifySerialValidation,
  deleteSerialValidation,
  initiateWarrantyClaimValidation,
  verifyOTPValidation,
  resendOTPValidation,
  getWarrantyDetailsValidation,
  getAllCustomerWarrantiesValidation,
} from "./serialNumber.validation.js";
import { protectedRoutes, allowedTo } from "../auth/auth.controller.js";

const serialRouter = express.Router();

serialRouter.post(
  "/generate",
  protectedRoutes,
  allowedTo("admin", "user"),
  validate(generateSerialValidation),
  serial.generateSerialNumbers
);

serialRouter.get(
  "/product/:productId",
  protectedRoutes,
  allowedTo("admin", "user"),
  validate(getByProductValidation),
  serial.getSerialsByProduct
);

serialRouter.patch(
  "/:id/deactivate",
  protectedRoutes,
  allowedTo("admin"),
  validate(deactivateSerialValidation),
  serial.deactivateSerial
);

serialRouter.get(
  "/verify/:serialNumber",
  validate(verifySerialValidation),
  serial.verifySerial
);

serialRouter.delete(
  "/:id",
  protectedRoutes,
  allowedTo("admin"),
  validate(deleteSerialValidation),
  serial.deleteSerial
);

// ==================== WARRANTY CLAIM ROUTES ====================

// Verify OTP and complete warranty claim
serialRouter.post(
  "/warranty/claim/verify",
  validate(verifyOTPValidation),
  serial.verifyWarrantyClaim
);

// Get all customer warranties (Admin only) - MUST be before /:serialNumber route
serialRouter.get(
  "/warranty/all",
  // protectedRoutes,
  // allowedTo("admin"),
  validate(getAllCustomerWarrantiesValidation),
  serial.getAllCustomerWarranties
);

// Get warranty details by serial number
serialRouter.get(
  "/warranty/:serialNumber",
  validate(getWarrantyDetailsValidation),
  serial.getWarrantyDetails
);

export default serialRouter;