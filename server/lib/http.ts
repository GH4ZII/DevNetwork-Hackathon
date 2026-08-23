import { HTTPException } from "hono/http-exception";

export async function readUpload(value: unknown, field: string): Promise<Buffer> {
  const file = Array.isArray(value) ? value[0] : value;
  if (file instanceof File || file instanceof Blob) {
    return Buffer.from(await file.arrayBuffer());
  }

  if (file && typeof file === "object" && "arrayBuffer" in file) {
    const maybe = file as { arrayBuffer: () => Promise<ArrayBuffer> };
    if (typeof maybe.arrayBuffer === "function") {
      return Buffer.from(await maybe.arrayBuffer());
    }
  }

  throw new HTTPException(400, {
    message: `Missing ${field} upload.`,
  });
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
