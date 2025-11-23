import Joi from "joi";

const addProductValidation = Joi.object({
  name: Joi.string().required().trim(),
  slug: Joi.string().required().trim(),
  family: Joi.string().trim(),
  category: Joi.string().trim(),
  technology: Joi.string().trim(),
  thumbnail: Joi.string().allow(null, ""),
  images: Joi.array().items(Joi.string()).allow(null),
  overview: Joi.string().trim(),
  keyHighlights: Joi.array().items(Joi.string()),
  features: Joi.array().items(Joi.string()),
  applications: Joi.array().items(Joi.string()),
  idealFor: Joi.array().items(Joi.string()),
  specifications: Joi.object({
    powerOutput: Joi.string().trim(),
    channels: Joi.string().trim(),
    inputChannels: Joi.string().trim(),
    digitalPlayer: Joi.string().trim(),
    toneControl: Joi.object({
      bass: Joi.string().trim(),
      mid: Joi.string().trim(),
      treble: Joi.string().trim(),
    }),
    speakerOutput: Joi.string().trim(),
    frequencyResponse: Joi.string().trim(),
    snRatio: Joi.string().trim(),
    powerSupply: Joi.string().trim(),
    dimensions: Joi.string().trim(),
    weight: Joi.string().trim(),
  }),
  warranty: Joi.string().trim(),
  tags: Joi.array().items(Joi.string()),
  ratingAvg: Joi.number().min(1).max(5),
  price: Joi.number().min(0).required(),
});

const getSpecificProductValidation = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

const updateProductValidation = Joi.object({
  id: Joi.string().hex().length(24).required(),
  name: Joi.string().trim(),
  slug: Joi.string().trim(),
  family: Joi.string().trim(),
  category: Joi.string().trim(),
  technology: Joi.string().trim(),
  thumbnail: Joi.string().allow(null, ""),
  images: Joi.array().items(Joi.string()).allow(null),
  overview: Joi.string().trim(),
  keyHighlights: Joi.array().items(Joi.string()),
  features: Joi.array().items(Joi.string()),
  applications: Joi.array().items(Joi.string()),
  idealFor: Joi.array().items(Joi.string()),
  specifications: Joi.object({
    powerOutput: Joi.string().trim(),
    channels: Joi.string().trim(),
    inputChannels: Joi.string().trim(),
    digitalPlayer: Joi.string().trim(),
    toneControl: Joi.object({
      bass: Joi.string().trim(),
      mid: Joi.string().trim(),
      treble: Joi.string().trim(),
    }),
    speakerOutput: Joi.string().trim(),
    frequencyResponse: Joi.string().trim(),
    snRatio: Joi.string().trim(),
    powerSupply: Joi.string().trim(),
    dimensions: Joi.string().trim(),
    weight: Joi.string().trim(),
  }),
  warranty: Joi.string().trim(),
  tags: Joi.array().items(Joi.string()),
  ratingAvg: Joi.number().min(1).max(5),
  price: Joi.number().min(0),
});

const deleteProductValidation = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

export {
  addProductValidation,
  getSpecificProductValidation,
  updateProductValidation,
  deleteProductValidation,
};
