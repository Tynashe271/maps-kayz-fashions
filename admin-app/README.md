# Maps Kayz Admin App

Expo shell for the responsive Maps Kayz admin web portal. The app retains the portal's authentication, role checks, live updates, and all admin workflows while adding native Android back navigation, pull-to-refresh, route restoration, external-link handling, and offline/error states.

The app uses its own `index.js` entry point so it remains isolated from the customer app even when both projects share a local Expo dependency cache.

## Run locally

```powershell
npm install
npm run android
```

The native app opens `https://maps-kayz-admin.pages.dev/`. The web target opens the local admin preview at `http://localhost:4174/` in development.

To point a development or branded build at another admin deployment, copy `.env.example` to `.env` and set `EXPO_PUBLIC_ADMIN_URL`. Keep the trailing slash.

The embedded portal contains every admin-web route: Dashboard, Products, Categories, Customers, Orders, Promotions, Inventory, Deliveries, Returns, and Customer activity. Authentication, staff-role enforcement, API access, and live synchronization remain owned by the web portal.

## Build an Android APK

```powershell
npx eas-cli build --platform android --profile preview
```

The preview profile creates an installable APK. Production builds use the separate Android package `zw.co.tinashenyenyesa.mapskayz.admin`.
