export class SerpApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "SerpApiError";
  }
}

export async function serpApiPostForm(
  path: string,
  form: FormData,
): Promise<unknown> {
  const response = await fetch(`https://serpapi.com${path}`, {
    method: "POST",
    body: form,
  });
  return parseJson(response);
}

export async function serpApiGet(
  params: Record<string, string>,
): Promise<unknown> {
  const url = new URL("https://serpapi.com/search.json");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  return parseJson(response);
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown = text;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const detail =
      body && typeof body === "object"
        ? JSON.stringify(body)
        : String(body).slice(0, 300);
    throw new SerpApiError(
      `SerpApi HTTP ${response.status}${detail ? `: ${detail}` : ""}`,
      response.status,
      body,
    );
  }

  if (body && typeof body === "object" && "error" in body) {
    const error = (body as { error: unknown }).error;
    throw new SerpApiError(String(error), response.status, body);
  }

  return body;
}
