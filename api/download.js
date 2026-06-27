const START_TOTAL = 1000;
const COUNTS_PATH = "download-counts.json";
const BLOB_ACCESS = process.env.BLOB_ACCESS === "public" ? "public" : "private";
const BLOB_API_VERSION = "12";
const MAX_WRITE_ATTEMPTS = 3;

module.exports = async function handler(req, res) {
  if (!["GET", "HEAD"].includes(req.method || "GET")) {
    sendJson(res, { error: "Method not allowed." }, 405);
    return;
  }

  const requestUrl = getRequestUrl(req);
  const file = getQueryValue(req, requestUrl, "file");

  if (!isValidFontPath(file)) {
    sendJson(res, { error: "Invalid font file." }, 400);
    return;
  }

  if (hasBlobCredentials()) {
    try {
      await updateStats((stats, now) => incrementStats(stats, file, now));
    } catch (error) {
      console.error("Unable to update download counts.", error);
    }
  }

  redirectToFont(res, file);
};

function getRequestUrl(req) {
  const host = req.headers?.host || "localhost";
  const protocol = req.headers?.["x-forwarded-proto"] || "https";
  return new URL(req.url || "/", `${protocol}://${host}`);
}

function getQueryValue(req, requestUrl, name) {
  const value = req.query?.[name] ?? requestUrl.searchParams.get(name) ?? "";
  return Array.isArray(value) ? value[0] || "" : String(value || "");
}

function redirectToFont(res, file) {
  const location = `/${file.split("/").map(encodeURIComponent).join("/")}`;

  res.writeHead(302, {
    Location: location,
    "Cache-Control": "no-store",
  });
  res.end();
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

async function updateStats(mutator) {
  let lastError;

  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
    const now = new Date().toISOString();
    const { stats, etag } = await readStats(now);
    const updatedStats = finalizeStats(mutator(stats, now), now);

    try {
      await writeStats(updatedStats, etag);
      return updatedStats;
    } catch (error) {
      lastError = error;

      if (!isRetryableWriteError(error) || attempt === MAX_WRITE_ATTEMPTS - 1) {
        throw error;
      }
    }
  }

  throw lastError;
}

async function readStats(now) {
  const auth = getBlobAuth();

  if (!auth) {
    return { stats: createEmptyStats(now), etag: "" };
  }

  const response = await fetch(getBlobObjectUrl(auth.storeId), {
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  if (response.status === 404) {
    return { stats: createEmptyStats(now), etag: "" };
  }

  if (!response.ok) {
    throw new Error(`Blob read failed with HTTP ${response.status}`);
  }

  const text = await response.text();
  let parsed = {};

  try {
    parsed = text ? JSON.parse(text) : {};
  } catch (error) {
    console.error("Download stats JSON is invalid. Reinitializing it.", error);
  }

  return {
    stats: normalizeStats(parsed, now),
    etag: response.headers.get("etag") || "",
  };
}

async function writeStats(stats, etag) {
  const auth = getBlobAuth();

  if (!auth) {
    return;
  }

  const body = `${JSON.stringify(stats, null, 2)}\n`;
  const response = await fetch(getBlobApiUploadUrl(), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "x-api-version": BLOB_API_VERSION,
      "x-api-blob-request-id": `${auth.storeId}:${Date.now()}:${Math.random()
        .toString(16)
        .slice(2)}`,
      "x-api-blob-request-attempt": "0",
      "x-vercel-blob-store-id": auth.storeId,
      "x-vercel-blob-access": BLOB_ACCESS,
      "x-allow-overwrite": "1",
      "x-content-type": "application/json",
      "x-cache-control-max-age": "60",
      "x-content-length": String(new TextEncoder().encode(body).byteLength),
      ...(etag ? { "x-if-match": etag } : {}),
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Blob write failed with HTTP ${response.status}`);
  }
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

function toCount(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function isIsoDateString(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function hasBlobCredentials() {
  return Boolean(getBlobAuth());
}

function getBlobAuth() {
  const readWriteToken = readEnv("BLOB_READ_WRITE_TOKEN");

  if (readWriteToken) {
    const storeId = readEnv("BLOB_STORE_ID") || parseStoreIdFromReadWriteToken(readWriteToken);

    if (!storeId) {
      return null;
    }

    return {
      token: readWriteToken,
      storeId,
    };
  }

  const oidcToken = readEnv("VERCEL_OIDC_TOKEN");
  const storeId = readEnv("BLOB_STORE_ID");

  if (oidcToken && storeId) {
    return { token: oidcToken, storeId };
  }

  return null;
}

function parseStoreIdFromReadWriteToken(token) {
  return token.split("_")[3] || "";
}

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function getBlobObjectUrl(storeId) {
  return `https://${storeId}.${BLOB_ACCESS}.blob.vercel-storage.com/${COUNTS_PATH}`;
}

function getBlobApiUploadUrl() {
  const base = readEnv("VERCEL_BLOB_API_URL") || "https://vercel.com/api/blob";
  const url = new URL(base.endsWith("/") ? base : `${base}/`);
  url.searchParams.set("pathname", COUNTS_PATH);
  return url.toString();
}

function isRetryableWriteError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("409") || message.includes("412") || message.includes("precondition");
}

function sendJson(res, payload, status = 200) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}
