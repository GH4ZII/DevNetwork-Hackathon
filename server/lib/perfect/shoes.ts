import { basename } from "node:path";
import { perfectRequest } from "./client.ts";

export type ShoeGender = "female" | "male";
export type ShoeStyle =
  | "random"
  | "style_minimalist"
  | "style_bohemian"
  | "style_cottagecore"
  | "style_french_elegance"
  | "style_retro_fashion";

interface FileApiResponse {
  status?: number;
  data?: {
    files?: Array<{
      file_id?: string;
      requests?: Array<{
        method?: string;
        url?: string;
        headers?: Record<string, string>;
      }>;
    }>;
  };
  error?: string;
}

interface TaskCreateResponse {
  status?: number;
  data?: { task_id?: string };
  error?: string;
}

export interface ShoeTaskStatus {
  status?: number;
  data?: {
    error?: unknown;
    results?: { url?: string };
    task_status?: string;
  };
  error?: string;
}

export async function uploadPerfectFile(
  baseUrl: string,
  apiKey: string,
  file: Buffer,
  filePath: string,
): Promise<string> {
  const contentType = contentTypeFor(filePath);
  const created = (await perfectRequest(baseUrl, apiKey, "/s2s/v2.0/file/shoes", {
    method: "POST",
    body: JSON.stringify({
      files: [
        {
          content_type: contentType,
          file_name: basename(filePath),
          file_size: file.length,
        },
      ],
    }),
  })) as FileApiResponse;

  const uploaded = created.data?.files?.[0];
  const fileId = uploaded?.file_id;
  const request = uploaded?.requests?.[0];

  if (!fileId || !request?.url) {
    throw new Error("Perfect Corp file API did not return file_id and upload URL.");
  }

  const headers = new Headers(request.headers ?? {});
  if (!headers.has("Content-Type") && !headers.has("content-type")) {
    headers.set("Content-Type", contentType);
  }

  const put = await fetch(request.url, {
    method: request.method ?? "PUT",
    headers,
    body: new Uint8Array(file),
  });

  if (!put.ok) {
    const detail = await put.text();
    throw new Error(
      `Perfect Corp binary upload failed (${put.status}): ${detail.slice(0, 300)}`,
    );
  }

  return fileId;
}

export async function createShoesTask(
  baseUrl: string,
  apiKey: string,
  input: {
    srcFileId: string;
    refFileId: string;
    gender: ShoeGender;
    style?: ShoeStyle;
  },
): Promise<string> {
  const created = (await perfectRequest(baseUrl, apiKey, "/s2s/v2.0/task/shoes", {
    method: "POST",
    body: JSON.stringify({
      src_file_id: input.srcFileId,
      ref_file_id: input.refFileId,
      gender: input.gender,
      style: input.style ?? "random",
    }),
  })) as TaskCreateResponse;

  const taskId = created.data?.task_id;
  if (!taskId) {
    throw new Error("Perfect Corp shoes task did not return task_id.");
  }
  return taskId;
}

export async function getShoesTask(
  baseUrl: string,
  apiKey: string,
  taskId: string,
): Promise<ShoeTaskStatus> {
  return (await perfectRequest(
    baseUrl,
    apiKey,
    `/s2s/v2.0/task/shoes/${encodeURIComponent(taskId)}`,
  )) as ShoeTaskStatus;
}

export async function pollShoesTask(
  baseUrl: string,
  apiKey: string,
  taskId: string,
  options: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<ShoeTaskStatus> {
  const intervalMs = options.intervalMs ?? 3000;
  const timeoutMs = options.timeoutMs ?? 120_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const status = await getShoesTask(baseUrl, apiKey, taskId);
    const taskStatus = status.data?.task_status;
    if (taskStatus === "success" || taskStatus === "error") {
      return status;
    }
    await sleep(intervalMs);
  }

  throw new Error(`Perfect Corp shoes task timed out after ${timeoutMs}ms.`);
}

function contentTypeFor(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
  return "image/jpg";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
