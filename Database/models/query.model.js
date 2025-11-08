import mongoose, { Schema, model } from "mongoose";

const querySchema = new Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
  type: { type: String, enum: ['contact', 'product', 'general'], default: 'general' },
}, { timestamps: true });

export const queryModel = model("Query", querySchema);
