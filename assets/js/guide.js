"use strict";

document.addEventListener("DOMContentLoaded", () => {
  window.GeezTheme?.bindThemeToggle();
  void window.GeezDownloadStats?.render();
  bindSectionToggles();
  bindScrollSpy();
  void renderFontStats();
});

function bindSectionToggles() {
  const sections = Array.from(document.querySelectorAll(".guide-section"));
  const expandButton = document.getElementById("expandAllButton");
  const collapseButton = document.getElementById("collapseAllButton");

  const setAll = (open) => {
    sections.forEach((section) => {
      section.open = open;
    });
  };

  expandButton?.addEventListener("click", () => setAll(true));
  collapseButton?.addEventListener("click", () => setAll(false));
}

function bindScrollSpy() {
  const links = new Map(
    Array.from(document.querySelectorAll(".guide-toc a[href^='#']"), (link) => [
      link.getAttribute("href").slice(1),
      link,
    ])
  );

  if (!("IntersectionObserver" in window) || links.size === 0) {
    return;
  }

  const visible = new Set();

  const setActive = () => {
    const firstVisible = Array.from(links.keys()).find((id) => visible.has(id));

    links.forEach((link, id) => {
      const isActive = id === firstVisible;
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visible.add(entry.target.id);
        } else {
          visible.delete(entry.target.id);
        }
      });

      setActive();
    },
    { rootMargin: "-15% 0px -55% 0px" }
  );

  links.forEach((_link, id) => {
    const section = document.getElementById(id);

    if (section) {
      observer.observe(section);
    }
  });
}

// Keep the guide's numbers in sync with the font catalogue instead of hard-coding them.
async function renderFontStats() {
  try {
    const response = await fetch("assets/data/fonts.min.json");

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const fonts = Array.isArray(data.fonts) ? data.fonts : [];

    if (fonts.length === 0) {
      return;
    }

    const collections = new Set(fonts.map((font) => font.city || "Unknown")).size;

    document.querySelectorAll("[data-stat='fonts']").forEach((node) => {
      node.textContent = String(fonts.length);
    });

    document.querySelectorAll("[data-stat='collections']").forEach((node) => {
      node.textContent = String(collections);
    });
  } catch (error) {
    // The static numbers in the HTML stay in place when the catalogue cannot load.
    console.warn("Font stats are not available.", error);
  }
}
