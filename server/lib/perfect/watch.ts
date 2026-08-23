import { basename } from "node:path";
import { fetchWithTimeout, withRetry } from "../http/retry.ts";
import { perfectRequest } from "./client.ts";

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

export interface WatchTaskStatus {
  status?: number;
  data?: {
    error?: unknown;
    results?: { url?: string };
    task_status?: string;
  };
  error?: string;
  url?: string;
}

export async function uploadWatchFile(
  baseUrl: string,
  apiKey: string,
  file: Buffer,
  filePath: string,
): Promise<string> {
  const contentType = contentTypeFor(filePath);
  const created = (await perfectRequest(
    baseUrl,
    apiKey,
    "/s2s/v2.0/file/2d-vto/watch",
    {
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
    },
    { policy: "network" },
  )) as FileApiResponse;

  const uploaded = created.data?.files?.[0];
  const fileId = uploaded?.file_id;
  const request = uploaded?.requests?.[0];

  if (!fileId || !request?.url) {
    throw new Error("Perfect Corp watch file API did not return file_id and upload URL.");
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
      `Perfect Corp watch binary upload failed (${put.status}): ${detail.slice(0, 300)}`,
    );
  }

  return fileId;
}

export async function createWatchTask(
  baseUrl: string,
  apiKey: string,
  input: {
    srcFileId: string;
    refFileId: string;
  },
): Promise<string> {
  const created = (await perfectRequest(
    baseUrl,
    apiKey,
    "/s2s/v2.0/task/2d-vto/watch",
    {
      method: "POST",
      body: JSON.stringify({
        source_info: { name: input.srcFileId },
        src_file_id: input.srcFileId,
        ref_file_ids: [input.refFileId],
        object_infos: [
          {
            name: input.refFileId,
            ref_file_ids: [input.refFileId],
            parameter: {
              watch_need_remove_background: true,
              watch_shadow_intensity: 0.3,
              watch_ambient_light_intensity: 1,
            },
          },
        ],
      }),
    },
    { policy: "network" },
  )) as TaskCreateResponse;

  const taskId = created.data?.task_id;
  if (!taskId) {
    throw new Error("Perfect Corp watch task did not return task_id.");
  }
  return taskId;
}

export async function getWatchTask(
  baseUrl: string,
  apiKey: string,
  taskId: string,
): Promise<WatchTaskStatus> {
  return (await perfectRequest(
    baseUrl,
    apiKey,
    `/s2s/v2.0/task/2d-vto/watch/${encodeURIComponent(taskId)}`,
    {},
    { policy: "full" },
  )) as WatchTaskStatus;
}

export function watchResultUrl(status: WatchTaskStatus): string | undefined {
  return status.data?.results?.url ?? status.url;
}

function contentTypeFor(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
  return "image/jpg";
}
