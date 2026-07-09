"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const START_TOTAL = 1000;
const COUNTS_PATH = "download-counts.json";
const LOCAL_COUNTS_PATH = path.join(process.cwd(), COUNTS_PATH);
const BLOB_ACCESS = process.env.BLOB_ACCESS === "public" ? "public" : "private";
const MAX_WRITE_ATTEMPTS = 3;

let blobSdkPromise = null;

async function readDownloadStats(now = new Date().toISOString()) {
  const storage = getStorageInfo();

  if (storage.mode === "blob") {
    const { stats } = await readBlobStats(now);
    return { stats: finalizeStats(stats, now), storage };
  }

  if (storage.mode === "local") {
    return { stats: finalizeStats(await readLocalStats(now), now), storage };
  }

  return { stats: createEmptyStats(now), storage };
}

async function incrementDownloadStats(file) {
  const storage = getStorageInfo();

  if (storage.mode === "memory") {
    const now = new Date().toISOString();
    return {
      stats: createEmptyStats(now),
      storage,
      persisted: false,
    };
  }

  let lastError;

  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
    const now = new Date().toISOString();
    const { stats, etag } =
      storage.mode === "blob" ? await readBlobStats(now) : { stats: await readLocalStats(now), etag: "" };
    const updatedStats = finalizeStats(incrementStats(stats, file, now), now);

    try {
      if (storage.mode === "blob") {
        await writeBlobStats(updatedStats, etag);
      } else {
        await writeLocalStats(updatedStats);
      }

      return { stats: updatedStats, storage, persisted: true };
    } catch (error) {
      lastError = error;

      if (!isRetryableWriteError(error) || attempt === MAX_WRITE_ATTEMPTS - 1) {
        throw error;
      }
    }
  }

  throw lastError;
}

function toPublicStats(stats, storage = getStorageInfo()) {
  return {
    startTotal: START_TOTAL,
    rawTotalDownloads: stats.rawTotalDownloads,
    displayTotalDownloads: START_TOTAL + stats.rawTotalDownloads,
    perFont: stats.perFont,
    daily: stats.daily,
    updatedAt: stats.updatedAt,
    storage: {
      mode: storage.mode,
      configured: storage.configured,
      persistent: storage.persistent,
    },
  };
}

function isValidFontPath(file) {
  if (typeof file !== "string" || file.length === 0) {
    return false;
  }

  const lowerFile = file.toLowerCase();

  return (
    file.startsWith("fonts/") &&
    file.endsWith(".ttf") &&
    !file.includes("..") &&
    !file.includes("\\") &&
    !file.includes("?") &&
    !file.includes("#") &&
    !file.startsWith("/") &&
    !lowerFile.startsWith("http")
  );
}

async function readBlobStats(now) {
  const { get } = await loadBlobSdk();
  const result = await get(COUNTS_PATH, {
    access: BLOB_ACCESS,
    useCache: false,
  });

  if (!result) {
    return { stats: createEmptyStats(now), etag: "" };
  }

  if (result.statusCode !== 200 || !result.stream) {
    return { stats: createEmptyStats(now), etag: result.blob?.etag || "" };
  }

  const text = await new Response(result.stream).text();
  let parsed = {};

  try {
    parsed = text ? JSON.parse(text) : {};
  } catch (error) {
    console.error("Download stats JSON is invalid. Reinitializing it.", error);
  }

  return {
    stats: normalizeStats(parsed, now),
    etag: result.blob?.etag || "",
  };
}

async function writeBlobStats(stats, etag) {
  const { put } = await loadBlobSdk();
  const options = {
    access: BLOB_ACCESS,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    contentType: "application/json; charset=utf-8",
  };

  if (etag) {
    options.ifMatch = etag;
  }

  await put(COUNTS_PATH, `${JSON.stringify(stats, null, 2)}\n`, options);
}

async function readLocalStats(now) {
  try {
    const text = await fs.readFile(LOCAL_COUNTS_PATH, "utf8");
    return normalizeStats(JSON.parse(text), now);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return createEmptyStats(now);
    }

    if (error instanceof SyntaxError) {
      console.error("Local download-counts.json is invalid. Reinitializing it.", error);
      return createEmptyStats(now);
    }

    throw error;
  }
}

