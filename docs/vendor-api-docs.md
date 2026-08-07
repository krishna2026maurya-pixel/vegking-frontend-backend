# VeggieMart Vendor API Documentation

> **Base URL:** `https://your-domain.com/api`  
> **Content-Type:** `application/json`  
> **Last Updated:** July 2026

---

## Table of Contents

1. [Vendor Add Products](#1-vendor-add-products)
2. [Vendor Categories](#2-vendor-categories)
3. [Vendors](#3-vendors)
4. [Vendor Orders](#4-vendor-orders)
5. [Vendor Riders (Delivery Boys)](#5-vendor-riders-delivery-boys)
6. [Vendor Customers (Users)](#6-vendor-customers-users)

---

## 1. Vendor Add Products

Manage products listed by vendors on the platform.

**Base Endpoint:** `/api/vendor-add-products`

---

### 1.1 Get All Vendor Products

Retrieve a paginated list of vendor products with optional search filtering.

**`GET /api/vendor-add-products`**

#### Query Parameters

| Parameter | Type   | Required | Default | Description                                     |
|-----------|--------|----------|---------|-------------------------------------------------|
| `page`    | number | No       | `1`     | Page number for pagination                      |
| `limit`   | number | No       | `20`    | Number of results per page                      |
| `search`  | string | No       | `""`    | Search by `product_name` (case-insensitive)     |

#### Example Request

```http
GET /api/vendor-add-products?page=1&limit=10&search=tomato
```

#### Success Response — `200 OK`

```json
{
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "vendor_id": "64f1a2b3c4d5e6f7a8b9c0d0",
      "product_name": "Fresh Tomato",
      "cat_type_id": 2,
      "category": "Vegetables",
      "subcategory": "Leafy",
      "low_category": "Seasonal",
      "brand": "Farm Fresh",
      "product_label": "Organic",
      "quantity": "500",
      "volume": "g",
      "mrp": 60,
      "selling_price": 50,
      "gst": 5,
      "total_amt": 55,
      "product_description": "Fresh organic tomatoes",
      "product_images": "https://cdn.example.com/tomato.jpg",
      "add_info_title": "Storage",
      "add_info_desc": "Keep refrigerated",
      "stock_status": "in_stock",
      "description": "Premium quality tomatoes",
      "createdAt": "2026-07-01T10:00:00.000Z",
      "updatedAt": "2026-07-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

#### Error Response — `500 Internal Server Error`

```json
{
  "error": "Database connection failed"
}
```

---

### 1.2 Create a Vendor Product

Add a new product for a vendor.

**`POST /api/vendor-add-products`**

#### Request Body

| Field                 | Type     | Required | Description                              |
|-----------------------|----------|----------|------------------------------------------|
| `vendor_id`           | ObjectId | No       | Reference to the Vendor (`_id`)          |
| `product_name`        | string   | **Yes**  | Name of the product                      |
| `cat_type_id`         | number   | No       | Category type identifier                 |
| `category`            | string   | No       | Main category (e.g., "Vegetables")       |
| `subcategory`         | string   | No       | Sub-category                             |
| `low_category`        | string   | No       | Lower-level category                     |
| `brand`               | string   | No       | Brand name                               |
| `product_label`       | string   | No       | Label (e.g., "Organic", "Premium")       |
| `quantity`            | string   | No       | Quantity value (e.g., "500")             |
| `volume`              | string   | No       | Unit (e.g., "g", "kg", "ml")            |
| `mrp`                 | number   | No       | Maximum Retail Price                     |
| `selling_price`       | number   | No       | Actual selling price                     |
| `gst`                 | number   | No       | GST percentage                           |
| `total_amt`           | number   | No       | Total amount after tax                   |
| `product_description` | string   | No       | Short product description                |
| `product_images`      | string   | No       | Image URL or comma-separated URLs        |
| `add_info_title`      | string   | No       | Additional info section title            |
| `add_info_desc`       | string   | No       | Additional info section content          |
| `stock_status`        | string   | No       | e.g., `"in_stock"`, `"out_of_stock"`     |
| `description`         | string   | No       | Detailed description                     |

#### Example Request

```http
POST /api/vendor-add-products
Content-Type: application/json

{
  "vendor_id": "64f1a2b3c4d5e6f7a8b9c0d0",
  "product_name": "Fresh Spinach",
  "category": "Vegetables",
  "subcategory": "Leafy",
  "mrp": 40,
  "selling_price": 30,
  "gst": 0,
  "total_amt": 30,
  "quantity": "250",
  "volume": "g",
  "stock_status": "in_stock"
}
```

#### Success Response — `201 Created`

```json
{
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
    "vendor_id": "64f1a2b3c4d5e6f7a8b9c0d0",
    "product_name": "Fresh Spinach",
    "category": "Vegetables",
    "mrp": 40,
    "selling_price": 30,
    "stock_status": "in_stock",
    "createdAt": "2026-07-30T10:00:00.000Z",
    "updatedAt": "2026-07-30T10:00:00.000Z"
  }
}
```

---

### 1.3 Update a Vendor Product

**`PATCH /api/vendor-add-products/:id`**

#### Path Parameter

| Parameter | Type   | Required | Description              |
|-----------|--------|----------|--------------------------|
| `id`      | string | **Yes**  | MongoDB ObjectId of the product |

#### Example Request

```http
PATCH /api/vendor-add-products/64f1a2b3c4d5e6f7a8b9c0d2
Content-Type: application/json

{
  "selling_price": 25,
  "stock_status": "out_of_stock"
}
```

#### Success Response — `200 OK`

```json
{
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
    "product_name": "Fresh Spinach",
    "selling_price": 25,
    "stock_status": "out_of_stock",
    "updatedAt": "2026-07-30T12:00:00.000Z"
  }
}
```

---

### 1.4 Delete a Vendor Product

**`DELETE /api/vendor-add-products/:id`**

#### Path Parameter

| Parameter | Type   | Required | Description                     |
|-----------|--------|----------|---------------------------------|
| `id`      | string | **Yes**  | MongoDB ObjectId of the product |

#### Example Request

```http
DELETE /api/vendor-add-products/64f1a2b3c4d5e6f7a8b9c0d2
```

#### Success Response — `200 OK`

```json
{
  "success": true
}
```

---

## 2. Vendor Categories

Manage categories available to vendors.

**Base Endpoint:** `/api/vendor-categories`

---

### 2.1 Get All Vendor Categories

**`GET /api/vendor-categories`**

#### Query Parameters

| Parameter | Type   | Required | Default | Description                                       |
|-----------|--------|----------|---------|---------------------------------------------------|
| `page`    | number | No       | `1`     | Page number for pagination                        |
| `limit`   | number | No       | `20`    | Number of results per page                        |
| `search`  | string | No       | `""`    | Search by `category_name` (case-insensitive)      |

#### Example Request

```http
GET /api/vendor-categories?page=1&limit=10&search=fruit
```

#### Success Response — `200 OK`

```json
{
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0e1",
      "category_name": "Fruits",
      "description": "Fresh seasonal and tropical fruits",
      "category_image": "https://cdn.example.com/fruits.jpg",
      "cat_type_id": 1,
      "createdAt": "2026-06-01T08:00:00.000Z",
      "updatedAt": "2026-06-01T08:00:00.000Z"
    }
  ],
  "meta": {
    "total": 20,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

---

### 2.2 Create a Vendor Category

**`POST /api/vendor-categories`**

#### Request Body

| Field            | Type   | Required | Description                       |
|------------------|--------|----------|-----------------------------------|
| `category_name`  | string | **Yes**  | Name of the category              |
| `description`    | string | No       | Short description                 |
| `category_image` | string | No       | Image URL for the category        |
| `cat_type_id`    | number | No       | Numeric type identifier           |

#### Example Request

```http
POST /api/vendor-categories
Content-Type: application/json

{
  "category_name": "Dairy Products",
  "description": "Milk, cheese, butter and more",
  "category_image": "https://cdn.example.com/dairy.jpg",
  "cat_type_id": 3
}
```

#### Success Response — `201 Created`

```json
{
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0e2",
    "category_name": "Dairy Products",
    "description": "Milk, cheese, butter and more",
    "category_image": "https://cdn.example.com/dairy.jpg",
    "cat_type_id": 3,
    "createdAt": "2026-07-30T10:00:00.000Z",
    "updatedAt": "2026-07-30T10:00:00.000Z"
  }
}
```

---

### 2.3 Update a Vendor Category

**`PATCH /api/vendor-categories/:id`**

#### Path Parameter

| Parameter | Type   | Required | Description                       |
|-----------|--------|----------|-----------------------------------|
| `id`      | string | **Yes**  | MongoDB ObjectId of the category  |

#### Example Request

```http
PATCH /api/vendor-categories/64f1a2b3c4d5e6f7a8b9c0e2
Content-Type: application/json

{
  "description": "All fresh dairy and dairy-based products"
}
```

#### Success Response — `200 OK`

```json
{
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0e2",
    "category_name": "Dairy Products",
    "description": "All fresh dairy and dairy-based products",
    "updatedAt": "2026-07-30T12:00:00.000Z"
  }
}
```

---

### 2.4 Delete a Vendor Category

**`DELETE /api/vendor-categories/:id`**

#### Path Parameter

| Parameter | Type   | Required | Description                       |
|-----------|--------|----------|-----------------------------------|
| `id`      | string | **Yes**  | MongoDB ObjectId of the category  |

#### Example Request

```http
DELETE /api/vendor-categories/64f1a2b3c4d5e6f7a8b9c0e2
```

#### Success Response — `200 OK`

```json
{
  "success": true
}
```

---

## 3. Vendors

Manage vendor accounts on the platform.

**Base Endpoint:** `/api/vendors`

---

### 3.1 Get All Vendors

**`GET /api/vendors`**

#### Query Parameters

| Parameter | Type   | Required | Default | Description                                                            |
|-----------|--------|----------|---------|------------------------------------------------------------------------|
| `page`    | number | No       | `1`     | Page number for pagination                                             |
| `limit`   | number | No       | `10`    | Number of results per page                                             |
| `search`  | string | No       | `""`    | Search across `shop_name`, `full_name`, `mobile_number` (case-insensitive) |

> **Note:** The GET list response returns only selected fields:  
> `full_name`, `email`, `mobile_number`, `shop_name`, `city`, `is_verified`, `is_bestseller`, `wallet_balance`, `created_at`

#### Example Request

```http
GET /api/vendors?page=1&limit=10&search=krishna
```

#### Success Response — `200 OK`

```json
{
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0f1",
      "full_name": "Krishna Maurya",
      "email": "krishna@example.com",
      "mobile_number": "9876543210",
      "shop_name": "Krishna Veggie Store",
      "city": "Mumbai",
      "is_verified": "1",
      "is_bestseller": "0",
      "wallet_balance": 500
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### 3.2 Get a Single Vendor

**`GET /api/vendors/:id`**

#### Path Parameter

| Parameter | Type   | Required | Description                    |
|-----------|--------|----------|--------------------------------|
| `id`      | string | **Yes**  | MongoDB ObjectId of the vendor |

#### Example Request

```http
GET /api/vendors/64f1a2b3c4d5e6f7a8b9c0f1
```

#### Success Response — `200 OK`

```json
{
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0f1",
    "full_name": "Krishna Maurya",
    "email": "krishna@example.com",
    "mobile_number": "9876543210",
    "shop_name": "Krishna Veggie Store",
    "shop_category": "Vegetables",
    "business_type": "Retail",
    "gst_number": "27AABCU9603R1ZX",
    "pan_number": "AABCU9603R",
    "licence_number": "LIC123456",
    "address": "123, Main Road",
    "country": "India",
    "state": "Maharashtra",
    "city": "Mumbai",
    "pincode": "400001",
    "landmark": "Near Central Market",
    "services_coverage": "10km",
    "shop_image": "https://cdn.example.com/shop.jpg",
    "aadhar_front": "https://cdn.example.com/aadhar_f.jpg",
    "aadhar_back": "https://cdn.example.com/aadhar_b.jpg",
    "gps_lat": "19.0760",
    "gps_long": "72.8777",
    "gps_location": "Mumbai Central",
    "is_verified": "1",
    "is_bestseller": "0",
    "wallet_balance": 500,
    "fiberbase_token": "fcm_token_here",
    "handling_charge": 20,
    "gst_certificate": "https://cdn.example.com/gst_cert.pdf",
    "pan_card": "https://cdn.example.com/pan.jpg",
    "createdAt": "2026-05-01T08:00:00.000Z",
    "updatedAt": "2026-07-01T10:00:00.000Z"
  }
}
```

#### Error Response — `404 Not Found`

```json
{
  "error": "Vendor not found"
}
```

---

### 3.3 Create a Vendor

**`POST /api/vendors`**

#### Request Body

| Field               | Type   | Required | Default | Description                                       |
|---------------------|--------|----------|---------|---------------------------------------------------|
| `full_name`         | string | No       | —       | Full name of the vendor owner                     |
| `email`             | string | No       | —       | Vendor's email address                            |
| `mobile_number`     | string | No       | —       | Vendor's mobile number                            |
| `password`          | string | No       | —       | Hashed account password                           |
| `shop_name`         | string | No       | —       | Name of the vendor's shop                         |
| `shop_category`     | string | No       | —       | Primary shop category                             |
| `business_type`     | string | No       | —       | e.g., `"Retail"`, `"Wholesale"`                  |
| `gst_number`        | string | No       | —       | GST registration number                           |
| `pan_number`        | string | No       | —       | PAN card number                                   |
| `licence_number`    | string | No       | —       | Business licence number                           |
| `address`           | string | No       | —       | Shop address                                      |
| `country`           | string | No       | —       | Country                                           |
| `state`             | string | No       | —       | State                                             |
| `city`              | string | No       | —       | City                                              |
| `pincode`           | string | No       | —       | Postal/PIN code                                   |
| `landmark`          | string | No       | —       | Nearby landmark                                   |
| `services_coverage` | string | No       | —       | Service coverage area (e.g., `"5km"`)             |
| `shop_image`        | string | No       | —       | URL of the shop image                             |
| `aadhar_front`      | string | No       | —       | URL of Aadhaar card front image                   |
| `aadhar_back`       | string | No       | —       | URL of Aadhaar card back image                    |
| `gps_lat`           | string | No       | —       | GPS latitude                                      |
| `gps_long`          | string | No       | —       | GPS longitude                                     |
| `gps_location`      | string | No       | —       | Readable GPS location label                       |
| `is_verified`       | string | No       | `"0"`   | `"0"` = Not Verified, `"1"` = Verified            |
| `is_bestseller`     | string | No       | `"0"`   | `"0"` = No, `"1"` = Yes                          |
| `wallet_balance`    | number | No       | `0`     | Vendor's wallet balance                           |
| `fiberbase_token`   | string | No       | —       | Firebase FCM push notification token              |
| `handling_charge`   | number | No       | —       | Handling charge per order (in Rs.)                |
| `gst_certificate`   | string | No       | —       | URL of uploaded GST certificate                   |
| `pan_card`          | string | No       | —       | URL of uploaded PAN card image                    |

#### Example Request

```http
POST /api/vendors
Content-Type: application/json

{
  "full_name": "Rahul Sharma",
  "email": "rahul@example.com",
  "mobile_number": "9123456789",
  "shop_name": "Rahul's Fresh Mart",
  "shop_category": "Grocery",
  "business_type": "Retail",
  "city": "Delhi",
  "state": "Delhi",
  "country": "India",
  "pincode": "110001"
}
```

#### Success Response — `201 Created`

```json
{
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0f2",
    "full_name": "Rahul Sharma",
    "email": "rahul@example.com",
    "mobile_number": "9123456789",
    "shop_name": "Rahul's Fresh Mart",
    "city": "Delhi",
    "is_verified": "0",
    "wallet_balance": 0,
    "createdAt": "2026-07-30T10:00:00.000Z",
    "updatedAt": "2026-07-30T10:00:00.000Z"
  }
}
```

---

### 3.4 Update a Vendor

**`PATCH /api/vendors/:id`**

#### Path Parameter

| Parameter | Type   | Required | Description                    |
|-----------|--------|----------|--------------------------------|
| `id`      | string | **Yes**  | MongoDB ObjectId of the vendor |

#### Example Request

```http
PATCH /api/vendors/64f1a2b3c4d5e6f7a8b9c0f1
Content-Type: application/json

{
  "is_verified": "1",
  "is_bestseller": "1",
  "wallet_balance": 1000
}
```

#### Success Response — `200 OK`

```json
{
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0f1",
    "full_name": "Krishna Maurya",
    "is_verified": "1",
    "is_bestseller": "1",
    "wallet_balance": 1000,
    "updatedAt": "2026-07-30T12:00:00.000Z"
  }
}
```

#### Error Response — `404 Not Found`

```json
{
  "error": "Vendor not found"
}
```

---

### 3.5 Delete a Vendor

**`DELETE /api/vendors/:id`**

#### Path Parameter

| Parameter | Type   | Required | Description                    |
|-----------|--------|----------|--------------------------------|
| `id`      | string | **Yes**  | MongoDB ObjectId of the vendor |

#### Example Request

```http
DELETE /api/vendors/64f1a2b3c4d5e6f7a8b9c0f1
```

#### Success Response — `200 OK`

```json
{
  "success": true
}
```

---

## 4. Vendor Orders

Manage and filter orders placed for products belonging to specific vendors.

**Base Endpoint:** `/api/orders`

---

### 4.1 Get All Orders (Filtered by Role)

Retrieve a list of orders. If authenticated as a vendor, only returns orders containing the vendor's products.

**`GET /api/orders`**

#### Query Parameters

| Parameter | Type   | Required | Default | Description                                            |
|-----------|--------|----------|---------|--------------------------------------------------------|
| `page`    | number | No       | `1`     | Page number for pagination                             |
| `limit`   | number | No       | `10`    | Number of results per page                             |
| `search`  | string | No       | `""`    | Search by `order_number` or `customer_mobile`           |
| `status`  | string | No       | `""`    | Filter by order status (e.g. `"Order Placed"`, etc)   |

#### Example Request

```http
GET /api/orders?page=1&limit=10&status=Packing
```

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0a1",
      "order_number": "ORD-1786015018058",
      "user_id": {
        "_id": "64f1a2b3c4d5e6f7a8b9c0b1",
        "name": "Amit Patel",
        "mobile_no": "9876543210"
      },
      "total_amount": 350.00,
      "payment_method": "COD",
      "payment_status": "pending",
      "orderStatus": "Packing",
      "shippingAddress": {
        "street": "12 Ring Road",
        "city": "Ahmedabad",
        "pincode": "380015"
      },
      "items": [
        "64f1a2b3c4d5e6f7a8b9c0c1"
      ],
      "createdAt": "2026-08-07T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

---

### 4.2 Create an Order

Create a new order.

**`POST /api/orders`**

#### Request Body

| Field             | Type   | Required | Description                                                         |
|-------------------|--------|----------|---------------------------------------------------------------------|
| `items`           | array  | **Yes**  | Array of items containing `productId`, `name`, `quantity`, `price` |
| `totalAmount`     | number | **Yes**  | Total price of the order                                            |
| `shippingAddress` | object | **Yes**  | Address object with details                                         |

#### Success Response — `201 Created`

```json
{
  "success": true,
  "_id": "64f1a2b3c4d5e6f7a8b9c0a1",
  "order_number": "ORD-1786015018058",
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0a1",
    "order_number": "ORD-1786015018058",
    "total_amount": 350,
    "payment_method": "COD",
    "payment_status": "pending",
    "items": [
      "64f1a2b3c4d5e6f7a8b9c0c1"
    ]
  }
}
```

---

### 4.3 Update Order Status

Update the status of an order (e.g. for vendor status updates).

**`PATCH /api/orders/:id`**

#### Request Body

| Field         | Type   | Required | Description                                             |
|---------------|--------|----------|---------------------------------------------------------|
| `orderStatus` | string | **Yes**  | New status (e.g., `"Order Confirmed"`, `"Delivered"`)   |
| `status`      | number | No       | Legacy status integer (0-5)                             |

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0a1",
    "orderStatus": "Packing",
    "statusHistory": [
      {
        "status": "Packing",
        "updatedAt": "2026-08-07T11:00:00.000Z"
      }
    ]
  }
}
```

