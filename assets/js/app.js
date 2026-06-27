"use strict";

const DEFAULT_TEXT = "ሰላም ብጾት";
const DEFAULT_SIZE = 100;
const START_TOTAL = 1000;
const STORAGE_KEY = "geez-font-browser:v2";
const DATA_PATHS = {
  fonts: "assets/data/fonts.min.json",
  cityNames: "assets/data/city_name.json",
  geezAlphabet: "assets/data/geez.ts",
};

const state = {
  fonts: [],
  fontIndex: new Map(),
  cityMap: {},
  byCity: new Map(),
  loadedFaces: new Set(),
  renderedFonts: [],
  selectedFontId: "",
  selectedCity: "",
  previewSize: DEFAULT_SIZE,
  viewMode: "grid",
  theme: "light",
  sortMode: "name",
  favoritesOnly: false,
  alphabetPreview: false,
  geezAlphabet: [],
  geezAlphabetText: DEFAULT_TEXT,
  favorites: new Set(),
  toastTimer: 0,
};

const elements = {};
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheElements();
  hydratePreferences();
  applyTheme();
  applyPreviewSize();
  renderCopyrightYears();

  try {
    const [fontsConfig, cityMap, geezSource] = await Promise.all([
      fetchJson(DATA_PATHS.fonts),
      fetchJson(DATA_PATHS.cityNames),
      fetchText(DATA_PATHS.geezAlphabet).catch(() => ""),
    ]);

    state.fonts = normalizeFonts(Array.isArray(fontsConfig.fonts) ? fontsConfig.fonts : []);
    state.fontIndex = new Map(state.fonts.map((font) => [font.id, font]));
    state.cityMap = cityMap || {};
    state.byCity = groupFontsByCity(state.fonts);
    state.geezAlphabet = parseGeezAlphabet(geezSource);
    state.geezAlphabetText = getGeezAlphabetText() || DEFAULT_TEXT;

    renderGlobalStats();
    populateCitySelect();
    restoreControls();
    bindEvents();
    renderSelectedCity({ preserveSelection: true });
  } catch (error) {
    console.error(error);
    showError(
      "We could not open the font collection. Please run this page from a local server and try again."
    );
  }
}

function cacheElements() {
  elements.controlsForm = document.getElementById("controlsForm");
  elements.citySelect = document.getElementById("citySelect");
  elements.fontSelect = document.getElementById("fontSelect");
  elements.textInput = document.getElementById("textInput");
  elements.searchInput = document.getElementById("searchInput");
  elements.clearSearchButton = document.getElementById("clearSearchButton");
  elements.sortSelect = document.getElementById("sortSelect");
  elements.sizeRange = document.getElementById("sizeRange");
  elements.sizeValue = document.getElementById("sizeValue");
  elements.resetButton = document.getElementById("resetButton");
  elements.randomButton = document.getElementById("randomButton");
  elements.gridViewButton = document.getElementById("gridViewButton");
  elements.listViewButton = document.getElementById("listViewButton");
  elements.themeToggle = document.getElementById("themeToggle");
  elements.favoritesOnly = document.getElementById("favoritesOnly");
  elements.alphabetPreview = document.getElementById("alphabetPreview");

  elements.livePreview = document.getElementById("livePreview");
  elements.cityTitle = document.getElementById("cityTitle");
  elements.cityFontCount = document.getElementById("cityFontCount");
  elements.cityGrid = document.getElementById("cityGrid");
  elements.emptyState = document.getElementById("emptyState");
  elements.resultsSummary = document.getElementsByClassName("resultsSummary")[0];

  elements.selectedCityBadge = document.getElementById("selectedCityBadge");
  elements.selectedFontName = document.getElementById("selectedFontName");
  elements.selectedFileName = document.getElementById("selectedFileName");
  elements.favoriteButton = document.getElementById("favoriteButton");
  elements.copyCssButton = document.getElementById("copyCssButton");

  elements.cityCount = document.getElementById("cityCount");
  elements.fontCount = document.getElementById("fontCount");
  elements.downloadCountStat = document.getElementById("downloadCountStat");
  elements.downloadCount = document.getElementById("downloadCount");
  elements.appError = document.getElementById("appError");
  elements.toast = document.getElementById("toast");
  elements.copyrightYears = document.getElementById("copyrightYears");
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }

  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }

  return response.text();
}

