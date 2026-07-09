(() => {
  "use strict";

  const START_TOTAL = 1000;
  const STORAGE_KEY = "geez-font-browser:download-total:v1";
  const REFRESH_DELAY_MS = 800;

  let apiRoutesAvailable = false;
  let refreshTimer = 0;

  async function render() {
    const elements = getElements();

    if (!elements.downloadCountStat || !elements.downloadCount) {
      return apiRoutesAvailable;
    }

    renderDownloadCount(getStoredDownloadTotal(), elements);

    if (!shouldTryApiRoutes()) {
      return apiRoutesAvailable;
    }

    try {
      const response = await fetch("/api/download-stats", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        return apiRoutesAvailable;
      }

      const stats = await response.json();
      const displayTotal = Number(stats.displayTotalDownloads);

      if (!Number.isFinite(displayTotal)) {
        throw new Error("Download stats response is invalid.");
      }

      apiRoutesAvailable = true;
      const apiTotal = toDisplayCount(displayTotal);
      const currentTotal = Math.max(
        getStoredDownloadTotal(),
        parseDisplayCount(elements.downloadCount.textContent)
      );
      const nextTotal = Math.max(apiTotal, currentTotal);
      saveStoredDownloadTotal(nextTotal);
      renderDownloadCount(nextTotal, elements);
    } catch (error) {
      console.warn("Download stats are not available.", error);
    }

    return apiRoutesAvailable;
  }

  function increment() {
    const elements = getElements();

    if (!elements.downloadCountStat || !elements.downloadCount) {
      return;
    }

    const currentCount = Math.max(
      parseDisplayCount(elements.downloadCount.textContent),
      getStoredDownloadTotal()
    );
    const nextCount = Math.max(currentCount, START_TOTAL) + 1;

    saveStoredDownloadTotal(nextCount);
    renderDownloadCount(nextCount, elements);
    scheduleRefresh();
  }

  function getDownloadUrl(fontOrPath) {
    const path = typeof fontOrPath === "string" ? fontOrPath : fontOrPath?.path || "";

    if (!isDownloadableFontPath(path)) {
      return "#";
    }

    if (!canUseApiRoutes()) {
      return path;
    }

    return `/api/download?file=${encodeURIComponent(path)}`;
  }

  function renderDownloadCount(total, elements = getElements()) {
    if (!elements.downloadCountStat || !elements.downloadCount) {
      return;
    }

    const displayTotal = Math.max(toDisplayCount(total), START_TOTAL);
    const formattedTotal = formatCount(displayTotal);

    elements.downloadCount.textContent = formattedTotal;
    elements.downloadCountStat.setAttribute("aria-label", `${formattedTotal} downloads`);
    elements.downloadCountStat.hidden = false;
  }

  function scheduleRefresh() {
    window.clearTimeout(refreshTimer);

    refreshTimer = window.setTimeout(() => {
      render();
    }, REFRESH_DELAY_MS);
  }

  function getElements() {
    return {
      downloadCountStat: document.getElementById("downloadCountStat"),
      downloadCount: document.getElementById("downloadCount"),
    };
  }

  function parseDisplayCount(value) {
    const number = Number(String(value).replace(/[^0-9]/g, ""));
    return toDisplayCount(number);
  }

  function getStoredDownloadTotal() {
    try {
      return toDisplayCount(localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      return START_TOTAL;
    }
  }

  function saveStoredDownloadTotal(total) {
    try {
      localStorage.setItem(STORAGE_KEY, String(toDisplayCount(total)));
    } catch (error) {
      console.warn("Unable to save local download total.", error);
    }
  }

  function toDisplayCount(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= START_TOTAL ? Math.floor(number) : START_TOTAL;
  }

  function canUseApiRoutes() {
    if (window.location.protocol === "file:") {
      return false;
    }

    return apiRoutesAvailable || !isLocalHost(window.location.hostname);
  }

  function shouldTryApiRoutes() {
    return window.location.protocol !== "file:";
  }

  function isLocalHost(hostname) {
    return ["localhost", "127.0.0.1", "::1"].includes(hostname);
  }

  function isDownloadableFontPath(path) {
    const value = String(path || "");

    return (
      value.startsWith("fonts/") &&
      value.endsWith(".ttf") &&
      !value.includes("..") &&
      !value.includes("\\") &&
      !value.includes("?") &&
      !value.includes("#") &&
      !value.startsWith("/") &&
      !value.toLowerCase().startsWith("http")
    );
  }

  function formatCount(value) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(value);
  }

  window.GeezDownloadStats = {
    render,
    increment,
    getDownloadUrl,
    isDownloadableFontPath,
  };
})();