---

### 4.4 Delete an Order

Remove an order record from the database.

**`DELETE /api/orders/:id`**

#### Success Response — `200 OK`

```json
{
  "success": true
}
```

---

## 5. Vendor Riders (Delivery Boys)

Manage delivery boy accounts assigned to the vendor.

**Base Endpoint:** `/api/delivery-boys`

---

### 5.1 Get Vendor Riders

Retrieve all delivery boy accounts, with optional search and vendor filtering.

**`GET /api/delivery-boys`**

#### Query Parameters

| Parameter   | Type   | Required | Description                                     |
|-------------|--------|----------|-------------------------------------------------|
| `page`      | number | No       | Page number for pagination                      |
| `limit`     | number | No       | Results per page                                |
| `search`    | string | No       | Search by `name` or `mobile_number`             |
| `vendor_id` | string | No       | Filter by assigning vendor ID                   |

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d5",
      "name": "Rider Kumar",
      "email": "rider1@vegimart.com",
      "mobile_number": "9812345678",
      "vehicle_type": "Bike",
      "vehicle_number": "GJ-01-AB-1234",
      "is_active": "1",
      "is_verified": "1",
      "vendor_id": "64f1a2b3c4d5e6f7a8b9c0d0",
      "createdAt": "2026-08-07T05:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 5.2 Register a Rider

