# Platform Integration Strategy

## 1. PWA Architecture
- **Manifest**: Standard `manifest.json` configured for standalone display, specifying theme colors (matching light/dark tokens) and mobile icons.
- **Service Worker**: Caching static assets (HTML, CSS, JS, fonts) and core API requests to ensure fast loading even on spotty connections.
- **Installability**: Must prompt for "Add to Homescreen" appropriately.

## 2. Offline Architecture Plan
- **Phase 0/1 Goal**: Graceful degradation. Show cached data, disable mutations if offline.
- **Future State**: Optimistic UI updates. 
  - Queue mutations in IndexedDB.
  - Sync when the `online` event fires.
  - Do not implement complex conflict resolution in Phase 0.

## 3. Future Android/Native Integration Strategy
- **Limitation**: PWAs cannot natively block other Android applications (e.g., Instagram, YouTube) due to OS sandboxing.
- **Strategy**: 
  - Develop a lightweight native Android layer (e.g., Kotlin/Jetpack Compose or React Native wrapper) that utilizes Android's `AccessibilityService` or `DevicePolicyManager` (or the newer Digital Wellbeing APIs).
  - The PWA will act as the UI and configuration layer.
  - The Native app will sync with Supabase to read `blocked_apps` and `focus_rules` and enforce them on the OS level.
  
## 4. Notification Architecture
- **Web/PWA**: Standard Web Push API for task reminders and focus session completions.
- **Delivery**: Supabase Edge Functions triggered by Postgres pg_cron or Webhooks, sending payloads to a push provider (e.g., FCM - Firebase Cloud Messaging).
