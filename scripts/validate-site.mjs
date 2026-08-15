import assert from "node:assert/strict";
import console from "node:console";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { URL } from "node:url";
import vm from "node:vm";

const projectRoot = process.cwd();
const outputDirectory = path.join(projectRoot, "site-dist");
const expectedFiles = [
  "index.html",
  "robots.txt",
  "sitemap.xml",
  "styles.css",
  "theme.js",
];
const bootstrapCssTag =
  '<link type="text/css" href="//i.mazey.net/lib/bootstrap/5.3.8/css/bootstrap.min.css" rel="stylesheet" />';
const bootstrapJavaScriptTag =
  '<script type="text/javascript" src="//i.mazey.net/lib/bootstrap/5.3.8/js/bootstrap.bundle.min.js"></script>';
const faviconTag =
  '<link rel="icon" type="image/png" sizes="32x32" href="//i.mazey.net/icon/fav/logo-dark-circle-transparent-32x32.png">';

function countMatches(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

function stripTags(value) {
  return value.replace(/<[^>]*>/gu, "").trim();
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function createThemeHarness({
  storedPreference = null,
  storageUnavailable = false,
  mediaUnavailable = false,
  prefersDark = false,
} = {}) {
  const rootAttributes = new Map();
  const metaAttributes = new Map([["content", "#4d8ffb"]]);
  const selectorListeners = new Map();
  const navToggleListeners = new Map();
  const documentListeners = new Map();
  const mediaListeners = [];
  const storedValues = new Map();
  const classNames = new Set();
  const selector = {
    value: "",
    addEventListener(type, handler) {
      selectorListeners.set(type, handler);
    },
  };
  const navToggle = {
    attributes: new Map([["aria-expanded", "false"]]),
    addEventListener(type, handler) {
      navToggleListeners.set(type, handler);
    },
    getAttribute(name) {
      return this.attributes.get(name) ?? null;
    },
    setAttribute(name, value) {
      this.attributes.set(name, value);
    },
  };
  const navLinks = {
    attributes: new Map([["data-expanded", "false"]]),
    setAttribute(name, value) {
      this.attributes.set(name, value);
    },
  };
  const mediaQuery = {
    matches: prefersDark,
    addEventListener(type, handler) {
      if (type === "change") {
        mediaListeners.push(handler);
      }
    },
  };
  const root = {
    style: {},
    classList: {
      add(name) {
        classNames.add(name);
      },
    },
    setAttribute(name, value) {
      rootAttributes.set(name, value);
    },
  };
  const document = {
    documentElement: root,
    readyState: "loading",
    addEventListener(type, handler) {
      documentListeners.set(type, handler);
    },
    querySelector(query) {
      if (query === 'meta[name="theme-color"]') return meta;
      if (query === "[data-theme-selector]") return selector;
      if (query === "[data-nav-toggle]") return navToggle;
      if (query === "[data-nav-links]") return navLinks;
      return null;
    },
  };
  const meta = {
    setAttribute(name, value) {
      metaAttributes.set(name, value);
    },
  };
  const localStorage = {
    getItem(key) {
      if (storageUnavailable) throw new Error("Storage unavailable");
      return storedValues.has(key) ? storedValues.get(key) : storedPreference;
    },
    setItem(key, value) {
      if (storageUnavailable) throw new Error("Storage unavailable");
      storedValues.set(key, value);
    },
  };
  const window = {
    localStorage,
    ...(mediaUnavailable ? {} : { matchMedia: () => mediaQuery }),
  };

  return {
    context: { document, Set, window },
    documentListeners,
    mediaListeners,
    mediaQuery,
    metaAttributes,
    navLinks,
    navToggle,
    navToggleListeners,
    root,
    rootAttributes,
    selector,
    selectorListeners,
    storedValues,
    classNames,
  };
}

function runThemeScenario(themeSource, options) {
  const harness = createThemeHarness(options);
  vm.runInNewContext(themeSource, harness.context, { filename: "theme.js" });
  harness.documentListeners.get("DOMContentLoaded")?.();
  return harness;
}

function assertThemeState(harness, preference, resolvedTheme, themeColor) {
  assert.equal(harness.rootAttributes.get("data-theme-preference"), preference);
  assert.equal(harness.rootAttributes.get("data-bs-theme"), resolvedTheme);
  assert.equal(harness.root.style.colorScheme, resolvedTheme);
  assert.equal(harness.selector.value, preference);
  assert.equal(harness.metaAttributes.get("content"), themeColor);
  assert.ok(harness.classNames.has("site-js"));
}

const packageJson = await readJson(path.join(projectRoot, "package.json"));
const routes = await readJson(path.join(projectRoot, "site", "routes.json"));
const workflow = await readFile(
  path.join(projectRoot, ".github", "workflows", "pages.yml"),
  "utf8",
);
const html = await readFile(path.join(outputDirectory, "index.html"), "utf8");
const robots = await readFile(path.join(outputDirectory, "robots.txt"), "utf8");
const sitemap = await readFile(
  path.join(outputDirectory, "sitemap.xml"),
  "utf8",
);
const styles = await readFile(path.join(outputDirectory, "styles.css"), "utf8");
const themeSource = await readFile(
  path.join(outputDirectory, "theme.js"),
  "utf8",
);

assert.deepEqual(
  (await readdir(outputDirectory)).sort(),
  expectedFiles.toSorted(),
);
assert.equal(routes.length, 1);

const [route] = routes;
assert.equal(
  packageJson.homepage,
  "https://chengchuu.github.io/new-typescript-project/",
);
assert.equal(route.path, "/new-typescript-project/");
assert.equal(route.canonical, packageJson.homepage);
assert.equal(new URL(route.canonical).pathname, route.path);
assert.equal(route.index, true);
assert.ok(route.title.trim());
assert.ok(route.description.trim());

assert.doesNotMatch(html, /\{\{[^}]+\}\}/u);
assert.equal(countMatches(html, /<title>[^<]+<\/title>/gu), 1);
assert.equal(
  countMatches(html, /<meta name="description" content="[^"]+" \/>/gu),
  1,
);
assert.equal(countMatches(html, /<link rel="canonical" href="[^"]+" \/>/gu), 1);
assert.equal(
  countMatches(html, /<meta property="og:url" content="[^"]+" \/>/gu),
  1,
);
assert.equal(
  countMatches(html, /<meta property="og:type" content="[^"]+" \/>/gu),
  1,
);
assert.equal(
  countMatches(html, /<meta property="og:title" content="[^"]+" \/>/gu),
  1,
);
assert.equal(
  countMatches(html, /<meta property="og:description" content="[^"]+" \/>/gu),
  1,
);
assert.equal(
  countMatches(html, /<meta name="robots" content="[^"]+" \/>/gu),
  1,
);
assert.equal(
  countMatches(html, /<meta name="theme-color" content="[^"]+" \/>/gu),
  1,
);
assert.equal(countMatches(html, /<h1(?:\s[^>]*)?>[\s\S]*?<\/h1>/gu), 1);
assert.ok(
  stripTags(html.match(/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/u)?.[1] ?? ""),
);
assert.ok(html.includes(`<title>${route.title}</title>`));
assert.ok(
  html.includes(`<meta name="description" content="${route.description}" />`),
);
assert.ok(html.includes(`<link rel="canonical" href="${route.canonical}" />`));
assert.ok(
  html.includes(`<meta property="og:url" content="${route.canonical}" />`),
);
assert.ok(html.includes('<meta property="og:type" content="website" />'));
assert.ok(
  html.includes(`<meta property="og:title" content="${route.title}" />`),
);
assert.ok(
  html.includes(
    `<meta property="og:description" content="${route.description}" />`,
  ),
);
assert.ok(html.includes('<meta name="robots" content="index, follow" />'));
assert.ok(html.includes('<meta name="theme-color" content="#4d8ffb" />'));
assert.equal(html.split(bootstrapCssTag).length - 1, 1);
assert.equal(html.split(bootstrapJavaScriptTag).length - 1, 1);
assert.equal(html.split(faviconTag).length - 1, 1);
assert.doesNotMatch(html, /(?:manifest|serviceWorker|og:image)/u);

const htmlWithoutBootstrapJavaScript = html.replace(bootstrapJavaScriptTag, "");
assert.match(htmlWithoutBootstrapJavaScript, /<main\s/u);
assert.match(htmlWithoutBootstrapJavaScript, /<h1(?:\s[^>]*)?>/u);
assert.ok(htmlWithoutBootstrapJavaScript.includes('src="./theme.js"'));

for (const requiredText of [
  "TypeScript 7",
  "Node.js 22",
  "ESM",
  "webpack",
  "ESLint",
  "Prettier",
  "npm install",
  "npm run check",
  "node dist/index.js",
  "@typescript/native",
  "@typescript/typescript6",
  "https://github.com/chengchuu/new-typescript-project",
  "https://github.com/chengchuu/new-typescript-project#readme",
]) {
  assert.ok(
    html.includes(requiredText),
    `Missing required site text: ${requiredText}`,
  );
}

assert.doesNotMatch(html, /p[n]pm/iu);

const documentIds = new Set(
  [...html.matchAll(/\sid=(?:"([^"]+)"|'([^']+)')/gu)].map(
    (match) => match[1] ?? match[2],
  ),
);

for (const referenceMatch of html.matchAll(
  /\s(?:href|src)=(?:"([^"]+)"|'([^']+)')/gu,
)) {
  const reference = referenceMatch[1] ?? referenceMatch[2];

  assert.doesNotMatch(reference, /^\/(?!\/)/u);

  if (reference.startsWith("#")) {
    assert.ok(
      documentIds.has(reference.slice(1)),
      `Missing fragment target: ${reference}`,
    );
    continue;
  }

  if (!reference.startsWith("./")) {
    continue;
  }

  const localUrl = new URL(reference, route.canonical);
  assert.ok(
    localUrl.pathname.startsWith(route.path),
    `Local reference escapes the Pages route: ${reference}`,
  );

  if (localUrl.pathname === route.path) {
    continue;
  }

  const localPath = decodeURIComponent(
    localUrl.pathname.slice(route.path.length),
  );
  const localFilePath = path.resolve(outputDirectory, localPath);
  const relativeOutputPath = path.relative(outputDirectory, localFilePath);
  assert.ok(
    relativeOutputPath &&
      relativeOutputPath !== ".." &&
      !relativeOutputPath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativeOutputPath),
    `Local reference escapes the Pages artifact: ${reference}`,
  );

  const localFile = await stat(localFilePath);
  assert.ok(localFile.isFile(), `Local reference is not a file: ${reference}`);
}

