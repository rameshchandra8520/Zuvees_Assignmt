# E-commerce Backend API

This is the backend API for the e-commerce platform. It provides endpoints for managing products, orders, and user authentication.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp env.example .env
```

3. Configure your Firebase service account:

```bash
# Get your service account key from Firebase console
# Save it as firebase-service-account.json in the root directory
cp firebase-service-account.example.json firebase-service-account.json
# Then edit the file with your actual Firebase credentials
```

4. Set up the database:

```bash
npm run migrate
npm run seed
```

## Running the Server

Development mode with hot-reloading:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## API Endpoints

### Public Endpoints

- `GET /products` - Get all products with their variants
- `GET /products/:id` - Get a product by ID with its variants

### Protected Endpoints (requires authentication)

- `POST /orders` - Create a new order
- `GET /orders` - Get all orders for the authenticated user

## Authentication

This API uses Firebase Authentication with Google OAuth. To authenticate API requests:

1. Get an ID token from Firebase client SDK
2. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_FIREBASE_ID_TOKEN
```

## Database Management

- Run migrations: `npm run migrate`
- Rollback migrations: `npm run migrate:rollback`
- Run seeds: `npm run seed` 