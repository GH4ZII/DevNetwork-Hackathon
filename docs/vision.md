# Vision

[← Spec index](./README.md)

## Hackathon goal

Build a polished end-to-end prototype for the **DevNetwork [API + Cloud + AI] Hackathon 2026**.

Primary sponsor integrations:

- **SerpApi** — visual product discovery and live web shopping data through Google Lens.
- **Perfect Corp** — photorealistic virtual try-on for supported fashion categories.

The project is intentionally designed around one unforgettable interaction:

```text
REAL-WORLD OBJECT
      ↓
   CAMERA
      ↓
 VISUAL SEARCH
      ↓
PRODUCT FOUND
      ↓
LIVE PRICES
      ↓
  TRY IT ON
      ↓
PHOTOREALISTIC RESULT
```

## The demo we are building for

The entire product should be optimized around a 30–60 second demo.

### Ideal demo

1. User opens the RealityLens app on a phone.
2. User photographs a real pair of shoes, watch, jacket, or bag.
3. UI immediately enters a scanning animation.
4. RealityLens identifies the likely product.
5. Product card appears with:
   - product name
   - image
   - likely category
   - merchant results
   - prices
6. RealityLens highlights:
   - **Best Match**
   - **Lowest Price**
7. User taps **Try On**.
8. User takes or picks a suitable photo of themselves.
9. Perfect Corp generates the virtual try-on.
10. Before/after interaction reveals the result.
11. User can open a merchant result.

The judge should understand the entire value proposition without an explanation.

## Product principles

### Camera first

Do not start with a dashboard.

The first screen should make the main action obvious:

> **Scan something you want.**

### Visual over textual

Avoid long AI explanations.

Prefer:

- images
- cards
- price chips
- merchant logos
- animation
- confidence indicators
- before/after interaction

### One magical loop

The MVP is:

> **Scan → Find → Compare → Try On**

Anything that does not improve this loop is secondary.

### Real data, not fake demo data

The final demo should use real SerpApi results and a real Perfect Corp try-on request.

Fallback demo fixtures may exist for development and failure recovery, but they must not be presented as the live integration.

### No chatbot

RealityLens is not conversational AI.

There should be no generic chat box, autonomous agent loop, task planner, or “AI assistant” interface.
