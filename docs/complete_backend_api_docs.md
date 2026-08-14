# VegKing Complete Backend API Documentation
> **Base URL:** `http://localhost:3000` (Local) / `/api`  
> **Format:** All requests and responses use `application/json` content type.

---

## 1. Authentication Endpoints

### 1.1 Vendor NextAuth Sign-In (Credentials Flow)
Authenticates a vendor via NextAuth, which sets the session cookie.
* **Method**: `POST`
* **URL**: `/api/auth/callback/vendor`
* **Headers**: 
  - `Content-Type: application/json`
  - `Cookie: next-auth.csrf-token=<TOKEN_HASH>`
* **Request Body**:
  ```json
  {
    "email": "vendor1@vegking.com",
    "password": "123456",
    "csrfToken": "e7fc192736f253a237d1555182e1f21a4f93445152d6e259be53b34be063fc60",
    "json": "true"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "url": "http://localhost:3000"
  }
  ```
  *(Returns `next-auth.session-token` in `Set-Cookie` header)*
* **Error Response (401 Unauthorized)**:
  ```json
  {
    "error": "Invalid credentials"
  }
  ```

---

### 1.2 Get NextAuth CSRF Token
Fetches the active CSRF token required for credentials login.
* **Method**: `GET`
* **URL**: `/api/auth/csrf`
* **Response (200 OK)**:
  ```json
  {
    "csrfToken": "e7fc192736f253a237d1555182e1f21a4f93445152d6e259be53b34be063fc60"
  }
  ```
  *(Returns `next-auth.csrf-token` in `Set-Cookie` header)*

---

### 1.3 User Credentials Login (JWT Flow)
Logs in a customer via custom mobile credentials.
* **Method**: `POST`
* **URL**: `/api/v1/auth/login`
* **Request Body**:
  ```json
  {
    "mobile_no": "9999999999",
    "password": "userpassword123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "message": "Login successful.",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "660c1ab2cd98ef...",
      "name": "Rajesh Kumar",
      "mobile_no": "9999999999",
      "email": "customer@gmail.com",
      "wallet_balance": 150
    }
  }
  ```

---

### 1.4 Retrieve User Profile
Fetches profile details of the logged-in customer (including their dynamic delivery verification OTP).
* **Method**: `GET`
* **URL**: `/api/v1/user/profile`
* **Headers**: `Authorization: Bearer <USER_JWT_TOKEN>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "660c1ab2cd98ef...",
      "name": "Rajesh Kumar",
      "mobile_no": "9999999999",
      "delivery_otp": "5834",
      "wallet_balance": 150
    }
  }
  ```

---

## 2. Order Management Endpoints

### 2.1 Get All Orders (Filtered & Paginated)
Fetches orders registered on the server.
* **Method**: `GET`
* **URL**: `/api/orders`
* **Query Params**:
  - `page`: Page number (default: `1`)
  - `limit`: Items per page (default: `10`)
  - `search`: Search order number
  - `vendor_id`: Filter orders by vendor
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "65b9a8bcde1234567890abcd",
        "order_number": "ORD-123456",
        "user_id": { "_id": "65b9a8bcde12345678901111", "name": "Rajesh Kumar" },
        "delivery_boy_id": { "_id": "65b9a8bcde12345678909999", "name": "Rider Kumar" },
        "total_amount": 750,
        "payment_method": "COD",
        "payment_status": "pending",
        "orderStatus": "Accepted",
        "status": 1
      }
    ],
    "meta": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
  }
  ```

---

### 2.2 Get Single Order Details
Fetches full details of a specific order including items.
* **Method**: `GET`
* **URL**: `/api/orders/[id]`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "65b9a8bcde1234567890abcd",
      "order_number": "ORD-123456",
      "user_id": { "_id": "65b9a8bcde12345678901111", "name": "Rajesh" },
      "delivery_boy_id": { "_id": "65b9a8bcde12345678909999", "name": "Rider Kumar" },
      "total_amount": 750,
      "payment_method": "COD",
      "orderStatus": "Accepted",
      "populatedItems": [
        { "_id": "item1", "product_name": "Organic Spinach", "price": 40, "qty": 2 }
      ]
    }
  }
  ```

---

