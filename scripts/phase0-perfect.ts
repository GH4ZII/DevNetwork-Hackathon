import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  getPerfectCorpBase,
  getPerfectCorpKey,
  PROJECT_ROOT,
} from "../server/lib/env.ts";
import {
  createShoesTask,
  pollShoesTask,
  uploadPerfectFile,
  type ShoeGender,
  type ShoeStyle,
} from "../server/lib/perfect/shoes.ts";
import { fixturePath, writeJsonFixture } from "./lib/fixtures.ts";

function arg(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

function positionalGender(): string | undefined {
  const value = process.argv.slice(2).find((arg) => arg === "male" || arg === "female");
  return value;
}

async function main(): Promise<void> {
  const selfiePath = resolve(
    arg("selfie", resolve(PROJECT_ROOT, "assets/demo/selfie.jpg"))!,
  );
  const shoesPath = resolve(
    arg("shoes", resolve(PROJECT_ROOT, "assets/demo/shoes.jpg"))!,
  );
  const gender = (arg(
    "gender",
    positionalGender() ?? process.env.PERFECT_CORP_GENDER ?? "male",
  ) ?? "male") as ShoeGender;
  const style = (arg("style", process.env.PERFECT_CORP_STYLE ?? "random") ??
    "random") as ShoeStyle;

  if (gender !== "male" && gender !== "female") {
    throw new Error('gender must be "male" or "female".');
  }

  const apiKey = getPerfectCorpKey();
  const baseUrl = getPerfectCorpBase();

  let selfie: Buffer;
  try {
    selfie = await readFile(selfiePath);
  } catch {
    throw new Error(
      `Missing selfie at ${selfiePath}. Add a clear head-to-chest photo of one person, then rerun.`,
    );
  }

  const shoes = await readFile(shoesPath);

  console.log(`Selfie: ${selfiePath} (${selfie.length} bytes)`);
  console.log(`Shoes: ${shoesPath} (${shoes.length} bytes)`);
  console.log(`gender=${gender} style=${style}`);

  const srcFileId = await uploadPerfectFile(baseUrl, apiKey, selfie, selfiePath);
  console.log(`src_file_id: ${srcFileId}`);
  const refFileId = await uploadPerfectFile(baseUrl, apiKey, shoes, shoesPath);
  console.log(`ref_file_id: ${refFileId}`);

  const taskId = await createShoesTask(baseUrl, apiKey, {
    srcFileId,
    refFileId,
    gender,
    style,
  });
  console.log(`task_id: ${taskId}`);
  await writeJsonFixture(fixturePath("perfect", "task.json"), {
    task_id: taskId,
    gender,
    style,
  });

  console.log("Polling Perfect Corp shoes task…");
  const result = await pollShoesTask(baseUrl, apiKey, taskId);
  await writeJsonFixture(fixturePath("perfect", "status.json"), result);

  if (result.data?.task_status !== "success") {
    throw new Error(
      `Shoes try-on failed: ${JSON.stringify(result.data?.error ?? result)}`,
    );
  }

  const resultUrl = result.data.results?.url;
  if (!resultUrl) {
    throw new Error("Try-on succeeded but no result URL was returned.");
  }

  const image = await fetch(resultUrl);
  if (!image.ok) {
    throw new Error(`Could not download try-on result (${image.status}).`);
  }

  const outputPath = resolve(PROJECT_ROOT, "assets/demo/try-on-result.jpg");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, Buffer.from(await image.arrayBuffer()));
  console.log(`Try-on image saved to ${outputPath}`);
  console.log("Perfect Corp Phase 0 passed.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
