(function initializeSite() {
  "use strict";

  const root = document.documentElement;
  const storageKey = "new-typescript-project-theme";
  const validPreferences = new Set(["system", "light", "dark"]);
  const themeColors = {
    light: "#ffffff",
    dark: "#141414",
  };

  root.classList.add("site-js");

  function getStoredPreference() {
    try {
      const storedPreference = window.localStorage?.getItem(storageKey);
      return validPreferences.has(storedPreference)
        ? storedPreference
        : "system";
    } catch {
      return "system";
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
    if (preference === "light" || preference === "dark") {
      return preference;
    }

    return colorSchemeQuery?.matches ? "dark" : "light";
  }

  let preference = getStoredPreference();
  const colorSchemeQuery = getColorSchemeQuery();

  function applyTheme() {
    const resolvedTheme = resolveTheme(preference, colorSchemeQuery);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const selector = document.querySelector("[data-theme-selector]");

    root.setAttribute("data-bs-theme", resolvedTheme);
    root.setAttribute("data-theme-preference", preference);
    root.style.colorScheme = resolvedTheme;

    if (themeColor) {
      themeColor.setAttribute("content", themeColors[resolvedTheme]);
    }

    if (selector) {
      selector.value = preference;
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
    const selector = document.querySelector("[data-theme-selector]");
    const navToggle = document.querySelector("[data-nav-toggle]");
    const navLinks = document.querySelector("[data-nav-links]");

    if (selector) {
      selector.value = preference;
      selector.addEventListener("change", (event) => {
        const nextPreference = validPreferences.has(event.target.value)
          ? event.target.value
          : "system";

        preference = nextPreference;
        persistPreference(nextPreference);
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
      if (preference === "system") {
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
