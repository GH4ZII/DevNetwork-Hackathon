# UX

[← Spec index](./README.md)

## States

Every major step needs a polished state.

### Scan

- idle
- camera permission denied
- image selected
- compressing
- uploading
- searching
- complete
- no match
- error

### Product

- high-confidence result
- visually similar result
- no commerce results
- offers loading
- no price available

### Try-on

- supported
- unsupported
- awaiting user photo
- validating photo
- processing
- generated
- generation failed
- retry

No raw API errors should reach the user.

## Visual direction

RealityLens should feel like a consumer camera product, not a SaaS panel.

### Style

- dark / near-black camera UI
- large imagery
- minimal typography
- glass-like floating controls
- high-contrast price/result cards
- smooth transitions
- rounded mobile UI
- product imagery should dominate the screen

### Avoid

- giant navigation bars
- admin dashboards
- tables
- sidebars
- chat bubbles
- excessive copy
- generic gradient “AI” aesthetic
- fake terminal animations

## Suggested screens

```text
Scan
  Native camera + gallery upload

Product
  Match + offers for the current scan

Try On
  User photo + try-on flow

Reveal
  Before/after result

About
  Optional explanation for judges
```

For hackathon speed, these can be expo-router screens or in-app navigation states.
