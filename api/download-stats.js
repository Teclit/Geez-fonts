"use strict";

const { START_TOTAL, readDownloadStats, toPublicError, toPublicStats } = require("../lib/download-stats-store");

module.exports = async function handler(req, res) {
  if (!["GET", "HEAD"].includes(req.method || "GET")) {
    sendJson(res, { error: "Method not allowed." }, 405);
    return;
  }

  try {
    const { stats, storage } = await readDownloadStats({
      oidcToken: getHeaderValue(req, "x-vercel-oidc-token"),
    });
    sendJson(res, toPublicStats(stats, storage));
  } catch (error) {
    console.error("Unable to read download stats.", error);
    sendJson(res, {
      error: "Unable to read download stats.",
      details: toPublicError(error),
      startTotal: START_TOTAL,
      rawTotalDownloads: 0,
      displayTotalDownloads: START_TOTAL,
      perFont: {},
      daily: {},
      updatedAt: new Date().toISOString(),
      storage: {
        mode: "error",
        configured: false,
        persistent: false,
      },
    });
  }
};

function getHeaderValue(req, name) {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()] ?? "";
  return Array.isArray(value) ? value[0] || "" : String(value || "");
}

function sendJson(res, payload, status = 200) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}