assert.equal(
  robots,
  [
    "User-agent: *",
    "Allow: /new-typescript-project/",
    "Sitemap: https://chengchuu.github.io/new-typescript-project/sitemap.xml",
    "",
  ].join("\n"),
);
assert.equal(
  sitemap,
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    "  <url>",
    `    <loc>${route.canonical}</loc>`,
    "  </url>",
    "</urlset>",
    "",
  ].join("\n"),
);

assert.ok(styles.includes("--site-blue: #4d8ffb"));
assert.ok(styles.includes('[data-bs-theme="dark"]'));
assert.ok(styles.includes(":focus-visible"));
assert.ok(styles.includes("overflow-x: auto"));
assert.ok(styles.includes('.site-js .site-nav-links[data-expanded="true"]'));

const firstVisit = runThemeScenario(themeSource, { prefersDark: true });
assertThemeState(firstVisit, "system", "dark", "#141414");

const storedLight = runThemeScenario(themeSource, {
  storedPreference: "light",
  prefersDark: true,
});
assertThemeState(storedLight, "light", "light", "#ffffff");

const storedDark = runThemeScenario(themeSource, {
  storedPreference: "dark",
  prefersDark: false,
});
assertThemeState(storedDark, "dark", "dark", "#141414");

const storedSystem = runThemeScenario(themeSource, {
  storedPreference: "system",
  prefersDark: false,
});
assertThemeState(storedSystem, "system", "light", "#ffffff");
storedSystem.mediaQuery.matches = true;
storedSystem.mediaListeners[0]();
assertThemeState(storedSystem, "system", "dark", "#141414");

