# VegKing - System Credentials, Database Connection & Testing Guide

This document contains all the essential credentials, database connection strings, portal URLs, and step-by-step testing instructions for **VegKing**. You can copy and paste this entire document directly into Google Docs.

---

## 1. MongoDB Database Connection

| Detail | Value |
|---|---|
| **Database Type** | MongoDB Atlas (Cloud Replica Set) |
| **Database Name** | `vegking` |
| **Database Username** | `deep2026u_db_user` |
| **Database Password** | `deep2026` |
| **Authentication DB** | `admin` |
| **SSL / TLS** | Enabled (`ssl=true`) |

### MongoDB Connection URI
```text
mongodb://deep2026u_db_user:deep2026@ac-oxpfifv-shard-00-00.zf4subp.mongodb.net:27017,ac-oxpfifv-shard-00-01.zf4subp.mongodb.net:27017,ac-oxpfifv-shard-00-02.zf4subp.mongodb.net:27017/vegking?ssl=true&replicaSet=atlas-uteeni-shard-0&authSource=admin&retryWrites=true&w=majority
```

> **How to Connect in MongoDB Compass**:
> 1. Open MongoDB Compass.
> 2. Paste the Connection URI above into the connection bar.
> 3. Click **Connect**.
> 4. You will see all 15 collections: `products`, `orders`, `vendors`, `users`, `deliveryboys`, `categories`, `subcategories`, `categorytypes`, `brands`, `coupons`, `orderitems`, `addresses`, `carts`, `banners`, and `notifications`.

---

## 2. Portals & Login Credentials

### A. Admin Portal
Use this account to manage all products, inventory, vendor approvals, customer orders, riders, and view live dashboard analytics.

| Field | Detail |
|---|---|
| **Login URL** | `http://localhost:3000/admin-login` (or `/admin`) |
| **Email** | `admin@vegking.com` |
| **Password** | `admin123` |
| **Role** | Super Administrator |

#### Admin Features to Test:
- **Dashboard**: Real-time DB date & time, sales metrics, live order stream.
- **Products**: View 71+ in-stock products, edit pricing/stock, add new products.
- **Vendors**: View 20 verified vendors, toggle verification, edit details, "+ New Vendor".
- **Orders**: View customer orders, update order status (`Placed`, `Out for Delivery`, `Delivered`).
- **Delivery Boys**: View and manage riders and their vehicles.

---

### B. Vendor Portal
Use these accounts to test the vendor shop management, viewing sales, managing vendor products, and tracking orders.

| Field | Primary Vendor Account | Alternative Vendor Account |
|---|---|---|
| **Vendor Name** | Rahul Kumar | Amit Sharma |
| **Shop Name** | Fresh Farm Mart | Green Grocers |
| **Login URL** | `http://localhost:3000/vendor/login` | `http://localhost:3000/vendor/login` |
| **Email** | `vendor1@vegking.com` | `vendor2@vegking.com` |
| **Mobile Number** | `9850295177` | `9828390034` |
| **Password** | `password123` | `password123` |
| **Status** | Verified (`1`) | Verified (`1`) |
| **Initial Wallet** | ₹4,435.74 | ₹1,902.45 |

*Note: You can also register a new vendor via the **"+ New Vendor"** button in Admin (`/admin/vendors/create`) or the vendor signup page (`/vendor/register`).*

---

### C. Delivery Boy / Rider Portal & API
Use these accounts to test rider order assignments, delivery tracking, and status updates.

| Field | Rider #1 | Rider #2 | Rider #3 |
|---|---|---|---|
| **Name** | Delivery Rahul Kumar | Delivery Amit Sharma | Delivery Priya Singh |
| **Mobile Number** | `9636886852` | `9635733245` | `9697740810` |
| **Email** | `delivery1@vegking.com` | `delivery2@vegking.com` | `delivery3@vegking.com` |
| **Password** | `password123` | `password123` | `password123` |
| **Vehicle** | Bike (`MH95-NE-3211`) | Bike (`MH16-NT-9300`) | Scooter (`MH40-JO-2099`) |
| **Status** | Active (`1`), Verified (`1`) | Active (`1`), Verified (`1`) | Active (`1`), Verified (`1`) |

#### Rider API Endpoints:
- **Login**: `POST /api/v1/rider/auth/login`  
  `Payload:` `{ "mobile_number": "9636886852", "password": "password123" }`
- **Dashboard & Orders**: `GET /api/v1/delivery_boy/dashboard`
- **Update Status**: `POST /api/v1/delivery_boy/update_status`

---

### D. Customer / User Accounts
Use these accounts to test browsing vegetables & fruits, adding to cart, entering delivery address, applying coupons, and placing orders.

| Field | Customer #1 (Default) | Customer #2 | Customer #3 |
|---|---|---|---|
| **Name** | Krishna Kumar | Rahul Kumar | Amit Sharma |
| **Mobile Number** | `9999999999` | `9789055019` | `9736888395` |
| **Email** | `krishna@vegking.com` | `user1@gmail.com` | `user2@gmail.com` |
| **Password** | `123456` | `123456` | `123456` |
| **OTP (Testing)** | `1234` | `1234` | `1234` |
| **City** | Mumbai | Lucknow | Pune |
| **Wallet Balance** | ₹1,000.00 | ₹450.00 | ₹320.00 |