function hydratePreferences() {
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  state.theme = prefersDark ? "dark" : "light";

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    state.theme = saved.theme === "dark" || saved.theme === "light" ? saved.theme : state.theme;
    state.viewMode = saved.viewMode === "list" ? "list" : "grid";
    state.sortMode = ["name", "city", "file"].includes(saved.sortMode) ? saved.sortMode : "name";
    state.previewSize = Number.isFinite(saved.previewSize) ? saved.previewSize : DEFAULT_SIZE;
    state.selectedCity = typeof saved.selectedCity === "string" ? saved.selectedCity : "";
    state.selectedFontId = typeof saved.selectedFontId === "string" ? saved.selectedFontId : "";
    state.favoritesOnly = Boolean(saved.favoritesOnly);
    state.alphabetPreview = Boolean(saved.alphabetPreview);
    state.favorites = new Set(Array.isArray(saved.favorites) ? saved.favorites : []);

    if (typeof saved.previewText === "string" && saved.previewText.trim()) {
      elements.textInput.value = saved.previewText;
    }
  } catch (error) {
    console.warn("Unable to read saved preferences.", error);
  }
}

function savePreferences() {
  const preferences = {
    theme: state.theme,
    viewMode: state.viewMode,
    sortMode: state.sortMode,
    previewSize: state.previewSize,
    selectedCity: elements.citySelect.value,
    selectedFontId: state.selectedFontId,
    previewText: elements.textInput.value,
    favoritesOnly: elements.favoritesOnly.checked,
    alphabetPreview: elements.alphabetPreview.checked,
    favorites: Array.from(state.favorites),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

function restoreControls() {
  if (hasOption(elements.citySelect, state.selectedCity)) {
    elements.citySelect.value = state.selectedCity;
  }

  elements.sortSelect.value = state.sortMode;
  elements.sizeRange.value = String(state.previewSize);
  elements.favoritesOnly.checked = state.favoritesOnly;
  elements.alphabetPreview.checked = state.alphabetPreview;

  applyPreviewSize();
  setViewMode(state.viewMode, { render: false });
}

function bindEvents() {
  elements.citySelect.addEventListener("change", () => {
    renderSelectedCity({ preserveSelection: false });
  });

  elements.fontSelect.addEventListener("change", () => {
    selectFontById(elements.fontSelect.value);
  });

  elements.textInput.addEventListener("input", () => {
    updatePreviewText();
    savePreferences();
  });

  elements.searchInput.addEventListener("input", () => {
    renderSelectedCity({ preserveSelection: true });
  });

  elements.clearSearchButton.addEventListener("click", () => {
    elements.searchInput.value = "";
    renderSelectedCity({ preserveSelection: true });
    elements.searchInput.focus();
  });

  elements.sortSelect.addEventListener("change", () => {
    state.sortMode = elements.sortSelect.value;
    renderSelectedCity({ preserveSelection: true });
  });

  elements.sizeRange.addEventListener("input", () => {
    state.previewSize = Number(elements.sizeRange.value);
    applyPreviewSize();
    savePreferences();
  });

  elements.resetButton.addEventListener("click", resetPreviewControls);
  elements.randomButton.addEventListener("click", selectRandomFont);

  elements.gridViewButton.addEventListener("click", () => setViewMode("grid"));
  elements.listViewButton.addEventListener("click", () => setViewMode("list"));

  elements.themeToggle.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
    savePreferences();
  });

  elements.favoritesOnly.addEventListener("change", () => {
    state.favoritesOnly = elements.favoritesOnly.checked;
    renderSelectedCity({ preserveSelection: true });
  });

  elements.alphabetPreview.addEventListener("change", () => {
    state.alphabetPreview = elements.alphabetPreview.checked;
    renderSelectedCity({ preserveSelection: true });
  });

  elements.favoriteButton.addEventListener("click", () => {
    toggleFavorite(state.selectedFontId);
  });

  elements.copyCssButton.addEventListener("click", copySelectedCss);
}

