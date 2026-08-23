# Demo day

[← Spec index](./README.md)

Operator checklist for a reliable 60-second RealityLens demo.

## Before you start

- [ ] `npm run server` is running
- [ ] Expo Go on a real phone (`npx expo start`)
- [ ] LAN reachable: set `EXPO_PUBLIC_API_URL` if Metro proxy fails (e.g. `http://192.168.x.x:3000`)
- [ ] Camera + photo library permissions granted
- [ ] SerpApi + Perfect Corp keys in `.env` (for live Layer 1/2)

## Layer 1 — True live demo

- [ ] Scan a physical shoe with the camera
- [ ] Confirm match + offers
- [ ] Try On with a clear full-body / feet photo
- [ ] Optional: scan a watch, then use a clear wrist photo for try-on

## Layer 2 — Known demo assets (fast path)

In the app (no gallery hunting):

1. Tap **Use demo photo** on the camera screen
2. Tap **Try On**
3. Tap **Use demo selfie**
4. Generate and drag the before/after slider

Assets live in `assets/demo/shoes.jpg` and `assets/demo/selfie.jpg`.

## Layer 3 — Fixture fallback (no API credits)

If SerpApi / Perfect Corp are down during the talk:

```bash
# .env
USE_FIXTURES=1
# FIXTURE_SCAN=watch   # optional; default is shoes success
```

Restart `npm run server`. Any scan image returns fixture JSON; try-on completes immediately without Perfect Corp.

Do **not** present fixture mode as the live integration.

## Record the video

Follow the [hackathon demo script](./hackathon.md#demo-script) (~60s):

1. Show a real product
2. Scan → searching animation
3. Match + prices
4. Try On → reveal slider
5. End line: “See it. Scan it. Try it. Buy it.”

- [ ] Device testing completed on a real phone
- [ ] Final demo video recorded
