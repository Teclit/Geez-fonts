"use strict";

const { readDownloadStats, toPublicStats } = require("../lib/download-stats-store");

module.exports = async function handler(req, res) {
  if (!["GET", "HEAD"].includes(req.method || "GET")) {
    sendJson(res, { error: "Method not allowed." }, 405);
    return;
  }

  try {
    const { stats, storage } = await readDownloadStats();
    sendJson(res, toPublicStats(stats, storage));
  } catch (error) {
    console.error("Unable to read download stats.", error);
    sendJson(res, {
      error: "Unable to read download stats.",
      startTotal: 1000,
      rawTotalDownloads: 0,
      displayTotalDownloads: 1000,
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

function sendJson(res, payload, status = 200) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}
