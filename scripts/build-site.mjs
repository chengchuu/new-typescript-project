import console from "node:console";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { URL } from "node:url";

const projectRoot = process.cwd();
const siteSource = path.join(projectRoot, "site");
const outputDirectory = path.join(projectRoot, "site-dist");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll("'", "&apos;");
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

const packageJson = await readJson(path.join(projectRoot, "package.json"));
const routes = await readJson(path.join(siteSource, "routes.json"));

if (routes.length !== 1) {
  throw new Error("The Pages site must define exactly one route.");
}

const [route] = routes;

if (packageJson.homepage !== route.canonical) {
  throw new Error("package.json.homepage must match the canonical route URL.");
}

if (new URL(route.canonical).pathname !== route.path) {
  throw new Error("The route path must match its canonical URL.");
}

const replacements = new Map([
  ["{{TITLE}}", escapeHtml(route.title)],
  ["{{DESCRIPTION}}", escapeHtml(route.description)],
  ["{{CANONICAL_URL}}", escapeHtml(route.canonical)],
  ["{{ROBOTS}}", route.index ? "index, follow" : "noindex, nofollow"],
]);

let html = await readFile(path.join(siteSource, "index.template.html"), "utf8");

for (const [placeholder, value] of replacements) {
  html = html.replaceAll(placeholder, value);
}

if (/\{\{[^}]+\}\}/u.test(html)) {
  throw new Error("The generated HTML contains unresolved placeholders.");
}

const canonicalUrl = new URL(route.canonical);
const sitemapUrl = new URL("sitemap.xml", canonicalUrl).href;
const robots = [
  "User-agent: *",
  `Allow: ${canonicalUrl.pathname}`,
  `Sitemap: ${sitemapUrl}`,
  "",
].join("\n");
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  "  <url>",
  `    <loc>${escapeXml(route.canonical)}</loc>`,
  "  </url>",
  "</urlset>",
  "",
].join("\n");

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(path.join(outputDirectory, "index.html"), html),
  writeFile(path.join(outputDirectory, "robots.txt"), robots),
  writeFile(path.join(outputDirectory, "sitemap.xml"), sitemap),
  copyFile(
    path.join(siteSource, "styles.css"),
    path.join(outputDirectory, "styles.css"),
  ),
  copyFile(
    path.join(siteSource, "theme.js"),
    path.join(outputDirectory, "theme.js"),
  ),
]);

console.log(`Built Pages artifact for ${route.canonical}`);
