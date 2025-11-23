import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    family: { type: String },
    category: { type: String },
    technology: { type: String },
    thumbnail: { type: String },
    images: [String],
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
    price: { type: Number, min: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.post("init", function (doc) {
  if (doc.thumbnail && doc.images) {
    doc.thumbnail = `${process.env.BASE_URL}products/${doc.thumbnail}`;
    doc.images = doc.images.map((ele) => {
      return `${process.env.BASE_URL}products/${ele}`;
    });
  }
});

export const productModel = model("product", productSchema);

