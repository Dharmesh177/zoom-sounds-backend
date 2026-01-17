import { AppError } from "../utils/AppError.js";
import { catchAsyncError } from "../utils/catchAsyncError.js";
import { SerialNumber } from "../../Database/models/serialNumber.model.js";

export const deleteOne = (model, name) => {
  return catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    if (name == "Product") {
      // Delete associated serial numbers
      await SerialNumber.deleteMany({ productId: id });
    }

    const document = await model.findByIdAndDelete(id, {
      new: true,
    });

    let response = {};
    response[name] = document;
    console.log(response);
    console.log({ ...response });
    console.log(name);
    document && res.status(201).json({ message: "success", ...response });

    !document && next(new AppError(`${name} was not found`, 404));
  });
};
