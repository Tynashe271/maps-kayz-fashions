# Maps Kayz Customer App

React Native customer app built with Expo. It runs the production customer storefront inside a native application shell and does not use Flutter.

## Run locally

```bash
npm install
npm start
```

Scan the QR code with Expo Go, or run `npm run android` / `npm run ios`.

The production API is the default. To use a different API, copy `.env.example` to `.env` and change `EXPO_PUBLIC_API_BASE_URL`.

## Included flows

The app uses the customer website as its single source of truth. Every website
screen, action, account section and navigation sequence therefore appears in
the app in exactly the same order. Login and cart state persist in the embedded
storefront. Android's back button and iOS back gestures follow browser history;
external WhatsApp and payment links open in their appropriate installed apps.
