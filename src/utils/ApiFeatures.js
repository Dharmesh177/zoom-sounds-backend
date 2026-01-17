export class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
    this.queryFilter = {};
  }

  //1-Pagination
  pagination(page, limit) {
    const PAGE_LIMIT = limit || 10;
    let PAGE_NUMBER = page || 1;
    if (PAGE_NUMBER <= 0) PAGE_NUMBER = 1;
    const PAGE_SKIP = (PAGE_NUMBER - 1) * PAGE_LIMIT;

    this.mongooseQuery.skip(PAGE_SKIP).limit(PAGE_LIMIT);
    return this;
  }

  //2-Filteration

  filteration() {
    let filterObj = { ...this.queryString };

    let excludedQuery = ["page", "sort", "fields", "keyword", "limit"];

    excludedQuery.forEach((ele) => {
      delete filterObj[ele];
    });
    filterObj = JSON.stringify(filterObj);

    filterObj = filterObj.replace(
      /\b(gt|gte|lt|lte)\b/g,
      (match) => `$${match}`
    );
    filterObj = JSON.parse(filterObj);
    
    // Store for counting
    this.queryFilter = { ...this.queryFilter, ...filterObj };

    return this;
  }
  //3-Sort
  sort() {
    if (this.queryString.sort) {
      // console.log(req.query.sort);
      let sortedBy = this.queryString.sort.split(",").join(" ");
      // console.log(sortedBy);
      this.mongooseQuery.sort(sortedBy);
    }
    return this;
  }
  //4-Search

  search() {
    if (this.queryString.keyword) {
      const searchFilter = {
        $or: [
          { title: { $regex: this.queryString.keyword, $options: "i" } },
          { name: { $regex: this.queryString.keyword, $options: "i" } },
          { description: { $regex: this.queryString.keyword, $options: "i" } },
        ],
      };
      this.queryFilter = { ...this.queryFilter, ...searchFilter };
    }
    return this;
  }

  //4-Fields

  fields() {
    if (this.queryString.fields) {
      // console.log(this.queryString.fields);
      let fields = this.queryString.fields.split(",").join(" ");
      console.log(fields);
      // this.mongooseQuery.select(fields);
    }
    return this;
  }
}
