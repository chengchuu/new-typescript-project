# Rename the Pages build script and document ESLint

## Summary

Rename the GitHub Pages-only `npm run build` command to `npm run build:pages` so that the site build is clearly distinct from direct TypeScript compilation and webpack bundling. Add the complete current ESLint configuration to the README so readers can reproduce the project's linting setup.

## Implementation changes

- Remove `build` from `package.json` and add `"build:pages": "node scripts/build-site.mjs && node scripts/validate-site.mjs"`. Do not retain a compatibility alias for the old command.
- Change the site build command in `.github/workflows/pages.yml` to `npm run build:pages`. Preserve the step order, permissions, deployment dependency, and artifact path.
- Update `scripts/validate-site.mjs` to require an exact `npm run build:pages` workflow command and verify the complete package script. The validator must also confirm that `build`, `build:site`, `validate:site`, and `check:site` are absent.
- Update the Pages commands and descriptions in `AGENTS.md` and `guides/GITHUB_PAGES_PLAN.md` to use `build:pages`. Keep `check` and `prepack` package-only; do not add the site build to either command.
- In the README's “配置 ESLint” section, add the sentence “在项目根目录创建 `eslint.config.js`:”. Follow it with the complete current JavaScript configuration from `eslint.config.js`, then retain the existing `npm run lint` command and reference link.
- Do not change the ESLint rules, dependencies, TypeScript source, package artifacts, Pages artifact structure, or deployment behavior. Do not address the existing mismatch between the Node.js minimum described in `AGENTS.md` and the absence of an `engines` field in `package.json`.

## Interfaces

- Remove the npm script interface `npm run build`.
- Add the npm script interface `npm run build:pages`.
- Preserve the existing behavior of `build:ts`, `build:webpack`, `check`, and `prepack`.

## Validation

1. Run `npm run format:check`, `npm run lint`, and `npm run check`.
2. Run `npm run build:pages` and confirm that it generates and validates `site-dist/`.
3. Confirm that the workflow, validator, and maintenance documentation no longer invoke the standalone `npm run build` command.
4. Confirm that the ESLint code block in the README exactly matches `eslint.config.js`.
5. Run `git diff --check` and inspect `git status --short`.
6. Confirm that Git still does not track `dist/` or `site-dist/`.

## Assumptions

- No external caller requires the existing `build` command.
- `build:pages` continues to generate and validate the site in sequence.
- The README includes the complete ESLint configuration and accepts the cost of keeping that example synchronized with the source file.
