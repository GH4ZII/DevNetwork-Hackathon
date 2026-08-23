# Build plan

[← Spec index](./README.md)

## Phase 0 — Prove the APIs

Before building polished UI:

- [ ] obtain SerpApi key
- [ ] obtain Perfect Corp key
- [ ] test one direct SerpApi image upload
- [ ] receive `image_id`
- [ ] receive Google Lens visual matches
- [ ] receive Google Lens product data
- [ ] test one Perfect Corp category manually
- [ ] generate one successful real try-on image

**Do not start the full UI until both integrations are proven.**

## Phase 1 — Vertical slice

Build one ugly but complete flow:

```text
capture scan image
→ SerpApi
→ product result
→ capture user image
→ Perfect Corp
→ try-on result
```

Target category:

> **Shoes**

This proves RealityLens.

## Phase 2 — Product experience

Build:

- camera-like home screen with the real device camera
- search animation
- hero product result
- merchant cards
- lowest-price display
- Try On CTA
- photo guidance
- generated reveal

## Phase 3 — Reliability

Add:

- retries
- timeouts
- loading skeletons
- API validation
- malformed result handling
- no-product fallback
- image resizing
- caching
- demo fixtures for development only

## Phase 4 — Second category

Choose only after shoes work perfectly.

Priority:

1. watch
2. clothes
3. bag

## Phase 5 — Demo polish

- transitions
- microinteractions
- before/after slider
- native camera polish
- device testing on a real phone
- fast demo path
- preload demo-safe assets if necessary
- record final video

## Demo reliability strategy

Live demos fail.

RealityLens needs three layers:

### Layer 1 — True live demo

Scan a physical product in front of the camera.

### Layer 2 — Known live demo image

Keep 2–3 images that are repeatedly verified to return strong results.

Example categories:

- recognizable Nike sneaker
- mainstream watch
- simple jacket

### Layer 3 — Development fixture mode

Saved API responses allow the UI to be developed without burning API credits.

Fixture mode must be clearly separate from the actual final integration.

## Immediate next tasks

1. Create repository.
2. Create `.env.example`.
3. Obtain and verify SerpApi API key.
4. Obtain and verify Perfect Corp API key.
5. Test SerpApi Image API with one shoe photo.
6. Test Google Lens `visual_matches`.
7. Test Google Lens `products`.
8. Save normalized example responses as local development fixtures.
9. Test Perfect Corp Shoes Virtual Try-On in its playground/API.
10. Generate one real shoe try-on.
11. Implement `POST /api/scan` on the backend.
12. Implement `POST /api/try-on` on the backend.
13. Build the complete ugly Expo vertical slice.
14. Only then build the polished native camera UI.
