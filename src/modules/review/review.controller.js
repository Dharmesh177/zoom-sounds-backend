import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { deleteOne } from "../../handlers/factor.js";
import { ApiFeatures } from "../../utils/ApiFeatures.js";
import { queryModel } from "./../../../Database/models/query.model.js";

const addReview = catchAsyncError(async (req, res, next) => {
  const newQuery = new queryModel(req.body);
  await newQuery.save();

  res.status(200).json({
    message: "success",
    data: newQuery,
  });
});

const getAllReviews = catchAsyncError(async (req, res, next) => {
  let apiFeature = new ApiFeatures(queryModel.find(), req.query)
    .pagination()
    .fields()
    .filteration()
    .search()
    .sort();
  const PAGE_NUMBER = apiFeature.queryString.page * 1 || 1;
  const getAllReviews = await apiFeature.mongooseQuery;
  res
    .status(200)
    .json({ page: PAGE_NUMBER, message: "success", getAllReviews });
});

const getSpecificReview = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  // console.log(id);

  let result = await queryModel.findById(id);

  !result && next(new AppError("Review was not found", 404));
  result && res.status(200).json({ message: "success", result });
});

const deleteReview = deleteOne(queryModel, "Review");
export {
  addReview,
  getAllReviews,
  getSpecificReview,
  deleteReview,
};
