"use strict";

(function initGeezTheme(global) {
  const STORAGE_KEY = "geez-font-browser:v2";
  const THEMES = new Set(["light", "dark"]);

  function readPreferences() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return stored && typeof stored === "object" ? stored : {};
    } catch (error) {
      console.warn("Unable to read saved preferences.", error);
      return {};
    }
  }

  function writePreferences(preferences) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn("Unable to save preferences.", error);
    }
  }

  function getSystemTheme() {
    return global.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function normalizeTheme(theme) {
    return THEMES.has(theme) ? theme : getSystemTheme();
  }

  function getInitialTheme() {
    return normalizeTheme(readPreferences().theme);
  }

  function persistTheme(theme) {
    const preferences = readPreferences();
    preferences.theme = normalizeTheme(theme);
    writePreferences(preferences);
  }

  function applyTheme(theme, options = {}) {
    const nextTheme = normalizeTheme(theme);
    const toggle = document.getElementById("themeToggle");

    document.documentElement.dataset.theme = nextTheme;

    if (toggle) {
      const isDark = nextTheme === "dark";
      toggle.textContent = isDark ? "Light" : "Dark";
      toggle.setAttribute("aria-pressed", String(isDark));
      toggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    }

    if (options.persist) {
      persistTheme(nextTheme);
    }

    return nextTheme;
  }

  function bindThemeToggle(options = {}) {
    let currentTheme = applyTheme(options.initialTheme || getInitialTheme(), {
      persist: Boolean(options.persistInitial),
    });
    const toggle = document.getElementById("themeToggle");

    if (!toggle || toggle.dataset.themeBound === "true") {
      return currentTheme;
    }

    toggle.dataset.themeBound = "true";
    toggle.addEventListener("click", () => {
      currentTheme = applyTheme(currentTheme === "dark" ? "light" : "dark", { persist: true });

      if (typeof options.onChange === "function") {
        options.onChange(currentTheme);
      }
    });

    return currentTheme;
  }

  global.GeezTheme = {
    STORAGE_KEY,
    readPreferences,
    writePreferences,
    getInitialTheme,
    applyTheme,
    bindThemeToggle,
  };
})(window);
