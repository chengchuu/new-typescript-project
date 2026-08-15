# GitHub Pages tutorial site plan

## Status and objective

Status: Completed

Add a responsive Simplified Chinese tutorial landing page at `https://chengchuu.github.io/new-typescript-project/`. Keep the Pages site separate from the package runtime and `dist/` artifacts. Maintained site source belongs under `site/`, generated deployment output belongs under ignored `site-dist/`, and package publishing remains independent.

Use Bootstrap 5.3.8 through the project CDN at `i.mazey.net`, a small repository-owned theme layer, and Cheng's blue light/dark palette. Deploy pushes to `main` and manual workflow dispatches only.

## Site and artifact boundaries

Create this delivery structure:

```text
site/                         Maintained HTML template, CSS, theme JavaScript, and site metadata
scripts/build-site.mjs        Generates the complete Pages artifact
scripts/validate-site.mjs     Validates metadata, routes, assets, theme, and workflow contracts
site-dist/                    Ignored deployable artifact
.github/workflows/pages.yml   Builds, validates, uploads, and deploys site-dist/
```

Build one canonical route, `/new-typescript-project/`, containing:

- a responsive navbar and hero;
- an overview of TypeScript 7, Node.js 22, ESM, webpack, ESLint, and Prettier;
- cards for environment setup, compilation, bundling, and validation;
- the verified `npm install`, `npm run check`, and `node dist/index.js` workflow;
- an explanation of the TypeScript 7 CLI and TypeScript 6 compatibility sidecar;
- links to the repository and complete README.

Do not add an npm publication claim, interactive playground, Progressive Web App (PWA), Service Worker, or social image without a verified asset.

## Site implementation

Use these exact Bootstrap 5.3.8 CDN tags:

<!-- prettier-ignore -->
```html
<link type="text/css" href="//i.mazey.net/lib/bootstrap/5.3.8/css/bootstrap.min.css" rel="stylesheet" />
<script type="text/javascript" src="//i.mazey.net/lib/bootstrap/5.3.8/js/bootstrap.bundle.min.js"></script>
```

Preserve the protocol-relative URLs and attributes. Keep Bootstrap site-only and do not add it to `package.json`.

Use this exact favicon tag in the generated page metadata:

<!-- prettier-ignore -->
```html
<link rel="icon" type="image/png" sizes="32x32" href="//i.mazey.net/icon/fav/logo-dark-circle-transparent-32x32.png">
```

Do not copy the favicon into `site/` or `site-dist/`.

Map Bootstrap color variables and custom components to Cheng's semantic blue palette. Add an accessible `system`/`light`/`dark` selector that:

- persists the selected preference;
- follows operating-system changes only in `system` mode;
- updates the root Bootstrap theme, CSS `color-scheme`, selected control state, and the single `theme-color` element together;
- continues applying a usable theme when storage or media-query APIs are unavailable.

Use `#4d8ffb` before theme initialization, then `#ffffff` for resolved light mode and `#141414` for resolved dark mode. Load the local theme initializer early enough to prevent an avoidable wrong-theme flash.

Use `package.json.homepage` as the production URL authority and change it to `https://chengchuu.github.io/new-typescript-project/`. Maintain one route record for the title, factual description, canonical URL, and indexability. Generate `index.html`, `robots.txt`, and a one-route `sitemap.xml`. Emit one title, description, canonical, Open Graph URL set, and non-empty `h1`. Use relative local asset URLs so the artifact works under the GitHub Pages project path and from a local static server.

Add these package-script contracts:

- `build:site`: generate `site-dist/` from maintained site source.
- `validate:site`: validate the complete generated artifact and workflow contract.
- `check:site`: build, then validate the Pages artifact.

Keep `npm run check` and `prepack` package-only so website validity cannot block package assembly. Update `.gitignore`, Prettier and ESLint scopes, `README.md`, and `AGENTS.md` for the new source, artifact, validation, and deployment boundaries.

## Deployment workflow

On a push to `main` or a manual dispatch, GitHub Actions must:

1. Check out the intended revision with `actions/checkout@v7`.
2. Set up Node.js 22 with `actions/setup-node@v7` and dependency caching disabled.
3. Run `npm install` and the existing `npm run check` package health check.
4. Configure Pages with `actions/configure-pages@v6`.
5. Build and validate the site through `npm run check:site`.
6. Upload only `site-dist/` with `actions/upload-pages-artifact@v5`.
7. Deploy the validated artifact with `actions/deploy-pages@v5`.

Keep build and deploy jobs separate. The deploy job must depend on the validated build artifact and use the protected `github-pages` environment. Grant only `contents: read`, `pages: write`, and `id-token: write`. Serialize deployments with `cancel-in-progress: false`. A validation failure must prevent artifact upload and deployment; package publication remains outside this workflow.

## Validation and acceptance criteria

1. Run `npm install`, `npm run check`, and `npm run check:site` locally on Node.js 22.
2. Confirm `site-dist/` contains `index.html`, `robots.txt`, `sitemap.xml`, and every referenced local asset.
3. Reject unresolved template placeholders, root-relative project assets, duplicate metadata, missing local assets, a missing or changed favicon tag, and noncanonical sitemap entries.
4. Serve `site-dist/` locally and inspect desktop and mobile layouts, collapsed navigation, keyboard focus, external links, and code-block readability.
5. Test first visit, stored `light`, stored `dark`, `system`, operating-system preference changes, invalid storage, and unavailable storage.
6. Confirm the root theme, Bootstrap mode, `color-scheme`, selector state, and browser theme color remain synchronized.
7. Confirm the page remains readable if Bootstrap JavaScript is unavailable and that the Bootstrap links use the exact version 5.3.8 CSS and JavaScript CDN URLs shown in this plan.
8. Validate the production subpath, canonical URL, crawler files, workflow trigger, permissions, action versions, artifact path, and deploy dependency.
9. Run `git diff --check` and inspect `git status --short`.
10. After the feature branch is merged to `main`, run a production Pages smoke test.

## Assumptions, risks, and rollback

- The TypeScript 7 migration at the current feature-branch head is the baseline. This work does not change `src/index.ts`, package output, public types, or the existing console message.
- The Bootstrap 3 reference supplies the card-based information architecture, but the new site follows the Bootstrap 5.3.8 component contract and loads its assets from the specified Mazey CDN.
- GitHub Pages must use GitHub Actions as its source in repository settings before the first deployment.
- Generated `site-dist/` files remain untracked.
- The Mazey CDN is an external runtime dependency. Local semantic CSS must preserve readable content if Bootstrap JavaScript is unavailable.
- Roll back by reverting the site change on `main` and allowing the workflow to deploy the previous artifact again.

## References

- [Bootstrap 5.3 quick start](https://getbootstrap.com/docs/5.3/getting-started/introduction/)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
