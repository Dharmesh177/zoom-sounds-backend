export class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
    this.page = 1;
    this.limit = 10;
    this.filters = {};
  }

  // Pagination
  pagination() {
    this.page = Number(this.queryString.page) || 1;
    this.limit = Number(this.queryString.limit) || 10;

    if (this.page <= 0) this.page = 1;

    const skip = (this.page - 1) * this.limit;
    this.mongooseQuery.skip(skip).limit(this.limit);

    return this;
  }

  // Filteration
  filteration() {
    let filterObj = { ...this.queryString };

    const excludedQuery = ["page", "limit", "sort", "fields", "keyword"];
    excludedQuery.forEach((ele) => delete filterObj[ele]);

    let filters = JSON.stringify(filterObj);
    filters = filters.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
    this.filters = JSON.parse(filters);

    this.mongooseQuery.find(this.filters);
    return this;
  }

  // Sort
  sort() {
    if (this.queryString.sort) {
      const sortedBy = this.queryString.sort.split(",").join(" ");
      this.mongooseQuery.sort(sortedBy);
    }
    return this;
  }

  // Search
  search() {
    if (this.queryString.keyword) {
      this.mongooseQuery.find({
        $or: [
          { title: { $regex: this.queryString.keyword, $options: "i" } },
          { description: { $regex: this.queryString.keyword, $options: "i" } },
        ],
      });
    }
    return this;
  }

  // Fields selection
  fields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.mongooseQuery.select(fields);
    }
    return this;
  }
}
