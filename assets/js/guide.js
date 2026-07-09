"use strict";

document.addEventListener("DOMContentLoaded", () => {
  window.GeezTheme?.bindThemeToggle();
  renderCopyrightYears();
});

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
