# VegKing API Reference

> **Base URL:** `/api`  
> **Format:** All requests and responses use `application/json`.  
> **Database:** MongoDB (Mongoose ODM)

---

## Table of Contents

1. [Vendor Add Products](#1-vendor-add-products)
2. [Vendor Categories](#2-vendor-categories)
3. [Vendors](#3-vendors)
4. [Common Patterns](#4-common-patterns)
5. [Data Models](#5-data-models)

---

## 1. Vendor Add Products

**Base Path:** `/api/vendor-add-products`

Manages products added by vendors to the platform.

---

### 1.1 List Vendor Products

Fetch a paginated, optionally filtered list of vendor products.

| Property   | Value                      |
|------------|----------------------------|
| **Method** | `GET`                      |
| **URL**    | `/api/vendor-add-products` |
| **Auth**   | Not required               |

#### Query Parameters

| Parameter | Type     | Default | Description                                     |
|-----------|----------|---------|-------------------------------------------------|
| `page`    | `number` | `1`     | Page number (1-indexed)                         |
| `limit`   | `number` | `20`    | Number of items per page                        |
| `search`  | `string` | `""`    | Case-insensitive search on `product_name` field |

#### Response — 200 OK

```json
{
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "vendor_id": "64f1a2b3c4d5e6f7a8b9c0aa",
      "product_name": "Fresh Tomatoes",
      "cat_type_id": 1,
      "category": "Vegetables",
      "subcategory": "Root Vegetables",
      "low_category": "Organic",
      "brand": "FarmFresh",
      "product_label": "New Arrival",
      "quantity": "500",
      "volume": "500g",
      "mrp": 60,
      "selling_price": 50,
      "gst": 5,
      "total_amt": 52.5,
      "product_description": "Farm fresh organic tomatoes",
      "product_images": "https://example.com/tomato.jpg",
      "add_info_title": "Storage",
      "add_info_desc": "Store in a cool dry place",
      "stock_status": "in_stock",
      "description": "Premium quality tomatoes",
      "createdAt": "2026-07-01T10:00:00.000Z",
      "updatedAt": "2026-07-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

#### Response — 500 Internal Server Error

```json
{ "error": "Error message here" }
```

---

### 1.2 Create Vendor Product

Add a new product entry by a vendor.

| Property      | Value                      |
|---------------|----------------------------|
| **Method**    | `POST`                     |
| **URL**       | `/api/vendor-add-products` |
| **Auth**      | Not required               |
| **Body Type** | `application/json`         |

#### Request Body

```json
{
  "vendor_id": "64f1a2b3c4d5e6f7a8b9c0aa",
  "product_name": "Fresh Tomatoes",
  "cat_type_id": 1,
  "category": "Vegetables",
  "subcategory": "Root Vegetables",
  "low_category": "Organic",
  "brand": "FarmFresh",
  "product_label": "New Arrival",
  "quantity": "500",
  "volume": "500g",
  "mrp": 60,
  "selling_price": 50,
  "gst": 5,
  "total_amt": 52.5,
  "product_description": "Farm fresh organic tomatoes",
  "product_images": "https://example.com/tomato.jpg",
  "add_info_title": "Storage",
  "add_info_desc": "Store in a cool dry place",
  "stock_status": "in_stock",
  "description": "Premium quality tomatoes"
}
```

#### Field Reference

| Field                 | Type       | Required | Description                              |
|-----------------------|------------|----------|------------------------------------------|
| `vendor_id`           | `ObjectId` | No       | Reference to the Vendor document         |
| `product_name`        | `string`   | **Yes**  | Name of the product                      |
| `cat_type_id`         | `number`   | No       | Numeric category type identifier         |
| `category`            | `string`   | No       | Main category name                       |
| `subcategory`         | `string`   | No       | Sub-category name                        |
| `low_category`        | `string`   | No       | Tertiary / lower category                |
| `brand`               | `string`   | No       | Brand name                               |
| `product_label`       | `string`   | No       | Display label (e.g. "Best Seller")       |
| `quantity`            | `string`   | No       | Quantity value                           |
| `volume`              | `string`   | No       | Volume / weight (e.g. "500g", "1L")      |
| `mrp`                 | `number`   | No       | Maximum retail price                     |
| `selling_price`       | `number`   | No       | Actual selling price                     |
| `gst`                 | `number`   | No       | GST percentage                           |
| `total_amt`           | `number`   | No       | Final amount after tax                   |
| `product_description` | `string`   | No       | Detailed product description             |
| `product_images`      | `string`   | No       | Image URL or comma-separated URLs        |
| `add_info_title`      | `string`   | No       | Additional info section title            |
| `add_info_desc`       | `string`   | No       | Additional info section body             |
| `stock_status`        | `string`   | No       | `"in_stock"` or `"out_of_stock"`         |
| `description`         | `string`   | No       | Short description                        |

#### Response — 201 Created

```json
{
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "product_name": "Fresh Tomatoes",
    "createdAt": "2026-07-30T10:00:00.000Z",
    "updatedAt": "2026-07-30T10:00:00.000Z"
  }
}
```

---

### 1.3 Update Vendor Product

Partially update fields of an existing vendor product.

| Property      | Value                           |
|---------------|---------------------------------|
| **Method**    | `PATCH`                         |
| **URL**       | `/api/vendor-add-products/{id}` |
| **Auth**      | Not required                    |
| **Body Type** | `application/json`              |

#### Path Parameters

| Parameter | Type     | Description                         |
|-----------|----------|-------------------------------------|
| `id`      | `string` | MongoDB `_id` of the vendor product |

#### Request Body

Send only the fields you want to update:

```json
{
  "selling_price": 45,
  "stock_status": "out_of_stock"
}
```

#### Response — 200 OK

```json
{
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "product_name": "Fresh Tomatoes",
    "selling_price": 45,
    "stock_status": "out_of_stock",
    "updatedAt": "2026-07-30T12:00:00.000Z"
  }
}
```

---

### 1.4 Delete Vendor Product

Permanently delete a vendor product by its ID.

| Property   | Value                           |
|------------|---------------------------------|
| **Method** | `DELETE`                        |
| **URL**    | `/api/vendor-add-products/{id}` |
| **Auth**   | Not required                    |

#### Path Parameters

| Parameter | Type     | Description                         |
|-----------|----------|-------------------------------------|
| `id`      | `string` | MongoDB `_id` of the vendor product |

#### Response — 200 OK

```json
{ "success": true }
```

---

## 2. Vendor Categories

**Base Path:** `/api/vendor-categories`

Manages product categories that vendors operate under.

---

### 2.1 List Vendor Categories

Fetch a paginated, optionally filtered list of vendor categories.

| Property   | Value                    |
|------------|--------------------------|
| **Method** | `GET`                    |
| **URL**    | `/api/vendor-categories` |
| **Auth**   | Not required             |

#### Query Parameters

| Parameter | Type     | Default | Description                                      |
|-----------|----------|---------|--------------------------------------------------|
| `page`    | `number` | `1`     | Page number (1-indexed)                          |
| `limit`   | `number` | `20`    | Number of items per page                         |
| `search`  | `string` | `""`    | Case-insensitive search on `category_name` field |

#### Response — 200 OK

```json
{
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0e1",
      "category_name": "Fresh Vegetables",
      "description": "All kinds of fresh vegetables",
      "category_image": "https://example.com/vegetables.jpg",
      "cat_type_id": 1,
      "createdAt": "2026-07-01T10:00:00.000Z",
      "updatedAt": "2026-07-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

---

### 2.2 Create Vendor Category

Add a new vendor category.

| Property      | Value                    |
|---------------|--------------------------|
| **Method**    | `POST`                   |
| **URL**       | `/api/vendor-categories` |
| **Auth**      | Not required             |
| **Body Type** | `application/json`       |

#### Request Body

```json
{
  "category_name": "Fresh Vegetables",
  "description": "All kinds of fresh vegetables",
  "category_image": "https://example.com/vegetables.jpg",
  "cat_type_id": 1
}
```

#### Field Reference

| Field            | Type     | Required | Description                              |
|------------------|----------|----------|------------------------------------------|
| `category_name`  | `string` | **Yes**  | Name of the category                     |
| `description`    | `string` | No       | Brief description of the category        |
| `category_image` | `string` | No       | URL of the category image                |
| `cat_type_id`    | `number` | No       | Numeric type identifier for the category |

#### Response — 201 Created

```json
{
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0e1",
    "category_name": "Fresh Vegetables",
    "description": "All kinds of fresh vegetables",
    "category_image": "https://example.com/vegetables.jpg",
    "cat_type_id": 1,
    "createdAt": "2026-07-30T10:00:00.000Z",
    "updatedAt": "2026-07-30T10:00:00.000Z"
  }
}
```

---

### 2.3 Update Vendor Category

Partially update an existing vendor category.

| Property      | Value                         |
|---------------|-------------------------------|
| **Method**    | `PATCH`                       |
| **URL**       | `/api/vendor-categories/{id}` |
| **Auth**      | Not required                  |
| **Body Type** | `application/json`            |

#### Path Parameters

| Parameter | Type     | Description                          |
|-----------|----------|--------------------------------------|
| `id`      | `string` | MongoDB `_id` of the vendor category |

#### Request Body

```json
{
  "description": "Updated description for the category",
  "category_image": "https://example.com/new-image.jpg"
}
```

#### Response — 200 OK

```json
{
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0e1",
    "category_name": "Fresh Vegetables",
    "description": "Updated description for the category",
    "category_image": "https://example.com/new-image.jpg",
    "updatedAt": "2026-07-30T12:00:00.000Z"
  }
}
```

---

### 2.4 Delete Vendor Category

Permanently delete a vendor category by its ID.

| Property   | Value                         |
|------------|-------------------------------|
| **Method** | `DELETE`                      |
| **URL**    | `/api/vendor-categories/{id}` |
| **Auth**   | Not required                  |

#### Path Parameters

| Parameter | Type     | Description                          |
|-----------|----------|--------------------------------------|
| `id`      | `string` | MongoDB `_id` of the vendor category |

#### Response — 200 OK

```json
{ "success": true }
```

---

## 3. Vendors

**Base Path:** `/api/vendors`

Manages vendor accounts on the VegKing platform.

---

### 3.1 List Vendors

Fetch a paginated, optionally filtered list of vendors.

| Property   | Value          |
|------------|----------------|
| **Method** | `GET`          |
| **URL**    | `/api/vendors` |
| **Auth**   | Not required   |

#### Query Parameters

| Parameter | Type     | Default | Description                                                                  |
|-----------|----------|---------|------------------------------------------------------------------------------|
| `page`    | `number` | `1`     | Page number (1-indexed)                                                      |
| `limit`   | `number` | `10`    | Number of results per page                                                   |
| `search`  | `string` | `""`    | Case-insensitive search across `shop_name`, `full_name`, `mobile_number`     |

> **Note:** Returns projected fields only: `full_name`, `email`, `mobile_number`, `shop_name`, `city`, `is_verified`, `is_bestseller`, `wallet_balance`, `created_at`

#### Response — 200 OK

```json
{
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0f1",
      "full_name": "Ravi Kumar",
      "email": "ravi@example.com",
      "mobile_number": "9876543210",
      "shop_name": "Ravi's Fresh Mart",
      "city": "Bengaluru",
      "is_verified": "1",
      "is_bestseller": "0",
      "wallet_balance": 1500,
      "created_at": "2026-06-01T08:00:00.000Z"
    }
  ],
  "meta": {
    "total": 48,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### 3.2 Create Vendor

Register a new vendor on the platform.

| Property      | Value              |
|---------------|--------------------|
| **Method**    | `POST`             |
| **URL**       | `/api/vendors`     |
| **Auth**      | Not required       |
| **Body Type** | `application/json` |

#### Request Body

```json
{
  "full_name": "Ravi Kumar",
  "email": "ravi@example.com",
  "mobile_number": "9876543210",
  "password": "hashedpassword123",
  "shop_name": "Ravi's Fresh Mart",
  "shop_category": "Vegetables",
  "business_type": "Retail",
  "gst_number": "22AAAAA0000A1Z5",
  "pan_number": "AAAAA0000A",
  "licence_number": "LIC123456",
  "address": "123, MG Road",
  "country": "India",
  "state": "Karnataka",
  "city": "Bengaluru",
  "pincode": "560001",
  "landmark": "Near City Mall",
  "services_coverage": "5km",
  "shop_image": "https://example.com/shop.jpg",
  "aadhar_front": "https://example.com/aadhar-front.jpg",
  "aadhar_back": "https://example.com/aadhar-back.jpg",
  "gps_lat": "12.9716",
  "gps_long": "77.5946",
  "gps_location": "MG Road, Bengaluru",
  "handling_charge": 10,
  "gst_certificate": "https://example.com/gst-cert.pdf",
  "pan_card": "https://example.com/pan-card.jpg",
  "fiberbase_token": "fcm_token_here"
}
```

#### Field Reference

| Field               | Type     | Default | Description                                     |
|---------------------|----------|---------|-------------------------------------------------|
| `full_name`         | `string` | —       | Vendor's full legal name                        |
| `email`             | `string` | —       | Vendor's email address                          |
| `mobile_number`     | `string` | —       | Vendor's contact number                         |
| `password`          | `string` | —       | Account password (store hashed)                 |
| `shop_name`         | `string` | —       | Name of the vendor's shop                       |
| `shop_category`     | `string` | —       | Shop type (e.g. Vegetables, Fruits)             |
| `business_type`     | `string` | —       | Business type (e.g. Retail, Wholesale)          |
| `gst_number`        | `string` | —       | GST registration number                         |
| `pan_number`        | `string` | —       | Permanent Account Number                        |
| `licence_number`    | `string` | —       | Business / trade licence number                 |
| `address`           | `string` | —       | Full street address                             |
| `country`           | `string` | —       | Country                                         |
| `state`             | `string` | —       | State / province                                |
| `city`              | `string` | —       | City                                            |
| `pincode`           | `string` | —       | Postal / ZIP code                               |
| `landmark`          | `string` | —       | Nearby landmark                                 |
| `services_coverage` | `string` | —       | Delivery radius / coverage area                 |
| `shop_image`        | `string` | —       | URL of shop banner / logo image                 |
| `aadhar_front`      | `string` | —       | URL of Aadhaar card front image                 |
| `aadhar_back`       | `string` | —       | URL of Aadhaar card back image                  |
| `gps_lat`           | `string` | —       | GPS latitude of shop                            |
| `gps_long`          | `string` | —       | GPS longitude of shop                           |
| `gps_location`      | `string` | —       | Human-readable GPS address                      |
| `is_verified`       | `string` | `"0"`   | `"1"` = verified, `"0"` = not verified          |
| `is_bestseller`     | `string` | `"0"`   | `"1"` = bestseller, `"0"` = normal              |
| `wallet_balance`    | `number` | `0`     | Vendor wallet balance in ₹                      |
| `fiberbase_token`   | `string` | —       | Firebase Cloud Messaging push token             |
| `handling_charge`   | `number` | —       | Handling / packaging charge in ₹                |
| `gst_certificate`   | `string` | —       | URL of GST certificate document                 |
| `pan_card`          | `string` | —       | URL of PAN card image                           |

#### Response — 201 Created

```json
{
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0f1",
    "full_name": "Ravi Kumar",
    "shop_name": "Ravi's Fresh Mart",
    "is_verified": "0",
    "is_bestseller": "0",
    "wallet_balance": 0,
    "createdAt": "2026-07-30T10:00:00.000Z",
    "updatedAt": "2026-07-30T10:00:00.000Z"
  }
}
```

---

### 3.3 Get Vendor by ID

Retrieve the full profile of a single vendor.

| Property   | Value               |
|------------|---------------------|
| **Method** | `GET`               |
| **URL**    | `/api/vendors/{id}` |
| **Auth**   | Not required        |

#### Path Parameters

| Parameter | Type     | Description                 |
|-----------|----------|-----------------------------|
| `id`      | `string` | MongoDB `_id` of the vendor |

#### Response — 200 OK

Returns the **full** vendor document (all fields).

```json
{
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0f1",
    "full_name": "Ravi Kumar",
    "email": "ravi@example.com",
    "mobile_number": "9876543210",
    "shop_name": "Ravi's Fresh Mart",
    "shop_category": "Vegetables",
    "city": "Bengaluru",
    "state": "Karnataka",
    "is_verified": "1",
    "is_bestseller": "0",
    "wallet_balance": 1500,
    "createdAt": "2026-06-01T08:00:00.000Z",
    "updatedAt": "2026-07-30T10:00:00.000Z"
  }
}
```

#### Response — 404 Not Found

```json
{ "error": "Vendor not found" }
```

---

### 3.4 Update Vendor

Partially update a vendor's profile fields.

| Property      | Value               |
|---------------|---------------------|
| **Method**    | `PATCH`             |
| **URL**       | `/api/vendors/{id}` |
| **Auth**      | Not required        |
| **Body Type** | `application/json`  |

#### Path Parameters

| Parameter | Type     | Description                 |
|-----------|----------|-----------------------------|
| `id`      | `string` | MongoDB `_id` of the vendor |

#### Request Body

Send only the fields you want to update:

```json
{
  "is_verified": "1",
  "wallet_balance": 2000,
  "is_bestseller": "1"
}
```

#### Response — 200 OK

```json
{
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0f1",
    "full_name": "Ravi Kumar",
    "is_verified": "1",
    "wallet_balance": 2000,
    "is_bestseller": "1",
    "updatedAt": "2026-07-30T12:00:00.000Z"
  }
}
```

#### Response — 404 Not Found

```json
{ "error": "Vendor not found" }
```

---

### 3.5 Delete Vendor

Permanently delete a vendor account.

| Property   | Value               |
|------------|---------------------|
| **Method** | `DELETE`            |
| **URL**    | `/api/vendors/{id}` |
| **Auth**   | Not required        |

#### Path Parameters

| Parameter | Type     | Description                 |
|-----------|----------|-----------------------------|
| `id`      | `string` | MongoDB `_id` of the vendor |

#### Response — 200 OK

```json
{ "success": true }
```

---

## 4. Common Patterns

### Pagination

All list endpoints follow the same pagination shape:

| Query Param | Type     | Default   | Notes                               |
|-------------|----------|-----------|-------------------------------------|
| `page`      | `number` | `1`       | 1-indexed page number               |
| `limit`     | `number` | `10`/`20` | Items per page (varies by endpoint) |

**Response `meta` object:**

```json
{
  "meta": {
    "total": 100,
    "page": 2,
    "limit": 10,
    "totalPages": 10
  }
}
```

### Search

All list endpoints support case-insensitive, partial-match text search via the `search` query parameter:

| Endpoint                    | Searched Field(s)                          |
|-----------------------------|--------------------------------------------|
| `/api/vendor-add-products`  | `product_name`                             |
| `/api/vendor-categories`    | `category_name`                            |
| `/api/vendors`              | `shop_name`, `full_name`, `mobile_number`  |

### Sorting

All list results are sorted by `createdAt` in **descending order** (newest first).

### Error Responses

All endpoints return a consistent error structure:

| HTTP Status | When                                         |
|-------------|----------------------------------------------|
| `404`       | Resource not found (vendors endpoints only)  |
| `500`       | Unexpected server / database error           |

```json
{ "error": "Descriptive error message" }
```

---

## 5. Data Models

### VendorProduct

| Field                 | Type       | Required | Default |
|-----------------------|------------|----------|---------|
| `_id`                 | `ObjectId` | Auto     | —       |
| `vendor_id`           | `ObjectId` | No       | —       |
| `product_name`        | `string`   | **Yes**  | —       |
| `cat_type_id`         | `number`   | No       | —       |
| `category`            | `string`   | No       | —       |
| `subcategory`         | `string`   | No       | —       |
| `low_category`        | `string`   | No       | —       |
| `brand`               | `string`   | No       | —       |
| `product_label`       | `string`   | No       | —       |
| `quantity`            | `string`   | No       | —       |
| `volume`              | `string`   | No       | —       |
| `mrp`                 | `number`   | No       | —       |
| `selling_price`       | `number`   | No       | —       |
| `gst`                 | `number`   | No       | —       |
| `total_amt`           | `number`   | No       | —       |
| `product_description` | `string`   | No       | —       |
| `product_images`      | `string`   | No       | —       |
| `add_info_title`      | `string`   | No       | —       |
| `add_info_desc`       | `string`   | No       | —       |
| `stock_status`        | `string`   | No       | —       |
| `description`         | `string`   | No       | —       |
| `createdAt`           | `Date`     | Auto     | —       |
| `updatedAt`           | `Date`     | Auto     | —       |

---

### VendorCategory

| Field            | Type       | Required | Default |
|------------------|------------|----------|---------|
| `_id`            | `ObjectId` | Auto     | —       |
| `category_name`  | `string`   | **Yes**  | —       |
| `description`    | `string`   | No       | —       |
| `category_image` | `string`   | No       | —       |
| `cat_type_id`    | `number`   | No       | —       |
| `createdAt`      | `Date`     | Auto     | —       |
| `updatedAt`      | `Date`     | Auto     | —       |

---

### Vendor

| Field               | Type       | Required | Default |
|---------------------|------------|----------|---------|
| `_id`               | `ObjectId` | Auto     | —       |
| `full_name`         | `string`   | No       | —       |
| `email`             | `string`   | No       | —       |
| `mobile_number`     | `string`   | No       | —       |
| `password`          | `string`   | No       | —       |
| `shop_name`         | `string`   | No       | —       |
| `shop_category`     | `string`   | No       | —       |
| `business_type`     | `string`   | No       | —       |
| `gst_number`        | `string`   | No       | —       |
| `pan_number`        | `string`   | No       | —       |
| `licence_number`    | `string`   | No       | —       |
| `address`           | `string`   | No       | —       |
| `country`           | `string`   | No       | —       |
| `state`             | `string`   | No       | —       |
| `city`              | `string`   | No       | —       |
| `pincode`           | `string`   | No       | —       |
| `landmark`          | `string`   | No       | —       |
| `services_coverage` | `string`   | No       | —       |
| `shop_image`        | `string`   | No       | —       |
| `aadhar_front`      | `string`   | No       | —       |
| `aadhar_back`       | `string`   | No       | —       |
| `gps_lat`           | `string`   | No       | —       |
| `gps_long`          | `string`   | No       | —       |
| `gps_location`      | `string`   | No       | —       |
| `is_verified`       | `string`   | No       | `"0"`   |
| `is_bestseller`     | `string`   | No       | `"0"`   |
| `wallet_balance`    | `number`   | No       | `0`     |
| `fiberbase_token`   | `string`   | No       | —       |
| `handling_charge`   | `number`   | No       | —       |
| `gst_certificate`   | `string`   | No       | —       |
| `pan_card`          | `string`   | No       | —       |
| `createdAt`         | `Date`     | Auto     | —       |
| `updatedAt`         | `Date`     | Auto     | —       |

---

*Generated on 2026-07-30 · VegKing Backend*
