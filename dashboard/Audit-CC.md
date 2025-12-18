# Comprehensive Dead Code & Duplication Audit Report

Audit date: 2025-12-16
Updated: 2025-12-18 (cleanup applied)

## False positives (confirmed)
- No regex bug: `dashboard/defalt-rendering/custom-source/handlebars/templateLoader.ts:171` matches `dashboard/public/themes/source-complete/post.hbs:74` (`defalt-post-start-end`).
- `VITE_GHOST_CONTENT_KEY` is not declared in `dashboard/src/env.d.ts:3` (docs mention it; code does not).

## Cleanup applied (2025-12-18)
Deleted/removed after repo-wide import scan (0 usages):
- `dashboard/defalt-app/App.css`
- `dashboard/defalt-utils/api/aiService.ts` `validateSection()` (removed)
- `dashboard/defalt-sections/utils/uiConstants.ts`
- `dashboard/defalt-sections/engine/schemaTypes.ts` `create*Setting` helpers (removed) + stop exporting unused schema primitives
- `dashboard/defalt-sections/themes/source/schema.ts` `sourceThemeSettingsSchema` (removed)
- `dashboard/defalt-ui/primitives/Button.tsx`
- `dashboard/defalt-ui/primitives/Pill.tsx`
- `dashboard/defalt-ui/primitives/ColorControl.tsx`
- `dashboard/defalt-ui/layout/settingComponents.tsx` `ButtonGroupSetting` / `SettingField` / `SettingRow` (removed)
- `dashboard/defalt-ui/primitives/ColorPicker/ColorPicker.tsx` `ColorOptionButtons` (removed)
- `dashboard/defalt-app/types/ghost-content-api.d.ts`
- `dashboard/package.json` deps: `use-debounce`, `@tryghost/content-api` (removed; lockfile updated)

## Remaining issues (still in code)

### CRITICAL-ish
- 3x color sanitizers drift (preview vs export vs normalization):
  - `dashboard/defalt-utils/security/sanitizers.ts:126`
  - `dashboard/defalt-rendering/theme/exportTheme.ts:120`
  - `dashboard/defalt-utils/config/themeConfig.ts:377`
- `hasFeature(feature)` ignores `feature` (feature gating collapses to “plus?”): `dashboard/defalt-app/contexts/SubscriptionContext.tsx:66`.

### HIGH
- Preview container width mismatch (different `--container-width` depending on update path):
  - `dashboard/defalt-rendering/custom-source/handlebars/helpers.ts:169` (720px / 1120px)
  - `dashboard/defalt-rendering/custom-source/handlebars/domManipulation.ts:698` (1000px / 1200px)

### MEDIUM
- Derived-config helper duplication between preview and export (`toTagFilter`, fallback tags, image layout):
  - preview: `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx:54`
  - export: `dashboard/defalt-rendering/theme/exportTheme.ts:196`
- Overgrown modules worth splitting:
  - `dashboard/defalt-utils/hooks/usePackageJson.ts`
  - `dashboard/defalt-utils/config/themeConfig.ts`

### LOW
- Likely-unused env declarations in `dashboard/src/env.d.ts`: `VITE_AUTH_SECRET`, `VITE_SUPPORT_TIP_URL`, `VITE_APP_URL`.
