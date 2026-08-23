import sharp from "sharp";

const TARGET_LONG_EDGE = 2048;

export async function prepareForTryOn(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({
      width: TARGET_LONG_EDGE,
      height: TARGET_LONG_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}
