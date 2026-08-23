export class TimeoutError extends Error {
  constructor(message = "Request timed out.") {
    super(message);
    this.name = "TimeoutError";
  }
}

export type RetryPolicy = "full" | "network" | "none";

export async function fetchWithTimeout(
  url: string,
  init: RequestInit | undefined,
  timeoutMs: number,
): Promise<Response> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal =
    init?.signal && typeof AbortSignal.any === "function"
      ? AbortSignal.any([init.signal, timeoutSignal])
      : timeoutSignal;

  try {
    return await fetch(url, { ...init, signal });
  } catch (err) {
    if (isAbortError(err)) {
      throw new TimeoutError(`Request timed out after ${timeoutMs}ms.`);
    }
    throw err;
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    baseMs?: number;
    policy?: RetryPolicy;
    isRetryable?: (err: unknown) => boolean;
  } = {},
): Promise<T> {
  const retries = options.retries ?? 2;
  const baseMs = options.baseMs ?? 400;
  const policy = options.policy ?? "full";

  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      const retryable =
        policy !== "none" &&
        (options.isRetryable?.(err) ?? defaultIsRetryable(err, policy));
      if (!retryable || attempt >= retries) throw err;
      const delay = baseMs * 2 ** attempt;
      attempt += 1;
      await sleep(delay);
    }
  }
}

function defaultIsRetryable(err: unknown, policy: RetryPolicy): boolean {
  if (isNetworkOrTimeout(err)) return true;
  if (policy === "network") return false;

  const status = httpStatusOf(err);
  return status === 429 || status === 502 || status === 503 || status === 504;
}

export function isNetworkOrTimeout(err: unknown): boolean {
  if (err instanceof TimeoutError) return true;
  if (isAbortError(err)) return true;
  if (!(err instanceof Error)) return false;
  const message = err.message.toLowerCase();
  return (
    err.name === "TypeError" ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("socket")
  );
}

function httpStatusOf(err: unknown): number | undefined {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof Error && err.name === "AbortError") ||
    (typeof DOMException !== "undefined" &&
      err instanceof DOMException &&
      err.name === "AbortError")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
