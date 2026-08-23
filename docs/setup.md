# Setup

[← Spec index](./README.md)

## Environment variables

```bash
# App — backend URL only, never vendor keys
EXPO_PUBLIC_API_URL=

# Server
SERPAPI_API_KEY=

PERFECT_CORP_API_KEY=

# Only if temporary external storage becomes necessary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Never expose vendor API keys through `EXPO_PUBLIC_*`.

The app may only know the backend URL. SerpApi and Perfect Corp keys stay on the server.

Never commit `.env` or `.env.local`.

## Suggested repository structure

```text
realitylens/
├─ app/
│  ├─ _layout.tsx
│  ├─ index.tsx
│  ├─ scan/
│  │  └─ [id].tsx
│  ├─ try-on/
│  │  └─ [id].tsx
│  └─ result/
│     └─ [id].tsx
│
├─ components/
│  ├─ camera/
│  ├─ scan/
│  ├─ product/
│  ├─ offers/
│  ├─ try-on/
│  └─ ui/
│
├─ server/
│  ├─ index.ts
│  ├─ routes/
│  │  ├─ scan.ts
│  │  └─ try-on.ts
│  └─ lib/
│     ├─ serpapi/
│     │  ├─ client.ts
│     │  ├─ image-upload.ts
│     │  ├─ lens.ts
│     │  └─ normalize.ts
│     ├─ perfect/
│     │  ├─ client.ts
│     │  ├─ shoes.ts
│     │  ├─ watch.ts
│     │  └─ clothes.ts
│     ├─ image/
│     │  └─ preprocess.ts
│     ├─ category/
│     │  └─ classify.ts
│     └─ ranking/
│        └─ offers.ts
│
├─ types/
│  └─ realitylens.ts
│
├─ assets/
│  └─ demo/
│
├─ docs/
│  └─ README.md
│
├─ app.json
├─ .env.example
└─ README.md
```
