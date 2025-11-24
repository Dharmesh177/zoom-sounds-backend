import express from "express";
import * as review from "./review.controller.js";
import { validate } from "../../middlewares/validate.js";
import { reviewPostLimiter } from "../../middlewares/rateLimiter.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import {
  addReviewValidation,
  deleteReviewValidation,
  getSpecificReviewValidation,
} from "./review.validation.js";

const reviewRouter = express.Router();

reviewRouter
  .route("/")
  .post(
    reviewPostLimiter,
    validate(addReviewValidation),
    review.addReview
  )
  .get(
    protectedRoutes,
    allowedTo("user", "admin"),
    review.getAllReviews
  ); 

reviewRouter
  .route("/:id")
  .get(validate(getSpecificReviewValidation), review.getSpecificReview)
  .delete(
    protectedRoutes,
    allowedTo("admin", "user"),
    validate(deleteReviewValidation),
    review.deleteReview
  );

export default reviewRouter;
