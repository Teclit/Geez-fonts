"use strict";

const {
  incrementDownloadStats,
  isValidFontPath,
  toPublicError,
  toPublicStats,
} = require("../lib/download-stats-store");

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

  const debug = getQueryValue(req, requestUrl, "debug") === "1";

  try {
    const result = await incrementDownloadStats(file, {
      oidcToken: getHeaderValue(req, "x-vercel-oidc-token"),
    });

    if (debug) {
      sendJson(res, {
        file,
        persisted: result.persisted,
        ...toPublicStats(result.stats, result.storage),
      });
      return;
    }
  } catch (error) {
    console.error("Unable to update download counts.", error);

    if (debug) {
      sendJson(
        res,
        {
          file,
          error: "Unable to update download counts.",
          details: toPublicError(error),
        },
        500
      );
      return;
    }
  }

  redirectToFont(res, file, requestUrl);
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

function getHeaderValue(req, name) {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()] ?? "";
  return Array.isArray(value) ? value[0] || "" : String(value || "");
}

function redirectToFont(res, file, requestUrl) {
  const encodedPath = file.split("/").map(encodeURIComponent).join("/");
  const location = new URL(`/${encodedPath}`, requestUrl.origin).toString();

  res.writeHead(302, {
    Location: location,
    "Cache-Control": "no-store",
  });
  res.end();
}

function sendJson(res, payload, status = 200) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}
