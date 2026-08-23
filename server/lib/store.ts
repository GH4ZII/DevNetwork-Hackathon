import type { ScanResult, TryOnResult } from "../../types/realitylens.ts";

export interface StoredScan {
  scanId: string;
  result: ScanResult;
  productImageUrl?: string;
  createdAt: number;
}

export interface StoredTryOnJob {
  jobId: string;
  scanId: string;
  taskId: string;
  result: TryOnResult;
  createdAt: number;
  garmentCategory?: string;
}

const scans = new Map<string, StoredScan>();
const tryOnJobs = new Map<string, StoredTryOnJob>();

export function saveScan(scan: StoredScan): void {
  scans.set(scan.scanId, scan);
}

export function getScan(scanId: string): StoredScan | undefined {
  return scans.get(scanId);
}

export function saveTryOnJob(job: StoredTryOnJob): void {
  tryOnJobs.set(job.jobId, job);
}

export function getTryOnJob(jobId: string): StoredTryOnJob | undefined {
  return tryOnJobs.get(jobId);
}
