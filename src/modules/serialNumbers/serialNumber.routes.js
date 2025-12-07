import express from "express";
import * as serial from "./serialNumber.controller.js";
import { validate } from "../../middlewares/validate.js";
import {
  generateSerialValidation,
  getByProductValidation,
  deactivateSerialValidation,
  verifySerialValidation,
  deleteSerialValidation,
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

export default serialRouter;
