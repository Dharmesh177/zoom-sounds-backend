import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { ApiFeatures } from "../../utils/ApiFeatures.js";
import Testimonial from "../../../Database/models/testinomial.model.js";

export const addTestimonial = catchAsyncError(async (req, res, next) => {
  const testimonial = new Testimonial(req.body);
  await testimonial.save();

  res.status(201).json({
    message: "success",
    testimonial,
  });
});

// Public: shows only approved testimonials
export const getApprovedTestimonials = catchAsyncError(async (req, res, next) => {
  let apiFeature = new ApiFeatures(Testimonial.find({ approved: true }), req.query)
    .pagination()
    .sort()
    .fields();

  const data = await apiFeature.mongooseQuery;

  res.status(200).json({
    message: "success",
    data,
  });
});

// Admin: see all testimonials including pending
export const getAllTestimonialsAdmin = catchAsyncError(async (req, res, next) => {
  let apiFeature = new ApiFeatures(Testimonial.find(), req.query)
    .pagination()
    .sort()
    .fields();

  const data = await apiFeature.mongooseQuery;

  res.status(200).json({
    message: "success",
    data,
  });
});

// Admin: approve / disapprove
export const approveTestimonial = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const updated = await Testimonial.findByIdAndUpdate(
    id,
    { approved: req.body.approved },
    { new: true }
  );

  if (!updated) return next(new AppError("Testimonial not found", 404));

  res.status(200).json({
    message: "success",
    updated,
  });
});

// Admin only delete
export const deleteTestimonial = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const deleted = await Testimonial.findByIdAndDelete(id);

  if (!deleted) return next(new AppError("Testimonial not found", 404));

  res.status(200).json({
    message: "success",
  });
});
