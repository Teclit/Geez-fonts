const fs = require("node:fs/promises");
const path = require("node:path");

const START_TOTAL = 1000;
const COUNTS_PATH = "download-counts.json";
const LOCAL_COUNTS_PATH = path.join(process.cwd(), COUNTS_PATH);
const BLOB_ACCESS = process.env.BLOB_ACCESS === "public" ? "public" : "private";

module.exports = async function handler(req, res) {
  if (!["GET", "HEAD"].includes(req.method || "GET")) {
    sendJson(res, { error: "Method not allowed." }, 405);
    return;
  }

  const now = new Date().toISOString();
  let stats = createEmptyStats(now);

  try {
    stats = await readStats(now);
  } catch (error) {
    console.error("Unable to read download stats.", error);
  }

  sendJson(res, toPublicStats(stats));
};

async function readStats(now) {
  const auth = getBlobAuth();

  if (!auth) {
    return readLocalStats(now);
  }

  const response = await fetch(getBlobObjectUrl(auth.storeId), {
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  if (response.status === 404) {
    return createEmptyStats(now);
  }

  if (!response.ok) {
    throw new Error(`Blob read failed with HTTP ${response.status}`);
  }

  const text = await response.text();
  let parsed = {};

  try {
    parsed = text ? JSON.parse(text) : {};
  } catch (error) {
    console.error("Download stats JSON is invalid. Returning initialized stats.", error);
  }

  return normalizeStats(parsed, now);
}

async function readLocalStats(now) {
  if (!canUseLocalStatsFile()) {
    return createEmptyStats(now);
  }

  try {
    const text = await fs.readFile(LOCAL_COUNTS_PATH, "utf8");
    return normalizeStats(JSON.parse(text), now);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return createEmptyStats(now);
    }

    if (error instanceof SyntaxError) {
      console.error("Local download-counts.json is invalid. Returning initialized stats.", error);
      return createEmptyStats(now);
    }

    throw error;
  }
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

function toPublicStats(stats) {
  return {
    startTotal: START_TOTAL,
    rawTotalDownloads: stats.rawTotalDownloads,
    displayTotalDownloads: START_TOTAL + stats.rawTotalDownloads,
    perFont: stats.perFont,
    daily: stats.daily,
    updatedAt: stats.updatedAt,
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

function toCount(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function isIsoDateString(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function getBlobAuth() {
  const oidcToken = readEnv("VERCEL_OIDC_TOKEN");
  const oidcStoreId = normalizeStoreId(readEnv("BLOB_STORE_ID"));

  if (oidcToken && oidcStoreId) {
    return { token: oidcToken, storeId: oidcStoreId };
  }

  const readWriteToken = readEnv("BLOB_READ_WRITE_TOKEN");

  if (readWriteToken) {
    const storeId = normalizeStoreId(
      readEnv("BLOB_STORE_ID") || parseStoreIdFromReadWriteToken(readWriteToken)
    );

    if (storeId) {
      return {
        token: readWriteToken,
        storeId,
      };
    }
  }

  return null;
}

function parseStoreIdFromReadWriteToken(token) {
  return token.split("_")[3] || "";
}

function normalizeStoreId(storeId) {
  return storeId.startsWith("store_") ? storeId.slice("store_".length) : storeId;
}

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function canUseLocalStatsFile() {
  return !readEnv("VERCEL");
}

function getBlobObjectUrl(storeId) {
  return `https://${storeId}.${BLOB_ACCESS}.blob.vercel-storage.com/${COUNTS_PATH}`;
}

function sendJson(res, payload, status = 200) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}