#### Customer Portal URLs:
- **Homepage Store**: `http://localhost:3000`
- **Login / Signup**: `http://localhost:3000/login`
- **Cart**: `http://localhost:3000/cart`
- **Checkout**: `http://localhost:3000/checkout`
- **Order History**: `http://localhost:3000/orders`

---

## 3. Sample In-Stock Products to Test

All 71 products in the database currently have verified positive stock (`15` to `60` units available).

| Product Name | Category | Selling Price | MRP | Available Stock | Stock Status |
|---|---|---|---|---|---|
| **Carrot (Gajar)** | Root Vegetables | ₹32 | ₹40 | 42 units | In Stock |
| **Potato (Bateta)** | Root Vegetables | ₹28 | ₹34 | 38 units | In Stock |
| **Green Cucumber (Kakdi)** | Root Vegetables | ₹43 | ₹54 | 20 units | In Stock |
| **Cabbage (Kobi)** | Leafy Greens | ₹24 | ₹30 | 32 units | In Stock |
| **Capsicum (Simla Marcha)** | Vegetables | ₹28 | ₹35 | 49 units | In Stock |
| **Onion (Dungdi)** | Root Vegetables | ₹37 | ₹43 | 54 units | In Stock |
| **Broccoli** | Exotic Vegetables | ₹65 | ₹80 | 25 units | In Stock |
| **Apple (Safarchand)** | Fruits | ₹180 | ₹220 | 30 units | In Stock |
| **Fresh Full Cream Milk** | Dairy & Eggs | ₹58 | ₹65 | 40 units | In Stock |
| **Arhar Dal (Toor Dal)** | Organic Daals | ₹140 | ₹165 | 35 units | In Stock |

---

## 4. Step-by-Step Client Testing Flow

Follow these quick test steps to confirm everything is working end-to-end:

### Test 1: Customer Order Placement
1. Navigate to `http://localhost:3000/`.
2. Browse products under **Fresh Vegetables**, **Fruits**, or **Dairy**.
3. Notice all products have the green **"In Stock"** badge and active **"Add to Cart"** button.
4. Add 2–3 products to your cart and go to `http://localhost:3000/cart`.
5. Click **Checkout**. Log in using Mobile `9999999999` and OTP `1234` (or Password `123456`).
6. Select your saved delivery address, choose **Cash on Delivery (COD)**, and click **Place Order**.
7. Confirm that the order confirmation screen displays your new Order ID (e.g., `#ORD-...`).

### Test 2: Admin Dashboard & Order Processing
1. Go to `http://localhost:3000/admin-login`.
2. Log in with `admin@vegking.com` / `admin123`.
3. Check the header clock: shows **"DB Connected"** with live real-time ticking date and time.
4. Check the **Recent Activity** and **Recent Orders** sections: your newly placed order appears at the top with real DB creation date and amount.
5. Go to **Orders** (`/admin/orders`), open the order, and change the status to **Out for Delivery** or **Delivered**.

### Test 3: Vendor Creation & Management
1. Inside Admin, click **Vendors** in the left sidebar (`/admin/vendors`).
2. Click the green **"+ New Vendor"** button.
3. Fill in:
   - Full Name: `Test Vendor Shop`
   - Mobile Number: `9876543210`
   - Shop Name: `Quality Farm Veggies`
   - City: `Pune`
   - Toggle **Is Verified** to active.
4. Click **Create Vendor**.
5. You will be redirected back to the Vendors table: the newly created vendor will immediately appear at the top of the list!
6. Click the **Edit** icon in the Actions column to test updating the vendor's wallet balance or shop name directly in MongoDB.

### Test 4: Product Stock Adjustment
1. Inside Admin, go to **Products** (`/admin/products`).
2. Click **Edit** on any product (e.g., `Carrot (Gajar)`).
3. Change the stock from `42` to `50` and change Selling Price from `32` to `35`.
4. Click **Save Product**.
5. Return to the customer store (`http://localhost:3000`): verify the product immediately reflects ₹35 and updated stock without caching delays.

---

## 5. Environment Variables Reference (.env.local)

```ini
# Database
MONGODB_URI=mongodb://deep2026u_db_user:deep2026@ac-oxpfifv-shard-00-00.zf4subp.mongodb.net:27017,ac-oxpfifv-shard-00-01.zf4subp.mongodb.net:27017,ac-oxpfifv-shard-00-02.zf4subp.mongodb.net:27017/vegking?ssl=true&replicaSet=atlas-uteeni-shard-0&authSource=admin&retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_super_secret_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ram.work2026@gmail.com
SMTP_PASS=shmnkkifxjrapvam
SMTP_FROM="VegKing Support <info@vegking.com>"
```
