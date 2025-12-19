# Comprehensive Dead Code & Duplication Audit Report

Audit date: 2025-12-16
Updated: 2025-12-18 (cleanup applied)
Updated: 2025-12-19 (false positives + decisions)

## False positives / resolved
- No regex bug: `dashboard/defalt-rendering/custom-source/handlebars/templateLoader.ts:171` matches `dashboard/public/themes/source-complete/post.hbs:74` (`defalt-post-start-end`).
- Derived-config duplication resolved: preview + export now share `dashboard/defalt-rendering/derived/sectionDerived.ts`.
- Color sanitizer drift resolved: preview/export/themeConfig all use `sanitizeHexColor` from `dashboard/defalt-utils/security/sanitizers.ts`.

## Cleanup applied (2025-12-18)
Deleted/removed after repo-wide import scan (0 usages):
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

## Remaining issues (still in code)

### CRITICAL-ish
- `hasFeature(feature)` ignores `feature` (feature gating collapses to “plus?”): `dashboard/defalt-app/contexts/SubscriptionContext.tsx:66`.
  - Desired behavior: plus can access everything; free can add/experiment but export should block premium sections.

### HIGH
- Preview container width mismatch (different `--container-width` depending on update path):
  - `dashboard/defalt-rendering/custom-source/handlebars/helpers.ts:169` (720px / 1120px)
  - `dashboard/defalt-rendering/custom-source/handlebars/domManipulation.ts:698` (1000px / 1200px)
  - Decision: match initial render values (720/1120) in incremental updates.
- Preview/export hide mismatch:
  - Preview strips markup: `dashboard/defalt-rendering/custom-source/handlebars/templateLoader.ts:78`.
  - Export wraps hidden sections: `dashboard/defalt-rendering/theme/exportTheme.ts:224`.
  - Decision: match export behavior.

### MEDIUM
- Hero tag assignment uses wrong ID pattern (duplicate `#hero` on multi instances):
  - `dashboard/defalt-app/hooks/editor/useSectionManager.ts:399`.
- Announcement bars enforce single item while schema/UI allow 5:
  - `dashboard/defalt-app/hooks/editor/useAnnouncementBars.ts:34`
  - `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx:189`
  - Decision: allow multi (limit 5) by removing truncation in app + preview.
- Overgrown modules worth splitting:
  - `dashboard/defalt-utils/hooks/usePackageJson.ts`
  - `dashboard/defalt-utils/config/themeConfig.ts`

### LOW
- Docs/env drift: `VITE_GHOST_CONTENT_KEY` is documented but not typed/used in code.
- Likely-unused env declarations in `dashboard/src/env.d.ts`: `VITE_AUTH_SECRET`, `VITE_SUPPORT_TIP_URL`, `VITE_APP_URL`.
