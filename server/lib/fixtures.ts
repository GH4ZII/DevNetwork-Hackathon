import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { PROJECT_ROOT } from "./env.ts";
import { assertScanResult, assertTryOnResult } from "./validate.ts";
import type { ScanResult, TryOnResult } from "../../types/realitylens.ts";

function readJson(name: string): unknown {
  const path = resolve(PROJECT_ROOT, "server", "fixtures", name);
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Success fixture by default; set FIXTURE_SCAN=empty for no-product UI. */
export function loadScanFixture(): ScanResult {
  const which = process.env.FIXTURE_SCAN?.trim().toLowerCase();
  const file = which === "empty" ? "scan-empty.json" : "scan-success.json";
  console.log(`[fixtures] loading ${file}`);
  const result = assertScanResult(readJson(file));
  return {
    ...result,
    scanId: `scan_${randomUUID()}`,
  };
}

export function loadTryOnFixture(jobId: string): TryOnResult {
  console.log("[fixtures] loading try-on-completed.json");
  const result = assertTryOnResult(readJson("try-on-completed.json"));
  return {
    ...result,
    jobId,
    status: "completed",
  };
}
