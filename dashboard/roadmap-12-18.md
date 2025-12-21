# Roadmap (2025-12-18) — Defalt refactor plan

Purpose: implementer-ready backlog (file list + callsites + acceptance checks) to apply best-practice structural patterns to Defalt.

Reference patterns:
- Explicit migrations list
- Schema-driven field traversal
- Component data resolution with config types
- Slice-based state management

## Status update (code check)
- [x] Back-compat tag normalization removed; no migrations planned (older docs require reset).
- [x] Shared sectionDerived helpers + callsites + tests. `dashboard/defalt-rendering/derived/sectionDerived.ts` `dashboard/defalt-rendering/derived/sectionDerived.test.ts`
- [x] Shared sanitizeHexColor in export + themeConfig. `dashboard/defalt-rendering/theme/exportTheme.ts` `dashboard/defalt-utils/config/themeConfig.ts`
- [x] Base-path mismatch aligned in code (both use `apiPath('/api/theme-config')`); not runtime-verified. `dashboard/defalt-app/hooks/useWorkspace.ts` `dashboard/defalt-app/hooks/useWorkspace.test.tsx`
- [ ] Design palette panel not started.
- [ ] settingsSchema walker not started.
- [ ] useWorkspace split not started.

## A) Decisions (locked)

1) **Multiple hero instances**
- Canonical ids + tags: `hero`, `hero-2`, … with `#hero`, `#hero-2`, …
- No backward compatibility; older docs require reset.

2) **Announcement block `tag` + `link`**
- UI exposes both.
- Auto-tag defaults per block; user can edit; collisions are blocked.

## new feature
- Design palette panel (railbar icon) for global styles: colors, fonts, dark mode, spacing, radii; store in ThemeDocument; apply via utils.css overrides (after `screen.css`); keep `package.json` theme settings unchanged.

## B) Phase 1 — Unify “derived section render params” (preview + export)

Goal: eliminate drift where preview/export compute the same values in two places.

### B1) Create shared module
Add:
- `dashboard/defalt-rendering/derived/sectionDerived.ts`

Move these helpers into it (single source of truth):
- From `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx:42`
  - `resolveContainerPaddingX`
  - `resolveImageColumns`
  - `resolveImageAspectRatio`
  - `toTagFilter`
  - `resolveHeroDefaultTag`
  - `resolveImageWithTextDefaultTag`
  - `resolveGhostCardsDefaultTag`
- From `dashboard/defalt-rendering/theme/exportTheme.ts:196`
  - same concepts currently re-implemented

### B2) Replace callsites
Edit:
- `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx`
  - delete local consts; import from `derived/sectionDerived`
- `dashboard/defalt-rendering/theme/exportTheme.ts`
  - delete local fns; import from `derived/sectionDerived`

### B3) Acceptance criteria
- Preview and export produce identical derived values for the same section config.
- No behavior changes intended except removing preview/export drift.

### B4) Tests to add
Add pure tests for `sectionDerived` (no DOM):
- `dashboard/defalt-rendering/derived/sectionDerived.test.ts`
  - hero default tag derivation for ids:
    - `hero` -> `#hero`
    - `hero-2` -> `#hero-2`
  - ghostCards default tags from ids:
    - `ghostCards` (or expected id format) -> `#cards`
    - `ghostCards-2` -> `#cards-2`

## C) Phase 2 — Single source of truth for color sanitization

Problem: 3 different color sanitizers.
- canonical: `dashboard/defalt-utils/security/sanitizers.ts:126`
- export duplicate: `dashboard/defalt-rendering/theme/exportTheme.ts:120`
- themeConfig duplicate: `dashboard/defalt-utils/config/themeConfig.ts:377`

Implementation:
1) Remove exportTheme local `sanitizeHexColor`, import canonical `sanitizeHexColor`.
2) Replace `sanitizeHexColorValue` in `themeConfig.ts` with canonical (or wrap canonical).

Acceptance:
- Preview/export/normalization accept the same color value set.

## D) Phase 3 — `settingsSchema` walker (schema field traversal)

Goal: one traversal for UI schema defaults/coercions/validation.

### D1) Add utility
Add:
- `dashboard/defalt-sections/engine/settingsWalker.ts`

Target API:
- `walkSettingsSchema(settings: SettingSchema[], visitor: (node) => void): void`
- include block schemas and nested settings where relevant.

Use cases:
- Build-time/dev-time validation: ensure every `settingsSchema.id` maps to a `configSchema` key (including blocks).
- Centralize UI defaults (e.g. URL empty string behavior).

Acceptance:
- Registry validation can cover blocks (today it doesn’t).

## E) Phase 4 — Split `useWorkspace` (incremental, not rewrite)

Approach: extract pure modules first, then decide if Zustand slices are needed.

### E1) Extract modules (pure)
- `dashboard/defalt-app/workspace/persistence.ts` (load/save/reset orchestration)
- `dashboard/defalt-app/workspace/derive.ts` (calls into shared `sectionDerived`)

### E2) Acceptance criteria
- No runtime behavior claims without manual verification.
- Tests still pass; re-run to confirm.

## F) Known failing tests to target (current)
- None under Vitest (`bun run test`); `bun test` uses Bun's runner and will fail on Vitest APIs.

## G) Phase 5 — Responsive preview scaling (like Ghost)

Goal: match Ghost's zoomed-out preview behavior with responsive breakpoints.

### G1) Current state
- [x] Basic scaling implemented: 115% size with 0.86957 scale (single breakpoint)
- `dashboard/defalt-rendering/custom-source/HandlebarsRenderer.tsx:673-683`

### G2) Target (Ghost pattern)
Ghost uses responsive breakpoints for preview scaling:
| Screen width | iframe size | Scale | Effect |
|--------------|-------------|-------|--------|
| > 1600px | 110% | 0.90909 | Slight zoom-out |
| ≤ 1600px | 130% | 0.76923 | More zoom-out on smaller screens |

### G3) Implementation options
1. **CSS classes** — Move iframe styles to Tailwind classes with responsive variants
2. **Media query hook** — `useMediaQuery` to switch scale values dynamically
3. **Container query** — Scale based on preview container width, not viewport

### G4) Acceptance criteria
- Preview zooms out more on smaller screens (≤1600px)
- No horizontal scrollbar in preview container
- Selection overlay and action bar positions remain accurate after scaling
