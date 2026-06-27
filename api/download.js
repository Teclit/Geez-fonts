import { get, put } from "@vercel/blob";

const START_TOTAL = 1000;
const COUNTS_PATH = "download-counts.json";
const BLOB_ACCESS = process.env.BLOB_ACCESS === "public" ? "public" : "private";
const MAX_WRITE_ATTEMPTS = 3;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file") || "";

  if (!isValidFontPath(file)) {
    return jsonResponse({ error: "Invalid font file." }, 400);
  }

  if (!hasBlobCredentials()) {
    return jsonResponse(
      {
        error:
          "Vercel Blob credentials are not configured. Connect a Blob store or run `vercel env pull` locally.",
      },
      503
    );
  }

  try {
    await updateStats((stats, now) => incrementStats(stats, file, now));
  } catch (error) {
    console.error("Unable to update download counts.", error);
    return jsonResponse({ error: "Unable to update download counts." }, 500);
  }

  const redirectUrl = new URL(`/${file}`, request.url);
  return Response.redirect(redirectUrl, 302);
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
  let result;

  try {
    result = await get(COUNTS_PATH, { access: BLOB_ACCESS });
  } catch (error) {
    if (isBlobNotFoundError(error)) {
      return { stats: createEmptyStats(now), etag: "" };
    }

    throw error;
  }

  if (!result || result.statusCode !== 200 || !result.stream) {
    return { stats: createEmptyStats(now), etag: "" };
  }

  const text = await new Response(result.stream).text();
  const parsed = text ? JSON.parse(text) : {};

  return {
    stats: normalizeStats(parsed, now),
    etag: result.blob?.etag || "",
  };
}

async function writeStats(stats, etag) {
  const options = {
    access: BLOB_ACCESS,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  };

  if (etag) {
    options.ifMatch = etag;
  }

  await put(COUNTS_PATH, `${JSON.stringify(stats, null, 2)}\n`, options);
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
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID)
  );
}

function isRetryableWriteError(error) {
  const name = String(error?.name || "");
  const message = String(error?.message || "").toLowerCase();

  return (
    name.includes("Precondition") ||
    message.includes("precondition") ||
    message.includes("already exists") ||
    message.includes("if-match") ||
    message.includes("409") ||
    message.includes("412")
  );
}

function isBlobNotFoundError(error) {
  const name = String(error?.name || "");
  const message = String(error?.message || "").toLowerCase();

  return name.includes("NotFound") || message.includes("not found") || message.includes("404");
}

function jsonResponse(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