Create a new delivery boy account.

**`POST /api/delivery-boys`**

#### Request Body

| Field            | Type   | Required | Description                     |
|------------------|--------|----------|---------------------------------|
| `name`           | string | **Yes**  | Delivery boy's name             |
| `email`          | string | **Yes**  | Login email                     |
| `mobile_number`  | string | **Yes**  | Contact number                  |
| `password`       | string | **Yes**  | Login password                  |
| `vehicle_type`   | string | **Yes**  | e.g. `"Bike"`, `"Scooter"`      |
| `vehicle_number` | string | **Yes**  | License plate number            |
| `vendor_id`      | string | **Yes**  | Parent vendor owner ID          |

#### Success Response — `201 Created`

```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d5",
    "name": "Rider Kumar",
    "email": "rider1@vegimart.com",
    "mobile_number": "9812345678",
    "is_active": "1",
    "is_verified": "1"
  }
}
```

---

### 5.3 Update Rider Details

Modify details of a delivery boy (e.g. updating vehicle info or credentials).

**`PATCH /api/delivery-boys/:id`**

#### Request Body (All fields optional)

| Field            | Type   | Description                         |
|------------------|--------|-------------------------------------|
| `name`           | string | Rider name                          |
| `email`          | string | Login email                         |
| `mobile_number`  | string | Contact number                      |
| `password`       | string | New password (if updating)          |
| `vehicle_type`   | string | Vehicle type                        |
| `vehicle_number` | string | License plate number                |

