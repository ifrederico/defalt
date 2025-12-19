# Defalt dashboard audit (combined)

Audit dates: 2025-12-16 (CC), 2025-12-17 (Deep)
Updated: 2025-12-19 (merged + registry/tag refactor)

Notes:
- File:line refs match this repo state and will drift.
- Audit focus: unused exports, broken refs, stale data, unreachable code, redundant code, and source-of-truth issues.

## Cleanup applied (2025-12-18)
Removed after repo-wide import scan (0 usages):
- `dashboard/defalt-app/App.css`
- `dashboard/defalt-utils/api/aiService.ts` `validateSection()` (removed)
- `dashboard/defalt-sections/utils/uiConstants.ts`
- `dashboard/defalt-sections/engine/schemaTypes.ts` `create*Setting` helpers (removed)
- `dashboard/defalt-sections/themes/source/schema.ts` `sourceThemeSettingsSchema` (removed)
- `dashboard/defalt-ui/primitives/Button.tsx`
- `dashboard/defalt-ui/primitives/Pill.tsx`
- `dashboard/defalt-ui/primitives/ColorControl.tsx`
- `dashboard/defalt-ui/layout/settingComponents.tsx` `ButtonGroupSetting` / `SettingField` / `SettingRow` (removed)
- `dashboard/defalt-ui/primitives/ColorPicker/ColorPicker.tsx` `ColorOptionButtons` (removed)
- `dashboard/defalt-app/types/ghost-content-api.d.ts`
- `dashboard/package.json` deps: `use-debounce`, `@tryghost/content-api` (removed; lockfile updated)

## Resolved / false positives (as of 2025-12-19)
- No regex bug: `dashboard/defalt-rendering/custom-source/handlebars/templateLoader.ts:171` matches `dashboard/public/themes/source-complete/post.hbs:74` (`defalt-post-start-end`).
- Derived-config helpers are shared (no preview/export duplication): `dashboard/defalt-rendering/derived/sectionDerived.ts`.
- Color sanitization drift resolved (export + themeConfig use shared `sanitizeHexColor`):
  - `dashboard/defalt-rendering/theme/exportTheme.ts:13`
  - `dashboard/defalt-utils/config/themeConfig.ts:6`
- Announcement bar UI exposes `tag` + `link` (schema + settings renderer align):
  - `dashboard/defalt-sections/sections/announcement-bar/schema.ts:41`
  - `dashboard/defalt-app/layout/sidebar/pages/components/SectionDetailRenderer.tsx:552`
- Ghost cards legacy tag normalization exists on edit:
  - `dashboard/defalt-app/hooks/editor/useSectionManager.ts:731`
- Base-path mismatch test note was wrong (tests already use `apiPath()`):
  - `dashboard/defalt-app/hooks/useWorkspace.test.tsx:336`

## Decisions (locked)
- Container width: incremental preview updates must match initial render (720/1120).
- Preview hiding: match export behavior (wrap hidden markup).
- Hero tags: enforce unique default tags (`#hero`, `#hero-2`, ...) and normalize on load.
- Announcement bars: allow multi (limit 5), remove truncation in app + preview.
- Subscription gating: plus gets access to everything; free can add/experiment; export must block premium sections.
- Export gating: server derives tier from member data (not client).

## Executive summary (highest ROI problems)
- Settings have multiple sources of truth (schema defaults + UI fallbacks + editor injection + normalization).
- Legacy hero ids/tag mismatch produced duplicate `#hero` (migration + unified registry added; verify).
- Announcement bars are single-only at runtime despite schema/UI supporting blocks.
- Preview/export hide mismatch (strip vs wrap).
- Container width mismatch between initial render and incremental updates.
- DB init order bug (trigger created before function).
- Export gating bypassed (tier forced to plus).

## End-to-end flow (actual)

### A) Custom section flow
1) Section definitions + schemas live in `defalt-sections`.
   - `definition` binds `configSchema`, `settingsSchema`, `createConfig()`, template path. `dashboard/defalt-sections/sections/hero/index.ts:9`.
2) Editor stores section instances separately from persisted document.
   - `useSectionManager` holds `customSections` (instances). `dashboard/defalt-app/hooks/editor/useSectionManager.ts:227`.
3) Persisting writes “template order sections” + “custom sections” into the same `page.order` list.
   - Custom sections stored as `settings.definitionId + settings.customConfig`. `dashboard/defalt-app/hooks/useWorkspace.ts:192`.
