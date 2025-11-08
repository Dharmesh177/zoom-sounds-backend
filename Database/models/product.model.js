import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minLength: [3, "Too Short product Name"],
    },
    imgCover: {
      type: String,
    },
    images: {
      type: [String],
    },
    descripton: {
      type: String,
      minlength: [10, "Description should be more than or equal to 10"],
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    priceAfterDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: [String],
    },
    subcategory: {
      type: [String],
    },
    brand: {
      type: [String],
    },
    ratingAvg: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true ,toJSON: { virtuals: true },toObject: { virtuals: true } }
);

productSchema.post('init',function(doc){

  if(doc.imgCover && doc.images){

    doc.imgCover = `${process.env.BASE_URL}products/${doc.imgCover}`
    doc.images = doc.images.map((ele)=>{
     return `${process.env.BASE_URL}products/${ele}`
    })
  }

  
})

// productSchema.virtual('reviews', {
//   ref: 'review',
//   localField: '_id',
//   foreignField: 'productId',
// });

// productSchema.pre(['find','findOne'],function (){
//   this.populate('reviews')
// })

export const productModel = model("product", productSchema);


