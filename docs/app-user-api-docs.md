# App User (Customer) API Documentation

This document outlines the API endpoints available for the end-user (customer) mobile app and frontend. All endpoints are prefixed with `/api/v1`.

Authentication is handled via JWT. Pass the token in the headers as:
`Authorization: Bearer <your_jwt_token>`

---

## 1. Authentication
* **POST `/api/v1/auth/login`**
  * **Description:** Login a user using phone number/email and password. Returns a JWT token.
* **POST `/api/v1/auth/register`**
  * **Description:** Register a new customer account.
* **POST `/api/v1/auth/verify-otp`**
  * **Description:** Verify phone number via OTP (if applicable).

## 2. User Profile & Addresses
* **GET `/api/v1/user/profile`**
  * **Description:** Fetch the logged-in user's profile details.
* **PUT `/api/v1/user/profile`**
  * **Description:** Update profile information (name, email).
* **GET `/api/v1/addresses`**
  * **Description:** List all saved delivery addresses for the user.
* **POST `/api/v1/addresses`**
  * **Description:** Add a new delivery address.
* **PUT `/api/v1/addresses/[id]`**
  * **Description:** Update an existing address.
* **DELETE `/api/v1/addresses/[id]`**
  * **Description:** Delete an address.

## 3. Catalog & Browsing
* **GET `/api/v1/banners`**
  * **Description:** Fetch homepage banners/promotions.
* **GET `/api/v1/category-types`**
  * **Description:** List top-level category types.
* **GET `/api/v1/categories`**
  * **Description:** List main categories (can be filtered by category-type).
* **GET `/api/v1/subcategories`**
  * **Description:** List subcategories under a specific category.
* **GET `/api/v1/hierarchy/explore`**
  * **Description:** Fetch an aggregated view of categories and subcategories for the explore page.
* **GET `/api/v1/products`**
  * **Description:** Fetch products (supports pagination `?page=1&limit=10`, searching `?search=term`, and filtering by `category_id`).
* **POST `/api/v1/products`**
  * **Description:** Fetch specific product details (often passing `product_id` in the body or form-data). Includes per-user flags like `is_in_cart` or `is_wishlist` if authenticated.

## 4. Cart & Checkout
* **GET `/api/v1/cart`**
  * **Description:** Fetch the user's current cart items, quantities, and pricing breakdown.
* **POST `/api/v1/cart`**
  * **Description:** Add an item to the cart or update its quantity.
* **DELETE `/api/v1/cart`**
  * **Description:** Remove a specific item from the cart or clear the cart.
* **GET `/api/v1/coupons`**
  * **Description:** List active coupons/promo codes available for the user.
* **POST `/api/v1/coupons/apply`**
  * **Description:** Apply a coupon to the current cart/checkout total.

## 5. Orders
* **POST `/api/v1/orders`**
  * **Description:** Place a new order using items in the cart and a selected address.
* **GET `/api/v1/orders`**
  * **Description:** List the user's order history.
* **GET `/api/v1/orders/[id]`**
  * **Description:** Get detailed information and status tracking for a specific order.

## 6. Wishlist
* **GET `/api/v1/wishlist`**
  * **Description:** List all products saved to the user's wishlist.
* **POST `/api/v1/wishlist`**
  * **Description:** Add or remove a product from the wishlist (toggle action).

---

## 7. Notifications & Firebase Integration

### 7.1 Verify OTP / Login
Verifies the client OTP or Firebase ID token, returns a JWT session token, and updates the device FCM token/details in the database.
* **Method**: `POST`
* **URL**: `/api/v1/auth/verify-otp`
* **Request Body**:
  ```json
  {
    "mobile_no": "9876543210",
    "otp": "1234",                                   // Mandatory if not using firebaseToken (Demo mode)
    "firebaseToken": "eyJhbGciOiJSUzI1NiIs...",      // Optional. Firebase Client SDK Auth ID Token (JWT)
    "fiberbase_token": "fcm_device_token_xyz...",    // Optional. Firebase FCM push token
    "device": "Samsung Galaxy S24 Ultra",            // Optional. Device model name
    "device_type": "android"                         // Optional. Platform: android | ios | web
  }
  ```

### 7.2 Get In-App Notifications
Fetches the active notifications log for the logged-in customer (e.g. order confirmation, shipment alerts, or admin announcements).
* **Method**: `GET`
* **URL**: `/api/v1/user/notifications`
* **Headers**: `Authorization: Bearer <USER_JWT_TOKEN>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "660c1ab2cd98ef1234567890",
        "userId": "660c1ab2cd98ef...",
        "title": "Order Confirmed",
        "message": "Your order #1002 has been accepted and confirmed by the vendor.",
        "type": "approved",
        "isRead": false,
        "createdAt": "2026-08-11T07:15:30.000Z"
      }
    ]
  }
  ```

### 7.3 Admin FCM Broadcast (Send to All)
Sends a push notification to all active device tokens (Users, Vendors, and Riders) using FCM multicast and creates in-app database notifications.
* **Method**: `POST`
* **URL**: `/api/admin/broadcast-notifications`
* **Headers**: `Authorization: Bearer <ADMIN_JWT_TOKEN>`
* **Request Body**:
  ```json
  {
    "title": "Mega Offer on VegKing!",
    "message": "Flat 20% off on all organic fruits today. Check it out!",
    "type": "broadcast",
    "data": {
      "screen": "offers_page",
      "click_action": "FLUTTER_NOTIFICATION_CLICK"
    }
  }
  ```
