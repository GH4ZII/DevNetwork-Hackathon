import { basename } from "node:path";
import { fetchWithTimeout, withRetry } from "../http/retry.ts";
import { perfectRequest } from "./client.ts";

export type GarmentCategory =
  | "full_body"
  | "lower_body"
  | "upper_body"
  | "outerwear"
  | "shoes"
  | "auto";

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

export interface ClothTaskStatus {
  status?: number;
  data?: {
    error?: unknown;
    results?: { url?: string };
    task_status?: string;
  };
  error?: string;
}

/** Generic File API used by Clothes try-on (preserves the source photo). */
export async function uploadClothFile(
  baseUrl: string,
  apiKey: string,
  file: Buffer,
  filePath: string,
): Promise<string> {
  const contentType = contentTypeFor(filePath);
  const created = (await perfectRequest(baseUrl, apiKey, "/s2s/v2.0/file", {
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

  const put = await withRetry(
    () =>
      fetchWithTimeout(
        request.url!,
        {
          method: request.method ?? "PUT",
          headers,
          body: new Uint8Array(file),
        },
        45_000,
      ),
    { policy: "network" },
  );

  if (!put.ok) {
    const detail = await put.text();
    throw new Error(
      `Perfect Corp binary upload failed (${put.status}): ${detail.slice(0, 300)}`,
    );
  }

  return fileId;
}

/**
 * Clothes try-on with garment_category=shoes swaps only footwear and keeps
 * the rest of the source photo. The dedicated /task/shoes API regenerates
 * outfit + background from style presets — not what we want for RealityLens.
 */
export async function createClothTask(
  baseUrl: string,
  apiKey: string,
  input: {
    srcFileId: string;
    refFileId: string;
    garmentCategory: GarmentCategory;
  },
): Promise<string> {
  const created = (await perfectRequest(
    baseUrl,
    apiKey,
    "/s2s/v2.0/task/cloth-v4",
    {
      method: "POST",
      body: JSON.stringify({
        src_file_id: input.srcFileId,
        ref_file_id: input.refFileId,
        garment_category: input.garmentCategory,
      }),
    },
    { policy: "network" },
  )) as TaskCreateResponse;

  const taskId = created.data?.task_id;
  if (!taskId) {
    throw new Error("Perfect Corp cloth task did not return task_id.");
  }
  return taskId;
}

export async function getClothTask(
  baseUrl: string,
  apiKey: string,
  taskId: string,
): Promise<ClothTaskStatus> {
  return (await perfectRequest(
    baseUrl,
    apiKey,
    `/s2s/v2.0/task/cloth-v4/${encodeURIComponent(taskId)}`,
    {},
    { policy: "full" },
  )) as ClothTaskStatus;
}

function contentTypeFor(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
  return "image/jpg";
}
