import { catchAsyncError } from "../../utils/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { deleteOne } from "../../handlers/factor.js";
import { ApiFeatures } from "../../utils/ApiFeatures.js";
import { queryModel } from "./../../../Database/models/query.model.js";

const buildResponse = ({ data, page, limit, totalDocuments }) => {
  const totalPages = Math.ceil(totalDocuments / limit);

  return {
    success: true,
    pagination: {
      page,
      limit,
      totalDocuments,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
    data,
  };
};

const addReview = catchAsyncError(async (req, res, next) => {
  const newQuery = new queryModel(req.body);
  await newQuery.save();

  res.status(200).json({
    message: "success",
    data: newQuery,
  });
});

const getAllReviews = catchAsyncError(async (req, res, next) => {
  const api = new ApiFeatures(queryModel.find(), req.query)
    .filteration()
    .search()
    .fields()
    .sort()
    .pagination();

  const data = await api.mongooseQuery;

  const totalDocuments = await queryModel.countDocuments(api.filters);

  const response = buildResponse({
    data,
    page: api.page,
    limit: api.limit,
    totalDocuments,
  });

  res.status(200).json(response);
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
