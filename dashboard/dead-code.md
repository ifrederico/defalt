# Dead Code Audit

Last audited: 2025-12-16

Goal: track dead code / bad refs + verdicts.

---

## Verdicts (from prior doc)

### 1) Export theme customizers removed

Verdict: TRUE

- Removed from `defalt-rendering/theme/exportTheme.ts`:
  - `applyHeroCustomization()`
  - `applyGhostCardsCustomization()`
  - `applyGhostGridCustomization()`
  - `applyImageWithTextCustomization()`
- Reason is accurate: export now copies section templates via `applyCustomSectionTemplates()`.

### 2) Stale `sections/*` partial loads removed

Verdict: TRUE

- Removed from `defalt-rendering/custom-source/handlebars/templateLoader.ts`:
  - `sections/announcement-bar`
  - `sections/defalt-hero`
  - `sections/defalt-ghost-cards`
  - `sections/defalt-ghost-grid`
- These files do not exist in source theme: `public/themes/source-complete/partials/` has no `sections/` dir.
- Custom section templates are sourced from `defalt-sections/sections/*/*.hbs` via `defalt-sections/engine/sectionRegistry.ts` (`import.meta.glob`).

### 3) Stale export workspace partials

Verdict: TRUE (mechanism), UNVERIFIED (the “Dec 11” detail)

- `vite-plugin-theme-config.ts` now removes workspace `partials/` before syncing theme files.
- This prevents old files sticking around because `fs.cp(..., force: true)` does not delete extra files.

---

## Intentional / expected

### Upcoming premium section IDs exist but sections not implemented

Verdict: TRUE

- Present in config/code:
  - `defalt-utils/config/premiumConfig.ts` (`PREMIUM_FEATURES`)
  - `defalt-utils/config/sectionIcons.ts` (`SECTION_ICON_MAP`)
  - `server.ts` (`PREMIUM_SECTION_PARTIALS`)
  - UI filters them as “upcoming”: `defalt-app/layout/sidebar/pages/SectionsPanelBase.tsx` (`UPCOMING_SECTION_IDS`)
- Not implemented as actual sections: no folders for `grid|testimonials|faq|about` under `defalt-sections/sections/`.

### `custom-css` in `FREE_FEATURES`

Verdict: TRUE

- No section definition for `custom-css` (it’s a feature flag; e.g. used for custom CSS injection).

---

## Incorrect / outdated in prior doc

- “`eslint-plugin-unused-imports` catches unused imports” → FALSE (not configured in `dashboard/eslint.config.js`).
- “`defalt-rendering/custom-source/handlebars/hbsRenderer.ts`” → FALSE (file does not exist).
- “`defalt-utils/config/schemaTypes.ts`” + listed schema names → FALSE (file does not exist; those names were internal locals in `themeValidation.ts`, not exported APIs).
- `sectionRegistry` export list was wrong (mixed functions from other files + non-existent names).

---

## Confirmed unused exports (repo-local, safe-to-remove if you want)

- Removed now:
  - `defalt-utils/config/themeValidation.ts`: `themeDocumentSchema`, `workspaceBackupSchema` exports (kept as internal constants).
  - `defalt-sections/engine/hbsRenderer.ts`: removed unused exports/functions (`clearTemplateCache`, `invalidateTemplate`, `renderSectionSync`, `buildCssVariables`, `getTemplateSource`, `isTemplateCached`, `sanitizeHexColor`, `sanitizeHref`, `escapeHtml`) and removed the unused `templateSourceCache`.
  - `defalt-sections/engine/sectionRegistry.ts`: removed unused exports (`hasSection`, `getSectionIds`, `getPremiumSections`, `getFreeSections`, `listSections`, `debugLogSections`) and made `sectionDefinitionMap` internal.
  - `defalt-sections/engine/validation.ts`: removed (was not used anywhere in-repo; `engine/index.ts` no longer re-exports it).