async function writeLocalStats(stats) {
  await fs.writeFile(LOCAL_COUNTS_PATH, `${JSON.stringify(stats, null, 2)}\n`, "utf8");
}

function incrementStats(stats, file, now) {
  const dateKey = now.slice(0, 10);
  const nextStats = normalizeStats(stats, now);
  const currentFont = nextStats.perFont[file] || {
    downloads: 0,
    displayDownloads: START_TOTAL,
    lastDownloadedAt: now,
  };

  nextStats.rawTotalDownloads += 1;
  nextStats.perFont[file] = {
    downloads: currentFont.downloads + 1,
    displayDownloads: START_TOTAL + currentFont.downloads + 1,
    lastDownloadedAt: now,
  };
  nextStats.daily[dateKey] = (nextStats.daily[dateKey] || 0) + 1;
  nextStats.updatedAt = now;

  return nextStats;
}

function createEmptyStats(now) {
  return {
    startTotal: START_TOTAL,
    rawTotalDownloads: 0,
    displayTotalDownloads: START_TOTAL,
    perFont: {},
    daily: {},
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeStats(stats, now) {
  const source = stats && typeof stats === "object" ? stats : {};
  const normalized = createEmptyStats(now);

  normalized.rawTotalDownloads = toCount(source.rawTotalDownloads);
  normalized.displayTotalDownloads = START_TOTAL + normalized.rawTotalDownloads;
  normalized.createdAt = isIsoDateString(source.createdAt) ? source.createdAt : now;
  normalized.updatedAt = isIsoDateString(source.updatedAt) ? source.updatedAt : normalized.createdAt;

  if (source.perFont && typeof source.perFont === "object") {
    for (const [file, value] of Object.entries(source.perFont)) {
      if (!isValidFontPath(file) || !value || typeof value !== "object") {
        continue;
      }

      const downloads = toCount(value.downloads);
      normalized.perFont[file] = {
        downloads,
        displayDownloads: START_TOTAL + downloads,
        lastDownloadedAt: isIsoDateString(value.lastDownloadedAt)
          ? value.lastDownloadedAt
          : normalized.updatedAt,
      };
    }
  }

  if (source.daily && typeof source.daily === "object") {
    for (const [date, downloads] of Object.entries(source.daily)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        normalized.daily[date] = toCount(downloads);
      }
    }
  }

  return normalized;
}

function finalizeStats(stats, now) {
  const normalized = normalizeStats(stats, now);
  normalized.displayTotalDownloads = START_TOTAL + normalized.rawTotalDownloads;

  for (const [file, value] of Object.entries(normalized.perFont)) {
    normalized.perFont[file] = {
      ...value,
      displayDownloads: START_TOTAL + value.downloads,
    };
  }

  return normalized;
}

function getStorageInfo() {
  if (hasBlobCredentials()) {
    return {
      mode: "blob",
      configured: true,
      persistent: true,
    };
  }

  if (!readEnv("VERCEL")) {
    return {
      mode: "local",
      configured: true,
      persistent: true,
    };
  }

  return {
    mode: "memory",
    configured: false,
    persistent: false,
  };
}

function hasBlobCredentials() {
  return Boolean(readEnv("BLOB_READ_WRITE_TOKEN") || (readEnv("VERCEL_OIDC_TOKEN") && readEnv("BLOB_STORE_ID")));
}

async function loadBlobSdk() {
  if (!blobSdkPromise) {
    blobSdkPromise = import("@vercel/blob");
  }

  return blobSdkPromise;
}

function toCount(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function isIsoDateString(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function isRetryableWriteError(error) {
  const message = String(error?.message || "").toLowerCase();
  const name = String(error?.name || "").toLowerCase();

  return (
    name.includes("precondition") ||
    message.includes("409") ||
    message.includes("412") ||
    message.includes("precondition")
  );
}

module.exports = {
  START_TOTAL,
  incrementDownloadStats,
  isValidFontPath,
  readDownloadStats,
  toPublicStats,
};
