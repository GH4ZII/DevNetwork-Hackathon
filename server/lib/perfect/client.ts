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
): Promise<unknown> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

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
}
