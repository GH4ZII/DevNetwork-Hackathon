# Technical stack

[← Spec index](./README.md)

## App

- **Expo + React Native + TypeScript**
- **NativeWind** for Tailwind-style styling
- **expo-camera** and **expo-image-picker**
- **expo-router** for screen navigation
- animation with **React Native Reanimated**

Why native instead of web:

- RealityLens is a camera product, not a website
- real device camera, permissions, and capture quality
- no browser chrome in the demo
- try-on and share flows feel like a consumer app
- Expo Go is still fast to iterate and show to judges

## Backend

Keep a thin API server in the same repo so vendor keys never ship in the app binary.

Use **Hono** or **Express** on Node for MVP.

Responsibilities:

- protect API keys
- preprocess/validate uploads
- communicate with SerpApi
- communicate with Perfect Corp
- normalize third-party results
- cache short-lived results
- prevent the app from calling SerpApi or Perfect Corp directly

## Storage

### MVP

Avoid permanent image storage when possible.

SerpApi now supports direct image upload through its Image API.

Important SerpApi constraints:

- accepted: JPG/JPEG, PNG, WebP
- uploaded image max: **500 KB**
- returned `image_id` expires after approximately **10 minutes**

Therefore the client/server should resize and compress scan images before SerpApi upload.

For Perfect Corp requests:

- use direct upload or URL-based input according to the selected API
- use temporary storage only if the integration requires a reachable URL

Possible temporary object storage:

- Cloudinary
- Supabase Storage
- S3-compatible storage

Choose only one if needed.
