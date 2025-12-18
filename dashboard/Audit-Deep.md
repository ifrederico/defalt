# Defalt dashboard deep audit (architectural)

Date: 2025-12-17

Notes:
- File:line refs match this repo state and will drift.
- Audit focus: unused exports, broken refs, stale data, unreachable code, redundant code, and (most importantly) where “truth” lives.

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

## Executive summary (highest ROI problems)
- Settings have multiple sources of truth (schema defaults + UI fallbacks + editor injection + normalization).
- Preview vs export duplicate “derived config” logic (tags, widths, image layout) → guaranteed drift.
- Hero multi-instance is supported but tag assignment is broken (duplicate `#hero`).
- Announcement bar is “block-based” on paper, but runtime enforces single-item bars; UI can’t edit `tag`/`link`.
- DB init SQL likely fails on first boot (trigger created before function).
- Base-path handling (`/api` vs `/app/api`) leaks into tests and likely deployments.

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

### 1.5 Announcement bar block schema drift (link + tag not editable)
Config has `tag` and `link`, template uses them, UI does not expose them.
- Config: `link` exists. `dashboard/defalt-sections/sections/announcement-bar/schema.ts:23`.
- Block UI schema: no `tag` / `link` fields. `dashboard/defalt-sections/sections/announcement-bar/schema.ts:41`.
- Template: renders `<a href="{{../link}}">...` when link present. `dashboard/defalt-sections/sections/announcement-bar/announcement-bar.hbs:92`.

Schema says repeatable blocks (limit 5), but runtime enforces single announcement (see 3.5).

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

### 2.3 Preview vs export duplicate “derived config” builders
Same concepts exist twice:
- preview: `resolveContainerPaddingX`, `resolveImageColumns`, `toTagFilter`, fallback tag resolvers. `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx:54`.
- export: same names. `dashboard/defalt-rendering/theme/exportTheme.ts:196`.

### 2.4 Preview hides by stripping markup; export hides by wrapping markup
- Preview strips via regex replacement. `dashboard/defalt-rendering/custom-source/handlebars/templateLoader.ts:78`.
- Export wraps in `<div class="hidden">`. `dashboard/defalt-rendering/theme/exportTheme.ts:294`.

### 2.5 Sanitization drift (color)
Color sanitizers are inconsistent across layers:
- canonical (robust): `sanitizeHexColor`. `dashboard/defalt-utils/security/sanitizers.ts:126`.
- exportTheme local (weak): `sanitizeHexColor`. `dashboard/defalt-rendering/theme/exportTheme.ts:120`.
- themeConfig local (weak): `sanitizeHexColorValue`. `dashboard/defalt-utils/config/themeConfig.ts:377`.

## 3) defalt-app

### 3.1 State duplication and unclear ownership
- Global settings live in `useWorkspace` local state. `dashboard/defalt-app/hooks/useWorkspace.ts:89`.
- Same settings are persisted into `ThemeDocument`. `dashboard/defalt-utils/config/themeConfig.ts:125`.
- `packageJson` is both parsed state (`usePackageJson`) and raw string stored on document. `dashboard/defalt-utils/hooks/usePackageJson.ts:45`.
- Selection + active tab are in a separate persisted Zustand store. `dashboard/defalt-app/stores/uiStore.ts:57`.

### 3.2 Schema-driven UI writes raw values (no validation at boundary)
- `SchemaSectionSettings` mutates config by key. `dashboard/defalt-app/layout/sidebar/components/SchemaSectionSettings.tsx:56`.
- Renderer adds non-schema behavior (defaults + coercions). `dashboard/defalt-app/layout/sidebar/components/settingsRenderUtils.tsx:109`.

### 3.3 Multiple hero sections exist; default tag assignment is broken
Hero ids are `hero-defalt`, `hero-defalt-2`, …:
- prefix constant. `dashboard/defalt-utils/config/configStateDefaults.ts:12`.
- id generation. `dashboard/defalt-app/hooks/editor/useSectionManager.ts:59`.

But hero tag is computed with a regex that expects `hero-2`:
- `instanceId.match(/^hero-(\\d+)$/)`. `dashboard/defalt-app/hooks/editor/useSectionManager.ts:399`.
- so tag becomes `#hero` even for hero-defalt-2. `dashboard/defalt-app/hooks/editor/useSectionManager.ts:403`.

Preview/export fallback logic can derive `#hero-2` from the id, but only when the tag is blank:
- preview fallback. `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx:74`.
- export fallback. `dashboard/defalt-rendering/theme/exportTheme.ts:219`.

Because config tag is explicitly set to `#hero`, fallback never triggers → tag collision.

### 3.4 Ghost cards legacy tag normalization is missing (confirmed by failing test)
There’s a helper to parse legacy tag suffixes:
- `parseGhostCardTagSuffix()`. `dashboard/defalt-sections/utils/tagUtils.ts:62`.

