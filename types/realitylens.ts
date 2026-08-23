export type ProductCategory =
  | "shoes"
  | "clothes"
  | "watch"
  | "bag"
  | "hat"
  | "ring"
  | "bracelet"
  | "earrings"
  | "necklace"
  | "scarf"
  | "other";

export type MatchLabel = "exact_match" | "best_match" | "similar";

export interface ProductMatch {
  id: string;
  title: string;
  category: ProductCategory;
  imageUrl?: string;
  source?: string;
  url?: string;
  label: MatchLabel;
}

export interface Offer {
  id: string;
  title: string;
  merchant?: string;
  priceText?: string;
  priceValue?: number;
  currency?: string;
  inStock?: boolean;
  rating?: number;
  reviews?: number;
  imageUrl?: string;
  url: string;
}

export interface ScanResult {
  scanId: string;
  bestMatch: ProductMatch | null;
  offers: Offer[];
  tryOnSupported: boolean;
  tryOnCategory?: ProductCategory;
}

export type TryOnStatus = "processing" | "completed" | "error";

export interface TryOnResult {
  status: TryOnStatus;
  jobId?: string;
  resultImageUrl?: string;
  provider?: "perfect_corp";
  error?: string;
}
