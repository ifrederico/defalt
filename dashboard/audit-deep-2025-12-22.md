# Deep Audit Report  -  defalt/dashboard (2025-12-22)

## Scope
- Included: all first-party source in this repo.
- Excluded: `node_modules/`, `dist/`, `.theme-export-workspace/`.
- Vendored: `public/themes/source-complete/` (integration points checked only).
- Excluded by prior recommendation: `puck-study/` (nested repo).

## Summary
- Focused on: unused exports, broken references, stale data, unreachable code, redundant code.
- No hard broken file/path references found in repo scope.

## Unused Exports (exported but not imported in this repo)
- `defalt-ui/hooks/usePreviousFocus.ts`  -  `usePreviousFocus` exported (via `defalt-ui/hooks/index.ts` and `defalt-ui/index.ts`) but never imported.
- `defalt-ui/primitives/Tabs.tsx`  -  `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` exported but unused.
- `defalt-ui/primitives/SimplePagination.tsx`  -  `SimplePagination*` exports unused.
- `defalt-ui/primitives/Table.tsx`  -  `Table*` exports unused.
- `defalt-ui/primitives/ColorPicker/ColorPicker.tsx`  -  `ColorPicker`, `ColorIndicator`, `KoenigSwatch` exported but not imported outside ColorPickerSetting internals.
- `defalt-ui/icons/PlusIcon.tsx`  -  `PlusIcon` exported but unused.
- `defalt-ui/layout/Heading.tsx`  -  `H1/H2/H3/H4/HTable` exports unused.
- `defalt-ui/layout/Header.tsx`  -  `Header`, `HeaderActions`, `HeaderTitle`, `HeaderNav`, `HeaderMeta` exports unused.
- `defalt-ui/layout/Page.tsx`  -  `Page` export unused.
- `defalt-ui/layout/ViewHeader.tsx`  -  `ViewHeader`, `ViewHeaderActions` exports unused.
- `defalt-ui/layout/RightSidebar.tsx`  -  `RightSidebarMenu`, `RightSidebarMenuLink` exports unused.
- `defalt-utils/config/premiumConfig.ts`  -  `isFree`, `getFreeFeatures` exported (also re-exported by `defalt-sections/engine/index.ts`) but not imported.
- `defalt-utils/config/sectionIcons.ts`  -  `GHOST_SECTION_IDS` exported but not imported.
- `defalt-utils/security/constants.ts`  -  `CSRF_TOKEN_MAX_AGE_MS`, `CSRF_TOKEN_REFRESH_BUFFER_MS` exported but not referenced.

## Broken References (code points to missing files/paths)
- None found in repo scope. (Vendored theme paths used by `templateLoader.ts` and export tooling exist in `public/themes/source-complete/`.)

## Stale Data (references to removed/unimplemented features)
- `defalt-utils/config/premiumConfig.ts`  -  premium IDs include `grid`, `testimonials`, `faq`, `about`; free IDs include `custom-css`. These do not exist as section definitions or templates in `defalt-sections/sections/*` (only `announcement-bar`, `header`, `ghostCards`, `ghostGrid`, `hero`, `image-with-text`).
- `defalt-utils/config/sectionIcons.ts`  -  icon map includes `grid`, `testimonials`, `faq`, `about`, which do not exist as section definitions.
- `defalt-utils/export/themeExport.ts`  -  `PREMIUM_SECTION_PARTIALS` lists `defalt-about.hbs`, `defalt-faq.hbs`, `defalt-grid.hbs`, `defalt-testimonials.hbs`, but no such partials exist in this repo. Cleanup is no-op with `force: true`, but the list is stale.
- `defalt-app/layout/sidebar/pages/components/AddSectionCard.tsx`  -  `UPCOMING_TEMPLATE_SECTIONS` advertises the same unimplemented sections as """coming soon.""" If these are no longer planned, the list is stale and misleading.
- `defalt-app/layout/sidebar/pages/SectionsPanelBase.tsx`  -  `UPCOMING_SECTION_IDS` filters out section IDs that are not in `templateDefinitions`, so it currently does nothing; likely stale if those sections are not coming.
- `defalt-sections/themes/source/schema.ts`  -  trailing comment """Flat list of all settings (for compatibility)""" with no export; appears leftover/incomplete.
- `src/env.d.ts` declares `VITE_APP_URL`, `VITE_SUPPORT_TIP_URL`, `VITE_AUTH_SECRET`, but they are unused in code and missing from `.env.example`. `vite-plugin-theme-config.ts` uses `AUTH_SECRET` instead (non-VITE), so the type and docs are out of sync.
- `defalt-utils/constants.ts`  -  `STORAGE_KEYS.CLOUD_LOADED` is never read; likely stale.

## Unreachable Code (branches/states that cannot be hit)
- `defalt-app/contexts/AuthContext.shared.ts`  -  `AuthStatus` includes `'guest' | 'error'`, but `AuthProvider` only yields `'initializing' | 'authenticated' | 'unauthenticated'` in `defalt-app/contexts/AuthContext.tsx`.

## Redundant Code (duplicate logic or dead branches)
- `defalt-utils/config/themeConfig.ts`  -  `SECTION_ID_MAP` and `CONFIG_TO_ID_MAP` are identical maps; both are used in different places (`SectionDetailRenderer` vs `useWorkspace`) without any divergence.
- `defalt-app/hooks/useStripeActions.ts`  -  `openBillingPortal` is returned but never used; Settings UI opens portal directly.
- `defalt-app/hooks/useWorkspace.ts`  -  `handlePackageJsonChange` is returned from the hook but never used or exposed via `WorkspaceContext`.
- `defalt-app/hooks/useExport.ts`  -  confirmation state and handlers (`isDownloadConfirmOpen`, `setDownloadConfirmOpen`, `handleConfirmThemeDownload`, `handleCancelThemeDownload`, plus config download/import dialog state) are never surfaced or used by the UI; dead code until a confirm UI is added.
- `defalt-app/contexts/SubscriptionContext.tsx`  -  `hasFeature(feature)` ignores its parameter and only checks tier; the signature implies per-feature logic but the parameter is unused.

## Notes / Risk Areas to Verify
- CSRF: the dev server enforces CSRF (`vite-plugin-theme-config.ts`), but production server does not validate CSRF headers (`server.ts`). This is a behavioral mismatch and likely not intended.

