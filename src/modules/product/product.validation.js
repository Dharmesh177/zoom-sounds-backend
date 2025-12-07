import Joi from "joi";

const addProductValidation = Joi.object({
  name: Joi.string().required().trim(),
  slug: Joi.string().required().trim(),
  family: Joi.string().trim().allow("", null),
  category: Joi.string().trim().allow("", null),
  technology: Joi.string().trim().allow("", null),
  thumbnail: Joi.string().allow("", null),
  images: Joi.array().items(Joi.string()).allow(null),

  overview: Joi.string().trim().allow("", null),

  keyHighlights: Joi.array().items(Joi.string()).allow(null),
  features: Joi.array().items(Joi.string()).allow(null),
  applications: Joi.array().items(Joi.string()).allow(null),
  idealFor: Joi.array().items(Joi.string()).allow(null),

  specifications: Joi.object({
    powerOutput: Joi.string().trim().allow("", null),
    channels: Joi.string().trim().allow("", null),
    inputChannels: Joi.string().trim().allow("", null),
    digitalPlayer: Joi.string().trim().allow("", null),
    toneControl: Joi.object({
      bass: Joi.string().trim().allow("", null),
      mid: Joi.string().trim().allow("", null),
      treble: Joi.string().trim().allow("", null),
    }).allow(null),
    speakerOutput: Joi.string().trim().allow("", null),
    frequencyResponse: Joi.string().trim().allow("", null),
    snRatio: Joi.string().trim().allow("", null),
    powerSupply: Joi.string().trim().allow("", null),
    dimensions: Joi.string().trim().allow("", null),
    weight: Joi.string().trim().allow("", null),
  }).allow(null),

  warranty: Joi.string().trim().allow("", null),
  tags: Joi.array().items(Joi.string()).allow(null),
  ratingAvg: Joi.number().min(1).max(5),
  price: Joi.number().min(0),
  isTopSellingProduct: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid("true", "false")
    ).optional(),
});

const getSpecificProductValidation = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

const updateProductValidation = Joi.object({
  id: Joi.string().hex().length(24).required(),

  name: Joi.string().trim().allow("", null),
  slug: Joi.string().trim().allow("", null),
  family: Joi.string().trim().allow("", null),
  category: Joi.string().trim().allow("", null),
  technology: Joi.string().trim().allow("", null),

  thumbnail: Joi.string().allow("", null),
  images: Joi.array().items(Joi.string()).allow(null),

  overview: Joi.string().trim().allow("", null),

  keyHighlights: Joi.array().items(Joi.string()).allow(null),
  features: Joi.array().items(Joi.string()).allow(null),
  applications: Joi.array().items(Joi.string()).allow(null),
  idealFor: Joi.array().items(Joi.string()).allow(null),

  specifications: Joi.object({
    powerOutput: Joi.string().trim().allow("", null),
    channels: Joi.string().trim().allow("", null),
    inputChannels: Joi.string().trim().allow("", null),
    digitalPlayer: Joi.string().trim().allow("", null),

    toneControl: Joi.object({
      bass: Joi.string().trim().allow("", null),
      mid: Joi.string().trim().allow("", null),
      treble: Joi.string().trim().allow("", null),
    }).allow(null),

    speakerOutput: Joi.string().trim().allow("", null),
    frequencyResponse: Joi.string().trim().allow("", null),
    snRatio: Joi.string().trim().allow("", null),
    powerSupply: Joi.string().trim().allow("", null),
    dimensions: Joi.string().trim().allow("", null),
    weight: Joi.string().trim().allow("", null),
  }).allow(null),

  warranty: Joi.string().trim().allow("", null),
  tags: Joi.array().items(Joi.string()).allow(null),

  ratingAvg: Joi.number().min(1).max(5),
  price: Joi.number().min(0),
   price: Joi.number().min(0),
  isTopSellingProduct: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid("true", "false")
    ).optional(),
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
