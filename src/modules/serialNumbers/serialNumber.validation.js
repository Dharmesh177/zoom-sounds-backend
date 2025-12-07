import Joi from "joi";

export const generateSerialValidation = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().min(1).max(1000).required(),
  batchNumber: Joi.string().trim().allow("", null),
});

export const getByProductValidation = Joi.object({
  productId: Joi.string().hex().length(24).required(),
});

export const deactivateSerialValidation = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

export const verifySerialValidation = Joi.object({
  serialNumber: Joi.string().required(),
});

export const deleteSerialValidation = Joi.object({
  id: Joi.string().hex().length(24).required(),
});
