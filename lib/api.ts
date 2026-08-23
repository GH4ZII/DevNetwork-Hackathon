import Constants from "expo-constants";
import type { ScanResult, TryOnResult } from "../types/realitylens";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function expoHost(): string | undefined {
  const extra = Constants as unknown as {
    expoGoConfig?: { debuggerHost?: string };
    debuggerHost?: string;
  };
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.linkingUri,
    extra.expoGoConfig?.debuggerHost,
    extra.debuggerHost,
  ];

  for (const value of candidates) {
    const match = String(value ?? "").match(/(\d+\.\d+\.\d+\.\d+)(?::(\d+))?/);
    if (match?.[1]) {
      return `${match[1]}:${match[2] || "8081"}`;
    }
  }

  return undefined;
}

function normalizeUrl(raw: string): string | undefined {
  let candidate = raw.trim();
  if (!candidate) return undefined;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `http://${candidate}`;
  }

  try {
    const url = new URL(candidate);
    if (!url.port) url.port = "8081";
    return url.origin;
  } catch {
    return undefined;
  }
}

function apiBaseUrls(): string[] {
  const urls: string[] = [];
  const host = expoHost();
  if (host) {
    const ip = host.split(":")[0];
    urls.push(`http://${host}`);
    urls.push(`http://${ip}:3000`);
  }

  const fromEnv = normalizeUrl(process.env.EXPO_PUBLIC_API_URL ?? "");
  if (fromEnv && !urls.includes(fromEnv)) urls.push(fromEnv);

  if (urls.length === 0) {
    urls.push("http://localhost:8081", "http://localhost:3000");
  }

  return urls;
}

export const API_URL = apiBaseUrls()[0];

function imagePart(uri: string, filename: string) {
  const normalized =
    uri.startsWith("file://") ||
    uri.startsWith("content://") ||
    uri.startsWith("ph://")
      ? uri
      : `file://${uri}`;
  return {
    uri: normalized,
    name: filename,
    type: "image/jpeg",
  } as unknown as Blob;
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const message =
      body && typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : `Request failed (${response.status})`;
    throw new ApiError(message);
  }

  if (typeof body === "string") {
    throw new ApiError(
      `API returned HTML instead of JSON. Check that npm run server is running.`,
    );
  }

  return body as T;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const bases = apiBaseUrls();
  let lastError: ApiError | undefined;

  for (const base of bases) {
    try {
      const response = await fetch(`${base}${path}`, init);
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        lastError = new ApiError(
          `Got a non-JSON response from ${base}. Restart Expo with npx expo start -c so Metro can proxy /api.`,
        );
        continue;
      }
      return response;
    } catch {
      lastError = new ApiError(
        `Could not reach the API at ${base}. Keep npm run server running.`,
      );
    }
  }

  throw (
    lastError ??
    new ApiError(
      "Could not reach the API. Start it with npm run server, then reload the app.",
    )
  );
}

export async function postScan(imageUri: string): Promise<ScanResult> {
  const form = new FormData();
  form.append("image", imagePart(imageUri, "scan.jpg"));
  const response = await apiFetch("/api/scan", {
    method: "POST",
    body: form,
  });
  return parseJson<ScanResult>(response);
}

export async function getScan(scanId: string): Promise<ScanResult> {
  const response = await apiFetch(`/api/scan/${encodeURIComponent(scanId)}`);
  return parseJson<ScanResult>(response);
}

export async function postTryOn(input: {
  scanId: string;
  userImageUri: string;
  productImageUrl?: string;
  gender: "male" | "female";
}): Promise<TryOnResult> {
  const form = new FormData();
  form.append("userImage", imagePart(input.userImageUri, "user.jpg"));
  form.append("scanId", input.scanId);
  form.append("gender", input.gender);
  if (input.productImageUrl) {
    form.append("productImageUrl", input.productImageUrl);
  }
  const response = await apiFetch("/api/try-on", {
    method: "POST",
    body: form,
  });
  return parseJson<TryOnResult>(response);
}

export async function getTryOn(jobId: string): Promise<TryOnResult> {
  const response = await apiFetch(`/api/try-on/${encodeURIComponent(jobId)}`);
  return parseJson<TryOnResult>(response);
}

export function getApiUrl(): string {
  return API_URL;
}
