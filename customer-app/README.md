# Maps Kayz Customer App

React Native customer app built with Expo. It connects to the existing Maps Kayz NestJS API and does not use Flutter.

## Run locally

```bash
npm install
npm start
```

Scan the QR code with Expo Go, or run `npm run android` / `npm run ios`.

The production API is the default. To use a different API, copy `.env.example` to `.env` and change `EXPO_PUBLIC_API_BASE_URL`.

## Included flows

- Home and store benefits
- Live product catalogue and search
- Backend-backed shopping cart
- WhatsApp ordering
- Customer registration and login
- Customer dashboard summary and logout
- In-app access to all storefront features: categories, product details,
  checkout, payment, tracking, returns, wishlist, saved looks, style profile,
  loyalty, coupons, store credit, addresses, notifications, reviews,
  referrals, support, profile and security
- Native login is passed securely into the in-app storefront session
- Android and iOS identifiers
