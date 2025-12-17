# Defalt dashboard deep audit (architectural)

Date: 2025-12-17

## Task scope (what I audited)
- `defalt-sections`: section definitions, zod schemas, defaults, registry, blocks
- `defalt-rendering`: preview renderer + export pipeline
- `defalt-app`: React/editor state + sidebar/settings UI + hooks
- `defalt-ui`: primitives + settings rendering utilities
- `server.ts` + `vite-plugin-theme-config.ts`: API/data flow + export
- Cross-cutting: types/defaults/sanitizers/premium gating

## End-to-end data flow (current)
1. **Schema layer**: each section exports `definition` with `configSchema` (Zod), `settingsSchema` (UI), optional `blocksSchema`, and `createConfig()` defaults. Example: `dashboard/defalt-sections/sections/hero/index.ts:9`.
2. **Registry**: `sectionRegistry.ts` auto-discovers `sections/*/index.ts`, warns on some inconsistencies, then registers anyway. `dashboard/defalt-sections/engine/sectionRegistry.ts:139`.
3. **Editor state**:
   - Section instances live in `useSectionManager` (ids, tags, per-instance config). `dashboard/defalt-app/hooks/editor/useSectionManager.ts:59`.
   - Padding/margins/visibility stored separately from per-section config. `dashboard/defalt-app/hooks/useWorkspace.ts:221`.
   - “Theme settings” split across:
     - `packageJson` custom settings (navigation layout, fonts, etc). `dashboard/defalt-utils/hooks/usePackageJson.ts:182`.
     - `useWorkspace` state (accentColor, bgColor, sticky header, etc). `dashboard/defalt-app/hooks/useWorkspace.ts:980`.
4. **Preview rendering**:
   - Custom sections rendered via `renderSection()` with derived render config + `{ padding, pages }`. `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx:354`.
   - Announcement bars rendered separately (not via template order). `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx:444`.
   - Header/custom spacing applied via DOM/CSS injection (not via section templates). `dashboard/defalt-rendering/custom-source/handlebars/headerCustomization.ts:61`.
5. **Export**:
   - Server copies `public/themes/source-complete` → temp dir then rewrites templates/partials + zips. `dashboard/server.ts:805`.
   - Generated `home.hbs` uses `@custom.*` values at runtime (Ghost custom settings). `dashboard/defalt-rendering/theme/exportTheme.ts:258`.

## Findings (by module)

### 1) defalt-sections

**1.1 Registry is warn-only; no enforcement** (Unreachable code / Redundant code risk)
- Registry collects warnings but still registers the section. `dashboard/defalt-sections/engine/sectionRegistry.ts:139` then `dashboard/defalt-sections/engine/sectionRegistry.ts:148`.
- Validates `settingsSchema` ids vs `configSchema` keys, but **does not validate `blocksSchema` ids vs `configSchema`**. `dashboard/defalt-sections/engine/sectionRegistry.ts:107`.
Impact: schema drift becomes runtime/UI drift, not build-time failure.

**1.2 Zod defaults vs UI defaults duplicated in multiple places** (Redundant code)
- `commonSettings` defines constraints twice: Zod min/max and UI min/max/step. Example: `imageBorderRadius` Zod `min/max` `dashboard/defalt-sections/engine/commonSettings.ts:97` vs UI `min/max/step` `dashboard/defalt-sections/engine/commonSettings.ts:120`.
Impact: changing constraints requires multiple edits; drift is likely.

**1.3 Section duplication: `hero` vs `image-with-text` are effectively the same schema** (Redundant code / Stale architecture)
- Both share identical shape composition and UI settings; only the default tag differs. Compare `dashboard/defalt-sections/sections/hero/schema.ts:31` and `dashboard/defalt-sections/sections/image-with-text/schema.ts:28`.
Impact: double maintenance; tag + template path is the only real variation.

**1.4 Duplicated “Primary Cards” help block** (Redundant code)
- Same long `cardList` exists in two schemas. `dashboard/defalt-sections/sections/ghostCards/schema.ts:55` and `dashboard/defalt-sections/sections/ghostGrid/schema.ts:61`.
Impact: high churn surface for copy edits; hard to keep consistent.

