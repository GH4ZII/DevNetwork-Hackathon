# RealityLens

> **See it. Scan it. Try it. Buy it.**

RealityLens is a camera-first native shopping app that turns anything you see in the real world into an interactive shopping result.

Take a photo of a product — shoes, clothing, a watch, a bag, or another fashion item — and RealityLens identifies visually matching products, surfaces live shopping results and prices, then lets the user virtually try the item on.

The goal is not to build another AI assistant. The goal is to build a **visually impressive consumer product** with a demo that anyone understands in seconds.

## One-line pitch

**RealityLens turns anything you see into something you can identify, compare, and virtually try on.**

Alternative pitch:

> Shazam for physical products — with live prices and virtual try-on.

## Spec index

| Doc | Contents |
| --- | --- |
| [Vision](./vision.md) | Hackathon goal, demo, product principles |
| [User journey](./user-journey.md) | Scan → Find → Compare → Try On screens |
| [Scope](./scope.md) | MVP, stretch goals, what we are not building |
| [Stack](./stack.md) | App, backend, storage |
| [Integrations](./integrations.md) | SerpApi and Perfect Corp |
| [API](./api.md) | Internal routes and data types |
| [Pipeline](./pipeline.md) | Ranking, category detection, image processing |
| [UX](./ux.md) | States, visual direction, screens |
| [Setup](./setup.md) | Environment variables and repo structure |
| [Build plan](./build-plan.md) | Phases, demo reliability, next tasks |
| [Demo day](./demo-day.md) | Operator checklist for live / demo / fixture layers |
| [Hackathon](./hackathon.md) | Metrics, submission story, demo script, judging |
| [Risks](./risks.md) | Risks, definition of done, product statement |

## The loop

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
