# RealityLens

> **See it. Scan it. Try it. Buy it.**

RealityLens is a camera-first visual shopping app. Photograph a product in the real world — shoes, a watch, a jacket, a bag — and it finds visually matching products, live prices, and a virtual try-on.

Built for the **DevNetwork [API + Cloud + AI] Hackathon 2026**. Full spec in [`docs/`](./docs/README.md).

**Shazam for physical products — with live prices and virtual try-on.**

## The loop

```text
Scan → Find → Compare → Try On
```

1. Take or pick a photo of a product.
2. SerpApi / Google Lens identifies visual matches and shopping results.
3. Compare merchants and prices.
4. Perfect Corp generates a photorealistic virtual try-on.

## Stack

- **Expo** + React Native + TypeScript
- **NativeWind**
- **SerpApi** — visual search and live product data
- **Perfect Corp** — virtual try-on
- Thin **Hono/Express** API so vendor keys stay off the device

The app never talks to SerpApi or Perfect Corp directly.

## Getting started

```bash
npm install
cp .env.example .env
npx expo start
```

Open the project in **Expo Go** on a phone, or run an iOS/Android simulator.

Start the API server separately so scan and try-on requests can be proxied.

### Environment variables

```bash
# App — backend URL only, never vendor keys
EXPO_PUBLIC_API_URL=

# Server
SERPAPI_API_KEY=
PERFECT_CORP_API_KEY=

# Only if temporary image hosting is required
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Never expose vendor keys as `EXPO_PUBLIC_*`. Never commit `.env`.

## Demo flow

The product is designed around a 30–60 second demo:

1. Open RealityLens on a phone.
2. Photograph a real pair of shoes, a watch, a jacket, or a bag.
3. Review the best visual match and live prices.
4. Tap **Try On** and take or pick a photo of yourself.
5. Reveal the before/after result, then open a merchant link.

## Scope

**In:** native camera/gallery, visual search, product + price UI, at least one Perfect Corp try-on category (shoes first), error/retry states, Expo Go or device build for the demo.

**Out:** web app, PWA, chatbot, accounts, checkout, payments, custom vision or try-on models.
