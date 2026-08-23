import { HTTPException } from "hono/http-exception";

export async function readUpload(value: unknown, field: string): Promise<Buffer> {
  const file = Array.isArray(value) ? value[0] : value;
  let bytes: Buffer | undefined;

  if (file instanceof File || file instanceof Blob) {
    bytes = Buffer.from(await file.arrayBuffer());
  } else if (file && typeof file === "object" && "arrayBuffer" in file) {
    const maybe = file as { arrayBuffer: () => Promise<ArrayBuffer> };
    if (typeof maybe.arrayBuffer === "function") {
      bytes = Buffer.from(await maybe.arrayBuffer());
    }
  }

  if (!bytes || bytes.length < 32) {
    throw new HTTPException(400, {
      message: `Missing or empty ${field} upload.`,
    });
  }

  return bytes;
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function publicError(err: unknown, fallback: string): string {
  if (err instanceof HTTPException) return err.message;
  if (err instanceof Error && err.message && !looksLikeVendorPayload(err.message)) {
    return err.message;
  }
  return fallback;
}

function looksLikeVendorPayload(message: string): boolean {
  return message.length > 280 || message.includes("{") || message.includes("<");
}