4) Preview renders custom sections via `renderSection()` and adds derived, render-only fields.
   - tagFilter/columns/aspect ratio derivations. `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx:303`.
5) Export re-derives the same fields and embeds them into template partial calls.
   - `{{> "defalt-hero" ... tagFilter=... }}`. `dashboard/defalt-rendering/theme/exportTheme.ts:345`.

### B) “Theme settings” flow (global/header/site)
Settings are split across:
- `ThemeDocument.packageJson` (string) loaded from the base theme, then overridden. `dashboard/defalt-utils/hooks/usePackageJson.ts:15`.
- `ThemeDocument.header.sections.header.settings` (sticky/search/typography + announcementBars). `dashboard/defalt-app/hooks/useWorkspace.ts:238`.
- `useWorkspace` local state duplicates parts of both (e.g. background color parsed from packageJson). `dashboard/defalt-app/hooks/useWorkspace.ts:777`.

The header settings UI is a composition layer:
- It builds a schema-shaped header config from disparate sources to render schema-driven controls. `dashboard/defalt-app/layout/sidebar/pages/components/SectionDetailRenderer.tsx:42`.

## Findings by module

## 1) defalt-sections

### 1.1 Index/schema/defaults are consistent but still duplicate “defaults”
Example (hero):
- `definition.tag` duplicates schema default tag. `dashboard/defalt-sections/sections/hero/index.ts:13` vs `dashboard/defalt-sections/sections/hero/schema.ts:28`.

The schema is the real source of truth; `definition.tag` can drift silently.

### 1.2 `commonSettings` reduces duplication but splits constraints across layers
Example:
- Zod constraint: `imageBorderRadius` min/max. `dashboard/defalt-sections/engine/commonSettings.ts:95`.
- UI constraint: slider min/max/step. `dashboard/defalt-sections/engine/commonSettings.ts:116`.

Changing constraints requires edits in both places.

### 1.3 Section schema duplication (structural)
`hero` and `image-with-text` are the same schema except tag default + template:
- hero schema. `dashboard/defalt-sections/sections/hero/schema.ts:26`.
- image-with-text schema. `dashboard/defalt-sections/sections/image-with-text/schema.ts:23`.

### 1.4 Registry validation is warn-only and incomplete
- Warns but still registers. `dashboard/defalt-sections/engine/sectionRegistry.ts:138` and `:148`.
- Only validates `settingsSchema` ids against `configSchema.shape`; does not validate `blocksSchema` ids. (Validation loop starts here.) `dashboard/defalt-sections/engine/sectionRegistry.ts:107`.

## 2) defalt-rendering

### 2.1 Rendering engine consumes config via two separate pipelines
Theme templates:
- Loaded by fetch from `public/themes/source-complete`. `dashboard/defalt-rendering/custom-source/handlebars/templateLoader.ts:260`.

Custom sections:
- Rendered by schema-engine HBS renderer. `dashboard/defalt-sections/engine/hbsRenderer.ts:450`.

### 2.2 Padding/spacing comes from multiple unrelated systems
At least 4:
- Custom section padding → inline `sectionStyle` via `renderSection()` options. `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx:286`.
- Base template padding/margins → DOM/style injection keyed by selectors. `dashboard/defalt-rendering/custom-source/handlebars/headerCustomization.ts:61`.
- `pageLayout` → hardcoded `--container-width` values. `dashboard/defalt-rendering/custom-source/handlebars/domManipulation.ts:698`.
- Section `contentWidth` setting → template-specific max-width behavior. `dashboard/defalt-sections/engine/commonSettings.ts:24` and `dashboard/defalt-sections/sections/hero/hero.hbs:162`.

### 2.3 Container width mismatch (initial vs incremental)
- Initial render uses `720px` / `1120px`: `dashboard/defalt-rendering/custom-source/handlebars/helpers.ts:169`.
- Incremental updates use `1000px` / `1200px`: `dashboard/defalt-rendering/custom-source/handlebars/domManipulation.ts:698`.
Decision: match initial render values in incremental updates.

### 2.4 Preview hides by stripping markup; export hides by wrapping markup
- Preview strips via regex replacement. `dashboard/defalt-rendering/custom-source/handlebars/templateLoader.ts:78`.
- Export wraps in `<div class="hidden">`. `dashboard/defalt-rendering/theme/exportTheme.ts:294`.
Decision: match export behavior (wrap hidden markup in preview).

