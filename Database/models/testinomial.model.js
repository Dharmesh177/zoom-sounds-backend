import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  message: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  approved: { type: Boolean, default: false }, // Admin approves
}, { timestamps: true });

const Testimonial = mongoose.model("Testimonial", testimonialSchema);

export default Testimonial;