const invalidStorage = runThemeScenario(themeSource, {
  storedPreference: "sepia",
  prefersDark: false,
});
assertThemeState(invalidStorage, "system", "light", "#ffffff");

const unavailableStorage = runThemeScenario(themeSource, {
  storageUnavailable: true,
  prefersDark: true,
});
assertThemeState(unavailableStorage, "system", "dark", "#141414");

const unavailableMedia = runThemeScenario(themeSource, {
  mediaUnavailable: true,
  storedPreference: "system",
});
assertThemeState(unavailableMedia, "system", "light", "#ffffff");

storedSystem.selector.value = "light";
storedSystem.selectorListeners.get("change")({ target: storedSystem.selector });
assertThemeState(storedSystem, "light", "light", "#ffffff");
assert.equal(
  storedSystem.storedValues.get("new-typescript-project-theme"),
  "light",
);
storedSystem.mediaQuery.matches = false;
storedSystem.mediaListeners[0]();
assertThemeState(storedSystem, "light", "light", "#ffffff");

storedSystem.navToggleListeners.get("click")();
assert.equal(storedSystem.navToggle.getAttribute("aria-expanded"), "true");
assert.equal(storedSystem.navLinks.attributes.get("data-expanded"), "true");

const actionOrder = [
  "actions/checkout@v7",
  "actions/setup-node@v7",
  "npm install",
  "npm run check",
  "actions/configure-pages@v6",
  "npm run check:site",
  "actions/upload-pages-artifact@v5",
  "actions/deploy-pages@v5",
];
let previousIndex = -1;

