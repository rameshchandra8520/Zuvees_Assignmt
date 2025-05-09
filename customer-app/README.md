# E-Shop Customer App

This is the React frontend for the e-commerce platform, designed for customers to browse products, add them to cart, and place orders.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up Firebase configuration:

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# API URL
VITE_API_URL=http://localhost:3000
```

Replace the placeholder values with your actual Firebase configuration. You can get these values from the Firebase console.

3. Run the development server:

```bash
npm run dev
```

## Features

- **Product Listing**: Browse all available products on the home page
- **Product Detail**: View detailed information about a product and select variants
- **Shopping Cart**: Add products to cart, update quantities, and remove items
- **Checkout**: Place orders with items in your cart
- **Authentication**: Sign in with Google to place orders and view your profile

## Firebase Authentication

This app uses Firebase for Google authentication. You need to:

1. Create a Firebase project in the Firebase console
2. Enable Google Authentication in the Authentication section
3. Add your domain to the authorized domains list
4. Create a web app and get the configuration values for your `.env.local` file

## Project Structure

- `src/components`: Reusable UI components
- `src/contexts`: React contexts for state management (Auth, Cart)
- `src/pages`: Page components for different routes
- `src/services`: Service modules for API and Firebase interactions

## Routing

- `/`: Home page with product listing
- `/product/:id`: Product detail page
- `/cart`: Shopping cart page
- `/login`: Login page for authentication
