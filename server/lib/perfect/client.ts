import {
  fetchWithTimeout,
  type RetryPolicy,
  withRetry,
} from "../http/retry.ts";

const PERFECT_TIMEOUT_MS = 45_000;

export class PerfectCorpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "PerfectCorpError";
  }
}

export async function perfectRequest(
  baseUrl: string,
  apiKey: string,
  path: string,
  init: RequestInit = {},
  options: { policy?: RetryPolicy } = {},
): Promise<unknown> {
  const method = (init.method ?? "GET").toUpperCase();
  const policy =
    options.policy ?? (method === "GET" || method === "HEAD" ? "full" : "network");

  return withRetry(
    async () => {
      const headers = new Headers(init.headers);
      headers.set("Authorization", `Bearer ${apiKey}`);
      if (init.body && !headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }

      const response = await fetchWithTimeout(
        `${baseUrl}${path}`,
        { ...init, headers },
        PERFECT_TIMEOUT_MS,
      );

      const text = await response.text();
      let body: unknown = text;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }

      if (!response.ok) {
        const message =
          body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : `Perfect Corp HTTP ${response.status}`;
        throw new PerfectCorpError(message, response.status, body);
      }

      return body;
    },
    { policy },
  );
}
