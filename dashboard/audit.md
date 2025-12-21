# Defalt dashboard audit (combined)

Audit dates: 2025-12-16 (CC), 2025-12-17 (Deep)
Updated: 2025-12-20 (status pass + triage)

Notes:
- File:line refs match this repo state and will drift.
- Audit focus: unused exports, broken refs, stale data, unreachable code, redundant code, and source-of-truth issues.

## Decisions (locked)
- Container width: incremental preview updates must match initial render (720/1120).
- Preview hiding: match export behavior (wrap hidden markup).
- Subscription gating: plus gets access to everything; free can add/experiment; export must block premium sections.
- Export gating: server derives tier from member data (not client).

## Status (High/Medium + Decisions/KNOWN)

| Issue | Priority | Status | Fix Status | Notes |
|------|----------|--------|------------|-------|
| themeConfig.ts god-module (1161 lines) | MEDIUM | TRUE | todo | See section 4.1 |

## Executive summary (highest ROI problems)
- Settings have multiple sources of truth (schema defaults + UI defaults + editor injection + normalization).
- Export gating bypassed (tier forced to plus).

## Findings by module

## 1) defalt-sections

### 1.1 `commonSettings` reduces duplication but splits constraints across layers
Example:
- Zod constraint: `imageBorderRadius` min/max. `dashboard/defalt-sections/engine/commonSettings.ts:95`.
- UI constraint: slider min/max/step. `dashboard/defalt-sections/engine/commonSettings.ts:116`.

Changing constraints requires edits in both places.

### 1.2 Section schema duplication (structural)
`hero` and `image-with-text` are the same schema except tag default + template:
- hero schema. `dashboard/defalt-sections/sections/hero/schema.ts:26`.
- image-with-text schema. `dashboard/defalt-sections/sections/image-with-text/schema.ts:23`.

## 2) defalt-rendering

### 2.1 Rendering engine consumes config via two separate pipelines
Theme templates:
- Loaded by fetch from `public/themes/source-complete`. `dashboard/defalt-rendering/custom-source/handlebars/templateLoader.ts:260`.

Custom sections:
- Rendered by schema-engine HBS renderer. `dashboard/defalt-sections/engine/hbsRenderer.ts:450`.

## 3) defalt-app

### 3.1 Schema-driven UI writes raw values (no validation at boundary)
- `SchemaSectionSettings` mutates config by key. `dashboard/defalt-app/layout/sidebar/components/SchemaSectionSettings.tsx:56`.
- Renderer adds non-schema behavior (defaults + coercions). `dashboard/defalt-app/layout/sidebar/components/settingsRenderUtils.tsx:109`.

### 3.2 Subscription gating API is inconsistent
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

## Open questions
- None.
