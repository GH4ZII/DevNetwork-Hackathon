/**
 * One-shot proof that Perfect Corp watch VTO works with the configured API key.
 * Usage: npx tsx scripts/prove-watch.ts
 */
import { getPerfectCorpBase, getPerfectCorpKey } from "../server/lib/env.ts";
import { downloadImage } from "../server/lib/perfect/download.ts";
import { prepareForTryOn } from "../server/lib/image/tryon.ts";
import {
  createWatchTask,
  getWatchTask,
  uploadWatchFile,
  watchResultUrl,
} from "../server/lib/perfect/watch.ts";

const WRIST_URL = "https://picsum.photos/800/1200";
const WATCH_URL =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const baseUrl = getPerfectCorpBase();
  const apiKey = getPerfectCorpKey();

  console.log("Downloading sample wrist + watch images…");
  const [wristRaw, watchRaw] = await Promise.all([
    downloadImage(WRIST_URL),
    downloadImage(WATCH_URL),
  ]);
  const wrist = await prepareForTryOn(wristRaw);
  const watch = await prepareForTryOn(watchRaw);

  console.log("Uploading to Perfect Corp watch file API…");
  const [srcFileId, refFileId] = await Promise.all([
    uploadWatchFile(baseUrl, apiKey, wrist, "wrist.jpg"),
    uploadWatchFile(baseUrl, apiKey, watch, "watch.jpg"),
  ]);
  console.log("src_file_id:", srcFileId);
  console.log("ref_file_id:", refFileId);

  console.log("Creating watch VTO task…");
  const taskId = await createWatchTask(baseUrl, apiKey, {
    srcFileId,
    refFileId,
  });
  console.log("task_id:", taskId);

  const started = Date.now();
  const timeoutMs = 120_000;
  while (Date.now() - started < timeoutMs) {
    const status = await getWatchTask(baseUrl, apiKey, taskId);
    const taskStatus = status.data?.task_status;
    console.log("poll:", taskStatus ?? "unknown");

    if (taskStatus === "success") {
      const url = watchResultUrl(status);
      console.log("\nSUCCESS");
      console.log("result_url:", url);
      return;
    }

    if (taskStatus === "error") {
      console.error("Task error:", JSON.stringify(status.data?.error ?? status));
      process.exit(1);
    }

    await sleep(3000);
  }

  console.error("Timed out waiting for watch try-on.");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
