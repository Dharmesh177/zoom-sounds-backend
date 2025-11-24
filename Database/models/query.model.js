import mongoose, { Schema, model } from "mongoose";
import { QUERY_TYPES } from "../../src/constants/common-constants.js";

const querySchema = new Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
  type: { 
    type: String, 
    enum: QUERY_TYPES,
    default: "other"
  },
}, { timestamps: true });

export const queryModel = model("Query", querySchema);
