import sharp from "sharp";

const SERPAPI_MAX_BYTES = 500 * 1024;
const TARGET_LONG_EDGE = 1400;

export async function compressForSerpApi(input: Buffer): Promise<Buffer> {
  let quality = 82;
  let longestEdge = TARGET_LONG_EDGE;
  let output = await encode(input, longestEdge, quality);

  while (output.length > SERPAPI_MAX_BYTES && (quality > 40 || longestEdge > 800)) {
    if (quality > 40) {
      quality -= 8;
    } else {
      longestEdge = Math.round(longestEdge * 0.85);
    }
    output = await encode(input, longestEdge, quality);
  }

  if (output.length > SERPAPI_MAX_BYTES) {
    throw new Error(
      `Could not compress image to ≤500 KB (ended at ${output.length} bytes).`,
    );
  }

  return output;
}

function encode(
  input: Buffer,
  longestEdge: number,
  quality: number,
): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({
      width: longestEdge,
      height: longestEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}