**1.5 Block section drift: announcement block config includes `link`, UI schema omits it** (Unreachable code / Stale data)
- Config has `link`. `dashboard/defalt-sections/sections/announcement-bar/schema.ts:28`.
- Block UI settings include `text` but no `link` field. `dashboard/defalt-sections/sections/announcement-bar/schema.ts:54`.
- Template uses `link` to render `<a href=...>`. `dashboard/defalt-sections/sections/announcement-bar/announcement-bar.hbs:92`.
Impact: link behavior exists but is not reachable via sidebar UI.

**1.6 Unused exports** (Unused exports)
- Setting factory helpers exported but never called (repo-wide). `dashboard/defalt-sections/engine/schemaTypes.ts:364` (and re-exported `dashboard/defalt-sections/engine/index.ts:52`).
- `sourceThemeSettingsSchema` exported but unused. `dashboard/defalt-sections/themes/source/schema.ts:160`.

### 2) defalt-rendering

**2.1 Preview vs export duplicate render-config builders** (Redundant code)
- Same helper logic exists in both:
  - Preview: `resolveContainerPaddingX` `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx:54`.
  - Export: `resolveContainerPaddingX` `dashboard/defalt-rendering/theme/exportTheme.ts:191`.
Impact: fixes land in one path only; behavior diverges.

**2.2 Container width mismatch (initial render vs incremental update)** (Stale data / Redundant code)
- Initial CSS var: `720px/1120px`. `dashboard/defalt-rendering/custom-source/handlebars/helpers.ts:169`.
- Incremental update uses `1000px/1200px`. `dashboard/defalt-rendering/custom-source/handlebars/domManipulation.ts:698`.
Impact: switching page layout after initial render yields inconsistent widths.

**2.3 Hero id/tag parsing inconsistent across modules (collision risk)** (Redundant code / Stale data)
- Section manager generates ids like `hero-defalt-2`. `dashboard/defalt-utils/config/configStateDefaults.ts:12` and `dashboard/defalt-app/hooks/editor/useSectionManager.ts:64`.
- Preview/export fallback tag parsing supports `hero-defalt(-N)`. `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx:76` and `dashboard/defalt-rendering/theme/exportTheme.ts:215`.
- But section manager’s hero tag suffix regex expects `hero-N`, so `hero-defalt-2` falls back to suffix `1`. `dashboard/defalt-app/hooks/editor/useSectionManager.ts:399`.
Impact: multiple hero instances can silently share `#hero` and source the same Ghost content.

**2.4 `generateHomeTemplate()` returns `partialFiles` but never populates it** (Unreachable code / Redundant code)
- Declared empty. `dashboard/defalt-rendering/theme/exportTheme.ts:257`.
- Returned (still empty). `dashboard/defalt-rendering/theme/exportTheme.ts:425`.
- Both server and dev plugin still write `partialFiles`. `dashboard/server.ts:835` and `dashboard/vite-plugin-theme-config.ts:492`.
Impact: dead path + misleading API contract.

**2.5 Custom CSS preview exists; export path appears missing** (Stale feature / Unreachable behavior)
- Preview injects CSS into iframe. `dashboard/defalt-rendering/custom-source/handlebars/domManipulation.ts:665`.
- Export customization claims to handle “custom CSS” but does not implement it. `dashboard/defalt-rendering/theme/exportTheme.ts:655` (comment) and `dashboard/defalt-rendering/theme/exportTheme.ts:660` (implementation).
Impact: user can believe Custom CSS exports, but it likely only affects preview.

### 3) defalt-app

**3.1 Hero tags for multi-instance sections are wrong** (Unreachable code / Stale data)
- `HERO_ID_PREFIX` is `hero-defalt`. `dashboard/defalt-utils/config/configStateDefaults.ts:12`.
- When adding hero, tag suffix parsing uses `^hero-(\\d+)$`. `dashboard/defalt-app/hooks/editor/useSectionManager.ts:399`.
Impact: `hero-defalt-2` tag becomes `#hero` (not `#hero-2`), and tag isn’t user-editable in the hero settings schema. `dashboard/defalt-sections/sections/hero/schema.ts:44`.