function normalizeFonts(fonts) {
  return fonts.map((font, index) => {
    const id = font.path || `${font.city || "Unknown"}-${font.file || "font"}-${index}`;

    return {
      ...font,
      id,
      searchText: normalizeSearchText([
        font.city,
        font.family,
        font.full_name,
        font.file,
        font.path,
        font.subfamily,
      ]),
    };
  });
}

function groupFontsByCity(fonts) {
  const byCity = new Map();

  for (const font of fonts) {
    const city = font.city || "Unknown";

    if (!byCity.has(city)) {
      byCity.set(city, []);
    }

    byCity.get(city).push(font);
  }

  for (const fontList of byCity.values()) {
    sortFonts(fontList, "name");
  }

  return byCity;
}

function renderGlobalStats() {
  elements.cityCount.textContent = String(state.byCity.size);
  elements.fontCount.textContent = String(state.fonts.length);
  renderDownloadStats();
}

async function renderDownloadStats() {
  if (!elements.downloadCountStat || !elements.downloadCount) {
    return;
  }

  try {
    const response = await fetch("/api/download-stats", {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error("Download stats are not available.");
    }

    const stats = await response.json();
    const displayTotal = Number(stats.displayTotalDownloads);

    if (!Number.isFinite(displayTotal)) {
      throw new Error("Download stats response is invalid.");
    }

    elements.downloadCount.textContent =
      displayTotal <= START_TOTAL ? `${START_TOTAL}+` : formatCount(displayTotal);
    elements.downloadCountStat.setAttribute(
      "aria-label",
      `${elements.downloadCount.textContent} downloads`
    );
    elements.downloadCountStat.hidden = false;
  } catch (error) {
    console.warn(error);
    elements.downloadCountStat.hidden = true;
  }
}

function renderCopyrightYears() {
  if (!elements.copyrightYears) {
    return;
  }

  const startYear = Number(elements.copyrightYears.dataset.startYear) || 2023;
  const currentYear = new Date().getFullYear();

  elements.copyrightYears.textContent =
    currentYear > startYear ? `${startYear} - ${currentYear}` : String(startYear);
}

function populateCitySelect() {
  const allOption = createElement("option", {
    text: "All collections",
    attrs: { value: "" },
  });

  const cityOptions = Array.from(state.byCity.keys())
    .sort((a, b) => collator.compare(getCityLabel(a), getCityLabel(b)))
    .map((city) =>
      createElement("option", {
        text: getCityLabel(city),
        attrs: { value: city },
      })
    );

  elements.citySelect.replaceChildren(allOption, ...cityOptions);
}

function renderSelectedCity(options = {}) {
  const preserveSelection = options.preserveSelection !== false;
  const baseFonts = getBaseFonts();
  const visibleFonts = getVisibleFonts(baseFonts);

  state.renderedFonts = visibleFonts;
  ensureSelectedFont(visibleFonts, preserveSelection);

  renderFontSelect(visibleFonts);
  renderWorkspaceGrid();
  updateSelectedPanel();
  updateResults(baseFonts, visibleFonts);

  elements.emptyState.textContent = state.alphabetPreview
    ? "No Geez alphabet groups found."
    : "No font choices match your search.";
  elements.emptyState.hidden = state.alphabetPreview
    ? state.geezAlphabet.length > 0
    : visibleFonts.length > 0;
  elements.clearSearchButton.disabled = elements.searchInput.value.trim() === "";
  savePreferences();
}

function getBaseFonts() {
  const selectedCity = elements.citySelect.value;

  if (!selectedCity) {
    return state.fonts;
  }

  return state.byCity.get(selectedCity) || [];
}

function getVisibleFonts(baseFonts) {
  const query = normalizeSearchText([elements.searchInput.value]);
  const filteredFonts = baseFonts.filter((font) => {
    if (elements.favoritesOnly.checked && !state.favorites.has(font.id)) {
      return false;
    }

    if (!query) {
      return true;
    }

    return `${font.searchText} ${normalizeSearchText([getCityLabel(font.city)])}`.includes(query);
  });

  return sortFonts([...filteredFonts], elements.sortSelect.value);
}

function ensureSelectedFont(fonts, preserveSelection) {
  const hasSelectedFont = fonts.some((font) => font.id === state.selectedFontId);

  if (fonts.length === 0) {
    state.selectedFontId = "";
    return;
  }

  if (preserveSelection && hasSelectedFont) {
    return;
  }

  state.selectedFontId = fonts[0].id;
}

function renderFontSelect(fonts) {
  if (fonts.length === 0) {
    const emptyOption = createElement("option", {
      text: "No font choices found",
      attrs: { value: "" },
    });

    elements.fontSelect.replaceChildren(emptyOption);
    elements.fontSelect.disabled = true;
    return;
  }

  const options = fonts.map((font) =>
    createElement("option", {
      text: getFontLabel(font),
      attrs: { value: font.id },
    })
  );

  elements.fontSelect.disabled = false;
  elements.fontSelect.replaceChildren(...options);
  elements.fontSelect.value = state.selectedFontId;
}

function renderFontGrid(fonts) {
  const cards = fonts.map((font) => createFontCard(font));
  elements.cityGrid.dataset.mode = "fonts";
  elements.cityGrid.dataset.view = state.viewMode;
  syncViewButtons(state.viewMode);
  elements.cityGrid.replaceChildren(...cards);
}

function renderWorkspaceGrid() {
  if (state.alphabetPreview) {
    renderAlphabetGrid();
    return;
  }

  renderFontGrid(state.renderedFonts);
}

function renderAlphabetGrid() {
  const cards = state.geezAlphabet.map((group) => createAlphabetCard(group));
  elements.cityGrid.dataset.mode = "alphabet";
  elements.cityGrid.dataset.view = "grid";
  syncViewButtons("grid");
  elements.cityGrid.replaceChildren(...cards);
}

function createFontCard(font) {
  const faceName = registerFont(font);
  const isSelected = font.id === state.selectedFontId;
  const isFavorite = state.favorites.has(font.id);

  const card = createElement("article", {
    className: `font-card${isSelected ? " is-selected" : ""}${isFavorite ? " is-favorite" : ""}`,
    attrs: {
      tabindex: "0",
      role: "button",
      "aria-pressed": String(isSelected),
      "aria-label": `Try ${getFontLabel(font)}`,
    },
  });

  card.dataset.fontId = font.id;

  const header = createElement("div", {
    className: "font-card__header",
  });

  const title = createElement("div", {
    className: "font-card__title",
  });

  const name = createElement("span", {
    className: "font-card__name",
    text: getFontLabel(font),
  });

  const city = createElement("span", {
    className: "font-card__city",
    text: `${getCityLabel(font.city)} · ${font.subfamily || "Regular"}`,
  });

  title.append(name, city);

  const badge = createElement("span", {
    className: "pill",
    text: getFileType(font.path),
  });

  header.append(title, badge);

  const sample = createElement("p", {
    className: "font-card__sample",
    text: getPreviewText(),
  });

  sample.style.fontFamily = `"${faceName}", system-ui, sans-serif`;

  const footer = createElement("footer", {
    className: "font-card__footer",
  });

  const meta = createElement("div", {
    className: "font-card__meta",
    text: font.file || font.path || "Download file",
  });

  const actions = createElement("div", {
    className: "font-card__actions",
  });

  const useButton = createElement("button", {
    className: "button button--secondary",
    text: isSelected ? "Chosen" : "Try",
    attrs: {
      type: "button",
      "aria-pressed": String(isSelected),
    },
  });

  useButton.addEventListener("click", (event) => {
    event.stopPropagation();
    selectFontById(font.id);
  });

  const favoriteButton = createElement("button", {
    className: "button button--quiet",
    text: isFavorite ? "Saved" : "Save choice",
    attrs: {
      type: "button",
      "aria-pressed": String(isFavorite),
    },
  });

  favoriteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFavorite(font.id);
  });

  const downloadLink = createElement("a", {
    className: "download-btn",
    text: "Download font",
    attrs: {
      href: getDownloadUrl(font),
      download: font.file || "",
    },
  });

  downloadLink.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  if (!isDownloadableFontPath(font.path)) {
    downloadLink.setAttribute("aria-disabled", "true");
    downloadLink.addEventListener("click", (event) => event.preventDefault());
  }

  actions.append(useButton, favoriteButton, downloadLink);
  footer.append(meta, actions);
  card.append(header, sample, footer);

  card.addEventListener("click", () => {
    selectFontById(font.id);
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectFontById(font.id);
    }
  });

  return card;
}

