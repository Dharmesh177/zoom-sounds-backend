import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    family: { type: String, required: true },
    category: { type: String, required: true },
    technology: { type: String, required: true },
    thumbnail: { type: String },
    images: [{ type: String }],
    overview: { type: String },
    keyHighlights: [String],
    features: [String],
    applications: [String],
    idealFor: [String],
    specifications: {
      powerOutput: { type: String },
      channels: { type: String },
      inputChannels: { type: String },
      digitalPlayer: { type: String },
      toneControl: {
        bass: { type: String },
        mid: { type: String },
        treble: { type: String },
      },
      speakerOutput: { type: String },
      frequencyResponse: { type: String },
      snRatio: { type: String },
      powerSupply: { type: String },
      dimensions: { type: String },
      weight: { type: String },
    },
    warranty: { type: String },
    tags: [String],
    ratingAvg: {
      type: Number,
      min: 1,
      max: 5,
    },
    totalSerialNumbers: { type: Number },
    price: { type: Number, min: 0 },
    isTopSellingProduct: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export const productModel = model("product", productSchema);

