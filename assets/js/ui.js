"use strict";

(function initGeezUi(global) {
  const MOBILE_QUERY = "(max-width: 760px)";
  const BACK_TO_TOP_OFFSET = 600;

  function isMobileViewport() {
    return Boolean(global.matchMedia?.(MOBILE_QUERY).matches);
  }

  function renderCopyrightYears() {
    const copyrightYears = document.getElementById("copyrightYears");

    if (!copyrightYears) {
      return;
    }

    const startYear = Number(copyrightYears.dataset.startYear) || 2023;
    const currentYear = new Date().getFullYear();

    copyrightYears.textContent =
      currentYear > startYear ? `${startYear} - ${currentYear}` : String(startYear);
  }

  // Secondary panels stay open on large screens but start closed on phones,
  // so the main content is reachable without a long scroll.
  function collapseSecondaryPanels() {
    if (!isMobileViewport()) {
      return;
    }

    document.querySelectorAll("details[data-collapse-mobile]").forEach((panel) => {
      panel.open = false;
    });
  }

  function bindBackToTop() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "back-to-top";
    button.setAttribute("aria-label", "Back to top");
    button.title = "Back to top";
    button.hidden = true;
    button.innerHTML =
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 5l-7 7m7-7l7 7M12 5v14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    button.addEventListener("click", () => {
      global.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });

    document.body.append(button);

    const progress = document.querySelector("[data-scroll-progress]");
    let ticking = false;

    const update = () => {
      const scrollTop = global.scrollY || document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - global.innerHeight;

      button.hidden = scrollTop < BACK_TO_TOP_OFFSET;

      if (progress) {
        const ratio = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
        progress.style.transform = `scaleX(${ratio})`;
      }

      ticking = false;
    };

    global.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          global.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );

    update();
  }

  function prefersReducedMotion() {
    return Boolean(global.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  }

  // Opening a collapsed <details> before jumping to it keeps in-page links useful.
  function bindAnchorPanels() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest?.('a[href^="#"]');

      if (!link) {
        return;
      }

      const target = document.getElementById(link.getAttribute("href").slice(1));

      if (!target) {
        return;
      }

      const panel = target.closest("details") || (target.tagName === "DETAILS" ? target : null);

      if (panel) {
        panel.open = true;
      }
    });
  }

  global.GeezUi = {
    isMobileViewport,
    prefersReducedMotion,
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderCopyrightYears();
    collapseSecondaryPanels();
    bindBackToTop();
    bindAnchorPanels();
  });
})(window);
