# Vegimart Order API Reference

This document provides a detailed request and response reference for every order-related API endpoint.

**Base URL:** `http://localhost:3001` (or `http://localhost:3000`)

---

## 🔑 Administrative & General APIs

### 1. Get All Orders (Paginated & Filterable)
Retrieves a list of orders, sorted by `createdAt` in descending order.

*   **URL:** `{{baseURL}}/api/orders`
*   **Method:** `GET`
*   **Headers:**
    *   `Content-Type: application/json`
*   **Query Parameters:**
    *   `page` (optional, default: `1`): The page offset.
    *   `limit` (optional, default: `10`): Number of orders per page.
    *   `search` (optional): Query matched against `order_number` or `customer_mobile` (regex, case-insensitive).
    *   `status` (optional): Numeric status code (`0`, `1`, `2`, `3`, `4`, `5`).

#### **Request Example**
`GET http://localhost:3001/api/orders?page=1&limit=2&search=ORD-123&status=0`

#### **Success Response (200 OK)**
```json
{
  "data": [
    {
      "_id": "65b9a8bcde1234567890abcd",
      "order_number": "ORD-123456",
      "user_id": "65b9a8bcde12345678901111",
      "total_amount": 750,
      "delivery_charge": 50,
      "payment_method": "COD",
      "payment_status": "pending",
      "status": 0,
      "items": [
        "65b9a8bcde12345678902222"
      ],
      "createdAt": "2026-07-22T06:00:00.000Z",
      "updatedAt": "2026-07-22T06:00:00.000Z",
      "__v": 0
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 2,
    "totalPages": 1
  }
}
```

#### **Error Response (500 Internal Server Error)**
```json
{
  "error": "Database connection failed"
}
```

---

### 2. Create Raw Order
Directly inserts an order document into the database (typically used for admin entries or manual migrations).

*   **URL:** `{{baseURL}}/api/orders`
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type: application/json`

#### **Request Example**
`POST http://localhost:3001/api/orders`

**Body:**
```json
{
  "order_number": "ORD-987654",
  "user_id": "65b9a8bcde12345678901111",
  "total_amount": 1200,
  "delivery_charge": 40,
  "payment_method": "ONLINE",
  "payment_status": "completed",
  "status": 1
}
```

#### **Success Response (201 Created)**
```json
{
  "data": {
    "_id": "65b9a910de1234567890ef01",
    "order_number": "ORD-987654",
    "user_id": "65b9a8bcde12345678901111",
    "total_amount": 1200,
    "delivery_charge": 40,
    "payment_method": "ONLINE",
    "payment_status": "completed",
    "status": 1,
    "items": [],
    "createdAt": "2026-07-22T06:15:00.000Z",
    "updatedAt": "2026-07-22T06:15:00.000Z",
    "__v": 0
  }
}
```

#### **Error Response (500 Internal Server Error)**
```json
{
  "error": "Order validation failed: order_number is required"
}
```

---

### 3. Get Order by ID
Fetches a single order document matching the provided database ID.

*   **URL:** `{{baseURL}}/api/orders/[id]`
*   **Method:** `GET`
*   **Headers:**
    *   `Content-Type: application/json`

#### **Request Example**
`GET http://localhost:3001/api/orders/65b9a8bcde1234567890abcd`

#### **Success Response (200 OK)**
```json
{
  "data": {
    "_id": "65b9a8bcde1234567890abcd",
    "order_number": "ORD-123456",
    "user_id": "65b9a8bcde12345678901111",
    "total_amount": 750,
    "delivery_charge": 50,
    "payment_method": "COD",
    "payment_status": "pending",
    "status": 0,
    "items": [
      "65b9a8bcde12345678902222"
    ],
    "createdAt": "2026-07-22T06:00:00.000Z",
    "updatedAt": "2026-07-22T06:00:00.000Z",
    "__v": 0
  }
}
```

#### **Error Response (404 Not Found)**
```json
{
  "error": "Order not found"
}
```

---

### 4. Update Order
Modifies an existing order document.

*   **URL:** `{{baseURL}}/api/orders/[id]`
*   **Method:** `PATCH`
*   **Headers:**
    *   `Content-Type: application/json`

#### **Request Example**
`PATCH http://localhost:3001/api/orders/65b9a8bcde1234567890abcd`

**Body:**
```json
{
  "status": 2,
  "payment_status": "completed",
  "delivery_boy_id": "65b9a8bcde12345678909999"
}
```

#### **Success Response (200 OK)**
```json
{
  "data": {
    "_id": "65b9a8bcde1234567890abcd",
    "order_number": "ORD-123456",
    "user_id": "65b9a8bcde12345678901111",
    "delivery_boy_id": "65b9a8bcde12345678909999",
    "total_amount": 750,
    "delivery_charge": 50,
    "payment_method": "COD",
    "payment_status": "completed",
    "status": 2,
    "items": [
      "65b9a8bcde12345678902222"
    ],
    "createdAt": "2026-07-22T06:00:00.000Z",
    "updatedAt": "2026-07-22T06:20:00.000Z",
    "__v": 0
  }
}
```

#### **Error Response (404 Not Found)**
```json
{
  "error": "Order not found"
}
```

---

### 5. Delete Order
Deletes an order by ID.

*   **URL:** `{{baseURL}}/api/orders/[id]`
*   **Method:** `DELETE`
*   **Headers:**
    *   `Content-Type: application/json`

#### **Request Example**
`DELETE http://localhost:3001/api/orders/65b9a8bcde1234567890abcd`

#### **Success Response (200 OK)**
```json
{
  "success": true
}
```

#### **Error Response (500 Internal Server Error)**
```json
{
  "error": "Cast to ObjectId failed for value \"invalid_id\""
}
```

---