**3.2 Announcement bar tag generation can collide after deletions** (Stale data)
- ID picks “first free suffix”. `dashboard/defalt-app/hooks/editor/useAnnouncementBars.ts:90`.
- Tag suffix uses `prevBars.length + 1`. `dashboard/defalt-app/hooks/editor/useAnnouncementBars.ts:97`.
Impact: after deleting bar 2, next created bar can reuse `#announcement-2` while an existing bar still has it.

**3.3 Announcement block `link` is not editable in UI but affects template output** (Unreachable behavior)
- Block settings UI is schema-driven from `announcementBarBlocksSchema`. `dashboard/defalt-app/layout/sidebar/pages/components/SectionDetailRenderer.tsx:557`.
- `link` exists in config and template. `dashboard/defalt-sections/sections/announcement-bar/schema.ts:28` and `dashboard/defalt-sections/sections/announcement-bar/announcement-bar.hbs:92`.
Impact: can’t create clickable announcements via sidebar.

**3.4 Header padding is persisted + hydrated, but not editable and not applied in preview** (Unreachable behavior)
- Persisted into header settings. `dashboard/defalt-app/hooks/useWorkspace.ts:249`.
- Hydrated back into section padding state. `dashboard/defalt-app/hooks/useWorkspace.ts:645`.
- Header settings panel passes no `onPaddingChange`, so SchemaSectionSettings never renders padding controls. `dashboard/defalt-app/layout/sidebar/pages/components/SectionDetailRenderer.tsx:192` and `dashboard/defalt-app/layout/sidebar/components/SchemaSectionSettings.tsx:47`.
- Preview padding selectors exclude header. `dashboard/defalt-rendering/custom-source/handlebars/headerCustomization.ts:61`.
Impact: header padding is effectively a zombie state.

**3.5 Background color state is parsed from `packageJson`, but updates don’t write back** (Stale data)
- Hydration parses `site_background_color.default` from `packageJson`. `dashboard/defalt-app/hooks/useWorkspace.ts:780`.
- UI updates only `bgColor` state. `dashboard/defalt-app/hooks/useWorkspace.ts:1000`.
- PackageJson editing hook does not manage `site_background_color`. `dashboard/defalt-utils/hooks/usePackageJson.ts:182`.
Impact: background color changes are non-persistent (reload/export mismatch).

**3.6 Schema settings renderer has brittle insertion points keyed off header label strings** (Redundant code / Stale coupling)
- Groups are keyed by header `label` (not stable id). `dashboard/defalt-app/layout/sidebar/components/settingsRenderUtils.tsx:86`.
- Padding is “inserted” at group title `Primary Cards`. `dashboard/defalt-app/layout/sidebar/components/SchemaSectionSettings.tsx:49`.
Impact: any copy/rename/localization of “Primary Cards” changes layout behavior.

**3.7 Subscription gating bug: `hasFeature()` ignores its argument** (Unreachable code)
- `feature` is explicitly discarded. `dashboard/defalt-app/contexts/SubscriptionContext.tsx:68`.
Impact: any per-feature gating based on `hasFeature('x')` cannot work.

### 4) defalt-ui

**4.1 Settings renderer bakes in defaults/behavior that are not schema-owned** (Stale coupling)
- Default color swatches are hardcoded in renderer utilities. `dashboard/defalt-app/layout/sidebar/components/settingsRenderUtils.tsx:64`.
- URL input coerces empty string to `#`. `dashboard/defalt-app/layout/sidebar/components/settingsRenderUtils.tsx:135`.
Impact: UI behavior can diverge from Zod defaults and from exported template expectations.

**4.2 Padding slider bounds are hardcoded in app layer (not schema/constant-owned)** (Redundant code)
- Section padding slider bounds duplicated in multiple places. Example: `dashboard/defalt-app/layout/sidebar/components/SchemaSectionSettings.tsx:130`.
Impact: constraints drift from `CSS_DEFAULT_PADDING` / theme expectations.