## 3) defalt-app

### 3.1 State duplication and unclear ownership
- Global settings live in `useWorkspace` local state. `dashboard/defalt-app/hooks/useWorkspace.ts:89`.
- Same settings are persisted into `ThemeDocument`. `dashboard/defalt-utils/config/themeConfig.ts:125`.
- `packageJson` is both parsed state (`usePackageJson`) and raw string stored on document. `dashboard/defalt-utils/hooks/usePackageJson.ts:45`.
- Selection + active tab are in a separate persisted Zustand store. `dashboard/defalt-app/stores/uiStore.ts:57`.

### 3.2 Schema-driven UI writes raw values (no validation at boundary)
- `SchemaSectionSettings` mutates config by key. `dashboard/defalt-app/layout/sidebar/components/SchemaSectionSettings.tsx:56`.
- Renderer adds non-schema behavior (defaults + coercions). `dashboard/defalt-app/layout/sidebar/components/settingsRenderUtils.tsx:109`.

### 3.3 Hero ids + tags (unified, no legacy)
Canonical ids: `hero`, `hero-2`, ...

Notes:
- No legacy migration. Existing legacy ids/tags must be fixed manually.
- Default tags still use `#hero`, `#hero-2`, ...

Status: verify in app.

### 3.4 Announcement bars: allow multiple blocks (limit 5)
Previous runtime truncated to one despite schema allowing 5.

Changes applied:
- removed app truncation (`useAnnouncementBars`)
- preview keeps all blocks
- header normalization keeps up to 5 blocks
- export renders all blocks

Status: verify in app + export.

### 3.5 Subscription gating API is inconsistent
`hasFeature(feature)` ignores the parameter:
- `void feature`. `dashboard/defalt-app/contexts/SubscriptionContext.tsx:68`.
Decision: plus gets access to everything; free can add/experiment but export should block premium sections.
Export currently bypasses gating:
- `tier: 'plus_monthly'` unconditionally. `dashboard/server.ts:676`.
Decision: server should derive tier from member data (not client).

## 4) defalt-utils

### 4.1 Overgrown modules worth splitting (optional)
- `dashboard/defalt-utils/hooks/usePackageJson.ts`
- `dashboard/defalt-utils/config/themeConfig.ts`

### 4.2 Likely-unused env declarations
- `VITE_AUTH_SECRET`, `VITE_SUPPORT_TIP_URL`, `VITE_APP_URL` in `dashboard/src/env.d.ts` (no code references).

## 5) Server & API

### 5.1 DB schema init order bug (likely breaks first boot)
Trigger is created before the function exists:
- trigger. `dashboard/server.ts:66`.
- function. `dashboard/server.ts:72`.

### 5.2 `db/schema.sql` is stale vs runtime schema
- SQL file only creates `member_themes`. `dashboard/db/schema.sql:4`.
- runtime init also creates `member_settings`. `dashboard/server.ts:55`.

### 5.3 Premium sections are planned but not shipped yet
Premium config references sections not in repo yet:
- `grid/faq/about/testimonials`. `dashboard/defalt-utils/config/premiumConfig.ts:3`.
Server maps those to partial names:
- `PREMIUM_SECTION_PARTIALS`. `dashboard/server.ts:629`.
Plan: keep list for upcoming sections, but add the missing sections/partials before enabling export gating.

### 5.4 Unreachable legacy: `header.sections['announcement-bar']`
Server checks this:
- `document.header.sections?.['announcement-bar']`. `dashboard/server.ts:664`.
But normalization collapses to only `{ header }`:
- `normalizeThemeDocument()` always returns header sections with only `header`. `dashboard/defalt-utils/config/themeConfig.ts:824`.

## Cross-cutting categories (requested)

### Broken references / stale data
- Premium feature ids reference sections not shipped yet (planned). `dashboard/defalt-utils/config/premiumConfig.ts:3`.
- Server premium partial mapping includes files not in repo yet. `dashboard/server.ts:629`.

### Unreachable code
- `hasFeature(feature)` ignores feature. `dashboard/defalt-app/contexts/SubscriptionContext.tsx:66`.
- Legacy announcement-bar header-section branch (see 5.4).

## Open questions
- None.
