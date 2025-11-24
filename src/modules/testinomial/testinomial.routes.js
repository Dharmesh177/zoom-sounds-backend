import express from "express";
import * as testimonial from "./testinomial.controller.js";
import { validate } from "../../middlewares/validate.js";
import { protectedRoutes, allowedTo } from "../auth/auth.controller.js";
import {
  addTestimonialValidation,
  updateTestimonialValidation,
  deleteTestimonialValidation,
} from "./testinomial.validation.js";

const router = express.Router();

// Public - add testimonial
router.post(
  "/",
  validate(addTestimonialValidation),
  testimonial.addTestimonial
);

// Public - view approved testimonials
router.get("/", testimonial.getApprovedTestimonials);

// Admin - view all testimonials
router.get(
  "/all",
  protectedRoutes,
  allowedTo("admin", "user"),
  testimonial.getAllTestimonialsAdmin
);

// Admin - approve / disapprove
router.put(
  "/approve/:id",
  protectedRoutes,
  allowedTo("admin", "user"),
  validate(updateTestimonialValidation),
  testimonial.approveTestimonial
);

// Admin - delete testimonial
router.delete(
  "/:id",
  protectedRoutes,
  allowedTo("admin", "user"),
  validate(deleteTestimonialValidation),
  testimonial.deleteTestimonial
);

export default router;