### 2.3 Update Order (Assign Rider, Change Status, or OTP Bypass)
Updates order properties. Requires OTP validation if marking an order as `Delivered`.
* **Method**: `PATCH`
* **URL**: `/api/orders/[id]`
* **Request Body (Assign Rider)**:
  ```json
  {
    "delivery_boy_id": "65b9a8bcde12345678909999"
  }
  ```
* **Request Body (Status Update to Confirmed/Packing)**:
  ```json
  {
    "orderStatus": "Packing",
    "status": 2
  }
  ```
* **Request Body (Delivered with Customer OTP Bypass)**:
  ```json
  {
    "orderStatus": "Delivered",
    "status": 4,
    "otp": "5834"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "65b9a8bcde1234567890abcd",
      "orderStatus": "Delivered",
      "status": 4
    }
  }
  ```
* **Error Response (400 Bad Request)**:
  ```json
  {
    "success": false,
    "error": "Invalid Delivery OTP."
  }
  ```

---

### 2.4 Delete Order
Deletes an order document.
* **Method**: `DELETE`
* **URL**: `/api/orders/[id]`
* **Response (200 OK)**:
  ```json
  {
    "success": true
  }
  ```

---

## 3. Rider Dedicated Endpoints

### 3.1 Get Rider's Assigned Orders
Lists orders assigned to the logged-in rider.
* **Method**: `GET`
* **URL**: `/api/v1/rider/orders`
* **Headers**: `Authorization: Bearer <RIDER_JWT_TOKEN>`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "65b9a8bcde1234567890abcd",
        "order_number": "ORD-123456",
        "total_amount": 750,
        "orderStatus": "Out for Delivery",
        "status": 3
      }
    ]
  }
  ```

---

### 3.2 Rider Complete Order (OTP Verification)
Rider submits the customer's 4-digit verification code to complete delivery.
* **Method**: `PATCH`
* **URL**: `/api/v1/rider/orders/[order_id]`
* **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer <RIDER_JWT_TOKEN>`
* **Request Body**:
  ```json
  {
    "orderStatus": "Delivered",
    "status": 4,
    "otp": "5834"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Order delivered successfully."
  }
  ```

---

## 4. Delivery Boys Management

### 4.1 Get Delivery Boys
* **Method**: `GET`
* **URL**: `/api/delivery-boys`
* **Query Params**: `vendor_id=<ID>&limit=100`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "65b9a8bcde12345678909999",
        "name": "Rider Kumar",
        "mobile_number": "9812345678",
        "vehicle_type": "Bike",
        "is_active": "1",
        "vendor_id": "65b9a8bcde1234567890aaaa"
      }
    ]
  }
  ```

---

## 5. Testing Credentials Sign-in with `curl`

To authenticate `vendor1@vegking.com` (password `123456`) from a terminal shell, use the following sequence of commands. NextAuth requires capturing cookies and forwarding the CSRF token.

### Step 1: Request CSRF Token
Fetch the CSRF token and save the response cookies to `cookies.txt`:
```bash
curl -s -c cookies.txt "http://localhost:3000/api/auth/csrf"
```
*(This outputs: `{"csrfToken":"YOUR_TOKEN_HERE"}`)*

### Step 2: Post Credentials
Extract your token from the previous output and run the login callback, loading cookies from `cookies.txt`:
```bash
curl -i -X POST \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "vendor1@vegking.com",
    "password": "123456",
    "csrfToken": "YOUR_TOKEN_HERE",
    "json": "true"
  }' \
  "http://localhost:3000/api/auth/callback/vendor"
```

#### Expected Response Headers & JSON
```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: next-auth.session-token=eyJhbGciOiJkaXIiLCJl...; Path=/; HttpOnly; SameSite=Lax

{
  "url": "http://localhost:3000"
}
```

---

## 6. Notifications & Firebase Integration

### 6.1 Get In-App Notifications
Fetches the active notifications inbox for the logged-in customer (e.g. order confirmation, shipment alerts, or admin announcements).
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

---

### 6.2 Admin FCM Broadcast
Sends a push notification to all active device tokens (Users, Vendors, and Riders) using Firebase FCM multicast and creates in-app database notifications.
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
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Successfully broadcasted message to 12 devices.",
    "successCount": 12,
    "failureCount": 0
  }
  ```

