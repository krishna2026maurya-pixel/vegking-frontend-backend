# 🛒 VegKing - Complete Vendor cURL Commands Reference

Base IP Address: **`http://192.168.1.8:3000`**

This document contains ready-to-run, copy-pasteable `curl` commands for all **Vendor Endpoints** (Authentication, Profile, Live Dashboard, Products Inventory, Orders & Fulfillment, Delivery Fleet, Bulk Negotiations, and Notifications).

---

## 📑 Table of Contents
1. [Vendor Login (POST)](#1-vendor-login-post)
2. [Vendor Registration (POST)](#2-vendor-registration-post)
3. [Vendor Profile by Token / ID (GET)](#3-vendor-profile-by-token--id-get)
4. [Vendor Live Dashboard Statistics (GET)](#4-vendor-live-dashboard-statistics-get)
5. [Fetch Vendor Inventory Products (GET)](#5-fetch-vendor-inventory-products-get)
6. [Create New Product (POST)](#6-create-new-product-post)
7. [Update Product Details / Stock / Price (PATCH)](#7-update-product-details--stock--price-patch)
8. [Delete Product (DELETE)](#8-delete-product-delete)
9. [Fetch Product Categories (GET)](#9-fetch-product-categories-get)
10. [Fetch Vendor Orders (GET)](#10-fetch-vendor-orders-get)
11. [Update Order Status (PATCH)](#11-update-order-status-patch)
12. [Assign Delivery Rider to Order (POST)](#12-assign-delivery-rider-to-order-post)
13. [Delete / Cancel Order (DELETE)](#13-delete--cancel-order-delete)
14. [Fetch Delivery Boys Fleet (GET)](#14-fetch-delivery-boys-fleet-get)
15. [Add New Delivery Boy / Rider (POST)](#15-add-new-delivery-boy--rider-post)
16. [Update Delivery Boy Status / Details (PATCH)](#16-update-delivery-boy-status--details-patch)
17. [Delete Delivery Boy / Rider (DELETE)](#17-delete-delivery-boy--rider-delete)
18. [Fetch Wholesale Bulk Negotiations (GET)](#18-fetch-wholesale-bulk-negotiations-get)
19. [Send Counter Offer / Message on Deal (POST)](#19-send-counter-offer--message-on-deal-post)
20. [Accept Bulk Wholesale Deal (POST)](#20-accept-bulk-wholesale-deal-post)
21. [Reject Bulk Wholesale Deal (POST)](#21-reject-bulk-wholesale-deal-post)
22. [Fetch Vendor Notifications (GET)](#22-fetch-vendor-notifications-get)
23. [Mark Notification as Read (PATCH)](#23-mark-notification-as-read-patch)

---

### 1. Vendor Login (POST)
Authenticates the vendor using email and password, returning JWT bearer token and store profile.
```bash
curl.exe -X POST "http://192.168.1.8:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "anam@gmail.com",
    "password": "yourPassword123"
  }'
```

---

### 2. Vendor Registration (POST)
Registers a new merchant shop in the system.
```bash
curl.exe -X POST "http://192.168.1.8:3000/api/vendors" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Rohan Sharma",
    "shop_name": "Rohan Organic Farm",
    "email": "rohan@gmail.com",
    "mobile_number": "9876543210",
    "password": "VendorPassword@123",
    "pan_number": "ABCDE1234F",
    "licence_number": "FSSAI-8837192",
    "address": "Krishi Mandi Yard, Gate 2",
    "city": "Varanasi"
  }'
```

> 💡 **Important for Windows PowerShell Users**:
> In PowerShell, `curl` is an alias for `Invoke-WebRequest`. **Always use `curl.exe`** so Windows runs the real cURL utility!
> Example: `curl.exe -X GET "http://192.168.1.8:3000/api/vendor?vendor_id=6a97d4a37c073b4c01f89faf"`

---

### 3. Vendor Profile by Token / ID (GET)
Fetches vendor shop profile details using Bearer token or vendor ID.
```bash
# Option A: With Bearer Token
curl.exe -X GET "http://192.168.1.8:3000/api/vendor" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Option B: With Query Parameter (No token needed!)
curl.exe -X GET "http://192.168.1.8:3000/api/vendor?vendor_id=6a97d4a37c073b4c01f89faf"
```

---

### 4. Vendor Live Dashboard Statistics (GET)
Returns live counts of store products, total orders, pending orders, completed orders, lifetime revenue, and recent activity.
```bash
curl.exe -X GET "http://192.168.1.8:3000/api/v1/vendor/dashboard?vendor_id=6a97d4a37c073b4c01f89faf" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 5. Fetch Vendor Inventory Products (GET)
Retrieves the list of products uploaded by this vendor with search and pagination support.
```bash
curl.exe -X GET "http://192.168.1.8:3000/api/v1/products?vendor_id=6a97d4a37c073b4c01f89faf&limit=100&search=" \
  -H "Content-Type: application/json"
```

---

### 6. Create New Product (POST)
Adds a new vegetable, fruit, or grocery item into the vendor's catalog.
```bash
curl.exe -X POST "http://192.168.1.8:3000/api/v1/products" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Fresh Organic Spinach (Palak)",
    "category": "Vegetables",
    "selling_price": 30,
    "mrp": 40,
    "product_unit": "bunch",
    "stock_status": 50,
    "vendor_id": "6a97d4a37c073b4c01f89faf",
    "description": "Farm-fresh organic spinach harvested daily morning.",
    "product_image": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500",
    "is_active": "1"
  }'
```

---

### 7. Update Product Details / Stock / Price (PATCH)
Updates price, stock quantity, active status, or details for an existing product.
```bash
curl.exe -X PATCH "http://192.168.1.8:3000/api/v1/products/6a97fc96b7a493a9bb815340" \
  -H "Content-Type: application/json" \
  -d '{
    "selling_price": 28,
    "stock_status": 75,
    "is_active": "1"
  }'
```

---

### 8. Delete Product (DELETE)
Removes a produce item from the inventory.
```bash
curl.exe -X DELETE "http://192.168.1.8:3000/api/v1/products/6a97fc96b7a493a9bb815340"
```

---

### 9. Fetch Product Categories (GET)
Fetches all active marketplace categories (Vegetables, Fruits, Herbs, Organic, etc.).
```bash
curl.exe -X GET "http://192.168.1.8:3000/api/v1/categories"
```

---

### 10. Fetch Vendor Orders (GET)
Fetches customer orders containing items from this vendor, including customer details and delivery rider assignment.
```bash
curl.exe -X GET "http://192.168.1.8:3000/api/v1/orders?vendor_id=6a97d4a37c073b4c01f89faf&limit=50" \
  -H "Content-Type: application/json"
```

---

### 11. Update Order Status (PATCH)
Updates fulfillment status (`Accepted`, `Packing`, `Out for Delivery`, `Delivered`, `Cancelled`).
```bash
curl.exe -X PATCH "http://192.168.1.8:3000/api/v1/orders/6a76c321478020fbf77bd2be/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Packing"
  }'
```

---

### 12. Assign Delivery Rider to Order (POST)
Assigns an active delivery boy to deliver the specified order.
```bash
curl.exe -X POST "http://192.168.1.8:3000/api/v1/orders/6a76c321478020fbf77bd2be/assign" \
  -H "Content-Type: application/json" \
  -d '{
    "delivery_boy_id": "6a76c321478020fbf77bd28c"
  }'
```

---

### 13. Delete / Cancel Order (DELETE)
Removes an order and its associated order items from the system.
```bash
curl.exe -X DELETE "http://192.168.1.8:3000/api/v1/orders/6a76c321478020fbf77bd2be"
```

---

### 14. Fetch Delivery Boys Fleet (GET)
Lists all delivery boys registered for this vendor or across the fleet.
```bash
curl.exe -X GET "http://192.168.1.8:3000/api/v1/delivery-boys?vendor_id=6a97d4a37c073b4c01f89faf&limit=50"
```

---

### 15. Add New Delivery Boy / Rider (POST)
Adds a new delivery boy to the vendor's delivery fleet.
```bash
curl.exe -X POST "http://192.168.1.8:3000/api/v1/delivery-boys" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Suresh Patel",
    "mobile_number": "9812345678",
    "password": "RiderSecret@123",
    "vehicle_type": "Motorcycle",
    "vehicle_number": "UP65-BZ-9921",
    "vendor_id": "6a97d4a37c073b4c01f89faf",
    "is_active": "1",
    "is_verified": "1"
  }'
```

---

### 16. Update Delivery Boy Status / Details (PATCH)
Toggles rider active availability or updates details.
```bash
curl.exe -X PATCH "http://192.168.1.8:3000/api/v1/delivery-boys/6a76c321478020fbf77bd28c" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": "1"
  }'
```

---

### 17. Delete Delivery Boy / Rider (DELETE)
Removes a rider from the delivery fleet.
```bash
curl.exe -X DELETE "http://192.168.1.8:3000/api/v1/delivery-boys/6a76c321478020fbf77bd28c"
```

---

### 18. Fetch Wholesale Bulk Negotiations (GET)
Lists all customer inquiries and price negotiations for bulk produce (5kg+).
```bash
curl.exe -X GET "http://192.168.1.8:3000/api/negotiations?vendor_id=6a97d4a37c073b4c01f89faf"
```

---

### 19. Send Counter Offer / Message on Deal (POST)
Sends a counter offer or price message back to the customer on a bulk order negotiation.
```bash
curl.exe -X POST "http://192.168.1.8:3000/api/negotiations/6a96bcad77c46825c0a84c67/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "sender_id": "6a97d4a37c073b4c01f89faf",
    "sender_role": "vendor",
    "sender_name": "anamfarm",
    "message": "We can offer ₹19 per kg for a minimum order of 50kg.",
    "proposed_price": 19,
    "proposed_qty": 50,
    "offer_type": "COUNTER"
  }'
```

---

### 20. Accept Bulk Wholesale Deal (POST)
Accepts the agreed price with the customer, generating a checkout deal link.
```bash
curl.exe -X POST "http://192.168.1.8:3000/api/negotiations/6a96bcad77c46825c0a84c67/accept" \
  -H "Content-Type: application/json" \
  -d '{
    "sender_id": "6a97d4a37c073b4c01f89faf",
    "sender_role": "vendor"
  }'
```

---

### 21. Reject Bulk Wholesale Deal (POST)
Declines a bulk deal negotiation inquiry.
```bash
curl.exe -X POST "http://192.168.1.8:3000/api/negotiations/6a96bcad77c46825c0a84c67/reject" \
  -H "Content-Type: application/json" \
  -d '{
    "sender_id": "6a97d4a37c073b4c01f89faf",
    "sender_role": "vendor"
  }'
```

---

### 22. Fetch Vendor Notifications (GET)
Fetches orders, status changes, and system alerts for the vendor.
```bash
curl.exe -X GET "http://192.168.1.8:3000/api/vendor/notifications?vendor_id=6a97d4a37c073b4c01f89faf"
```

---

### 23. Mark Notification as Read (PATCH)
Marks an alert notification as read.
```bash
curl.exe -X PATCH "http://192.168.1.8:3000/api/vendor/notifications?notification_id=6a97ef127c073b4c01f89fd5"
```
