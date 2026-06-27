import { get } from "@vercel/blob";

const START_TOTAL = 1000;
const COUNTS_PATH = "download-counts.json";
const BLOB_ACCESS = process.env.BLOB_ACCESS === "public" ? "public" : "private";

export async function GET() {
  const now = new Date().toISOString();

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
    const stats = await readStats(now);
    return jsonResponse(toPublicStats(stats));
  } catch (error) {
    console.error("Unable to read download stats.", error);
    return jsonResponse({ error: "Unable to read download stats." }, 500);
  }
}

async function readStats(now) {
  let result;

  try {
    result = await get(COUNTS_PATH, { access: BLOB_ACCESS });
  } catch (error) {
    if (isBlobNotFoundError(error)) {
      return createEmptyStats(now);
    }

    throw error;
  }

  if (!result || result.statusCode !== 200 || !result.stream) {
    return createEmptyStats(now);
  }

  const text = await new Response(result.stream).text();
  const parsed = text ? JSON.parse(text) : {};

  return normalizeStats(parsed, now);
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

function isBlobNotFoundError(error) {
  const name = String(error?.name || "");
  const message = String(error?.message || "").toLowerCase();

  return name.includes("NotFound") || message.includes("not found") || message.includes("404");
}

function hasBlobCredentials() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID)
  );
}

function jsonResponse(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
