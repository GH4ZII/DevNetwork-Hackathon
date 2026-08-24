import { createHash, randomUUID } from "node:crypto";
import type { ScanResult } from "../../types/realitylens.ts";

const TTL_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 50;

interface CacheEntry {
  result: ScanResult;
  productImageUrl?: string;
  createdAt: number;
  lastAccess: number;
}

const cache = new Map<string, CacheEntry>();

export function hashImageBytes(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function cacheKey(imageHash: string, country: string): string {
  return `${imageHash}:${country}`;
}

export function getCachedScan(
  imageHash: string,
  country: string,
): {
  result: ScanResult;
  productImageUrl?: string;
} | undefined {
  const key = cacheKey(imageHash, country);
  const entry = cache.get(key);
  if (!entry) return undefined;

  if (Date.now() - entry.createdAt > TTL_MS) {
    cache.delete(key);
    return undefined;
  }

  entry.lastAccess = Date.now();
  const fresh: ScanResult = {
    ...entry.result,
    scanId: `scan_${randomUUID()}`,
    bestMatch: entry.result.bestMatch
      ? { ...entry.result.bestMatch }
      : null,
    offers: entry.result.offers.map((offer) => ({ ...offer })),
  };

  return {
    result: fresh,
    productImageUrl: entry.productImageUrl,
  };
}

export function setCachedScan(
  imageHash: string,
  country: string,
  result: ScanResult,
  productImageUrl?: string,
): void {
  evictExpired();
  while (cache.size >= MAX_ENTRIES) {
    evictOldest();
  }

  const now = Date.now();
  cache.set(cacheKey(imageHash, country), {
    result: {
      ...result,
      bestMatch: result.bestMatch ? { ...result.bestMatch } : null,
      offers: result.offers.map((offer) => ({ ...offer })),
    },
    productImageUrl,
    createdAt: now,
    lastAccess: now,
  });
}

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.createdAt > TTL_MS) {
      cache.delete(key);
    }
  }
}

function evictOldest(): void {
  let oldestKey: string | undefined;
  let oldestAccess = Infinity;
  for (const [key, entry] of cache) {
    if (entry.lastAccess < oldestAccess) {
      oldestAccess = entry.lastAccess;
      oldestKey = key;
    }
  }
  if (oldestKey) cache.delete(oldestKey);
}