function createAlphabetCard(group) {
  const faceStack = getSelectedFontStack();
  const card = createElement("article", {
    className: "alphabet-card",
  });

  const header = createElement("header", {
    className: "alphabet-card__header",
  });

  const title = createElement("div", {
    className: "alphabet-card__title",
  });

  const eyebrow = createElement("span", {
    className: "alphabet-card__eyebrow",
    text: "Phonetic group",
  });

  const name = createElement("h3", {
    text: formatPhoneticGroup(group.phoneticGroup),
  });

  const order = createElement("span", {
    className: "pill",
    text: String(group.order),
  });

  title.append(eyebrow, name);
  header.append(title, order);

  const letters = createElement("div", {
    className: "alphabet-card__letters",
  });

  group.geez.forEach((character, index) => {
    if (!character) {
      return;
    }

    const tile = createElement("div", {
      className: "alphabet-tile",
    });

    const glyph = createElement("span", {
      className: "alphabet-tile__glyph",
      text: character,
    });

    glyph.style.fontFamily = faceStack;

    const latin = createElement("span", {
      className: "alphabet-tile__latin",
      text: group.latinTransliteration[index] || "",
    });

    tile.append(glyph, latin);
    letters.append(tile);
  });

  card.append(header, letters);
  return card;
}

function selectFontById(fontId) {
  if (!fontId || !state.fontIndex.has(fontId)) {
    return;
  }

  state.selectedFontId = fontId;

  if (hasOption(elements.fontSelect, fontId)) {
    elements.fontSelect.value = fontId;
  }

  updateSelectedPanel();
  savePreferences();
}

