# Rider (Delivery Boy) API Documentation

This document outlines the API endpoints available for managing and using the Rider (Delivery Boy) application. 

It is divided into three sections:
1. **Admin APIs:** For managing riders from the admin panel.
2. **Rider App APIs:** For the actual delivery boys to use in their mobile app (Auth, Profile, Orders).
3. **Real-time WebSockets:** For instant status updates.

---

## Part 1: Admin & Vendor APIs (Managing Delivery Boys)
**Base URL:** `/api/delivery-boys`

### 1.1 Get All Riders (with Pagination & Search)
- **Method:** `GET`
- **URL:** `/api/delivery-boys`
- **Query Parameters:** 
  - `page` (optional): Page number (default: `1`)
  - `limit` (optional): Limit per page (default: `10`)
  - `search` (optional): Search by name or mobile number
  - `vendor_id` (optional): Filter to only return riders belonging to a specific vendor
- **Response:** Paginated list of delivery boys, populating `vendor_id` (shop_name) details if associated.

### 1.2 Add New Rider
- **Method:** `POST`
- **URL:** `/api/delivery-boys`
- **Body:** 
```json
{
  "name": "Rider Name",
  "email": "rider@example.com",
  "mobile_number": "9876543210",
  "password": "securepassword",
  "vehicle_type": "Bike",
  "vehicle_number": "MH-12-AB-1234",
  "vendor_id": "64d..." // Optional: Vendor ID (leave null/omit for global admin riders)
}
```

### 1.3 Update Rider Details
- **Method:** `PATCH`
- **URL:** `/api/delivery-boys/:id`
- **Body:** `{ "status": 1, "is_active": "1" }`

### 1.4 Delete a Rider
- **Method:** `DELETE`
- **URL:** `/api/delivery-boys/:id`

---

## Part 2: Rider App APIs (For the Mobile App)
*(Note: These are the endpoints the Rider Mobile App will consume)*

**Base URL:** `/api/v1/rider`

### 2.1 Rider Authentication

#### Login
Authenticates the rider and returns a session token.
- **URL:** `/api/v1/rider/auth/login`
- **Method:** `POST`
- **Body:**
```json
{
  "mobile_number": "9876543210",
  "password": "securepassword123" 
}
```
- **Response (200 OK):**
```json
{
  "token": "jwt_or_session_token_here",
  "rider": {
    "_id": "64d...",
    "name": "John Doe",
    "mobile_number": "9876543210",
    "is_active": "1"
  }
}
```

### 2.2 Rider Profile Management

#### Get Profile
Fetches the logged-in rider's profile, including wallet balance.
- **URL:** `/api/v1/rider/profile`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "vehicle_type": "Bike",
    "vehicle_number": "DL 12 AB 3456",
    "is_active": "1",
    "wallet_balance": 500
  }
}
```

#### Update Live Location (Tracking)
Continuously called by the app to update the rider's current coordinates.
- **URL:** `/api/v1/rider/profile/location`
- **Method:** `PATCH`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "current_lat": "28.7041",
  "current_long": "77.1025"
}
```

#### Toggle Duty Status (Online/Offline)
Allows the rider to mark themselves as available or unavailable for new orders.
*(This action also emits a real-time socket event)*
- **URL:** `/api/v1/rider/profile/status`
- **Method:** `PATCH`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "is_active": "1" // "1" for Online, "0" for Offline
}
```

### 2.3 Rider Order Management

#### Get Assigned Orders
Fetches orders assigned specifically to this rider.
- **URL:** `/api/v1/rider/orders`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:** 
  - `status`: Filter by current status (e.g., `Out for Delivery`, `Delivered`).
- **Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "order_123",
      "order_number": "ORD-1785...",
      "shippingAddress": "123 Main St, City",
      "total_amount": 1250,
      "payment_method": "COD",
      "orderStatus": "Out for Delivery"
    }
  ]
}
```

#### Update Order Status
Updates the tracking status of the order (e.g., marking it as Delivered).
*(This action also emits a real-time socket event)*
- **URL:** `/api/v1/rider/orders/:order_id`
- **Method:** `PATCH`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "orderStatus": "Delivered",
  "status": 4
}
```

---

## Part 3: Real-Time Sockets (Socket.IO)

The backend runs a standalone **Socket.IO** server on port `3001` (by default) to broadcast real-time updates to connected clients (like the Admin panel or User App).

**Socket URL:** `http://localhost:3001` (or your production socket URL)

### 3.1 Connecting & Rooms
When a client connects to the socket, they should join specific "Rooms" depending on what data they want to listen to.

#### Joining a Room (Client-side Action)
To receive updates, the client must emit a `join-room` event immediately after connecting.
```javascript
// Example in React/JS
socket.emit("join-room", "admin"); // Join the admin room
// or
socket.emit("join-room", "order_123456789"); // Join a specific order's room
```

### 3.2 Available Events to Listen For

#### `rider-status-changed`
Fired when a delivery boy toggles their online/offline duty status. 
- **Broadcasted to:** `admin` room.
- **Payload:**
```json
{
  "rider_id": "64d...",
  "is_active": "1",
  "name": "John Doe"
}
```

#### `order-status-changed`
Fired whenever an order's status is changed (either by the Admin or the Delivery Boy).
- **Broadcasted to:** `admin` room AND the specific `order_[id]` room.
- **Payload:**
```json
{
  "order_id": "64e...",
  "order_number": "ORD-12345",
  "orderStatus": "Out for Delivery",
  "status": 3,
  "updatedBy": "64d...",
  "updatedByName": "John Doe"
}
```

### Example Frontend Code (React)
```javascript
import { useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", { transports: ["websocket"] });

function OrderTracking({ orderId }) {
  useEffect(() => {
    // 1. Join the specific order room
    socket.emit("join-room", `order_${orderId}`);

    // 2. Listen for status changes
    socket.on("order-status-changed", (data) => {
      console.log("Order status updated!", data.orderStatus);
    });

    // 3. Cleanup when component unmounts
    return () => {
      socket.emit("leave-room", `order_${orderId}`);
      socket.off("order-status-changed");
    };
  }, [orderId]);

  return <div>Tracking Order...</div>;
}
```
