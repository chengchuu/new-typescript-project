# Repository guide

## Project scope and layout

This repository contains a minimal TypeScript ECMAScript module (ESM) package and a separate static GitHub Pages site.

- `src/index.ts` is the only runtime source and source entry point. Preserve its observable output, `This project is new-typescript-project.`, unless a task explicitly changes runtime behavior.
- `package.json` defines the ESM package, JavaScript and declaration entry points, published files, development dependencies, and task scripts. It does not declare an `engines` range; use Node.js 22 to match CI and the Pages documentation.
- `tsconfig.json`, `webpack.config.js`, and `eslint.config.js` own compiler, bundle, and lint behavior. Keep configuration changes tied to a verified contract change.
- `README.md` is the reproducible Simplified Chinese TypeScript tutorial. Keep commands, dependency examples, configuration snippets, and generated-output examples synchronized with the repository.
- `site/` contains the maintained Pages template, route metadata, CSS, and theme/navigation JavaScript. `site/routes.json` is the single route record, and its canonical URL must match `package.json.homepage`.
- `scripts/build-site.mjs` recreates the ignored `site-dist/` directory. `scripts/validate-site.mjs` validates the generated files, metadata, local references, theme scenarios, and Pages workflow.
- `guides/` contains implementation plans. Plans describe proposed work and do not override the live package scripts or configuration.
- `.vscode/settings.json` defines workspace title, Markdown table-of-contents levels, line-ending and whitespace rules, and browser preferences.

## Compiler and build contracts

The TypeScript 7 transition uses two package aliases:

- `@typescript/native` aliases `typescript@7.0.2` and owns `tsc`, direct builds, watch mode, and type-checking.
- `typescript` aliases `@typescript/typescript6@6.0.2` and supplies the temporary compiler API required by `ts-loader` and typescript-eslint. It also provides `tsc6`.

Both build paths use `tsconfig.json`. The direct TypeScript build uses `NodeNext`, targets `ES2023`, reads `src/**/*.ts`, and emits ESM JavaScript, declarations, declaration maps, and source maps under `dist/`. webpack loads the same source through `ts-loader`, disables declaration output, and emits `dist/bundle.js` plus its source map. Both builds share the ignored `dist/` directory, so do not enable webpack output cleaning or edit generated files.

The Pages build reads `package.json`, `site/routes.json`, and `site/index.template.html`; replaces the route placeholders; generates `index.html`, `robots.txt`, and `sitemap.xml`; and copies `styles.css` and `theme.js` into `site-dist/`. The validator enforces the exact Bootstrap and favicon tags, project-relative assets, the light/dark theme contract, and the deployment workflow. Do not edit or commit `site-dist/`.

## Tooling and commands

Install dependencies from the repository root:

```bash
npm install
```

The repository tracks `pnpm-lock.yaml`, but local instructions and CI use `npm install`. Prettier excludes the generated lockfile. Do not hand-format it or introduce a committed `package-lock.json` without an explicit dependency-management change.

Run tasks through package scripts:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build:ts
npm run build:webpack
npm run check
npm run build
```

`npm run check` is the package health check: it checks formatting, lint rules, and types before running both package builds. `npm run build` is site-only: it rebuilds and validates `site-dist/`. Keep both `check` and `prepack` independent from the Pages build. `npm run format` and `npm run lint:fix` write files, so inspect their scope first.

`npm run watch` starts the TypeScript 7 compiler in watch mode. ESLint uses flat config with the recommended JavaScript and TypeScript rules; Prettier handles formatting separately.

The `prepack` lifecycle removes only `dist/` and runs `npm run check`. Use `npm pack --dry-run` to inspect package contents; do not publish unless the user explicitly requests it.

## Deployment and verification

`.github/workflows/pages.yml` runs on pushes to `main` and manual dispatches. It uses Node.js 22, installs with npm, runs the package health check, configures Pages, runs `npm run build`, uploads only `site-dist/`, and deploys through the protected `github-pages` environment.

For implementation changes, run the focused command plus `npm run check`. Run `npm run build` when site source, site scripts, route metadata, or the workflow changes. When runtime behavior changes, execute both `node dist/index.js` and `node dist/bundle.js`; their output must match. Finish with `git diff --check` and `git status --short`.

There is no automated test suite. Do not describe `npm run check` as a test command. Preserve unrelated work, and do not stage, commit, push, deploy, or publish unless requested.
