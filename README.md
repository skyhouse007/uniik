# CozyFoam — Mattress Ecommerce (Pepperfry-like)

Root structure:

```
/frontend  (React + Vite + Tailwind + Clerk)
/backend   (Node.js + Express + MongoDB + Clerk + Razorpay)
```

## Prerequisites

- Node.js 18+ (recommended)
- MongoDB running locally or MongoDB Atlas connection string
- A Clerk application (for publishable + secret keys)
- A Razorpay test account (key id + secret)

## 1) Backend setup

```bash
cd backend
copy .env.example .env
```

Edit `backend/.env` and set:

- `MONGODB_URI`
- `CLERK_SECRET_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Install + run:

```bash
npm install
npm run seed
npm run dev
```

Backend runs on `http://localhost:4000` with API base `http://localhost:4000/api`.

## 2) Frontend setup

```bash
cd frontend
copy .env.example .env.local
```

Edit `frontend/.env.local` and set:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_API_BASE_URL` (default is `http://localhost:4000/api`)

Install + run:

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Clerk notes

- Frontend uses Clerk components (`SignInButton`, `UserButton`, `UserProfile`) and protects routes like `/checkout`, `/orders`, `/profile`.
- Backend validates sessions using Clerk middleware and expects requests to include an `Authorization: Bearer <token>` header for protected APIs.

To make an admin:

- Set Clerk `publicMetadata.role = "admin"` for your user.
- Then you can call admin APIs like `POST /api/products`.

## Razorpay payment flow

- Frontend calls `POST /api/payments/razorpay/order` to create a Razorpay order.
- Razorpay Checkout opens on the frontend.
- On success, frontend calls `POST /api/payments/razorpay/verify`.
- Backend verifies the signature and creates an `Order` in MongoDB from the user’s cart.

