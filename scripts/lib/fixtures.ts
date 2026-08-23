import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSecrets);
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([key, nested]) => {
        if (/api[_-]?key/i.test(key) || key === "Authorization") {
          return [key, "[redacted]"];
        }
        return [key, redactSecrets(nested)];
      },
    );
    return Object.fromEntries(entries);
  }

  if (typeof value === "string") {
    return value
      .replace(/api_key=[^&]+/gi, "api_key=[redacted]")
      .replace(/([?&]X-Amz-[^=]+=)[^&]+/gi, "$1[redacted]");
  }

  return value;
}

export async function writeJsonFixture(
  filePath: string,
  value: unknown,
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    `${JSON.stringify(redactSecrets(value), null, 2)}\n`,
    "utf8",
  );
}

export function fixturePath(...parts: string[]): string {
  return resolve(process.cwd(), "fixtures", ...parts);
}
