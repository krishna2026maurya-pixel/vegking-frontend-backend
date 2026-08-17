# VegKing Credentials & Route Navigation Manual

This guide lists the URLs and credentials required to access and test the **Admin**, **Vendor**, and **Customer** portals of the VegKing application.

---

## 1. Admin Portal

The Admin Portal allows you to manage categories, category types, products, riders, orders, and verify new vendor applications.

* **Login URL**: [http://localhost:3000/admin-login](http://localhost:3000/admin-login)
* **Dashboard URL**: [http://localhost:3000/admin](http://localhost:3000/admin) (accessible after logging in)
* **Credentials**:
  * **Email**: `admin@vegking.com` (or `admin@vegking.com`)
  * **Password**: `admin123`

> [!IMPORTANT]
> **Vendor Verification**: When new vendors register, their accounts are set to unverified (`is_verified = "0"`). To approve them, log in as **Admin**, navigate to the **Vendors** sidebar link, find the vendor, and click the check/verify icon to approve them.

---

## 2. Vendor Portal

The Vendor Portal is designed for merchants to edit shop settings, configure delivery thresholds, manage product listings, and download CSV shop reports.

* **Register URL**: [http://localhost:3000/vendor/register](http://localhost:3000/vendor/register)
* **Login URL**: [http://localhost:3000/vendor/login](http://localhost:3000/vendor/login)
* **Pre-seeded Verified Vendor Credentials**:
  * **Email**: `vendor1@vegking.com` (you can use any number up to `vendor20@vegking.com`)
  * **Password**: `password123`
* **How to test new Vendor Registration**:
  1. Go to the **Register URL** and fill out the multi-step account registration, business profile, and upload the dummy document credentials.
  2. Log in to the **Admin Portal** (using `admin@vegking.com` / `admin123`).
  3. Go to the **Vendors** list page and verify/approve your newly registered vendor.
  4. Go back to the **Login URL** and log in using the email and password you registered.

---

## 3. Storefront / Customer Account

Customers can search for fresh produce, add items to their shopping cart, subscribe to recurring delivery schedules, and manage user dashboards.

* **Login URL**: [http://localhost:3000/login](http://localhost:3000/login)
* **Profile / User Dashboard URL**: [http://localhost:3000/user/dashboard](http://localhost:3000/user/dashboard) (accessible after logging in)
* **Credentials (OTP Flow)**:
  * **Mobile Number**: Enter any valid 10-digit mobile number.
  * **Seeded Account Mobile**: `9999999999` (Registered to seeded dummy user **Krishna Kumar**)
  * **OTP**: `1234` (Seeded default validation OTP in development)

> [!TIP]
> E.g. entering the mobile number `9999999999` and clicking **Send OTP** will let you log in as Krishna Kumar when you enter the mock code `1234`. Any unregistered 10-digit number entered will automatically register a new user account.
