import { serpApiGet } from "./client.ts";
import { coerceLensResponse } from "../validate.ts";

export type GoogleLensType =
  | "all"
  | "products"
  | "visual_matches"
  | "exact_matches"
  | "about_this_image";

export interface LensPrice {
  value?: string;
  extracted_value?: number;
  currency?: string;
}

export interface LensVisualMatch {
  position?: number;
  title?: string;
  link?: string;
  source?: string;
  rating?: number;
  reviews?: number;
  price?: LensPrice | string;
  extracted_price?: number;
  in_stock?: boolean;
  thumbnail?: string;
  image?: string;
}

export interface GoogleLensResponse {
  visual_matches?: LensVisualMatch[];
  shopping_results?: LensVisualMatch[];
  related_content?: unknown[];
  search_metadata?: Record<string, unknown>;
  search_parameters?: Record<string, unknown>;
  error?: string;
}

export async function searchGoogleLens(
  apiKey: string,
  imageId: string,
  type: GoogleLensType,
): Promise<GoogleLensResponse> {
  const raw = await serpApiGet({
    engine: "google_lens",
    image_id: imageId,
    type,
    api_key: apiKey,
  });
  const body = coerceLensResponse(raw);

  if (!body.visual_matches?.length && body.shopping_results?.length) {
    body.visual_matches = body.shopping_results;
  }

  return body;
}
