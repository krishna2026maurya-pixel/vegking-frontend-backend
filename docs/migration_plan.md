# Goal Description

The new goal is to migrate the **frontend UI only** from `veggiemart/frontend` into the `vegimart_general` repository. We will temporarily bypass backend API migration (database, real auth, fetching from the server) and instead power the UI components using **dummy data**. This ensures the frontend layout, styling, and navigation are fully integrated into the Next.js app before we tackle backend logic in the future.

## User Review Required

> [!IMPORTANT]
> **JavaScript vs TypeScript**: Since `vegimart_general` is TypeScript-based (`.ts`/`.tsx`), I will copy the JavaScript components from the old frontend as `.js`/`.jsx` files to speed up this phase. We can refactor them to TypeScript later. Please confirm this is acceptable.

## Open Questions

- Should I keep the Next.js admin dashboard at `/admin` intact, or should the frontend completely replace everything? (I assume we are keeping `/admin` functional).
- For dummy data, I will use static JSON arrays for products, categories, and user profile data. Does that sound good?

## Proposed Changes

The frontend-only migration will be divided into the following phases:

### Phase 1: Setup & Styling
- Merge necessary packages (lucide-react, styling libraries, etc.) from `veggiemart/frontend/package.json` into `vegimart_general`.
- Migrate global CSS and `tailwind.config` settings.

### Phase 2: Dummy Data & Contexts Setup
- Create a `data/` folder inside `vegimart_general` with dummy JSON data for products, categories, carts, and user profiles.
- Migrate React Contexts (like `CartContext`, `AuthContext`), but modify them to read/write to the dummy data or local storage instead of making actual API calls.

### Phase 3: Components Migration
- Copy all reusable components from `veggiemart/frontend/src/components` (Navbar, Footer, ProductCards, Modals, etc.) to `vegimart_general/components/frontend`.
- Adjust import paths and update them to use the dummy data.

### Phase 4: Pages Migration
- Copy the consumer-facing pages (`/products`, `/cart`, `/checkout`, `/login`, etc.) from `veggiemart/frontend/src/app` into `vegimart_general/app/`.
- Replace the root `vegimart_general/app/page.tsx` with the storefront home page from `veggiemart/frontend/src/app/page.js`.

### Phase 5: Backend API Migration
- Once the frontend UI is fully migrated and functional using dummy data, we will migrate the custom Node.js backend logic (`veggiemart/backend`) into Next.js App Router API endpoints within `vegimart_general`.
- This includes migrating the database connection (Mongoose/MongoDB), integrating actual authentication (NextAuth/JWT), and replacing all dummy data with real API calls.

## Verification Plan

### Manual Verification
- Start `vegimart_general` using `npm run dev`.
- Ensure the main storefront home page loads with perfect styling.
- Verify that users can browse products (using dummy data) and add them to their cart.
- Verify the admin dashboard still exists at `/admin`.
