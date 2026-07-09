"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const START_TOTAL = 1126;
const COUNTS_PATH = "download-counts.json";
const LOCAL_COUNTS_PATH = path.join(process.cwd(), COUNTS_PATH);
const MAX_WRITE_ATTEMPTS = 3;

let blobSdkPromise = null;

async function readDownloadStats(options = {}) {
  const context = normalizeOptions(options);
  const storage = getStorageInfo(context);
  const now = context.now;

  if (storage.mode === "blob") {
    const { stats } = await readBlobStats(now, context);
    return { stats: finalizeStats(stats, now), storage };
  }

  if (storage.mode === "local") {
    return { stats: finalizeStats(await readLocalStats(now), now), storage };
  }

  return { stats: createEmptyStats(now), storage };
}

async function incrementDownloadStats(file, options = {}) {
  const context = normalizeOptions(options);
  const storage = getStorageInfo(context);

  if (storage.mode === "memory") {
    const now = context.now;
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
      storage.mode === "blob" ? await readBlobStats(now, context) : { stats: await readLocalStats(now), etag: "" };
    const updatedStats = finalizeStats(incrementStats(stats, file, now), now);

    try {
      if (storage.mode === "blob") {
        await writeBlobStats(updatedStats, etag, context);
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
      authSource: storage.authSource,
      diagnostics: storage.diagnostics,
    },
  };
}

function toPublicError(error) {
  return {
    name: typeof error?.name === "string" ? error.name : "Error",
    message: typeof error?.message === "string" ? error.message : String(error || "Unknown error"),
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

async function readBlobStats(now, context = {}) {
  const { get } = await loadBlobSdk();
  const auth = getBlobAuth(context);
  let fallbackStats = null;
  let lastError = null;

  for (const access of getBlobAccessCandidates()) {
    try {
      const result = await get(COUNTS_PATH, {
        access,
        useCache: false,
        ...auth.options,
      });

      if (!result) {
        fallbackStats = { stats: createEmptyStats(now), etag: "" };
        continue;
      }

      if (result.statusCode !== 200 || !result.stream) {
        fallbackStats = { stats: createEmptyStats(now), etag: result.blob?.etag || "" };
        continue;
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
    } catch (error) {
      lastError = error;

      if (isBlobAccessConfigured()) {
        throw error;
      }
    }
  }

  if (fallbackStats) {
    return fallbackStats;
  }

  throw lastError || new Error("Unable to read Blob stats.");
}

async function writeBlobStats(stats, etag, context = {}) {
  const { put } = await loadBlobSdk();
  const auth = getBlobAuth(context);
  let lastError = null;

  for (const access of getBlobAccessCandidates()) {
    const options = {
      access,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: "application/json; charset=utf-8",
      ...auth.options,
    };

    if (etag) {
      options.ifMatch = etag;
    }

    try {
      await put(COUNTS_PATH, `${JSON.stringify(stats, null, 2)}\n`, options);
      return;
    } catch (error) {
      lastError = error;

      if (isBlobAccessConfigured()) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Unable to write Blob stats.");
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

function getStorageInfo(context = {}) {
  const auth = getBlobAuth(context);
  const diagnostics = getBlobEnvDiagnostics(auth.source);

  if (auth.configured) {
    return {
      mode: "blob",
      configured: true,
      persistent: true,
      authSource: auth.source,
      diagnostics,
    };
  }

  if (!readEnv("VERCEL")) {
    return {
      mode: "local",
      configured: true,
      persistent: true,
      authSource: "local-file",
      diagnostics,
    };
  }

  return {
    mode: "memory",
    configured: false,
    persistent: false,
    authSource: "none",
    diagnostics,
  };
}

function getBlobAuth(context = {}) {
  const oidcToken = readString(context.oidcToken) || readEnv("VERCEL_OIDC_TOKEN");
  const storeId = readFirstEnvByNamesAndSuffix(["BLOB_STORE_ID"], "_BLOB_STORE_ID");

  if (oidcToken && storeId.value) {
    return {
      configured: true,
      source: readString(context.oidcToken)
        ? "oidc-request-header"
        : storeId.name === "BLOB_STORE_ID"
          ? "oidc"
          : "oidc-prefixed-store-id",
      options: {
        oidcToken,
        storeId: storeId.value,
      },
    };
  }

  const readWriteToken = readFirstEnvByNamesAndSuffix(
    ["BLOB_READ_WRITE_TOKEN"],
    "_BLOB_READ_WRITE_TOKEN"
  );

  if (readWriteToken.value) {
    return {
      configured: true,
      source: readWriteToken.name === "BLOB_READ_WRITE_TOKEN"
        ? "read-write-token"
        : "prefixed-read-write-token",
      options: {
        token: readWriteToken.value,
      },
    };
  }

  if (storeId.value) {
    return {
      configured: true,
      source: storeId.name === "BLOB_STORE_ID" ? "store-id-only" : "prefixed-store-id-only",
      options: {
        storeId: storeId.value,
      },
    };
  }

  return {
    configured: false,
    source: "none",
    options: {},
  };
}

function getBlobEnvDiagnostics(authSource) {
  return {
    authSource,
    blobAccess: getBlobAccessCandidates().join(","),
    blobAccessConfigured: isBlobAccessConfigured(),
    hasBlobReadWriteToken: Boolean(readEnv("BLOB_READ_WRITE_TOKEN")),
    hasBlobStoreId: Boolean(readEnv("BLOB_STORE_ID")),
    hasVercelOidcToken: Boolean(readEnv("VERCEL_OIDC_TOKEN")),
    hasPrefixedBlobReadWriteToken: hasEnvWithSuffix("_BLOB_READ_WRITE_TOKEN", [
      "BLOB_READ_WRITE_TOKEN",
    ]),
    hasPrefixedBlobStoreId: hasEnvWithSuffix("_BLOB_STORE_ID", ["BLOB_STORE_ID"]),
    blobRelatedEnvCount: Object.keys(process.env).filter((name) => name.includes("BLOB")).length,
  };
}

function getBlobAccessCandidates() {
  const configuredAccess = readEnv("BLOB_ACCESS").toLowerCase();

  if (configuredAccess === "public" || configuredAccess === "private") {
    return [configuredAccess];
  }

  return ["private", "public"];
}

function isBlobAccessConfigured() {
  const configuredAccess = readEnv("BLOB_ACCESS").toLowerCase();
  return configuredAccess === "public" || configuredAccess === "private";
}

function normalizeOptions(options) {
  if (typeof options === "string") {
    return {
      now: options,
      oidcToken: "",
    };
  }

  return {
    now: readString(options?.now) || new Date().toISOString(),
    oidcToken: readString(options?.oidcToken),
  };
}

function readFirstEnvByNamesAndSuffix(names, suffix) {
  for (const name of names) {
    const value = readEnv(name);

    if (value) {
      return { name, value };
    }
  }

  const name = Object.keys(process.env)
    .filter((key) => key.endsWith(suffix) && !names.includes(key))
    .sort()[0];

  return name ? { name, value: readEnv(name) } : { name: "", value: "" };
}

function hasEnvWithSuffix(suffix, excludedNames = []) {
  return Object.keys(process.env).some((name) => {
    return name.endsWith(suffix) && !excludedNames.includes(name) && Boolean(readEnv(name));
  });
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
  return readString(value);
}

function readString(value) {
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
  toPublicError,
  toPublicStats,
};
