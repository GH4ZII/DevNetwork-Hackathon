import { serpApiPostForm } from "./client.ts";

export interface ImageUploadResult {
  message: string;
  image_id: string;
}

export async function uploadSerpApiImage(
  apiKey: string,
  image: Buffer,
  filename = "scan.jpg",
): Promise<ImageUploadResult> {
  const form = new FormData();
  form.append(
    "image",
    new Blob([new Uint8Array(image)], { type: "image/jpeg" }),
    filename,
  );
  form.append("api_key", apiKey);

  const body = (await serpApiPostForm("/image", form)) as ImageUploadResult;
  if (!body.image_id) {
    throw new Error("SerpApi image upload did not return image_id.");
  }
  return body;
}
