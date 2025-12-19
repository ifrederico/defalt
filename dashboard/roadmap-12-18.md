# Roadmap (2025-12-18) — Puck patterns → Defalt refactor plan

Purpose: implementer-ready backlog (file list + callsites + acceptance checks) to copy the best structural patterns from Puck into Defalt.

Reference: Puck Editor (puckeditor/puck). Relevant upstream paths:
- `packages/core/lib/migrate.ts` (explicit migrations list)
- `packages/core/lib/data/map-fields.ts` (schema-driven traversal)
- `packages/core/lib/resolve-component-data.ts` + `types/Config.tsx` (`resolveData` in component config)
- `packages/core/store/slices/*` (slice-based state)

## A) Decisions (locked)

1) **Multiple hero instances**
- Canonical ids + tags: `hero`, `hero-2`, … with `#hero`, `#hero-2`, …
- Normalize on load; no runtime legacy support.

2) **Announcement block `tag` + `link`**
- UI exposes both.
- Auto-tag defaults per block; user can edit; collisions are blocked.

## new feature
- Design palette panel (railbar icon) for global styles: colors, fonts, dark mode, spacing, radii; store in ThemeDocument; apply via utils.css overrides (after `screen.css`); keep `package.json` theme settings unchanged.

## B) Phase 1 — Add `ThemeDocument` migration pipeline (pure transforms)

### B1) Add files
- `dashboard/defalt-utils/config/migrations/types.ts`
  - `export type ThemeDocumentMigration = { id: string; apply: (doc: ThemeDocument) => ThemeDocument | null }`
- `dashboard/defalt-utils/config/migrations/index.ts`
  - `export function runThemeDocumentMigrations(doc: ThemeDocument): { doc: ThemeDocument; applied: string[] }`
- `dashboard/defalt-utils/config/migrations/migrations.ts`
  - exports ordered `THEME_DOCUMENT_MIGRATIONS: ThemeDocumentMigration[]`
- `dashboard/defalt-utils/config/migrations/001-normalize-ghostCards-tags.ts`
- `dashboard/defalt-utils/config/migrations/002-normalize-hero-tags.ts`
- `dashboard/defalt-utils/config/migrations/003-normalize-announcement-blocks.ts`

### B2) Integrate at the only correct boundaries
Modify:
- `dashboard/defalt-utils/config/themeConfig.ts`

Integration rules:
1) Keep `normalizeThemeDocument()` as the “shape normalizer” (coercion + defaults). (`dashboard/defalt-utils/config/themeConfig.ts:778`)
2) Immediately after normalization, run migrations:
   - draft read path: `readDraftDocument()` after `normalizeThemeDocument()`
   - saved read path: `readSavedDocument()` after `normalizeThemeDocument()`
3) If migrations applied on read, persist back to the same storage key (so we don’t re-migrate every boot).
4) Before writing to disk/network (explicit save/export), run migrations as a last guard (should be idempotent).

### B3) Migration #001 — normalize ghostCards legacy tags
Why: current tests expect it, current runtime doesn’t do it.
- failing test: `dashboard/defalt-app/hooks/useWorkspace.test.tsx:257` expects `#cards-2` but sees `#ghost-card2`.

Implementation direction:
- Parse/normalize any ghostCards tag variants to canonical:
  - `#cards` (suffix 1)
  - `#cards-2`, `#cards-3`, … (suffix >= 2)
- Make this normalization happen at document load, not in UI.

### B4) Acceptance criteria
- Migrations are pure + idempotent.
- On any persisted doc: load -> normalize -> migrate -> save produces stable output (no churn on second pass).
- `cd dashboard && bun run test` no longer fails at:
  - `dashboard/defalt-app/hooks/useWorkspace.test.tsx:257` (ghostCards tag normalization)

### B5) Tests to add
Add unit tests for migrations (no React):
- `dashboard/defalt-utils/config/migrations/__tests__/001-normalize-ghostCards-tags.test.ts`
  - input variants -> expected output snapshots