for (const action of actionOrder) {
  const currentIndex = workflow.indexOf(action);
  assert.ok(
    currentIndex > previousIndex,
    `Workflow order is invalid at ${action}`,
  );
  previousIndex = currentIndex;
}

assert.match(workflow, /push:\s*\n\s+branches:\s*\[main\]/u);
assert.match(workflow, /workflow_dispatch:/u);
const triggerBlock = workflow.match(/^on:\n([\s\S]+?)\npermissions:/mu)?.[1];
assert.ok(triggerBlock);
assert.deepEqual(
  [...triggerBlock.matchAll(/^ {2}([\w-]+):/gmu)]
    .map((match) => match[1])
    .toSorted(),
  ["push", "workflow_dispatch"],
);
const permissionBlock = workflow.match(
  /^permissions:\n((?: {2}[\w-]+:\s*\w+\n)+)/mu,
)?.[1];
assert.ok(permissionBlock);
assert.deepEqual(
  [...permissionBlock.matchAll(/^ {2}([\w-]+):/gmu)]
    .map((match) => match[1])
    .toSorted(),
  ["contents", "id-token", "pages"],
);
assert.match(permissionBlock, /contents:\s*read/u);
assert.match(permissionBlock, /pages:\s*write/u);
assert.match(permissionBlock, /id-token:\s*write/u);
assert.match(workflow, /cancel-in-progress:\s*false/u);
assert.match(workflow, /node-version:\s*["']?22["']?/u);
assert.match(workflow, /package-manager-cache:\s*false/u);
assert.match(workflow, /^\s+path:\s*site-dist\/\s*$/mu);
assert.match(workflow, /deploy:\s*\n\s+needs:\s*build/u);
assert.match(workflow, /name:\s*github-pages/u);
assert.doesNotMatch(workflow, /(?:npm|p[n]pm)\s+(?:publish|pack)/u);
assert.equal(packageJson.scripts["build:site"], "node scripts/build-site.mjs");
assert.equal(
  packageJson.scripts["validate:site"],
  "node scripts/validate-site.mjs",
);
assert.equal(
  packageJson.scripts["check:site"],
  "npm run build:site && npm run validate:site",
);
assert.doesNotMatch(packageJson.scripts.check, /site/u);
assert.doesNotMatch(packageJson.scripts.prepack, /site/u);

console.log(`Validated Pages artifact for ${route.canonical}`);
