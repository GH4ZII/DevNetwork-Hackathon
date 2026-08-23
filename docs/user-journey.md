# Core user journey

[← Spec index](./README.md)

## Screen A — Scan

Full-screen native camera.

Primary controls:

- `Take Photo`
- `Choose from Gallery`
- optional example products for testing

UI copy:

> **What did you find?**

Supporting text:

> Scan a product to find it online.

After capture:

- show captured image
- crop/retake controls
- `Search`

## Screen B — Searching

Visually strong transition.

Suggested stages:

```text
Analyzing object
      ↓
Finding visual matches
      ↓
Comparing stores
```

These are UI stages, not autonomous agent steps.

Animate them while the backend completes the search.

## Screen C — Product Match

Hero result:

```text
┌──────────────────────────────┐
│ [PRODUCT IMAGE]              │
│                              │
│ Nike Air Max 95              │
│ Shoes                        │
│                              │
│ Best visual match            │
│                              │
│ From $129                    │
│                              │
│ [ TRY ON ]   [ VIEW DEALS ]  │
└──────────────────────────────┘
```

Below it:

### Shop it

Merchant cards ranked by useful signals:

- price
- source/store
- rating
- review count
- stock status
- product link

Do not pretend every visual result is guaranteed to be the exact SKU.

Label results appropriately:

- `Best Match`
- `Similar`
- `Exact Match` only when source data actually supports it

## Screen D — Try On

If category is supported:

```text
You found it.
Now wear it.
```

Ask for the image type required by the selected Perfect Corp API.

Examples:

- shoes → suitable person/full-body image
- clothing → selfie / half-body / full-body depending on API requirements
- watch → clear wrist/hand photo
- ring → hand photo
- bag → suitable person image

Show simple framing instructions before upload.

Then:

`Generate Try-On`

## Screen E — Reveal

This is the visual payoff.

Use:

- full-screen result
- before / after slider
- subtle transition
- product card at bottom
- price + merchant CTA

Primary CTA:

> **Shop this look**

Secondary actions:

- `Try another`
- `Scan something else`
- `Share result` — stretch goal
