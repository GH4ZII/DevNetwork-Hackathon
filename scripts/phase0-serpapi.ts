import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getSerpApiKey, PROJECT_ROOT } from "../server/lib/env.ts";
import { compressForSerpApi } from "../server/lib/image/preprocess.ts";
import { uploadSerpApiImage } from "../server/lib/serpapi/image-upload.ts";
import { searchGoogleLens } from "../server/lib/serpapi/lens.ts";
import { normalizeScanResult } from "../server/lib/serpapi/normalize.ts";
import { fixturePath, writeJsonFixture } from "./lib/fixtures.ts";

const DEFAULT_IMAGE = resolve(PROJECT_ROOT, "assets/demo/shoes.jpg");

async function main(): Promise<void> {
  const imagePath = resolve(process.argv[2] ?? DEFAULT_IMAGE);
  const apiKey = getSerpApiKey();
  const original = await readFile(imagePath);
  const compressed = await compressForSerpApi(original);

  console.log(`Image: ${imagePath}`);
  console.log(
    `Compressed ${original.length} bytes → ${compressed.length} bytes (≤500 KB)`,
  );

  const upload = await uploadSerpApiImage(apiKey, compressed, "shoes.jpg");
  console.log(`image_id: ${upload.image_id}`);
  await writeJsonFixture(fixturePath("serpapi", "upload.json"), upload);

  const visual = await searchGoogleLens(
    apiKey,
    upload.image_id,
    "visual_matches",
  );
  const visualCount = visual.visual_matches?.length ?? 0;
  console.log(`visual_matches: ${visualCount}`);
  if (visualCount === 0) {
    throw new Error("Google Lens returned no visual_matches.");
  }
  console.log(`  #1 ${visual.visual_matches?.[0]?.title ?? "(untitled)"}`);
  await writeJsonFixture(fixturePath("serpapi", "visual_matches.json"), visual);

  const products = await searchGoogleLens(apiKey, upload.image_id, "products");
  const productCount = products.visual_matches?.length ?? 0;
  const priced =
    products.visual_matches?.filter((match) => match.price != null).length ?? 0;
  console.log(`products: ${productCount} (${priced} with price)`);
  if (productCount === 0) {
    throw new Error("Google Lens returned no product results.");
  }
  await writeJsonFixture(fixturePath("serpapi", "products.json"), products);

  const normalized = normalizeScanResult(visual, products);
  console.log(`bestMatch: ${normalized.bestMatch?.title ?? "none"}`);
  console.log(`category: ${normalized.tryOnCategory ?? "other"}`);
  console.log(`offers: ${normalized.offers.length}`);
  await writeJsonFixture(fixturePath("serpapi", "normalized.json"), normalized);

  console.log("SerpApi Phase 0 passed. Fixtures saved under fixtures/serpapi/");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
