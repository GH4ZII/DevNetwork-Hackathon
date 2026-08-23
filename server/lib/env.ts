import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
config({ path: resolve(root, ".env") });

export const PROJECT_ROOT = root;

function required(name: string, hint: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and add your key. ${hint}`,
    );
  }
  return value;
}

export function getSerpApiKey(): string {
  return required(
    "SERPAPI_API_KEY",
    "Create one at https://serpapi.com/users/sign_up",
  );
}

export function getPerfectCorpKey(): string {
  return required(
    "PERFECT_CORP_API_KEY",
    "Create one at https://yce.makeupar.com/api-console/en/api-keys/",
  );
}

export function getPerfectCorpBase(): string {
  return (
    process.env.PERFECT_CORP_API_BASE?.trim() ||
    "https://yce-api-01.makeupar.com"
  );
}

/** Dev-only: serve handcrafted fixtures and skip SerpApi / Perfect Corp. */
export function isFixtureMode(): boolean {
  const value = process.env.USE_FIXTURES?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}