function selectRandomFont() {
  if (state.renderedFonts.length === 0) {
    showToast("No font choices match your current options.");
    return;
  }

  const randomIndex = Math.floor(Math.random() * state.renderedFonts.length);
  selectFontById(state.renderedFonts[randomIndex].id);
}

function updateSelectedPanel() {
  const font = getSelectedFont();
  const previewText = getPreviewText();

  elements.livePreview.textContent = previewText;

  if (!font) {
    elements.livePreview.style.fontFamily = "system-ui, sans-serif";
    elements.selectedCityBadge.textContent = "No collection";
    elements.selectedFontName.textContent = "Choose a font";
    elements.selectedFileName.textContent = "No download selected";
    elements.favoriteButton.disabled = true;
    elements.favoriteButton.textContent = "Save choice";
    elements.favoriteButton.setAttribute("aria-pressed", "false");
    elements.copyCssButton.disabled = true;
    updateWorkspaceSelectionState();
    return;
  }

  const faceName = registerFont(font);
  const isFavorite = state.favorites.has(font.id);

  elements.livePreview.style.fontFamily = `"${faceName}", system-ui, sans-serif`;
  elements.selectedCityBadge.textContent = getCityLabel(font.city);
  elements.selectedFontName.textContent = getFontLabel(font);
  elements.selectedFileName.textContent = font.file || font.path || "Download file";
  elements.favoriteButton.disabled = false;
  elements.favoriteButton.textContent = isFavorite ? "Saved" : "Save choice";
  elements.favoriteButton.setAttribute("aria-pressed", String(isFavorite));
  elements.copyCssButton.disabled = false;

  updateWorkspaceSelectionState();
}

