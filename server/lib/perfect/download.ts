import { fetchWithTimeout, withRetry } from "../http/retry.ts";

const DOWNLOAD_TIMEOUT_MS = 30_000;

export async function downloadImage(url: string): Promise<Buffer> {
  const response = await withRetry(
    () =>
      fetchWithTimeout(
        url,
        {
          headers: {
            Accept: "image/*,*/*",
            "User-Agent": "RealityLens/0.1",
          },
        },
        DOWNLOAD_TIMEOUT_MS,
      ),
    { policy: "full" },
  );

  if (!response.ok) {
    throw new Error("Could not download the product image for try-on.");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (
    contentType &&
    !contentType.startsWith("image/") &&
    !contentType.includes("octet-stream")
  ) {
    throw new Error("Product image URL did not return an image.");
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 32) {
    throw new Error("Product image download was empty.");
  }

  return bytes;
}

export async function downloadFirstImage(urls: string[]): Promise<Buffer> {
  const unique = [...new Set(urls.filter(Boolean))];
  let lastError: unknown;
  for (const url of unique) {
    try {
      return await downloadImage(url);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Could not download the product image for try-on.");
}

