# RealityLens

> **See it. Scan it. Try it. Buy it.**

RealityLens is a camera-first visual shopping app. Photograph a product in the real world — shoes, a watch, a jacket, a bag — and it finds visually matching products, live prices, and a virtual try-on.

Built for the **DevNetwork [API + Cloud + AI] Hackathon 2026**.

**Shazam for physical products — with live prices and virtual try-on.**

## The loop

```text
Scan → Find → Compare → Try On
```

1. Take or upload a photo of a product.
2. SerpApi / Google Lens identifies visual matches and shopping results.
3. Compare merchants and prices.
4. Perfect Corp generates a photorealistic virtual try-on.

## Stack

- **Next.js** + TypeScript + React
- **Tailwind CSS**
- **SerpApi** — visual search and live product data
- **Perfect Corp** — virtual try-on

API keys stay on the server. The browser never talks to SerpApi or Perfect Corp directly.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

```bash
SERPAPI_API_KEY=
PERFECT_CORP_API_KEY=

# Only if temporary image hosting is required
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Never expose vendor keys as `NEXT_PUBLIC_*`. Never commit `.env.local`.

## Demo flow

The product is designed around a 30–60 second demo:

1. Open RealityLens.
2. Photograph a real pair of shoes, a watch, a jacket, or a bag.
3. Review the best visual match and live prices.
4. Tap **Try On** and upload a photo of yourself.
5. Reveal the before/after result, then open a merchant link.

## Scope

**In:** camera/upload, visual search, product + price UI, at least one Perfect Corp try-on category (shoes first), error/retry states, mobile-first demo deploy.

**Out:** chatbot, accounts, checkout, payments, native apps, custom vision or try-on models.
