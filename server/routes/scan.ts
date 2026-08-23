import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { asString, publicError, readUpload } from "../lib/http.ts";
import { compressForSerpApi } from "../lib/image/preprocess.ts";
import { getSerpApiKey } from "../lib/env.ts";
import { uploadSerpApiImage } from "../lib/serpapi/image-upload.ts";
import { searchGoogleLens } from "../lib/serpapi/lens.ts";
import { normalizeScanResult } from "../lib/serpapi/normalize.ts";
import { getScan, saveScan } from "../lib/store.ts";

export const scanRoutes = new Hono();

scanRoutes.post("/api/scan", async (c) => {
  try {
    const body = await c.req.parseBody();
    const image = await readUpload(body.image, "image");
    const compressed = await compressForSerpApi(image);
    const apiKey = getSerpApiKey();
    const uploaded = await uploadSerpApiImage(apiKey, compressed);
    const [visual, products] = await Promise.all([
      searchGoogleLens(apiKey, uploaded.image_id, "visual_matches"),
      searchGoogleLens(apiKey, uploaded.image_id, "products"),
    ]);
    const result = normalizeScanResult(visual, products);
    const productImageUrl =
      result.bestMatch?.imageUrl ?? result.offers[0]?.imageUrl;

    saveScan({
      scanId: result.scanId,
      result,
      productImageUrl,
      createdAt: Date.now(),
    });

    return c.json(result);
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error("POST /api/scan failed", err);
    return c.json(
      { error: publicError(err, "Visual search failed. Try another photo.") },
      502,
    );
  }
});

scanRoutes.get("/api/scan/:id", (c) => {
  const id = asString(c.req.param("id"));
  if (!id) {
    throw new HTTPException(400, { message: "Missing scan id." });
  }

  const stored = getScan(id);
  if (!stored) {
    return c.json({ error: "Scan not found. Scan the product again." }, 404);
  }

  return c.json(stored.result);
});
