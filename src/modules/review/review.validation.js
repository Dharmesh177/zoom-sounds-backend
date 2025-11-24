import Joi from "joi";
import { QUERY_TYPES } from "../../constants/common-constants.js";

const addReviewValidation = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().trim().required(),
  phone: Joi.string().trim().allow(null, ""),
  message: Joi.string().trim().required(),
  type: Joi.string().valid(...QUERY_TYPES).default("other"),
});

const getSpecificReviewValidation = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

const updateReviewValidation = Joi.object({
  id: Joi.string().hex().length(24).required(),
  name: Joi.string().trim(),
  email: Joi.string().email().trim(),
  phone: Joi.string().trim().allow(null, ""),
  message: Joi.string().trim(),
  type: Joi.string().valid(...QUERY_TYPES).default("other"),
});

const deleteReviewValidation = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

export {
  addReviewValidation,
  getSpecificReviewValidation,
  updateReviewValidation,
  deleteReviewValidation,
};
