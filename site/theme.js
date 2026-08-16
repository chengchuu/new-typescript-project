(function initializeSite() {
  "use strict";

  const root = document.documentElement;
  const storageKey = "new-typescript-project-theme";
  const validPreferences = new Set(["light", "dark"]);
  const themeColors = {
    light: "#ffffff",
    dark: "#141414",
  };

  root.classList.add("site-js");

  function getStoredPreference() {
    try {
      const storedPreference = window.localStorage?.getItem(storageKey);
      return validPreferences.has(storedPreference) ? storedPreference : null;
    } catch {
      return null;
    }
  }

  function getColorSchemeQuery() {
    try {
      return typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;
    } catch {
      return null;
    }
  }

  function resolveTheme(preference, colorSchemeQuery) {
    if (validPreferences.has(preference)) {
      return preference;
    }

    return colorSchemeQuery?.matches ? "dark" : "light";
  }

  let preference = getStoredPreference();
  const colorSchemeQuery = getColorSchemeQuery();

  function applyTheme() {
    const resolvedTheme = resolveTheme(preference, colorSchemeQuery);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const toggle = document.querySelector("[data-theme-toggle]");
    const isDark = resolvedTheme === "dark";

    root.setAttribute("data-bs-theme", resolvedTheme);
    root.setAttribute("data-theme-preference", resolvedTheme);
    root.style.colorScheme = resolvedTheme;

    if (themeColor) {
      themeColor.setAttribute("content", themeColors[resolvedTheme]);
    }

    if (toggle) {
      const currentLabel = isDark ? "深色" : "浅色";
      const nextLabel = isDark ? "浅色" : "深色";
      toggle.setAttribute(
        "aria-label",
        `当前为${currentLabel}模式，切换到${nextLabel}模式`,
      );
    }
  }

  function persistPreference(nextPreference) {
    try {
      window.localStorage?.setItem(storageKey, nextPreference);
    } catch {
      // The selected theme remains active for the current page.
    }
  }

  function initializeControls() {
    const toggle = document.querySelector("[data-theme-toggle]");
    const navToggle = document.querySelector("[data-nav-toggle]");
    const navLinks = document.querySelector("[data-nav-links]");

    if (toggle) {
      toggle.addEventListener("click", () => {
        const currentTheme = resolveTheme(preference, colorSchemeQuery);
        preference = currentTheme === "dark" ? "light" : "dark";
        persistPreference(preference);
        applyTheme();
      });
    }

    if (navToggle && navLinks) {
      navToggle.addEventListener("click", () => {
        const expanded = navToggle.getAttribute("aria-expanded") === "true";
        navToggle.setAttribute("aria-expanded", String(!expanded));
        navLinks.setAttribute("data-expanded", String(!expanded));
      });
    }

    const handleSystemThemeChange = () => {
      if (preference === null) {
        applyTheme();
      }
    };

    if (typeof colorSchemeQuery?.addEventListener === "function") {
      colorSchemeQuery.addEventListener("change", handleSystemThemeChange);
    } else if (typeof colorSchemeQuery?.addListener === "function") {
      colorSchemeQuery.addListener(handleSystemThemeChange);
    }

    applyTheme();
  }

  applyTheme();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeControls, {
      once: true,
    });
  } else {
    initializeControls();
  }
})();
