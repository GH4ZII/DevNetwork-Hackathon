import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { asString, publicError, readUpload } from "../lib/http.ts";
import {
  getPerfectCorpBase,
  getPerfectCorpKey,
  isFixtureMode,
} from "../lib/env.ts";
import { loadTryOnFixture } from "../lib/fixtures.ts";
import { prepareForTryOn } from "../lib/image/tryon.ts";
import { downloadFirstImage } from "../lib/perfect/download.ts";
import {
  createClothTask,
  getClothTask,
  uploadClothFile,
  type GarmentCategory,
} from "../lib/perfect/cloth.ts";
import {
  createWatchTask,
  getWatchTask,
  uploadWatchFile,
  watchResultUrl,
} from "../lib/perfect/watch.ts";
import {
  isTryOnSupported,
  resolveTryOnIntegration,
  toGarmentCategory,
  tryOnPhotoGuide,
} from "../lib/category/classify.ts";
import { getScan, getTryOnJob, saveTryOnJob } from "../lib/store.ts";
import { assertTryOnResult } from "../lib/validate.ts";
import type { TryOnResult } from "../../types/realitylens.ts";

export const tryOnRoutes = new Hono();

tryOnRoutes.post("/api/try-on", async (c) => {
  try {
    const body = await c.req.parseBody();
    const scanId = asString(body.scanId);
    if (!scanId) {
      throw new HTTPException(400, { message: "Missing scanId." });
    }

    const stored = getScan(scanId);
    if (!stored) {
      return c.json({ error: "Scan not found. Scan the product again." }, 404);
    }

    const category =
      stored.result.tryOnCategory ?? stored.result.bestMatch?.category;
    const integration = category ? resolveTryOnIntegration(category) : null;
    if (
      !category ||
      !stored.result.tryOnSupported ||
      !isTryOnSupported(category) ||
      !integration
    ) {
      return c.json(
        {
          error:
            "Try-on is available for shoes, clothing, and watches. Scan a supported item.",
        },
        400,
      );
    }

    const guide = tryOnPhotoGuide(category, stored.result.garmentCategory);

    if (isFixtureMode()) {
      await readUpload(body.userImage, "userImage");
      const jobId = `tryon_${randomUUID()}`;
      const result = assertTryOnResult(
        loadTryOnFixture(jobId, category),
      );
      saveTryOnJob({
        jobId,
        scanId,
        taskId: "fixture",
        result,
        createdAt: Date.now(),
        integration,
        garmentCategory: stored.result.garmentCategory,
      });
      return c.json({
        ...result,
        garmentCategory: stored.result.garmentCategory,
        hint: guide.hint,
      });
    }

    const productImageUrls = [
      asString(body.productImageUrl),
      stored.productImageUrl,
      stored.result.bestMatch?.imageUrl,
      ...stored.result.offers.map((offer) => offer.imageUrl),
    ].filter((url): url is string => Boolean(url));

    if (productImageUrls.length === 0) {
      return c.json({ error: "No product image is available for try-on." }, 400);
    }

    const userImage = await prepareForTryOn(
      await readUpload(body.userImage, "userImage"),
    );
    const productImage = await prepareForTryOn(
      await downloadFirstImage(productImageUrls),
    );

    const baseUrl = getPerfectCorpBase();
    const apiKey = getPerfectCorpKey();
    const jobId = `tryon_${randomUUID()}`;

    if (integration === "watch-vto") {
      const [srcFileId, refFileId] = await Promise.all([
        uploadWatchFile(baseUrl, apiKey, userImage, "wrist.jpg"),
        uploadWatchFile(baseUrl, apiKey, productImage, "watch.jpg"),
      ]);
      const taskId = await createWatchTask(baseUrl, apiKey, {
        srcFileId,
        refFileId,
      });
      const result: TryOnResult = { status: "processing", jobId };
      saveTryOnJob({
        jobId,
        scanId,
        taskId,
        result,
        createdAt: Date.now(),
        integration,
      });
      return c.json({
        ...assertTryOnResult(result),
        hint: guide.hint,
      });
    }

    const garmentCategory =
      stored.result.garmentCategory ??
      toGarmentCategory(category, stored.result.bestMatch?.title ?? "");
    if (!garmentCategory) {
      return c.json(
        { error: "Could not map this product to a try-on garment type." },
        400,
      );
    }

    const [srcFileId, refFileId] = await Promise.all([
      uploadClothFile(baseUrl, apiKey, userImage, "user.jpg"),
      uploadClothFile(baseUrl, apiKey, productImage, "product.jpg"),
    ]);
    const taskId = await createClothTask(baseUrl, apiKey, {
      srcFileId,
      refFileId,
      garmentCategory,
    });

    const result: TryOnResult = { status: "processing", jobId };
    saveTryOnJob({
      jobId,
      scanId,
      taskId,
      result,
      createdAt: Date.now(),
      integration,
      garmentCategory,
    });

    return c.json({
      ...assertTryOnResult(result),
      garmentCategory,
      hint: guide.hint,
    });
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    console.error("POST /api/try-on failed", err);
    return c.json(
      { error: publicError(err, "Try-on failed. Try another photo.") },
      502,
    );
  }
});

tryOnRoutes.get("/api/try-on/:jobId", async (c) => {
  const jobId = asString(c.req.param("jobId"));
  if (!jobId) {
    throw new HTTPException(400, { message: "Missing job id." });
  }

  const stored = getTryOnJob(jobId);
  if (!stored) {
    return c.json({ error: "Try-on job not found." }, 404);
  }

  if (stored.result.status !== "processing") {
    return c.json(assertTryOnResult(stored.result));
  }

  if (isFixtureMode()) {
    const scan = getScan(stored.scanId);
    const category =
      scan?.result.tryOnCategory ?? scan?.result.bestMatch?.category ?? "shoes";
    stored.result = assertTryOnResult(loadTryOnFixture(jobId, category));
    saveTryOnJob(stored);
    return c.json(stored.result);
  }

  try {
    const baseUrl = getPerfectCorpBase();
    const apiKey = getPerfectCorpKey();
    const isWatch = stored.integration === "watch-vto";
    const status = isWatch
      ? await getWatchTask(baseUrl, apiKey, stored.taskId)
      : await getClothTask(baseUrl, apiKey, stored.taskId);
    const taskStatus = status.data?.task_status;
    const resultUrl = isWatch
      ? watchResultUrl(status)
      : status.data?.results?.url;

    if (taskStatus === "success" && resultUrl) {
      stored.result = assertTryOnResult({
        status: "completed",
        jobId,
        resultImageUrl: resultUrl,
        provider: "perfect_corp",
      });
      saveTryOnJob(stored);
      return c.json(stored.result);
    }

    if (taskStatus === "error") {
      const watchMessage =
        isWatch &&
        status.data &&
        typeof status.data === "object" &&
        "error_message" in status.data &&
        typeof (status.data as { error_message?: string }).error_message ===
          "string"
          ? (status.data as { error_message: string }).error_message
          : undefined;
      stored.result = assertTryOnResult({
        status: "error",
        jobId,
        error: watchMessage?.toLowerCase().includes("hand")
          ? "No hand detected. Use a clear photo of your wrist."
          : "Try-on generation failed. Try another photo.",
      });
      saveTryOnJob(stored);
      return c.json(stored.result);
    }

    return c.json(assertTryOnResult(stored.result));
  } catch (err) {
    console.error("GET /api/try-on/:jobId failed", err);
    return c.json(
      { error: publicError(err, "Could not check try-on status.") },
      502,
    );
  }
});

export type { GarmentCategory };
