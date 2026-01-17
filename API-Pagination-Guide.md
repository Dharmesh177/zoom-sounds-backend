# API Pagination Guide

This document provides details on how to use the pagination feature in the `getAllProducts` endpoint.

---

## Endpoint
**GET** `/api/v1/products`

---

## Query Parameters
| Parameter | Type   | Description                              | Default |
|-----------|--------|------------------------------------------|---------|
| `page`    | Number | The page number to fetch.               | `1`     |
| `limit`   | Number | The number of items to fetch per page.  | `10`    |

---

## Sample Request
```http
GET /api/v1/products?page=2&limit=5
```

---

## Sample Response
```json
{
  "page": 2,
  "limit": 5,
  "totalPages": 10,
  "totalProducts": 50,
  "status": "success",
  "products": [
    // data
  ]
}
```

---

## Explanation
1. **Input**:
   - `page=2`: Fetch the second page.
   - `limit=5`: Each page contains 5 products.

2. **Output**:
   - `page`: The current page number.
   - `limit`: The number of items per page.
   - `totalPages`: Total number of pages based on the total products.
   - `totalProducts`: Total number of products in the database.
   - `products`: The array of products for the current page.

---

## Notes
- If `page` is not provided, the default value is `1`.
- If `limit` is not provided, the default value is `10`.
- Ensure that the `page` and `limit` values are positive integers.
- The `products` array will be empty if there are no products for the requested page.