function updatePreviewText() {
  const previewText = getPreviewText();

  elements.livePreview.textContent = previewText;

  document.querySelectorAll(".font-card__sample").forEach((sample) => {
    sample.textContent = previewText;
  });
}

function updateWorkspaceSelectionState() {
  if (state.alphabetPreview) {
    updateAlphabetGlyphFont();
    return;
  }

  highlightSelectedFontCard();
}

function updateAlphabetGlyphFont() {
  const faceStack = getSelectedFontStack();

  document.querySelectorAll(".alphabet-tile__glyph").forEach((glyph) => {
    glyph.style.fontFamily = faceStack;
  });
}

function highlightSelectedFontCard() {
  document.querySelectorAll(".font-card").forEach((card) => {
    const isSelected = card.dataset.fontId === state.selectedFontId;
    card.classList.toggle("is-selected", isSelected);
    card.setAttribute("aria-pressed", String(isSelected));

    const useButton = card.querySelector(".font-card__actions .button--secondary");

    if (useButton) {
      useButton.textContent = isSelected ? "Chosen" : "Try";
      useButton.setAttribute("aria-pressed", String(isSelected));
    }
  });
}

function toggleFavorite(fontId) {
  if (!fontId) {
    return;
  }

  if (state.favorites.has(fontId)) {
    state.favorites.delete(fontId);
  } else {
    state.favorites.add(fontId);
  }

  if (elements.favoritesOnly.checked && !state.favorites.has(fontId)) {
    renderSelectedCity({ preserveSelection: true });
  } else {
    renderWorkspaceGrid();
    updateSelectedPanel();
  }

  savePreferences();
}

async function copySelectedCss() {
  const font = getSelectedFont();

  if (!font) {
    return;
  }

  const css = buildFontCss(font);

  try {
    await navigator.clipboard.writeText(css);
    showToast("Website style copied.");
  } catch (error) {
    const copied = fallbackCopy(css);
    showToast(copied ? "Website style copied." : "We could not copy the website style.");
  }
}

function fallbackCopy(value) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;

  try {
    copied = document.execCommand("copy");
  } catch (error) {
    copied = false;
  }

  textarea.remove();
  return copied;
}

function buildFontCss(font) {
  const faceName = getFaceName(font);
  const fontPath = escapeCssString(font.path || "");

  return `@font-face {
  font-family: "${escapeCssString(faceName)}";
  src: url("${fontPath}") format("${getFontFormat(font.path)}");
  font-weight: ${inferFontWeight(font)};
  font-style: ${inferFontStyle(font)};
  font-display: swap;
}

.geez-preview {
  font-family: "${escapeCssString(faceName)}", system-ui, sans-serif;
}`;
}

function resetPreviewControls() {
  elements.textInput.value = DEFAULT_TEXT;
  elements.searchInput.value = "";
  elements.sortSelect.value = "name";
  elements.sizeRange.value = String(DEFAULT_SIZE);
  elements.favoritesOnly.checked = false;
  elements.alphabetPreview.checked = false;

  state.sortMode = "name";
  state.previewSize = DEFAULT_SIZE;
  state.favoritesOnly = false;
  state.alphabetPreview = false;

  applyPreviewSize();
  setViewMode("grid", { render: false });
  renderSelectedCity({ preserveSelection: false });
}

