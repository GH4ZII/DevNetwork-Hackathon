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
```

Add keys to `.env`:

1. [SerpApi signup](https://serpapi.com/users/sign_up) → `SERPAPI_API_KEY`
2. [YouCam / Perfect Corp API keys](https://yce.makeupar.com/api-console/en/api-keys/) → `PERFECT_CORP_API_KEY`

Run the API, then the app:

```bash
npm run server
npm start
```

The API listens on `http://0.0.0.0:3000`. Open the app in Expo Go.

On a physical phone, set `EXPO_PUBLIC_API_URL` to your computer's LAN IP, for example `http://192.168.1.10:3000`. `localhost` only works in a simulator on the same machine.

Phase 1 is an ugly but complete shoes flow: scan a shoe photo, review the match and offers, then generate a try-on.

### Environment variables

```bash
# App — backend URL only, never vendor keys
EXPO_PUBLIC_API_URL=

# Server
SERPAPI_API_KEY=
PERFECT_CORP_API_KEY=
PERFECT_CORP_API_BASE=https://yce-api-01.makeupar.com

# Only if temporary image hosting is required
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Never expose vendor keys as `EXPO_PUBLIC_*`. Never commit `.env`.

## Demo flow

The product is designed around a 30–60 second demo:

1. Open RealityLens on a phone.
2. Photograph a real pair of shoes, a watch, a jacket, or a bag — or tap **Use demo photo**.
3. Review the best visual match and live prices.
4. Tap **Try On** and take a photo, pick from gallery, or tap **Use demo selfie**.
5. Reveal the before/after result, then open a merchant link.

### Demo day layers

| Layer | When to use | How |
|-------|-------------|-----|
| **1 — Live** | Best for the talk | Scan a real product with the camera |
| **2 — Known assets** | Fast, reliable backup | **Use demo photo** → **Use demo selfie** |
| **3 — Fixtures** | APIs down / no credits | `USE_FIXTURES=1` in `.env`, restart server |

Full operator checklist: [`docs/demo-day.md`](./docs/demo-day.md).

## Scope

**In:** native camera/gallery, visual search, product + price UI, at least one Perfect Corp try-on category (shoes first), error/retry states, Expo Go or device build for the demo.

**Out:** web app, PWA, chatbot, accounts, checkout, payments, custom vision or try-on models.
