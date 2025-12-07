import Joi from "joi";

const addTestimonialValidation = Joi.object({
  name: Joi.string().trim().required(),
  message: Joi.string().trim().required(),
  rating: Joi.number().min(1).max(5).required(),
  approved: false,
});

const updateTestimonialValidation = Joi.object({
  id: Joi.string().hex().length(24).required(),
  approved: Joi.boolean().required(), // only admin updates this
});

const deleteTestimonialValidation = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

export {
  addTestimonialValidation,
  updateTestimonialValidation,
  deleteTestimonialValidation,
};