## 🛒 Customer APIs (v1)
All routes below require authorization (a valid session/JWT token handled by `authMiddleware`).

---

### 6. Get My Orders
Lists the authenticated user's order history.

*   **URL:** `{{baseURL}}/api/v1/orders`
*   **Method:** `GET`
*   **Headers:**
    *   `Authorization: Bearer <JWT_TOKEN>`
    *   `Content-Type: application/json`
*   **Query Parameters:**
    *   `page` (optional, default: `1`)
    *   `limit` (optional, default: `10`)

#### **Request Example**
`GET http://localhost:3001/api/v1/orders?page=1&limit=5`

#### **Success Response (200 OK)**
```json
{
  "data": [
    {
      "_id": "65b9a8bcde1234567890abcd",
      "order_number": "ORD-123456",
      "user_id": "65b9a8bcde12345678901111",
      "total_amount": 750,
      "delivery_charge": 50,
      "payment_method": "COD",
      "payment_status": "pending",
      "status": 0,
      "items": [
        {
          "_id": "65b9a8bcde12345678902222",
          "order_id": "65b9a8bcde1234567890abcd",
          "product_id": "65b9a8bcde12345678903333",
          "product_name": "Organic Spinach",
          "qty": 2,
          "price": 350,
          "image": "spinach_img.png",
          "createdAt": "2026-07-22T06:00:00.000Z",
          "updatedAt": "2026-07-22T06:00:00.000Z"
        }
      ],
      "createdAt": "2026-07-22T06:00:00.000Z",
      "updatedAt": "2026-07-22T06:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 5,
    "totalPages": 1
  }
}
```

---

### 7. Place Order
Validates the checkout details, creates the order, reduces product stock, and clears the user's cart.

*   **URL:** `{{baseURL}}/api/v1/orders`
*   **Method:** `POST`
*   **Headers:**
    *   `Authorization: Bearer <JWT_TOKEN>`
    *   `Content-Type: application/json`

#### **Request Example**
`POST http://localhost:3001/api/v1/orders`

**Body:**
```json
{
  "address_id": "65b9a8bcde1234567890aaaa",
  "payment_method": "COD",
  "coupon_code": "WELCOME10",
  "delivery_charge": 50,
  "total_amount": 750,
  "items": [
    {
      "product_id": "65b9a8bcde12345678903333",
      "qty": 2,
      "price": 350
    }
  ]
}
```

#### **Success Response (201 Created)**
```json
{
  "message": "Order placed successfully.",
  "data": {
    "_id": "65b9a8bcde1234567890abcd",
    "order_number": "ORD-349810",
    "user_id": "65b9a8bcde12345678901111",
    "total_amount": 750,
    "delivery_charge": 50,
    "payment_method": "COD",
    "payment_status": "pending",
    "status": 0,
    "items": [
      {
        "_id": "65b9a8bcde12345678902222",
        "order_id": "65b9a8bcde1234567890abcd",
        "product_id": "65b9a8bcde12345678903333",
        "product_name": "Organic Spinach",
        "qty": 2,
        "price": 350,
        "image": "spinach_img.png"
      }
    ],
    "createdAt": "2026-07-22T06:40:00.000Z",
    "updatedAt": "2026-07-22T06:40:00.000Z"
  }
}
```

#### **Error Response (400 Bad Request)**
```json
{
  "error": "Address and items are required."
}
```

---

### 8. Get Customer Order Detail
Retrieves the details of a specific order if it belongs to the authenticated user.

*   **URL:** `{{baseURL}}/api/v1/orders/[id]`
*   **Method:** `GET` (Supports `POST` as a fallback)
*   **Headers:**
    *   `Authorization: Bearer <JWT_TOKEN>`
    *   `Content-Type: application/json`

#### **Request Example**
`GET http://localhost:3001/api/v1/orders/65b9a8bcde1234567890abcd`

#### **Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "_id": "65b9a8bcde1234567890abcd",
    "order_number": "ORD-123456",
    "user_id": "65b9a8bcde12345678901111",
    "total_amount": 750,
    "delivery_charge": 50,
    "payment_method": "COD",
    "payment_status": "pending",
    "status": 0,
    "items": [
      {
        "_id": "65b9a8bcde12345678902222",
        "order_id": "65b9a8bcde1234567890abcd",
        "product_id": "65b9a8bcde12345678903333",
        "product_name": "Organic Spinach",
        "qty": 2,
        "price": 350,
        "image": "spinach_img.png"
      }
    ],
    "createdAt": "2026-07-22T06:00:00.000Z",
    "updatedAt": "2026-07-22T06:00:00.000Z"
  }
}
```

#### **Error Response (404 Not Found)**
```json
{
  "success": false,
  "error": "Order not found."
}
```

---

### 9. Cancel Customer Order
Cancels an order if it has not yet been processed or dispatched.

*   **URL:** `{{baseURL}}/api/v1/orders/[id]/cancel`
*   **Method:** `PATCH` (Supports `POST` and `GET` as fallbacks)
*   **Headers:**
    *   `Authorization: Bearer <JWT_TOKEN>`
    *   `Content-Type: application/json`

#### **Request Example**
`PATCH http://localhost:3001/api/v1/orders/65b9a8bcde1234567890abcd/cancel`

#### **Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Order cancelled successfully.",
  "data": {
    "_id": "65b9a8bcde1234567890abcd",
    "order_number": "ORD-123456",
    "user_id": "65b9a8bcde12345678901111",
    "total_amount": 750,
    "delivery_charge": 50,
    "payment_method": "COD",
    "payment_status": "pending",
    "status": 4
  }
}
```

#### **Error Response (400 Bad Request)**
```json
{
  "success": false,
  "error": "Order cannot be cancelled as it is already dispatched or delivered."
}
```