function setViewMode(viewMode, options = {}) {
  state.viewMode = viewMode === "list" ? "list" : "grid";
  elements.cityGrid.dataset.view = state.viewMode;

  syncViewButtons(state.viewMode);

  if (options.render !== false) {
    renderWorkspaceGrid();
    savePreferences();
  }
}

function syncViewButtons(viewMode) {
  const isGrid = viewMode !== "list";

  elements.gridViewButton.classList.toggle("is-active", isGrid);
  elements.listViewButton.classList.toggle("is-active", !isGrid);
  elements.gridViewButton.setAttribute("aria-pressed", String(isGrid));
  elements.listViewButton.setAttribute("aria-pressed", String(!isGrid));
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  elements.themeToggle.textContent = state.theme === "dark" ? "Light" : "Dark";
  elements.themeToggle.setAttribute("aria-pressed", String(state.theme === "dark"));
  elements.themeToggle.setAttribute(
    "aria-label",
    state.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
  );
}

function applyPreviewSize() {
  const size = clamp(Number(state.previewSize), 12, 592);
  state.previewSize = size;
  document.documentElement.style.setProperty("--preview-size", `${size}px`);
  elements.sizeValue.textContent = `${size}px`;
}

function updateResults(baseFonts, visibleFonts) {
  if (state.alphabetPreview) {
    const groupCount = state.geezAlphabet.length;

    elements.cityTitle.textContent = "Geez alphabet";
    elements.cityFontCount.textContent = String(groupCount);
    elements.resultsSummary.textContent = `${groupCount} alphabet groups`;
    return;
  }

  const city = elements.citySelect.value;
  const cityLabel = city ? `${getCityLabel(city)} font options` : "All Geez font options";

  elements.cityTitle.textContent = cityLabel;
  elements.cityFontCount.textContent = String(baseFonts.length);
  elements.resultsSummary.textContent = `${visibleFonts.length} of ${baseFonts.length} font choices`;
}

function sortFonts(fonts, mode) {
  const sortMode = ["name", "city", "file"].includes(mode) ? mode : "name";

  return fonts.sort((a, b) => {
    if (sortMode === "city") {
      return collator.compare(getCityLabel(a.city), getCityLabel(b.city)) || compareByName(a, b);
    }

    if (sortMode === "file") {
      return collator.compare(a.file || a.path || "", b.file || b.path || "") || compareByName(a, b);
    }

    return compareByName(a, b);
  });
}

function compareByName(a, b) {
  return collator.compare(getFontLabel(a), getFontLabel(b));
}

function registerFont(font) {
  const faceName = getFaceName(font);

  if (!font.path || state.loadedFaces.has(faceName)) {
    return faceName;
  }

  const style = document.createElement("style");
  style.dataset.fontFace = faceName;
  style.textContent = `
    @font-face {
      font-family: "${escapeCssString(faceName)}";
      src: url("${escapeCssString(font.path)}") format("${getFontFormat(font.path)}");
      font-weight: ${inferFontWeight(font)};
      font-style: ${inferFontStyle(font)};
      font-display: swap;
    }
  `;

  document.head.appendChild(style);
  state.loadedFaces.add(faceName);

  return faceName;
}

function getSelectedFont() {
  return state.selectedFontId ? state.fontIndex.get(state.selectedFontId) : null;
}

function getSelectedFontStack() {
  const font = getSelectedFont();

  if (!font) {
    return "system-ui, sans-serif";
  }

  return `"${registerFont(font)}", system-ui, sans-serif`;
}

function getPreviewText() {
  if (elements.alphabetPreview?.checked) {
    return state.geezAlphabetText;
  }

  return elements.textInput.value.trim() || DEFAULT_TEXT;
}

