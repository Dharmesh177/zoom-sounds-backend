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

// Warranty Claim Validations
export const initiateWarrantyClaimValidation = Joi.object({
  serialNumber: Joi.string().required().messages({
    'string.empty': 'Serial number is required',
    'any.required': 'Serial number is required'
  }),
  customerName: Joi.string().min(2).max(100).required().trim().messages({
    'string.empty': 'Customer name is required',
    'string.min': 'Customer name must be at least 2 characters',
    'string.max': 'Customer name cannot exceed 100 characters',
    'any.required': 'Customer name is required'
  }),
  email: Joi.string().email().required().lowercase().trim().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Please provide a valid 10-digit Indian phone number',
      'any.required': 'Phone number is required'
    })
});

export const verifyOTPValidation = Joi.object({
  serialNumber: Joi.string().required().messages({
    'string.empty': 'Serial number is required',
    'any.required': 'Serial number is required'
  }),
  name: Joi.string().min(2).max(100).required().trim().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().lowercase().trim().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Please provide a valid phone number in E.164 format (e.g., +919876543210)',
      'any.required': 'Phone number is required'
    }),
  firebaseIdToken: Joi.string().required().messages({
    'string.empty': 'Firebase ID token is required',
    'any.required': 'Firebase ID token is required'
  })
});

export const resendOTPValidation = Joi.object({
  serialNumber: Joi.string().required(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required()
});

export const getWarrantyDetailsValidation = Joi.object({
  serialNumber: Joi.string().required()
});

export const getAllCustomerWarrantiesValidation = Joi.object({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
  status: Joi.string().valid('active', 'expired', 'cancelled').optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional()
});
