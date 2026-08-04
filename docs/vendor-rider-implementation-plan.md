# Vendor & Rider System Implementation Document

This document records the design decisions, tasks, and API changes required for implementing the Vendor Self-Registration, Admin Approvals, Catalog Duplication Prevention, and Vendor-Specific Riders.

---

## 1. System Goals & Architecture

### A. Vendor Self-Registration & Admin Control
1. **Self-Registration**: Vendors apply directly through `/vendor/register`. Their details are saved to the database with a hashed password using `bcrypt` and default verification status set to unverified (`is_verified: '0'`).
2. **Admin Controls Everything**: The Admin Panel maintains complete CRUD authority over all vendors and riders. Admin can view pending registrations at `/admin/vendors` and toggle their verification status.
3. **Login Protection**: The NextAuth credentials provider checks `is_verified === '1'`. Unverified vendors are blocked from logging in with a specific error message.

### B. Catalog Duplication Prevention & Multi-Seller Selection
To prevent duplicate items from cluttering search results and category pages:
1. **Catalog Grouping**: The customer-facing products API (`GET /api/products`) groups listings by `product_name` and `brand` using aggregation or query logic.
2. **Website Display**: The customer sees one unified product card (e.g. *"Organic Tomatoes - Starting from ₹40"*).
3. **Multi-Seller Selection**: On the product detail page, the customer sees all verified vendors selling that product, along with their respective prices and stock, allowing the customer to select their preferred seller.
4. **Dashboard Search**: When a vendor adds a product, they can type the product name to check if it already exists globally. If so, they can click a button to copy all descriptive details (description, category, image) to list it as their own.

### C. Customer Vendor-Wise Browsing
If the customer wants to shop by a specific vendor rather than viewing grouped products:
1. **Sellers List**: A customer-facing route `/vendors` will display a list of all verified vendors/sellers in the system.
2. **Seller Product Detail Page**: Clicking a vendor opens a detail page `/vendors/[id]` that displays their profile details and a grid of all products listed by **that specific vendor**.
3. **No Grouping in Vendor View**: In the vendor-specific view, **no products are grouped/collapsed**—all items listed by that specific vendor are shown individually.

### D. Vendor-Specific Riders (Delivery Boys)
1. **Schema Link**: Add `vendor_id` to the `DeliveryBoy` model (defaults to `null` for global/admin riders).
2. **Vendor Dashboard Tab**: Add a "My Riders" tab in the Vendor Dashboard so vendors can view and register their own delivery boys.
3. **Rider App Login**: Vendor-created riders log in using the `/api/v1/rider/auth/login` endpoint on the mobile app.

---

## 2. Task List & Files to Modify

### Core Models & Database
* **Modify** `lib/models/DeliveryBoy.ts`
  * Add `vendor_id` field.
* **Modify** `app/api/vendors/route.ts`
  * Hash passwords with `bcryptjs` on registration.

### Authentication & Authorization
* **Modify** `app/api/auth/[...nextauth]/route.ts`
  * Authenticate vendors using database credentials.
  * Verify `is_verified === '1'` before allowing login.

### Vendor Dashboard & Listing Features
* **Modify** `app/vendor/register/page.tsx`
  * Call `POST /api/vendors` during registration.
* **Modify** `app/vendor/dashboard/page.tsx`
  * Fetch real products, categories, profile, and orders.
  * Save/edit/delete products using real API calls.
  * Implement catalog lookup when adding products (auto-populate from existing catalog).
  * Build "My Riders" tab (list, add, delete vendor-specific delivery boys).

### Customer UIs & Vendor-Wise Browsing
* **Modify** `app/api/products/route.ts`
  * Group products by name to prevent duplicates (only for general query; do not group if `vendor_id` query param is present).
* **Modify** `app/product/[id]/page.tsx`
  * Display a list of all sellers/vendors for the grouped product.
* **Modify** `components/Navbar.tsx`
  * Add "Sellers" links to the desktop and mobile navigation menus.
* **NEW** `app/vendors/page.tsx`
  * List all verified sellers/vendors in the marketplace.
* **NEW** `app/vendors/[id]/page.tsx`
  * Show details and all individual products for a specific vendor.
* **Modify** `app/api/orders/route.ts`
  * Filter orders for the logged-in vendor.

### Admin Controls & Typos
* **Modify** `app/admin/delivery-boys/page.tsx`
  * Fix broken routes targeting `/api/s/` and `/admin/s/`.
  * Display owner vendor's shop name if the rider belongs to a vendor.
