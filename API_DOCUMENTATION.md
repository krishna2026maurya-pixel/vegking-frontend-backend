

# 🚀 VegKing / VegiMart Complete API Documentation

Comprehensive reference documentation for all API endpoints in the VegKing web & mobile application.

---

## 🌐 Base URL Configuration

The Base URL is separated so you can easily switch environments in tools like **Postman**, **Insomnia**, or **cURL**:

| Environment | Base URL |
| :--- | :--- |
| **Local Development** | `http://localhost:3000` (or `http://localhost:3001`) |
| **Vercel Production** | `https://your-domain.vercel.app` |
| **Environment Variable** | `{{BASE_URL}}` |

> [!NOTE]
> All endpoints below use the variable `{{BASE_URL}}`. Set `BASE_URL` in your API client environment.

---

## 📋 Table of Contents
1. [Authentication & Auth Provider](#1-authentication--auth-provider)
2. [Products & Produce Catalog](#2-products--produce-catalog)
3. [Wholesale Bulk Deals & Negotiations](#3-wholesale-bulk-deals--negotiations)
4. [Shopping Cart & Checkout Calculations](#4-shopping-cart--checkout-calculations)
5. [Orders, Payment & Live Tracking](#5-orders-payment--live-tracking)
6. [Categories, Subcategories & Hierarchy](#6-categories-subcategories--hierarchy)
7. [Vendor Portal & Inventory Management](#7-vendor-portal--inventory-management)
8. [Delivery Rider Fleet & Real-time Location](#8-delivery-rider-fleet--real-time-location)
9. [Customer Profiles, Addresses & Wallet](#9-customer-profiles-addresses--wallet)
10. [Subscriptions (Recurring Fresh Delivery)](#10-subscriptions-recurring-fresh-delivery)
11. [Discount Coupons & Wishlist](#11-discount-coupons--wishlist)
12. [Promotional Banners & Marketing](#12-promotional-banners--marketing)
13. [Admin Broadcasts & Notifications](#13-admin-broadcasts--notifications)
14. [Media Upload & Utilities](#14-media-upload--utilities)

---

## 1. Authentication & Auth Provider

### 1.1 Customer Registration
Register a new customer account with name, email, mobile number, and password.
* **URL:** `{{BASE_URL}}/api/auth/signup`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "name": "Aditya Kumar",
    "email": "aditya1@gmail.com",
    "password": "Password@123",
    "mobile_no": "9876543210"
  }
  ```
* **Response:** `201 Created`
  ```json
  { "success": true, "message": "User registered successfully." }
  ```

### 1.2 NextAuth Authentication (Customer, Vendor, Admin)
Unified NextAuth endpoint supporting multiple credential providers: `user-login`, `vendor`, and `admin-login`.
* **URL:** `{{BASE_URL}}/api/auth/[...nextauth]`
* **Method:** `POST`
* **Providers:**
  - **User Login (OTP)**: Provider `user-login` (credentials: `mobile_no`, `otp`)
  - **Vendor Login**: Provider `vendor` (credentials: `email`, `password`)
  - **Admin Login**: Provider `admin-login` (credentials: `email`, `password`)

### 1.3 Mobile App User & Vendor Login (JWT)
Direct JWT login for both mobile customer apps and vendor merchant apps.
* **URL:** `{{BASE_URL}}/api/v1/auth/login` (Also supports alias `{{BASE_URL}}/vendor/login` with JSON)
* **Method:** `POST`
* **Vendor Request Body:**
  ```json
  {
    "email": "anam@gmail.com",
    "password": "yourPassword123"
  }
  ```
* **Customer Request Body:**
  ```json
  {
    "mobile_no": "9876543210",
    "password": "yourPassword123"
  }
  ```
* **Vendor Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Vendor login successful.",
    "token": "eyJhbGciOi...",
    "role": "vendor",
    "user": {
      "id": "6a97d4a37c073b4c01f89faf",
      "vendor_id": "6a97d4a37c073b4c01f89faf",
      "name": "anam",
      "shop_name": "anamfarm",
      "email": "anam@gmail.com",
      "role": "vendor"
    }
  }
  ```

### 1.4 Mobile Send OTP
Sends an SMS / simulated OTP for mobile number verification.
* **URL:** `{{BASE_URL}}/api/v1/auth/send-otp`
* **Method:** `POST`
* **Request Body:** `{ "mobile_no": "9876543210" }`

### 1.5 Mobile Verify OTP
Verifies the OTP and issues a session token.
* **URL:** `{{BASE_URL}}/api/v1/auth/verify-otp`
* **Method:** `POST`
* **Request Body:** `{ "mobile_no": "9876543210", "otp": "1234" }`

### 1.6 Delivery Rider Login
Login endpoint specifically for delivery fleet riders.
* **URL:** `{{BASE_URL}}/api/v1/rider/auth/login`
* **Method:** `POST`
* **Request Body:** `{ "mobile_number": "9876543210", "password": "riderPassword" }`

---

## 2. Products & Produce Catalog

### 2.1 List Products (Search, Filter, Paginate)
Retrieve all retail & bulk produce with multi-parameter filtering.
* **URL:** `{{BASE_URL}}/api/products`
* **Method:** `GET`
* **Query Parameters:**
  - `page` *(optional, default 1)*
  - `limit` *(optional, default 50)*
  - `search` *(optional, text search across product names)*
  - `category` *(optional, category ObjectId)*
  - `vendor_id` *(optional, filter by specific vendor)*
  - `inStock` *(optional, boolean)*
* **Response:** `200 OK`

### 2.2 Create New Product
* **URL:** `{{BASE_URL}}/api/products`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "product_name": "Organic Tomatoes",
    "category_id": "6a71fc8b07106e7f44da1f59",
    "selling_price": 40,
    "mrp": 50,
    "product_unit": "kg",
    "stock": 50,
    "images": ["https://res.cloudinary.com/.../tomato.jpg"],
    "is_bulk": false
  }
  ```

### 2.3 Single Product Details
* **URL:** `{{BASE_URL}}/api/products/:id`
* **Method:** `GET` | `PATCH` | `DELETE`

### 2.4 Mobile Featured Products
* **URL:** `{{BASE_URL}}/api/v1/products/featured`
* **Method:** `GET`

---

## 3. Wholesale Bulk Deals & Negotiations

### 3.1 List Bulk Negotiations
List open, countered, accepted, or completed bulk wholesale deal negotiations.
* **URL:** `{{BASE_URL}}/api/negotiations`
* **Method:** `GET`
* **Query Parameters:** `user_id`, `vendor_id`, `status`

### 3.2 Initiate Bulk Deal Negotiation (Min 5kg)
Buyers can initiate wholesale bulk price negotiation directly with produce vendors.
* **URL:** `{{BASE_URL}}/api/negotiations`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "product_id": "6a71fc8b07106e7f44da1f59",
    "user_id": "6a97c6c4ae23b625b06e86de",
    "requested_qty": 20,
    "initial_offer_price": 32,
    "customer_name": "Aditya",
    "customer_mobile": "9876543210",
    "note": "Looking to buy 20kg bulk tomatoes weekly."
  }
  ```

### 3.3 Negotiation Thread & Message History
* **URL:** `{{BASE_URL}}/api/negotiations/:id`
* **Method:** `GET`

### 3.4 Send Counter Offer or Chat
* **URL:** `{{BASE_URL}}/api/negotiations/:id/messages`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "sender_id": "6a97cfb87c073b4c01f89fae",
    "sender_role": "vendor",
    "sender_name": "Aditya Mart",
    "message": "We can offer ₹35/kg for 20kg.",
    "proposed_price": 35,
    "proposed_qty": 20,
    "offer_type": "COUNTER"
  }
  ```

### 3.5 Accept Negotiation Offer
Vendor or customer accepts the price. Generates a secure `deal_token` to lock into cart.
* **URL:** `{{BASE_URL}}/api/negotiations/:id/accept`
* **Method:** `POST`

### 3.6 Reject Negotiation Offer
* **URL:** `{{BASE_URL}}/api/negotiations/:id/reject`
* **Method:** `POST`

---

## 4. Shopping Cart & Checkout Calculations

### 4.1 Get Cart & Subtotals
Returns items with automatic calculation: **Orders < ₹199 charge ₹40 delivery; Orders ≥ ₹199 get FREE delivery**.
* **URL:** `{{BASE_URL}}/api/v1/cart`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <token>` or Session cookie

### 4.2 Add Produce to Cart
Supports standard retail items or negotiated bulk wholesale deals with `deal_token`.
* **URL:** `{{BASE_URL}}/api/v1/cart/add`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "product_id": "6a71fc8b07106e7f44da1f59",
    "quantity": 2,
    "deal_token": null
  }
  ```

### 4.3 Update Item Quantity
* **URL:** `{{BASE_URL}}/api/v1/cart/update`
* **Method:** `PUT`
* **Request Body:** `{ "product_id": "...", "quantity": 3 }`

### 4.4 Remove Item from Cart
* **URL:** `{{BASE_URL}}/api/v1/cart/remove`
* **Method:** `POST`

### 4.5 Clear Cart
* **URL:** `{{BASE_URL}}/api/v1/cart/clear`
* **Method:** `DELETE`

---

## 5. Orders, Payment & Live Tracking

### 5.1 List Orders (Paginated & Filterable)
* **URL:** `{{BASE_URL}}/api/orders`
* **Method:** `GET`
* **Query Parameters:**
  - `page`: Page index (default: 1)
  - `limit`: Items per page (default: 50)
  - `search`: Search by order ID or phone
  - `status`: Filter by status string (`Order Placed`, `Packing`, `Out for Delivery`, `Delivered`, `Cancelled`)

### 5.2 Place Order (Cash on Delivery)
* **URL:** `{{BASE_URL}}/api/orders`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "items": [
      {
        "productId": "6a71fc8b07106e7f44da1f59",
        "name": "Hybrid Tomato",
        "price": 43,
        "quantity": 1,
        "image": "https://...",
        "is_bulk_deal": false
      }
    ],
    "totalAmount": 83,
    "delivery_charge": 40,
    "shippingAddress": "Plot 42, Sector 5, Varanasi"
  }
  ```

### 5.3 Initiate Online Payment (Razorpay Order)
Creates a cryptographically signed Razorpay Order.
* **URL:** `{{BASE_URL}}/api/orders/create-payment`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "items": [...],
    "totalAmount": 250,
    "delivery_charge": 0,
    "shippingAddress": "..."
  }
  ```

### 5.4 Verify Online Payment Signature
Verifies SHA256 HMAC signature received from Razorpay Checkout webhook/callback.
* **URL:** `{{BASE_URL}}/api/orders/verify-payment`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "orderId": "...",
    "razorpay_order_id": "order_EK123...",
    "razorpay_payment_id": "pay_EK123...",
    "razorpay_signature": "5d2e..."
  }
  ```

### 5.5 Order Tracking Status
* **URL:** `{{BASE_URL}}/api/orders/track`
* **Method:** `POST`
* **Request Body:** `{ "order_number": "ORD-1788324852754" }`

### 5.6 Verify Delivery OTP
Delivery rider submits the customer's 4-digit OTP to confirm hand-off and complete the order.
* **URL:** `{{BASE_URL}}/api/orders/verify-delivery-otp`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "orderId": "6a97e99d7c073b4c01f89fc0",
    "delivery_otp": "8127"
  }
  ```

---

## 6. Categories, Subcategories & Hierarchy

### 6.1 List & Create Categories
* **URL:** `{{BASE_URL}}/api/categories`
* **Method:** `GET` | `POST`

### 6.2 Manage Category by ID
* **URL:** `{{BASE_URL}}/api/categories/:id`
* **Method:** `GET` | `PATCH` | `DELETE`

### 6.3 Category Types
* **URL:** `{{BASE_URL}}/api/category-types`
* **Method:** `GET` | `POST`

### 6.4 Subcategories
* **URL:** `{{BASE_URL}}/api/subcategories`
* **Method:** `GET` | `POST`

### 6.5 Category Hierarchy Explorer (Mobile)
* **URL:** `{{BASE_URL}}/api/v1/hierarchy/explore`
* **Method:** `GET` | `POST`

---

## 7. Vendor Portal & Inventory Management

### 7.1 Vendor Registration & Listing
* **URL:** `{{BASE_URL}}/api/vendors`
* **Method:** `GET` (list approved vendors) | `POST` (register vendor application)
* **Request Body (Register):**
  ```json
  {
    "full_name": "Aditya Kumar",
    "shop_name": "Aditya Mart",
    "email": "aditya1@gmail.com",
    "mobile_number": "9876543210",
    "password": "VendorPassword123",
    "pan_number": "ABCDE1234F",
    "licence_number": "FSSAI-123456",
    "address": "Warehouse 4, Krishi Mandi",
    "city": "Varanasi"
  }
  ```

### 7.2 Vendor Profile & Approval Status
* **URL:** `{{BASE_URL}}/api/vendors/:id`
* **Method:** `GET` | `PATCH` | `DELETE`

### 7.3 Vendor Products (Merchant Catalog)
Vendors can add, edit, or adjust produce stock and wholesale thresholds.
* **URL:** `{{BASE_URL}}/api/vendor-add-products`
* **Method:** `GET` | `POST`
* **URL:** `{{BASE_URL}}/api/vendor-add-products/:id`
* **Method:** `PATCH` | `DELETE`

### 7.4 Vendor Notifications
* **URL:** `{{BASE_URL}}/api/vendor/notifications`
* **Method:** `GET` | `PATCH` (mark read)

---

## 8. Delivery Rider Fleet & Real-time Location

### 8.1 Rider Fleet Management (Admin)
* **URL:** `{{BASE_URL}}/api/delivery-boys`
* **Method:** `GET` | `POST`
* **URL:** `{{BASE_URL}}/api/delivery-boys/:id`
* **Method:** `PATCH` | `DELETE`

### 8.2 Rider Active Orders
List orders assigned to the logged-in delivery rider.
* **URL:** `{{BASE_URL}}/api/v1/rider/orders`
* **Method:** `GET`

### 8.3 Rider Update Order Status
Change status to `Out for Delivery` or mark `Delivered`.
* **URL:** `{{BASE_URL}}/api/v1/rider/orders/:order_id`
* **Method:** `PATCH`
* **Request Body:** `{ "status": "Out for Delivery" }`

### 8.4 Real-time GPS Location Broadcast
Rider app pings live latitude/longitude for customer map tracking.
* **URL:** `{{BASE_URL}}/api/v1/rider/profile/location`
* **Method:** `PATCH`
* **Request Body:** `{ "latitude": 25.3176, "longitude": 82.9739 }`

### 8.5 Toggle Rider Availability Status
* **URL:** `{{BASE_URL}}/api/v1/rider/profile/status`
* **Method:** `PATCH`
* **Request Body:** `{ "is_online": true }`

---

## 9. Customer Profiles, Addresses & Wallet

### 9.1 Get / Update Current Customer Profile
* **URL:** `{{BASE_URL}}/api/user/me`
* **Method:** `GET` | `PATCH`

### 9.2 Address Book Management
* **URL:** `{{BASE_URL}}/api/user/addresses`
* **Method:** `GET` | `POST` | `PUT` | `DELETE`
* **Request Body (Add):**
  ```json
  {
    "name": "Home",
    "address": "B-12, Green Park Avenue",
    "city": "Varanasi",
    "pincode": "221002",
    "is_default": true
  }
  ```

### 9.3 Set Default Address (Mobile)
* **URL:** `{{BASE_URL}}/api/v1/addresses/:id/default`
* **Method:** `PATCH`

### 9.4 Customer Wallet & Transactions
* **URL:** `{{BASE_URL}}/api/v1/user/wallet`
* **Method:** `GET`

---

## 10. Subscriptions (Recurring Fresh Delivery)

### 10.1 Create Recurring Produce Subscription
Subscribe to automated fresh delivery (e.g. 2kg carrots every Monday or 1st of month).
* **URL:** `{{BASE_URL}}/api/subscription/create`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "productId": "6a71fc8b07106e7f44da1f59",
    "quantity": 2,
    "frequency": "weekly",
    "deliveryDate": "Monday",
    "shippingAddress": "..."
  }
  ```

### 10.2 User Active Subscriptions
* **URL:** `{{BASE_URL}}/api/subscription/user`
* **Method:** `GET`

### 10.3 Modify Subscription Schedule & Quantity
* **URL:** `{{BASE_URL}}/api/subscription/update`
* **Method:** `PATCH`

### 10.4 Pause / Resume / Cancel Subscription
* **URL:** `{{BASE_URL}}/api/subscription/status`
* **Method:** `PATCH`
* **Request Body:** `{ "subscriptionId": "...", "status": "paused" }`

---

## 11. Discount Coupons & Wishlist

### 11.1 List & Create Coupons
* **URL:** `{{BASE_URL}}/api/coupons`
* **Method:** `GET` | `POST`
* **URL:** `{{BASE_URL}}/api/coupons/:id`
* **Method:** `PATCH` | `DELETE`

### 11.2 Apply Coupon to Cart
Validates expiry, minimum cart value, and returns exact rupee discount.
* **URL:** `{{BASE_URL}}/api/v1/coupons/apply`
* **Method:** `POST`
* **Request Body:** `{ "coupon_code": "FRESH50", "cart_total": 400 }`

### 11.3 Wishlist / Saved Items
* **URL:** `{{BASE_URL}}/api/wishlist`
* **Method:** `GET` | `POST`
* **URL:** `{{BASE_URL}}/api/wishlist/:productId`
* **Method:** `DELETE`

---

## 12. Promotional Banners & Marketing

### 12.1 Get & Create Hero Banners
* **URL:** `{{BASE_URL}}/api/banners`
* **Method:** `GET` | `POST`
* **URL:** `{{BASE_URL}}/api/banners/:id`
* **Method:** `GET` | `PATCH` | `DELETE`

### 12.2 Mobile Home Banners
* **URL:** `{{BASE_URL}}/api/v1/banners`
* **Method:** `GET`

---

## 13. Admin Broadcasts & Notifications

### 13.1 Broadcast Push Notification to Users / Riders
Sends instant Firebase Cloud Messaging (FCM) push alerts.
* **URL:** `{{BASE_URL}}/api/admin/broadcast-notifications`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "title": "Fresh Farm Harvest Alert 🍅",
    "message": "Fresh organic farm produce just arrived. Enjoy free delivery on orders above ₹199!",
    "target": "all"
  }
  ```

### 13.2 System Notifications
* **URL:** `{{BASE_URL}}/api/notifications`
* **Method:** `GET` | `PATCH`

---

## 14. Media Upload & Utilities

### 14.1 Cloudinary Media Upload
Upload images for products, shop banners, documents, and produce images.
* **URL:** `{{BASE_URL}}/api/upload`
* **Method:** `POST`
* **Content-Type:** `multipart/form-data`
* **Body Form Field:** `file: <Binary Image File>`
* **Response:** `{ "url": "https://res.cloudinary.com/...", "public_id": "..." }`

### 14.2 Database Seeder
* **URL:** `{{BASE_URL}}/api/seed/all`
* **Method:** `POST`
