# Backend API design

[← Spec index](./README.md)

Internal API routes should isolate external vendors from the UI.

## `POST /api/scan`

Input:

```text
multipart/form-data
image
```

Responsibilities:

1. validate image
2. resize/compress if necessary
3. upload to SerpApi Image API
4. request visual matches
5. request product results
6. normalize response
7. return a `ScanResult`

Example response:

```json
{
  "scanId": "scan_123",
  "queryImage": "/temporary-or-client-reference",
  "bestMatch": {
    "title": "Nike Air Max 95",
    "category": "shoes",
    "imageUrl": "...",
    "source": "...",
    "confidenceLabel": "best_match"
  },
  "offers": [
    {
      "title": "Nike Air Max 95",
      "merchant": "Example Store",
      "priceText": "$129.99",
      "priceValue": 129.99,
      "currency": "USD",
      "inStock": true,
      "rating": 4.7,
      "reviews": 120,
      "url": "...",
      "imageUrl": "..."
    }
  ],
  "tryOn": {
    "supported": true,
    "category": "shoes"
  }
}
```

## `POST /api/try-on`

Input concept:

```json
{
  "scanId": "scan_123",
  "category": "shoes",
  "productImageUrl": "...",
  "userImage": "<upload>"
}
```

Responsibilities:

1. verify category
2. verify image inputs
3. map category to Perfect Corp integration
4. create try-on task
5. retrieve/poll result as required
6. return normalized status/result

Initial response may be synchronous or task-based depending on the Perfect Corp API.

Normalized result:

```json
{
  "status": "completed",
  "resultImageUrl": "...",
  "provider": "perfect_corp"
}
```

If asynchronous:

```json
{
  "status": "processing",
  "jobId": "tryon_123"
}
```

Then:

```http
GET /api/try-on/tryon_123
```

## Internal data types

```ts
type ProductCategory =
  | "shoes"
  | "clothes"
  | "watch"
  | "bag"
  | "hat"
  | "ring"
  | "bracelet"
  | "earrings"
  | "necklace"
  | "scarf"
  | "other";

type MatchLabel =
  | "exact_match"
  | "best_match"
  | "similar";

interface ProductMatch {
  id: string;
  title: string;
  category: ProductCategory;
  imageUrl?: string;
  source?: string;
  url?: string;
  label: MatchLabel;
}

interface Offer {
  id: string;
  title: string;
  merchant?: string;
  priceText?: string;
  priceValue?: number;
  currency?: string;
  inStock?: boolean;
  rating?: number;
  reviews?: number;
  imageUrl?: string;
  url: string;
}

interface ScanResult {
  scanId: string;
  bestMatch: ProductMatch | null;
  offers: Offer[];
  tryOnSupported: boolean;
  tryOnCategory?: ProductCategory;
}
```
