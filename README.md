# E-commerce Monorepo

This is a monorepo for an e-commerce platform with multiple applications:

- `backend`: Node.js + Express API server
- `customer-app`: React frontend for customers
- `admin-panel`: React admin dashboard for the platform
- `rider-pwa`: React Progressive Web App for delivery riders

## Setup

1. Install dependencies for all applications:

```bash
npm run install:all
```

2. Copy the environment variables:

```bash
cp backend/env.example backend/.env
```

3. Configure environment variables in `.env` files as needed.

4. Set up the database:

```bash
# Create a PostgreSQL database named 'ecommerce'
# Then run migrations and seeds
npm run db:setup
```

## Database Management

- Run migrations: `npm run db:migrate`
- Run seeds: `npm run db:seed`
- Rollback migrations: `npm run db:rollback`

## Development

Run the applications in development mode:

- Backend: `npm run backend:dev`
- Customer app: `npm run customer-app:dev`
- Admin panel: `npm run admin-panel:dev`
- Rider PWA: `npm run rider-pwa:dev`

## Build

Build the frontend applications:

- Customer app: `npm run customer-app:build`
- Admin panel: `npm run admin-panel:build`
- Rider PWA: `npm run rider-pwa:build`

## Technologies

- Backend: Express, PostgreSQL, Knex.js, Firebase Admin
- Frontend: React, Vite, React Router, TailwindCSS

## Database Schema

- **users**: Store customers, admins, and riders accounts
- **products**: Product listings with details
- **product_variants**: Color and size variations for products
- **orders**: Customer orders with status information
- **order_items**: Line items in each order
- **riders**: Delivery personnel information
- **order_riders**: Relationship between orders and assigned riders 