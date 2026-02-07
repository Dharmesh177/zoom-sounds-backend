import Joi from "joi";

const addUserValidation = Joi.object({
  name: Joi.string().required().trim(),
  email: Joi.string().required().trim(),
  password: Joi.string().required(),
});

const updateUserValidation = Joi.object({
  name: Joi.string().trim(),
  password: Joi.string(),
  id: Joi.string().hex().length(24).required(),
});

const changeUserPasswordValidation = Joi.object({
  password: Joi.string().required(),
  id: Joi.string().hex().length(24).required(),
});

const deleteUserValidation = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

export {
  addUserValidation,
  updateUserValidation,
  changeUserPasswordValidation,
  deleteUserValidation,
};

// {
//   "title": "ZS India",
//   "imgCover": "zoom-pro-cover.jpg",
//   "images": ["zoom-pro-1.jpg"],
//   "descripton": "Premium Bluetooth speaker with deep bass and 12-hour battery li\\\\\\\\dfbdgndfbsfbsfbsfbfdb",
//   "price": 2499,
//   "priceAfterDiscount": 199,
//   "quantity": 50,
//   "category": ["Speakers"],
//   "subcategory": ["Bluetooth", "Portable"],
//   "brand": ["ZS India"],
//   "ratingAvg": 4.6
// }

