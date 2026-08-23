# Risks and definition of done

[← Spec index](./README.md)

## Biggest risks

### Risk 1 — Search returns visually similar but wrong products

Mitigation:

- label confidence honestly
- show several matches
- avoid claiming exact SKU when uncertain
- keep known demo products available

### Risk 2 — Product image is unusable for try-on

Mitigation:

- select the cleanest matching product image
- allow user to choose another result
- add image validation
- optionally remove/background-clean asset only if necessary

### Risk 3 — Try-on API latency

Mitigation:

- beautiful processing state
- asynchronous polling if required
- pre-test demo input
- never leave a frozen screen

### Risk 4 — Too many categories

Mitigation:

> One spectacular category beats nine unreliable categories.

Ship shoes first.

### Risk 5 — Scope explosion

Use this rule:

> If a feature does not improve Scan → Find → Compare → Try On, it waits.

## Definition of done

RealityLens MVP is done when a native app on a phone can perform this with real integrations:

```text
User takes or picks a product photo
        ↓
SerpApi receives the image
        ↓
RealityLens displays credible product matches
        ↓
RealityLens displays merchant/price results
        ↓
User selects Try On
        ↓
User supplies the required personal image
        ↓
Perfect Corp generates the result
        ↓
RealityLens shows a polished before/after reveal
```

If this flow works beautifully, **stop adding major features and polish the demo.**

## Final product statement

**RealityLens transforms visual curiosity into action.**

You no longer need to know the brand, model, product name, or search terms.

If you can see it, you can scan it.

If RealityLens can find it, you can compare it.

And if it's wearable, you can try it on.

> **See it. Scan it. Try it. Buy it.**
