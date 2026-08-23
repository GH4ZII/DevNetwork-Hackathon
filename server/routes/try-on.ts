import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { asString, publicError, readUpload } from "../lib/http.ts";
import { getPerfectCorpBase, getPerfectCorpKey } from "../lib/env.ts";
import { prepareForTryOn } from "../lib/image/tryon.ts";
import { downloadFirstImage } from "../lib/perfect/download.ts";
import {
  createShoesTask,
  getShoesTask,
  uploadPerfectFile,
  type ShoeGender,
} from "../lib/perfect/shoes.ts";
import { getScan, getTryOnJob, saveTryOnJob } from "../lib/store.ts";
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
    if (!stored.result.tryOnSupported || category !== "shoes") {
      return c.json(
        { error: "Try-on is only available for shoes in this version." },
        400,
      );
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

    const gender = parseGender(body.gender);
    const userImage = await prepareForTryOn(
      await readUpload(body.userImage, "userImage"),
    );
    const productImage = await prepareForTryOn(
      await downloadFirstImage(productImageUrls),
    );

    const baseUrl = getPerfectCorpBase();
    const apiKey = getPerfectCorpKey();
    const [srcFileId, refFileId] = await Promise.all([
      uploadPerfectFile(baseUrl, apiKey, userImage, "user.jpg"),
      uploadPerfectFile(baseUrl, apiKey, productImage, "product.jpg"),
    ]);
    const taskId = await createShoesTask(baseUrl, apiKey, {
      srcFileId,
      refFileId,
      gender,
    });

    const jobId = `tryon_${randomUUID()}`;
    const result: TryOnResult = { status: "processing", jobId };
    saveTryOnJob({
      jobId,
      scanId,
      taskId,
      result,
      createdAt: Date.now(),
    });

    return c.json(result);
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
    return c.json(stored.result);
  }

  try {
    const status = await getShoesTask(
      getPerfectCorpBase(),
      getPerfectCorpKey(),
      stored.taskId,
    );
    const taskStatus = status.data?.task_status;
    const resultUrl = status.data?.results?.url;

    if (taskStatus === "success" && resultUrl) {
      stored.result = {
        status: "completed",
        jobId,
        resultImageUrl: resultUrl,
        provider: "perfect_corp",
      };
      saveTryOnJob(stored);
      return c.json(stored.result);
    }

    if (taskStatus === "error") {
      stored.result = {
        status: "error",
        jobId,
        error: "Try-on generation failed. Try another photo.",
      };
      saveTryOnJob(stored);
      return c.json(stored.result);
    }

    return c.json(stored.result);
  } catch (err) {
    console.error("GET /api/try-on/:jobId failed", err);
    return c.json(
      { error: publicError(err, "Could not check try-on status.") },
      502,
    );
  }
});

function parseGender(value: unknown): ShoeGender {
  return asString(value) === "female" ? "female" : "male";
}