#### Success Response — `200 OK`

```json
{
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d5",
    "name": "Rider Kumar (Updated)",
    "vehicle_type": "Scooter"
  }
}
```

---

### 5.4 Delete a Rider

Permanently delete a delivery boy account.

**`DELETE /api/delivery-boys/:id`**

#### Success Response — `200 OK`

```json
{
  "success": true
}
```

---

## 6. Vendor Customers (Users)

Manage customers (users) registered on the VeggieMart platform.

**Base Endpoint:** `/api/users`

---

### 6.1 Get Customers List

Retrieve a paginated list of all customers.

**`GET /api/users`**

#### Query Parameters

| Parameter | Type   | Required | Description                        |
|-----------|--------|----------|------------------------------------|
| `page`    | number | No       | Page number for pagination         |
| `limit`   | number | No       | Results per page                   |
| `search`  | string | No       | Search by `name`, `email`, `mobile_no` |

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0b1",
      "name": "Amit Patel",
      "email": "amit@example.com",
      "mobile_no": "9876543210",
      "wallet_balance": 150.00,
      "is_active": "1",
      "createdAt": "2026-08-01T12:00:00.000Z"
    }
  ],
  "meta": {
    "total": 120,
    "page": 1,
    "limit": 10,
    "totalPages": 12
  }
}
```

---

### 6.2 Update Customer

Modify a customer record.

**`PATCH /api/users/:id`**

#### Request Body

| Field       | Type   | Required | Description                              |
|-------------|--------|----------|------------------------------------------|
| `is_active` | string | No       | `"0"` = Suspended, `"1"` = Active        |
| `name`      | string | No       | Update name                              |

#### Success Response — `200 OK`

```json
{
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0b1",
    "name": "Amit Patel",
    "is_active": "0"
  }
}
```

---

### 6.3 Delete Customer

Delete a customer record.

**`DELETE /api/users/:id`**

#### Success Response — `200 OK`

```json
{
  "success": true
}
```

---

## Common Error Responses

| Status Code | Meaning               | Example Response                            |
|-------------|-----------------------|---------------------------------------------|
| `404`       | Resource not found    | `{ "error": "Vendor not found" }`          |
| `500`       | Internal server error | `{ "error": "Database connection failed" }` |

---

## Quick Reference Summary

| Method   | Endpoint                           | Description                       |
|----------|------------------------------------|-----------------------------------|
| `GET`    | `/api/vendor-add-products`         | List all vendor products          |
| `POST`   | `/api/vendor-add-products`         | Create a new vendor product       |
| `PATCH`  | `/api/vendor-add-products/:id`     | Update a vendor product           |
| `DELETE` | `/api/vendor-add-products/:id`     | Delete a vendor product           |
| `GET`    | `/api/vendor-categories`           | List all vendor categories        |
| `POST`   | `/api/vendor-categories`           | Create a new vendor category      |
| `PATCH`  | `/api/vendor-categories/:id`       | Update a vendor category          |
| `DELETE` | `/api/vendor-categories/:id`       | Delete a vendor category          |
| `GET`    | `/api/vendors`                     | List all vendors                  |
| `GET`    | `/api/vendors/:id`                 | Get a single vendor by ID         |
| `POST`   | `/api/vendors`                     | Register a new vendor             |
| `PATCH`  | `/api/vendors/:id`                 | Update a vendor                   |
| `DELETE` | `/api/vendors/:id`                 | Delete a vendor                   |
| `GET`    | `/api/orders`                      | List orders (filtered by Vendor)  |
| `POST`   | `/api/orders`                      | Create a new order                |
| `PATCH`  | `/api/orders/:id`                  | Update order status               |
| `DELETE` | `/api/orders/:id`                  | Delete an order                   |
| `GET`    | `/api/delivery-boys`               | List delivery riders              |
| `POST`   | `/api/delivery-boys`               | Register a new delivery rider      |
| `PATCH`  | `/api/delivery-boys/:id`           | Update delivery rider details     |
| `DELETE` | `/api/delivery-boys/:id`           | Delete a delivery rider           |
| `GET`    | `/api/users`                       | List all customers (users)        |
| `PATCH`  | `/api/users/:id`                   | Update customer details           |
| `DELETE` | `/api/users/:id`                   | Delete a customer account         |
