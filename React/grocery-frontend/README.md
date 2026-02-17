# Grocery Delivery Frontend (React + Vite)

Production-ready React SPA for a Grocery Delivery application, integrated against your Spring Boot CRUD controllers.

## Stack

- React + Vite (JavaScript)
- React Router DOM (SPA routing)
- Axios (API client)
- React Hook Form + Yup (validation)
- Tailwind CSS (UI)
- react-hot-toast (notifications)

## Project Structure

```text
src/
  components/
  context/
  hooks/
  pages/
  services/
  styles/
  utils/
```

## Routes

- `/`
- `/auth/register`
- `/auth/login`
- `/products`
- `/products/:id`
- `/cart`
- `/checkout`
- `/orders`
- `/orders/:id`
- `/notifications`
- `/store`
- `/delivery`
- `/admin/products`
- `/admin/categories`

## Backend Endpoint Mapping

Controller mappings are centralized in:

- `src/services/endpoints.js`

Mapped base routes (from controllers):

- `/users`
- `/products`
- `/categories`
- `/carts`
- `/cart-items`
- `/orders`
- `/payments`
- `/deliveries`
- `/agents`
- `/notifications`
- `/stores`

If any endpoint contract changes, update only `src/services/endpoints.js` and/or service helpers.

## Environment Setup

1. Copy env template:

```bash
cp .env.example .env
```

2. Set backend base URL:

```env
VITE_API_BASE_URL=http://localhost:8080
```

## Install and Run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Auth Note

Current controller set exposes `/users` CRUD but no dedicated token auth endpoint.

- Login is implemented by validating user via `/users` and creating a local session token.
- Authorization header is still sent from localStorage so you can switch to backend JWT/token flow later without UI rewrite.
- Role selection is currently client-side (`CUSTOMER`, `STORE`, `DELIVERY_AGENT`) for route-level protection.

To migrate to backend auth, update:

- `src/services/userService.js` (`login` method)
- `src/context/AuthContext.jsx`

## Discount Rule

Implemented in `src/utils/cart.js`:

- `cartTotal = sum(price * quantity)`
- if `cartTotal > 200` then `discount = 25`
- `finalTotal = cartTotal - discount`

## Fallback Mock Mode

If backend endpoint is missing/unreachable (404/network), services fallback to local mock storage:

- `src/services/fallbackStore.js`
- `src/services/crudFactory.js`

This keeps UI flows functional while preserving backend-first behavior.

## Core Files to Review

- `src/App.jsx`
- `src/context/AuthContext.jsx`
- `src/hooks/useCart.js`
- `src/hooks/useNotifications.js`
- `src/services/axiosClient.js`
- `src/services/endpoints.js`
- `src/pages/CheckoutPage.jsx`
- `src/pages/OrderDetailPage.jsx`
- `src/pages/StoreDashboardPage.jsx`
- `src/pages/DeliveryDashboardPage.jsx`