## C) Phase 2 — Unify “derived section render params” (preview + export)

Goal: eliminate drift where preview/export compute the same values in two places.

### C1) Create shared module
Add:
- `dashboard/defalt-rendering/derived/sectionDerived.ts`

Move these helpers into it (single source of truth):
- From `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx:42`
  - `resolveContainerPaddingX`
  - `resolveImageColumns`
  - `resolveImageAspectRatio`
  - `toTagFilter`
  - `resolveHeroFallbackTag`
  - `resolveImageWithTextFallbackTag`
  - `resolveGhostCardsFallbackTag`
- From `dashboard/defalt-rendering/theme/exportTheme.ts:196`
  - same concepts currently re-implemented

### C2) Replace callsites
Edit:
- `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx`
  - delete local consts; import from `derived/sectionDerived`
- `dashboard/defalt-rendering/theme/exportTheme.ts`
  - delete local fns; import from `derived/sectionDerived`

### C3) Acceptance criteria
- Preview and export produce identical derived values for the same section config.
- No behavior changes intended except removing preview/export drift.

### C4) Tests to add
Add pure tests for `sectionDerived` (no DOM):
- `dashboard/defalt-rendering/derived/sectionDerived.test.ts`
  - hero fallback tag derivation for ids:
    - `hero` -> `#hero`
    - `hero-2` -> `#hero-2`
  - ghostCards fallback tags from ids:
    - `ghostCards` (or expected id format) -> `#cards`
    - `ghostCards-2` -> `#cards-2`

## D) Phase 3 — Single source of truth for color sanitization

Problem: 3 different color sanitizers.
- canonical: `dashboard/defalt-utils/security/sanitizers.ts:126`
- export duplicate: `dashboard/defalt-rendering/theme/exportTheme.ts:120`
- themeConfig duplicate: `dashboard/defalt-utils/config/themeConfig.ts:377`

Implementation:
1) Remove exportTheme local `sanitizeHexColor`, import canonical `sanitizeHexColor`.
2) Replace `sanitizeHexColorValue` in `themeConfig.ts` with canonical (or wrap canonical).

Acceptance:
- Preview/export/normalization accept the same color value set.

## E) Phase 4 — `settingsSchema` walker (Defalt equivalent of Puck `map-fields`)

Goal: one traversal for UI schema defaults/coercions/validation.

### E1) Add utility
Add:
- `dashboard/defalt-sections/engine/settingsWalker.ts`

Target API:
- `walkSettingsSchema(settings: SettingSchema[], visitor: (node) => void): void`
- include block schemas and nested settings where relevant.

Use cases:
- Build-time/dev-time validation: ensure every `settingsSchema.id` maps to a `configSchema` key (including blocks).
- Centralize UI fallbacks (e.g. URL empty string behavior).

Acceptance:
- Registry validation can cover blocks (today it doesn’t).

## F) Phase 5 — Split `useWorkspace` (incremental, not rewrite)

Approach: extract pure modules first, then decide if Zustand slices are needed.

### F1) Extract modules (pure)
- `dashboard/defalt-app/workspace/persistence.ts` (load/save/reset orchestration)
- `dashboard/defalt-app/workspace/migrations.ts` (calls into `runThemeDocumentMigrations`)
- `dashboard/defalt-app/workspace/derive.ts` (calls into shared `sectionDerived`)

### F2) Acceptance criteria
- No runtime behavior claims without manual verification.
- Tests still pass (including the 2 known failures once addressed).

## G) Known failing tests to target (current)
- `dashboard/defalt-app/hooks/useWorkspace.test.tsx:257` ghostCards legacy tag normalization.
- `dashboard/defalt-app/hooks/useWorkspace.test.tsx:335` expects `/api/theme-config` but app uses `/app/api/theme-config` (base-path handling).