But nothing normalizes the value on edit/hydration, so tags like `#ghost-card2` persist as-is.
The existing test expects normalization:
- expects `#cards-2`. `dashboard/defalt-app/hooks/useWorkspace.test.tsx:236`.

### 3.5 Announcement bars: schema says repeatable blocks; runtime enforces single
Enforced by app:
- `ensureSingleAnnouncement()` always truncates to one. `dashboard/defalt-app/hooks/editor/useAnnouncementBars.ts:34`.
Enforced by preview:
- preview truncates announcements array to 1. `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx:189`.
Schema still advertises 5 blocks:
- blocksSchema limit 5. `dashboard/defalt-sections/sections/announcement-bar/schema.ts:45`.

### 3.6 Base-path mismatch leaks into tests (likely prod too)
`apiPath()` prefixes with Vite `BASE_URL`. `dashboard/defalt-utils/api/apiPath.ts:8`.

Test expects hardcoded `/api/theme-config`:
- `useWorkspace.test.tsx`. `dashboard/defalt-app/hooks/useWorkspace.test.tsx:335`.

If the app is served under `/app/`, actual calls are `/app/api/...`.

### 3.7 Subscription gating API is inconsistent
`hasFeature(feature)` ignores the parameter:
- `void feature`. `dashboard/defalt-app/contexts/SubscriptionContext.tsx:68`.

## 4) defalt-ui

Dead primitives/CSS from this audit were removed in the 2025-12-18 cleanup (see top).

## 5) Server & API

### 5.1 DB schema init order bug (likely breaks first boot)
Trigger is created before the function exists:
- trigger. `dashboard/server.ts:66`.
- function. `dashboard/server.ts:72`.

### 5.2 `db/schema.sql` is stale vs runtime schema
- SQL file only creates `member_themes`. `dashboard/db/schema.sql:4`.
- runtime init also creates `member_settings`. `dashboard/server.ts:55`.

### 5.3 Export: package.json + Custom CSS (implemented; needs verification)
Per your answers:
- export must write `document.packageJson` into exported `package.json`.
- export must append Custom CSS at end of `assets/built/util.css`.

Implemented:
- `applyPackageJsonCustomization()` writes `package.json`. `dashboard/defalt-rendering/theme/exportTheme.ts:450`.
- `applyCustomCssCustomization()` appends into `assets/built/util.css` with markers. `dashboard/defalt-rendering/theme/exportTheme.ts:476`.
- server export calls them. `dashboard/server.ts:847`.
- dev export calls them. `dashboard/vite-plugin-theme-config.ts:491`.

Custom CSS persistence moved to document-level:
- `ThemeDocument.customCSS`. `dashboard/defalt-utils/config/themeConfig.ts:125`.
- normalization preserves/migrates it. `dashboard/defalt-utils/config/themeConfig.ts:788`.
- persistence writes it. `dashboard/defalt-utils/config/themeConfig.ts:1094`.

### 5.4 Stale premium config / dead export logic
Premium config references missing sections:
- `grid/faq/about/testimonials`. `dashboard/defalt-utils/config/premiumConfig.ts:3`.
Server maps those to partial names:
- `PREMIUM_SECTION_PARTIALS`. `dashboard/server.ts:629`.

But server export currently forces tier to plus:
- `tier: 'plus_monthly'` unconditionally. `dashboard/server.ts:676`.

### 5.5 Unreachable legacy: `header.sections['announcement-bar']`
Server checks this:
- `document.header.sections?.['announcement-bar']`. `dashboard/server.ts:664`.
But normalization collapses to only `{ header }`:
- `normalizeThemeDocument()` always returns header sections with only `header`. `dashboard/defalt-utils/config/themeConfig.ts:824`.

## Cross-cutting categories (requested)

### Broken references / stale data
- Premium feature ids reference non-existent sections. `dashboard/defalt-utils/config/premiumConfig.ts:3`.
- Server premium partial mapping includes files that don’t exist in this repo (not fatal due to `force: true` deletes). `dashboard/server.ts:629`.

### Unreachable code
- `hasFeature(feature)` ignores feature. `dashboard/defalt-app/contexts/SubscriptionContext.tsx:66`.
- Legacy announcement-bar header-section branch (see 5.5).

### Redundant code
- Preview vs export derived config builders duplicated (tags/layout helpers). `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx:54` and `dashboard/defalt-rendering/theme/exportTheme.ts:196`.
- Multiple sanitizers for “colors”. `dashboard/defalt-utils/security/sanitizers.ts:126`, `dashboard/defalt-rendering/theme/exportTheme.ts:120`, `dashboard/defalt-utils/config/themeConfig.ts:377`.

## Open questions (need your answers)
1) Multiple hero instances: should tags be forced unique by default (`#hero`, `#hero-2`, …), and should we normalize legacy hero tags on load?
2) Announcement blocks: should UI expose `block.tag` and `block.link` (currently not editable), or keep them auto-managed? If auto-managed, what is the rule?