function parseGeezAlphabet(source) {
  const groups = [];
  const objectPattern =
    /{\s*geez:\s*\[([\s\S]*?)\],\s*latinTransliteration:\s*\[([\s\S]*?)\],\s*phoneticGroup:\s*"([^"]+)",\s*order:\s*(\d+)/g;

  for (const match of String(source).matchAll(objectPattern)) {
    groups.push({
      geez: parseQuotedList(match[1]),
      latinTransliteration: parseQuotedList(match[2]),
      phoneticGroup: match[3],
      order: Number(match[4]),
    });
  }

  return groups.sort((a, b) => a.order - b.order);
}

function parseQuotedList(source) {
  return Array.from(String(source).matchAll(/"([^"]*)"/g), (match) => match[1]);
}

function getGeezAlphabetText() {
  return state.geezAlphabet
    .map((group) => group.geez.filter(Boolean).join(""))
    .filter(Boolean)
    .join("\n");
}

function formatPhoneticGroup(value) {
  return String(value)
    .split("-")
    .filter(Boolean)
    .map((part) => {
      if (part.length <= 2) {
        return part.toUpperCase();
      }

      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function getCityLabel(city) {
  return state.cityMap?.[city] || city || "Other collection";
}

function getFontLabel(font) {
  return font.family || font.full_name || font.file || "Font option";
}

function getFaceName(font) {
  return `Geez_${String(font.id).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

function getFileType(path = "") {
  const extension = String(path).split(".").pop();
  return extension ? extension.toUpperCase() : "TTF";
}

function getDownloadUrl(font) {
  const path = font?.path || "";

  if (!isDownloadableFontPath(path)) {
    return "#";
  }

  return `/api/download?file=${encodeURIComponent(path)}`;
}

function isDownloadableFontPath(path) {
  return (
    typeof path === "string" &&
    path.startsWith("fonts/") &&
    path.endsWith(".ttf") &&
    !path.includes("..") &&
    !path.includes("\\") &&
    !path.includes("?") &&
    !path.includes("#") &&
    !path.startsWith("/") &&
    !path.toLowerCase().startsWith("http")
  );
}

function formatCount(value) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(value);
}

function getFontFormat(path = "") {
  const extension = String(path).split(".").pop().toLowerCase();

  if (extension === "woff2") {
    return "woff2";
  }

  if (extension === "woff") {
    return "woff";
  }

  if (extension === "otf") {
    return "opentype";
  }

  return "truetype";
}

function inferFontWeight(font) {
  const source = `${font.file || ""} ${font.full_name || ""} ${font.subfamily || ""}`.toLowerCase();

  if (source.includes("black")) {
    return 900;
  }

  if (source.includes("extra") && source.includes("bold")) {
    return 800;
  }

  if (source.includes("bold")) {
    return 700;
  }

  if (source.includes("semibold") || source.includes("semi bold")) {
    return 600;
  }

  if (source.includes("medium")) {
    return 500;
  }

  if (source.includes("light")) {
    return 300;
  }

  if (source.includes("thin")) {
    return 200;
  }

  return 400;
}

function inferFontStyle(font) {
  const source = `${font.file || ""} ${font.full_name || ""} ${font.subfamily || ""}`.toLowerCase();
  return source.includes("italic") ? "italic" : "normal";
}

function normalizeSearchText(parts) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function escapeCssString(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

function hasOption(select, value) {
  return Array.from(select.options).some((option) => option.value === value);
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function showError(message) {
  elements.appError.textContent = message;
  elements.appError.hidden = false;
}

function showToast(message) {
  window.clearTimeout(state.toastTimer);

  elements.toast.textContent = message;
  elements.toast.hidden = false;

  state.toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 2200);
}

function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);

  if (options.className) {
    element.className = options.className;
  }

  if (options.text !== undefined) {
    element.textContent = options.text;
  }

  if (options.attrs) {
    for (const [name, value] of Object.entries(options.attrs)) {
      element.setAttribute(name, value);
    }
  }

  return element;
}
