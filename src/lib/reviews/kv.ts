import "server-only";

import type { ReviewStoreKind } from "./types";

/**
 * Minimal key/value contract used by the review store. Values are strings
 * (JSON documents or base64 image payloads).
 */
export interface ReviewKv {
  readonly kind: ReviewStoreKind;
  get(key: string): Promise<string | null>;
  getMany(keys: readonly string[]): Promise<(string | null)[]>;
  put(key: string, value: string): Promise<void>;
}

type CloudflareKvNamespace = {
  get(key: string, type: "text"): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

type GlobalSlots = typeof globalThis & {
  __SVGH_BINDINGS?: { REVIEWS_KV?: CloudflareKvNamespace };
  __SVGH_REVIEW_KV?: Promise<ReviewKv>;
  __SVGH_REVIEW_MEMORY?: Map<string, string>;
};

const slots = globalThis as GlobalSlots;

/* ---------------------------------------------------------------------- */
/* Upstash-compatible Redis REST (works on Vercel, Cloudflare, anywhere).  */
/* ---------------------------------------------------------------------- */

function redisRestConfig(): { url: string; token: string } | null {
  const url =
    process.env.REVIEWS_REDIS_REST_URL?.trim() ||
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.KV_REST_API_URL?.trim();
  const token =
    process.env.REVIEWS_REDIS_REST_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.KV_REST_API_TOKEN?.trim();

  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

function createRedisRestKv(config: { url: string; token: string }): ReviewKv {
  async function command<T>(parts: readonly string[]): Promise<T> {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parts),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Review store request failed (${response.status}).`);
    }

    const payload = (await response.json()) as { result?: T; error?: string };

    if (payload.error) {
      throw new Error(`Review store error: ${payload.error}`);
    }

    return payload.result as T;
  }

  return {
    kind: "redis-rest",
    get: (key) => command<string | null>(["GET", key]),
    getMany: (keys) =>
      keys.length === 0
        ? Promise.resolve([])
        : command<(string | null)[]>(["MGET", ...keys]),
    put: async (key, value) => {
      await command<string>(["SET", key, value]);
    },
  };
}

/* ---------------------------------------------------------------------- */
/* Cloudflare Workers KV binding exposed by worker/index.ts.               */
/* ---------------------------------------------------------------------- */

function createCloudflareKv(namespace: CloudflareKvNamespace): ReviewKv {
  return {
    kind: "cloudflare-kv",
    get: (key) => namespace.get(key, "text"),
    getMany: (keys) =>
      Promise.all(keys.map((key) => namespace.get(key, "text"))),
    put: (key, value) => namespace.put(key, value),
  };
}

/* ---------------------------------------------------------------------- */
/* Local JSON files for development (never used on serverless runtimes).  */
/* ---------------------------------------------------------------------- */

type FsPromises = {
  mkdir(path: string, options: { recursive: boolean }): Promise<unknown>;
  readFile(path: string, encoding: "utf8"): Promise<string>;
  writeFile(path: string, data: string, encoding: "utf8"): Promise<void>;
  rename(from: string, to: string): Promise<void>;
};

async function loadFs(): Promise<FsPromises | null> {
  try {
    const moduleName = "node:fs/promises";
    const fs = (await import(
      /* webpackIgnore: true */ /* @vite-ignore */ moduleName
    )) as FsPromises;
    return typeof fs.readFile === "function" ? fs : null;
  } catch {
    return null;
  }
}

function fileNameForKey(key: string): string {
  return `${encodeURIComponent(key).replace(/%/g, "_")}.json`;
}

function createFileKv(fs: FsPromises, directory: string): ReviewKv {
  let ready: Promise<unknown> | null = null;

  function ensureDirectory() {
    ready ??= fs.mkdir(directory, { recursive: true });
    return ready;
  }

  async function get(key: string) {
    await ensureDirectory();

    try {
      const raw = await fs.readFile(
        `${directory}/${fileNameForKey(key)}`,
        "utf8",
      );
      return JSON.parse(raw) as string;
    } catch {
      return null;
    }
  }

  return {
    kind: "file",
    get,
    getMany: (keys) => Promise.all(keys.map(get)),
    put: async (key, value) => {
      await ensureDirectory();
      const target = `${directory}/${fileNameForKey(key)}`;
      const temporary = `${target}.${Date.now()}.tmp`;
      await fs.writeFile(temporary, JSON.stringify(value), "utf8");
      await fs.rename(temporary, target);
    },
  };
}

/* ---------------------------------------------------------------------- */
/* In-memory fallback so the feature never breaks the page.               */
/* ---------------------------------------------------------------------- */

function createMemoryKv(): ReviewKv {
  const memory = (slots.__SVGH_REVIEW_MEMORY ??= new Map<string, string>());

  return {
    kind: "memory",
    get: async (key) => memory.get(key) ?? null,
    getMany: async (keys) => keys.map((key) => memory.get(key) ?? null),
    put: async (key, value) => {
      memory.set(key, value);
    },
  };
}

/* ---------------------------------------------------------------------- */

async function resolveKv(): Promise<ReviewKv> {
  const explicit = process.env.REVIEWS_STORE?.trim().toLowerCase();
  const redis = redisRestConfig();

  if ((!explicit || explicit === "redis") && redis) {
    return createRedisRestKv(redis);
  }

  const cloudflareNamespace = slots.__SVGH_BINDINGS?.REVIEWS_KV;

  if ((!explicit || explicit === "cloudflare") && cloudflareNamespace) {
    return createCloudflareKv(cloudflareNamespace);
  }

  const allowFile =
    explicit === "file" ||
    (!explicit && process.env.NODE_ENV !== "production");

  if (allowFile && typeof process !== "undefined" && process.cwd) {
    const fs = await loadFs();

    if (fs) {
      const directory =
        process.env.REVIEWS_FILE_DIR?.trim() ||
        `${process.cwd()}/.data/reviews`;
      return createFileKv(fs, directory);
    }
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[reviews] No durable review store is configured. Reviews are kept in memory only. Set REVIEWS_REDIS_REST_URL/TOKEN or bind REVIEWS_KV.",
    );
  }

  return createMemoryKv();
}

export function getReviewKv(): Promise<ReviewKv> {
  slots.__SVGH_REVIEW_KV ??= resolveKv();
  return slots.__SVGH_REVIEW_KV;
}
