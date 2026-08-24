import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

const STORAGE_KEY = "@realitylens/looks";

export type LookStep = {
  id: string;
  resultImageUri: string;
  baseImageUri?: string;
  productTitle?: string;
  productImageUrl?: string;
  garmentCategory?: string;
  shopUrl?: string;
  scanId?: string;
  jobId?: string;
  savedAt: number;
};

export type LookCollection = {
  id: string;
  createdAt: number;
  updatedAt: number;
  steps: LookStep[];
};

export type SaveLookInput = {
  resultImageUrl: string;
  baseImageUri?: string;
  productTitle?: string;
  productImageUrl?: string;
  garmentCategory?: string;
  shopUrl?: string;
  scanId?: string;
  jobId?: string;
};

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function looksDir(): string {
  const base = FileSystem.documentDirectory;
  if (!base) {
    throw new Error("File storage is not available on this device.");
  }
  return `${base}looks/`;
}

async function ensureLooksDir(): Promise<string> {
  const dir = looksDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

async function persistImage(uri: string, filename: string): Promise<string> {
  const dir = await ensureLooksDir();
  const dest = `${dir}${filename}`;
  if (/^https?:\/\//i.test(uri)) {
    const result = await FileSystem.downloadAsync(uri, dest);
    return result.uri;
  }
  const from =
    uri.startsWith("file://") ||
    uri.startsWith("content://") ||
    uri.startsWith("ph://")
      ? uri
      : `file://${uri}`;
  await FileSystem.copyAsync({ from, to: dest });
  return dest;
}

async function loadAll(): Promise<LookCollection[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LookCollection[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAll(collections: LookCollection[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
}

async function buildStep(input: SaveLookInput): Promise<LookStep> {
  const id = uid("step");
  const resultImageUri = await persistImage(
    input.resultImageUrl,
    `${id}_after.jpg`,
  );
  let baseImageUri: string | undefined;
  if (input.baseImageUri) {
    try {
      baseImageUri = await persistImage(input.baseImageUri, `${id}_before.jpg`);
    } catch {
      baseImageUri = undefined;
    }
  }
  return {
    id,
    resultImageUri,
    baseImageUri,
    productTitle: input.productTitle,
    productImageUrl: input.productImageUrl,
    garmentCategory: input.garmentCategory,
    shopUrl: input.shopUrl,
    scanId: input.scanId,
    jobId: input.jobId,
    savedAt: Date.now(),
  };
}

export async function listCollections(): Promise<LookCollection[]> {
  const all = await loadAll();
  return [...all].sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getCollection(
  id: string,
): Promise<LookCollection | null> {
  const all = await loadAll();
  return all.find((collection) => collection.id === id) ?? null;
}

export async function findCollectionByJobId(
  jobId: string,
): Promise<LookCollection | null> {
  const all = await loadAll();
  return (
    all.find((collection) =>
      collection.steps.some((step) => step.jobId === jobId),
    ) ?? null
  );
}

export async function createCollection(
  input: SaveLookInput,
): Promise<LookCollection> {
  const step = await buildStep(input);
  const now = Date.now();
  const collection: LookCollection = {
    id: uid("look"),
    createdAt: now,
    updatedAt: now,
    steps: [step],
  };
  const all = await loadAll();
  all.push(collection);
  await saveAll(all);
  return collection;
}

export async function appendStep(
  collectionId: string,
  input: SaveLookInput,
): Promise<LookCollection> {
  const all = await loadAll();
  const index = all.findIndex((collection) => collection.id === collectionId);
  if (index < 0) {
    return createCollection(input);
  }
  const step = await buildStep(input);
  const updated: LookCollection = {
    ...all[index],
    updatedAt: Date.now(),
    steps: [...all[index].steps, step],
  };
  all[index] = updated;
  await saveAll(all);
  return updated;
}

async function safeDelete(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore missing files
  }
}

export async function deleteCollection(id: string): Promise<void> {
  const all = await loadAll();
  const collection = all.find((item) => item.id === id);
  await saveAll(all.filter((item) => item.id !== id));
  if (!collection) return;
  for (const step of collection.steps) {
    await safeDelete(step.resultImageUri);
    if (step.baseImageUri) await safeDelete(step.baseImageUri);
  }
}

export function coverUri(collection: LookCollection): string | undefined {
  return collection.steps[collection.steps.length - 1]?.resultImageUri;
}

export function collectionTitle(collection: LookCollection): string {
  const titles = collection.steps
    .map((step) => step.productTitle)
    .filter((title): title is string => Boolean(title));
  if (titles.length === 0) return "Saved look";
  return titles[titles.length - 1] ?? "Saved look";
}

export function looksLabel(count: number): string {
  return count === 1 ? "1 look" : `${count} looks`;
}