### 5) Server & API

**5.1 DB schema init order bug (trigger created before function)** (Broken behavior)
- Trigger references `update_updated_at_column()` before it’s created. `dashboard/server.ts:70` then function defined `dashboard/server.ts:72`.
Impact: depending on postgres behavior, init can error mid-script; later statements may not run.

**5.2 `db/schema.sql` drifts from runtime schema** (Stale docs)
- Repo SQL file only creates `member_themes`. `dashboard/db/schema.sql:4`.
- Runtime init also creates `member_settings`. `dashboard/server.ts:55`.
Impact: operators running `db/schema.sql` won’t match what the app expects.

**5.3 Dead legacy branch: announcement bar “header section”** (Unreachable code)
- Server checks `document.header.sections['announcement-bar']`. `dashboard/server.ts:662`.
- Normalizer always collapses header sections to `{ header }`. `dashboard/defalt-utils/config/themeConfig.ts:804`.
Impact: legacy branch can’t be true after normalization.

**5.4 Export ignores updated `packageJson` (Ghost `@custom` defaults won’t ship)** (Stale data / Broken export)
- Theme doc persists `packageJson`. `dashboard/defalt-utils/config/themeConfig.ts:1070`.
- Export request sends full theme document. `dashboard/defalt-app/hooks/useExport.ts:156`.
- Export generates templates that read `@custom.*`. `dashboard/defalt-rendering/theme/exportTheme.ts:258`.
- But export flow only writes templates/partials and never updates theme `package.json` in workspace copy (base stays). Example write is `home.hbs`. `dashboard/server.ts:833` and dev export `dashboard/vite-plugin-theme-config.ts:489`.
- Base theme `package.json` contains the relevant custom default keys. `dashboard/public/themes/source-complete/package.json:97`.
Impact: exported zip likely reverts many Settings-tab defaults (navigation layout, fonts, background color, etc.) to the base theme’s `package.json`.

## Cross-cutting issues (categories)

### Unused exports
- `createTextSetting` and related helpers (exported, unused): `dashboard/defalt-sections/engine/schemaTypes.ts:364`.
- `sourceThemeSettingsSchema` exported, unused: `dashboard/defalt-sections/themes/source/schema.ts:160`.

### Broken references / stale assets
- Premium feature ids include sections not present in this repo (`grid`, `faq`, `about`, `testimonials`). `dashboard/defalt-utils/config/premiumConfig.ts:3`.
- Server maps those premium ids to partial filenames (also absent unless generated elsewhere). `dashboard/server.ts:628`.

### Unreachable code paths
- `partialFiles` plumbing (always empty): `dashboard/defalt-rendering/theme/exportTheme.ts:257`.
- Legacy announcement-bar header section check: `dashboard/server.ts:662`.
- `hasFeature(feature)` ignores `feature`: `dashboard/defalt-app/contexts/SubscriptionContext.tsx:68`.

### Redundant code / duplicated logic
- Preview vs export config derivation duplication: `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx:74` and `dashboard/defalt-rendering/theme/exportTheme.ts:214`.
- Multiple hex color sanitizers with different feature sets:
  - canonical: `dashboard/defalt-utils/security/sanitizers.ts:126`
  - local duplicates: `dashboard/defalt-rendering/theme/exportTheme.ts:115` and `dashboard/defalt-utils/config/themeConfig.ts:375`

## Refactor targets (high ROI)
1. Single source of truth for **ids/tags** (hero, announcement): fix parsing once; share helper across app + rendering + export.
2. Make **package.json custom defaults** a first-class export artifact (or stop pretending Settings-tab edits persist).
3. Collapse **defaults** to one place per setting (Zod defaults OR createConfig OR UI fallback; not all three).
4. Enforce schema consistency at registry time (throw in dev; validate `blocksSchema` ids too).
5. Remove dead API surface (`partialFiles`, dead legacy branches) to reduce maintenance surface.

