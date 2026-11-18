"use strict";

/*
 * Collapsible sidebar shared by every page.
 * - Desktop (> 1120px): the sidebar collapses to a slim icon rail; the choice is remembered.
 * - Tablet / phone (<= 1120px): the sidebar becomes a slide-in drawer opened from the top bar.
 */
(function initGeezSidebar(global) {
  const DRAWER_QUERY = "(max-width: 1120px)";
  const PREF_KEY = "sidebarCollapsed";
  const root = document.documentElement;

  const readPrefs = () => global.GeezTheme?.readPreferences?.() || {};
  const writePrefs = (prefs) => global.GeezTheme?.writePreferences?.(prefs);

  // Apply the saved desktop state as early as possible to avoid a layout jump.
  if (readPrefs()[PREF_KEY]) {
    root.dataset.sidebar = "collapsed";
  }

  function init() {
    const sidebar = document.getElementById("appSidebar");
    const toggles = document.querySelectorAll("[data-sidebar-toggle]");

    if (!sidebar || !toggles.length) {
      return;
    }

    const drawerMedia = global.matchMedia(DRAWER_QUERY);
    const backdrop = document.createElement("div");
    backdrop.className = "sidebar-backdrop";
    backdrop.hidden = true;
    document.body.append(backdrop);

    let lastTrigger = null;

    const isDrawer = () => drawerMedia.matches;
    const isCollapsed = () => root.dataset.sidebar === "collapsed";
    const isDrawerOpen = () => root.dataset.drawer === "open";

    function syncToggles() {
      const expanded = isDrawer() ? isDrawerOpen() : !isCollapsed();

      toggles.forEach((toggle) => {
        toggle.setAttribute("aria-expanded", String(expanded));

        const label = isDrawer()
          ? expanded
            ? "Close menu"
            : "Open menu"
          : expanded
            ? "Collapse sidebar"
            : "Expand sidebar";

        toggle.setAttribute("aria-label", label);
        toggle.title = label;

        const text = toggle.querySelector("[data-toggle-label]");
        if (text) {
          text.textContent = isDrawer() ? (expanded ? "Close" : "Menu") : expanded ? "Collapse" : "Expand";
        }
      });

      // A closed drawer is off-screen: keep it out of the tab order and screen readers.
      sidebar.inert = isDrawer() && !isDrawerOpen();
    }

    function openDrawer(trigger) {
      lastTrigger = trigger || null;
      root.dataset.drawer = "open";
      backdrop.hidden = false;
      document.body.classList.add("has-open-drawer");
      syncToggles();
      sidebar.querySelector(".site-nav__toggle, a, button")?.focus({ preventScroll: true });
    }

    function closeDrawer({ restoreFocus = true } = {}) {
      if (!isDrawerOpen()) {
        return;
      }

      delete root.dataset.drawer;
      backdrop.hidden = true;
      document.body.classList.remove("has-open-drawer");
      syncToggles();

      if (restoreFocus) {
        (lastTrigger || document.querySelector(".mobile-bar [data-sidebar-toggle]"))?.focus({
          preventScroll: true,
        });
      }
    }

    function setCollapsed(collapsed) {
      if (collapsed) {
        root.dataset.sidebar = "collapsed";
      } else {
        delete root.dataset.sidebar;
      }

      const prefs = readPrefs();
      prefs[PREF_KEY] = collapsed;
      writePrefs(prefs);
      syncToggles();
    }

    toggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        if (isDrawer()) {
          isDrawerOpen() ? closeDrawer() : openDrawer(toggle);
        } else {
          setCollapsed(!isCollapsed());
        }
      });
    });

    // In the collapsed rail, clicking a hidden-panel shortcut expands the sidebar first.
    sidebar.addEventListener("click", (event) => {
      const expander = event.target.closest?.("[data-sidebar-expand]");

      if (expander && !isDrawer() && isCollapsed()) {
        event.preventDefault();
        setCollapsed(false);
        document.querySelector(expander.getAttribute("href"))?.scrollIntoView({ block: "start" });
        return;
      }

      // Following a link from the drawer should reveal the page behind it.
      if (isDrawer() && event.target.closest?.("a[href]")) {
        closeDrawer({ restoreFocus: false });
      }
    });

    backdrop.addEventListener("click", () => closeDrawer());

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isDrawerOpen()) {
        closeDrawer();
      }
    });

    drawerMedia.addEventListener?.("change", () => {
      closeDrawer({ restoreFocus: false });
      syncToggles();
    });

    syncToggles();
    root.classList.add("sidebar-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
