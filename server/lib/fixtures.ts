import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { PROJECT_ROOT } from "./env.ts";
import { assertScanResult, assertTryOnResult } from "./validate.ts";
import type { ProductCategory, ScanResult, TryOnResult } from "../../types/realitylens.ts";

function readJson(name: string): unknown {
  const path = resolve(PROJECT_ROOT, "server", "fixtures", name);
  return JSON.parse(readFileSync(path, "utf8"));
}

function scanFixtureFile(): string {
  const which = process.env.FIXTURE_SCAN?.trim().toLowerCase();
  if (which === "empty") return "scan-empty.json";
  if (which === "watch") return "scan-watch-success.json";
  return "scan-success.json";
}

/** Success fixture by default; FIXTURE_SCAN=empty | watch */
export function loadScanFixture(): ScanResult {
  const file = scanFixtureFile();
  console.log(`[fixtures] loading ${file}`);
  const result = assertScanResult(readJson(file));
  return {
    ...result,
    scanId: `scan_${randomUUID()}`,
  };
}

export function loadTryOnFixture(
  jobId: string,
  category: ProductCategory = "shoes",
): TryOnResult {
  const file =
    category === "watch"
      ? "try-on-watch-completed.json"
      : "try-on-completed.json";
  console.log(`[fixtures] loading ${file}`);
  const result = assertTryOnResult(readJson(file));
  return {
    ...result,
    jobId,
    status: "completed",
  };
}
