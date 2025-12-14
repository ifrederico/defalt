# Defalt Codebase Architectural Audit

**Date:** December 13, 2025
**Scope:** Full dashboard codebase analysis
**Method:** 6 parallel deep-dive agents analyzing each module

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Issues](#critical-issues)
3. [High Severity Issues](#high-severity-issues)
4. [Medium Severity Issues](#medium-severity-issues)
5. [Module-by-Module Findings](#module-by-module-findings)
   - [defalt-sections](#defalt-sections)
   - [defalt-rendering](#defalt-rendering)
   - [defalt-app](#defalt-app)
   - [defalt-ui](#defalt-ui)
   - [Server & API](#server--api)
   - [Cross-Cutting Concerns](#cross-cutting-concerns)
6. [Data Flow Analysis](#data-flow-analysis)
7. [Root Cause Analysis](#root-cause-analysis)
8. [Recommended Refactoring Plan](#recommended-refactoring-plan)
9. [File Reference Index](#file-reference-index)

---

## Executive Summary

This audit reveals **systemic architectural issues** centered around **multiple sources of truth** for the same configuration values. The padding system originally identified (`defaultPadding` + `showPaddingControls`) is symptomatic of a larger pattern affecting the entire codebase.

### Key Findings

| Category | Count | Severity |
|----------|-------|----------|
| Critical (data loss/breaking) | 4 | 🔴 |
| High (significant maintenance burden) | 10 | 🟠 |
| Medium (technical debt) | 9 | 🟡 |

### Impact Summary

- **Preview ≠ Export:** CSS defaults in `domManipulation.ts` differ from schema defaults
- **Schema Drift:** Zod defaults and UI defaults can diverge silently
- **Dead Code:** `commonSettings.ts` exports presets that no section uses
- **No Validation:** API accepts any JSON without schema validation
- **Export Broken:** Export expects properties (`showHeader`, `columnGap`) that don't exist in schemas

---

## Critical Issues

### 1. Export Pipeline Expects Undefined Properties

**Severity:** 🔴 Critical
**Impact:** Exported theme differs from preview; silent failures

The export functions in `exportTheme.ts` read configuration properties that are **never defined** in any section schema.

#### Ghost Cards Section

| Property | In Schema | In Defaults | Export Expects | Location |
|----------|-----------|-------------|----------------|----------|
| `showHeader` | ❌ No | ❌ No | ✅ Yes | exportTheme.ts:1335 |
| `headerAlignment` | ❌ No | ❌ No | ✅ Yes | exportTheme.ts:1336-1337 |
| `backgroundColor` | ✅ Yes | ✅ Yes | ✅ Yes | exportTheme.ts:1338+ |

**Export code (exportTheme.ts:1333-1338):**
```typescript
const cardsConfig = ((section.settings?.customConfig ?? {}) as Partial<GhostCardsSectionConfig>)
const showHeader = cardsConfig.showHeader !== false  // ← UNDEFINED in schema!
const headerAlignment = cardsConfig.headerAlignment === 'left' || ...
```

#### Ghost Grid Section

| Property | In Schema | In Defaults | Export Expects | Location |
|----------|-----------|-------------|----------------|----------|
| `showHeader` | ❌ No | ❌ No | ✅ Yes | exportTheme.ts:1508 |
| `headerAlignment` | ❌ No | ❌ No | ✅ Yes | exportTheme.ts:1509-1510 |
| `columnGap` | ❌ No | ❌ No | ✅ Yes | exportTheme.ts:1516-1520 |
| `gap` | ✅ Yes | ✅ Yes | ❌ Not used | Schema defines but export ignores |

**Export code (exportTheme.ts:1506-1520):**
```typescript
const gridConfig = ((ghostGridSection.settings?.customConfig ?? {}) as Partial<GhostGridSectionConfig>)
const showHeader = gridConfig.showHeader !== false  // ← UNDEFINED
const columnGap = typeof gridConfig.columnGap === 'number'  // ← UNDEFINED, falls back to 20
```

**Consequence:**
- User sets `gap: 40` in UI
- Export reads `columnGap` (undefined), falls back to `20`
- Exported theme has different spacing than preview

---

### 2. Seven Sources Define Padding

**Severity:** 🔴 Critical
**Impact:** Impossible to determine authoritative padding value

The padding/spacing system has accumulated **7 different sources** that can conflict:

| # | Source | Location | Example Value |
|---|--------|----------|---------------|
| 1 | `defaultPadding` | Section index.ts | `{ top: 48, bottom: 48 }` |
| 2 | `showPaddingControls` | Section index.ts | `false` |
| 3 | Zod schema `.default()` | Section schema.ts | `.default(48)` |
| 4 | `settingsSchema` UI field | Section schema.ts | `default: 48` |
| 5 | `CSS_DEFAULT_PADDING` | themeConfig.ts | `{ hero: 48, ... }` |
| 6 | CSS in `domManipulation.ts` | domManipulation.ts | `32px`, `min(12vmax, 5rem)` |
| 7 | Hardcoded fallbacks | exportTheme.ts | `|| 20`, `|| 32` |

#### Specific Conflicts Found

**Hero Section:**
- `defaultPadding: { top: 48, bottom: 48 }` (index.ts:16)
- `paddingTop: .default(48)` (schema.ts via createPaddingConfigSchema)
- CSS default: `min(12vmax, 5rem)` ≈ 60px (domManipulation.ts:68-75)

**Ghost Cards:**
- Schema default: `48px` (ghostCards/schema.ts:10)
- CSS default: `32px` (domManipulation.ts:210-212)

---

### 3. No API Validation

**Severity:** 🔴 Critical
**Impact:** Database can store invalid/malformed data

The server accepts `theme_json` without any validation:

**server.ts:397-403:**
```typescript
const { name, description, theme_json } = req.body ?? {}
// ... directly JSON.stringify(theme_json ?? {})
// NO normalizeThemeDocument() call!
// NO schema validation!
```

**Affected Endpoints:**
- `POST /api/themes` (server.ts:392-410) - Create theme
- `PUT /api/themes/:id` (server.ts:432-483) - Update theme
- `GET /api/themes/:id` (server.ts:375-390) - Returns unvalidated JSON

**Database Schema (server.ts:46):**
```sql
theme_json JSONB NOT NULL DEFAULT '{}'  -- No constraints, accepts anything
```

**Impact:**
- Malformed section configs stored permanently
- Client bugs corrupt database
- No way to migrate invalid data

---

### 4. Circular Dependency: utils ↔ sections

**Severity:** 🔴 Critical
**Impact:** Module boundary violation, build complexity

**Violation 1 - subscription.ts:6:**
```typescript
import { isPremium } from '../../defalt-sections/premiumConfig.js'
```

**Violation 2 - configStateHelpers.ts:1:**
```typescript
import { getSectionDefinition, type SectionConfigSchema } from '@defalt/sections/engine'
```

**Dependency Graph:**
```
defalt-utils (should have NO defalt-* deps)
    ↓ VIOLATES
defalt-sections (should depend on utils)
    ↓
defalt-app (depends on both)
```

---

## High Severity Issues

### 5. Defaults Duplicated in 3 Places Per Section

**Severity:** 🟠 High
**Impact:** Schema drift when one location is updated but not others

Every section repeats default values in three locations:

**Example: Hero contentWidth**

```typescript
// 1. Zod schema (hero/schema.ts:21)
contentWidth: z.enum(['720px', '960px', '1120px', '1320px', 'none']).default('1120px'),

// 2. Settings schema (hero/schema.ts:45)
{ type: 'select', id: 'contentWidth', label: 'Width', default: '1120px', options: [...] },

// 3. Defaults file (hero/defaults.ts:11) - OK, derived from Zod
export const heroDefaults: HeroConfig = heroConfigSchema.parse({})
```

If you change the Zod default to `'960px'`, the settingsSchema still shows `'1120px'` in the UI.

**Affected Sections:**
- hero (10+ duplicated defaults)
- ghostCards (8+ duplicated defaults)
- ghostGrid (9+ duplicated defaults)
- image-with-text (10+ duplicated defaults)
- announcement-bar (15+ duplicated defaults)
- header (5+ duplicated defaults)

---

### 6. commonSettings.ts is Dead Code

**Severity:** 🟠 High
**Impact:** Unused abstraction, maintenance confusion

`commonSettings.ts` exports comprehensive UI setting presets:

```typescript
// Exported but NEVER USED:
export const paddingSettings: SettingSchema[] = [...]
export const backgroundSettings: SettingSchema[] = [...]
export const buttonToggleSettings: SettingSchema[] = [...]
export const buttonContentSettings: SettingSchema[] = [...]
export const buttonStyleSettings: SettingSchema[] = [...]
export const fullButtonSettings: SettingSchema[] = [...]
export const alignmentSettings: SettingSchema[] = [...]
export const widthSettings: SettingSchema[] = [...]
export const layoutSettings: SettingSchema[] = [...]
export const sectionHeaderSettings: SettingSchema[] = [...]
export const toggleableSectionHeaderSettings: SettingSchema[] = [...]
export const lightSchemeSettings: SettingSchema[] = [...]
export const darkSchemeSettings: SettingSchema[] = [...]
```

**Evidence:**
```bash
# Grep across all sections:
paddingSettings: 0 matches
backgroundSettings: 0 matches
buttonSettings: 0 matches
layoutSettings: 0 matches
sectionHeaderSettings: 0 matches
```

All sections hardcode their settings arrays inline instead of using these presets.

---

### 7. domManipulation.ts is 2400 Lines of Hardcoded CSS

**Severity:** 🟠 High
**Impact:** Preview ≠ Export, maintenance nightmare

**File:** `/dashboard/defalt-rendering/custom-source/handlebars/domManipulation.ts`

Contains `PREVIEW_INLINE_STYLES` with hardcoded CSS for 9 section types:

| Section | Lines | CSS Padding Default |
|---------|-------|---------------------|
| Hero | 57-203 | `min(12vmax, 5rem)` |
| Ghost Cards | 205-383 | `32px` |
| Ghost Grid | 480-579 | `32px` |
| FAQ | 806-878 | `32px` |
| + 5 more sections | ... | various |

**Problems:**
1. These styles are **injected during preview only**
2. Export doesn't include them (different rendering path)
3. CSS defaults **conflict with schema defaults**
4. Same CSS exists in `.hbs` templates (duplication)

---

### 8. useWorkspace is 1200+ Lines with 10+ Concerns

**Severity:** 🟠 High
**Impact:** Untestable, hard to reason about, fragile

**File:** `/dashboard/defalt-app/hooks/useWorkspace.ts`

Bundled concerns:
1. Workspace state management (colors, layout)
2. Persistence/hydration logic
3. Cloud sync orchestration (lines 831-853)
4. Auto-save scheduling (lines 758-871)
5. Page transitions (lines 804-829)
6. Undo/redo integration (line 89)
7. Analytics event firing
8. Draft mode tracking (lines 982-985)
9. Section manager delegation (lines 148-159)
10. Announcement bar delegation (lines 156-159)

**Metrics:**
- ~1,200 lines
- ~20 useState calls
- Complex effect dependencies

---

### 9. State Stored in Both React State AND Refs

**Severity:** 🟠 High
**Impact:** Race conditions, divergent state

Both `useSectionManager` and `useWorkspace` maintain parallel structures:

**useSectionManager.ts:230-244:**
```typescript
const footerItemsRef = useRef(footerItems)
const templateItemsRef = useRef(templateItems)
const sectionVisibilityRef = useRef(sectionVisibility)
const sectionPaddingRef = useRef(sectionPadding)
const sectionMarginsRef = useRef(sectionMargins)
const customSectionsRef = useRef(customSections)
const hasGhostGridRef = useRef(false)
const pendingGhostGridRef = useRef(false)
const subheaderMarginCacheRef = useRef<{ top?: number; bottom?: number } | null>(null)
const pendingPaddingCommandsRef = useRef<Record<...>>({})
const pendingMarginCommandsRef = useRef<Record<...>>({})
```

Plus useEffects to sync state → refs (lines 247-269).

**Why both?**
- Refs used in closures/callbacks to avoid stale captures
- State used for re-rendering
- If sync effect doesn't run, refs diverge from state

---

### 10. Block Schema Defined But Not Wired

**Severity:** 🟠 High
**Impact:** Confusing architecture, dead code

**announcement-bar/schema.ts:37-108:**
```typescript
export const announcementBarBlocksSchema: BlockSchema[] = [
  {
    type: 'announcement',
    name: 'Announcement',
    limit: 5,
    settings: [...]
  }
]
```

**announcement-bar/index.ts:4-23:**
```typescript
export const definition: SectionDefinition<typeof announcementBarConfigSchema> = {
  id: 'announcement-bar',
  // blocksSchema: announcementBarBlocksSchema,  ← NOT INCLUDED!
  ...
}
```

The `blocksSchema` is defined but never wired to the definition. Block editing is handled via custom sidebar code instead of the formal block system.

---

### 11. Content Width Repeated in 4 Schemas

**Severity:** 🟠 High
**Impact:** Add a width option? Update 4 files.

Identical enum in:
- `hero/schema.ts:21`
- `image-with-text/schema.ts:18`
- `ghostCards/schema.ts:15`
- `ghostGrid/schema.ts:16`

```typescript
contentWidth: z.enum(['720px', '960px', '1120px', '1320px', 'none']).default('1120px')
```

---

### 12. Text Alignment Repeated in 4 Sections

**Severity:** 🟠 High
**Impact:** Same duplication as content width

```typescript
// Repeated in hero, image-with-text, ghostCards, ghostGrid
{
  type: 'radio',
  id: 'textAlignment',
  label: 'Text alignment',
  default: 'left',
  iconOnly: true,
  options: [
    { label: 'Left', value: 'left', icon: 'AlignLeft' },
    { label: 'Center', value: 'center', icon: 'AlignCenter' },
    { label: 'Right', value: 'right', icon: 'AlignRight' }
  ]
}
```

---

### 13. Image Settings Duplicated Between Hero and Image-with-Text

**Severity:** 🟠 High
**Impact:** Changes must be made in two places

Both sections define identical fields:
- `imageAspect: z.enum([...]).default('default')`
- `imageBorderRadius: z.number().min(0).max(96).default(0)`
- `invert: z.boolean().optional()`
- `imageWidth: z.enum(['1/2', '2/3', '3/4']).default('1/2')`
- `imagePosition: z.enum(['left', 'right']).default('left')`

**Locations:**
- `hero/schema.ts:21-33`
- `image-with-text/schema.ts:18-30`

---

### 14. SchemaSectionSettings Ignores Schema Bounds

**Severity:** 🟠 High
**Impact:** UI allows values outside schema-defined range

**SchemaSectionSettings.tsx:222-263:**
```typescript
// Hardcoded bounds:
min={0}
max={200}
step={1}
unit="px"
```

**But announcement-bar/schema.ts:210:**
```typescript
paddingTop: z.number().min(0).max(100).default(8),  // max=100, not 200!
```

The UI allows 0-200, but schema only accepts 0-100. If user sets 150, Zod validation would fail (but validation isn't called until export).

---

## Medium Severity Issues

### 15. Color Swatches Hardcoded in Renderer

**Severity:** 🟡 Medium
**Impact:** Can't customize swatches per section

**settingsRenderUtils.tsx:150-158:**
```typescript
swatches={[
  { title: 'Accent', hex: '#AC1E3E', accent: true },
  { title: 'Grey', hex: '#e5e7eb' },
  { title: 'Black', hex: '#000000' },
  { title: 'White', hex: '#ffffff' }
]}
```

These colors are hardcoded for ALL color inputs. Sections can't define their own swatch palettes.

---

### 16. Announcement Bar Parent + Block Typography Duplication

**Severity:** 🟡 Medium
**Impact:** Unclear which level takes precedence

**Parent level (announcementBarConfigSchema):**
```typescript
typographySize: z.enum(['small', 'normal', 'large', 'x-large']).default('normal'),
typographySpacing: z.enum(['tight', 'regular', 'wide']).default('regular'),
typographyCase: z.enum(['default', 'uppercase']).default('default'),
```

**Block level (announcementBlockConfigSchema):**
```typescript
typographySize: z.enum(['small', 'normal', 'large', 'x-large']).default('normal'),
typographyWeight: z.enum(['light', 'default', 'bold']).default('default'),
typographySpacing: z.enum(['tight', 'regular', 'wide']).default('regular'),
typographyCase: z.enum(['default', 'uppercase']).default('default')
```

Same fields at both levels. Documentation says "Parent controls for consistent bar height" but implementation unclear.

---

### 17. Header Style Implicitly Controls Section Spacing

**Severity:** 🟡 Medium
**Impact:** Cross-context coupling, hard to debug

**SectionDetailRenderer.tsx:294:**
```typescript
const spacingMode = SUBHEADER_MARGIN_STYLES.has(props.headerStyleValue) ? 'margin' : 'padding'
```

`headerStyleValue` comes from `ThemeContext`, but spacing is managed by `useSectionManager` in `WorkspaceContext`. When header style changes, subheader spacing mode changes implicitly.

**Related code:**
- `useSectionManager.ts:49-53` - Hardcoded subheader defaults
- `useSectionManager.ts:820-908` - `applySubheaderSpacing` function

---

### 18. Three-Stage Hydration with No Error Boundaries

**Severity:** 🟡 Medium
**Impact:** Silent failures, users get defaults without knowing

**useWorkspace.ts hydration flow:**

1. **Stage 1:** Load from storage (lines 681-801)
   ```typescript
   loadStoredState() → EditorState
   ```

2. **Stage 2:** Spread to React state (lines 741-750)
   ```typescript
   setAccentColor(headerSettings.accentColor)
   setBgColor(parsedBgColor)
   // ...
   ```

3. **Stage 3:** Effect syncs to snapshot (lines 987-1018)
   ```typescript
   useEffect(() => {
     if (!workspaceHydrated) return
     syncExternalState({...})
   })
   ```

If Stage 1 fails, Stage 2 runs with defaults. No error logging, no user feedback.

---

### 19. Backward Compatibility Debt

**Severity:** 🟡 Medium
**Impact:** Dead code that must be maintained

**hero/schema.ts:32-33:**
```typescript
// Backward compatibility
imagePosition: z.enum(['left', 'right']).default('left'),
```

**announcement-bar/schema.ts:136-137:**
```typescript
// --- Legacy Support (deprecated, kept for migration) ---
previewText: z.string().optional()
```

These fields:
- ✅ Are in config schema
- ❌ Are not in settingsSchema
- ❌ Are never shown in UI
- ❌ Have no deprecation timeline or migration path

---

### 20. ToggleSwitch Gets Size Prop It Doesn't Support

**Severity:** 🟡 Medium
**Impact:** Dead prop, confusing API

**settingsRenderUtils.tsx:170:**
```typescript
<ToggleSwitch size={size} ... />
```

**ToggleSwitch.tsx:1-23:**
- Component has NO `size` prop defined
- Prop is silently ignored
- Fixed dimensions: 18px height, 34px width

---

### 21. ColorPickerSetting Has Deprecated + New API

**Severity:** 🟡 Medium
**Impact:** Confusing which API to use

**ColorPicker/types.ts:13-32:**
```typescript
// Deprecated:
onPickerChange?: (value: string) => void
onSwatchChange?: (value: string) => void

// New:
onChange?: (value: string) => void
onCommit?: (value: string) => void
```

Component handles both patterns (ColorPickerSetting.tsx:80-94). New code should use `onChange`/`onCommit`, but legacy code may still use deprecated callbacks.

---

### 22. Environment Variable BASE_PATH Duplicated 4+ Times

**Severity:** 🟡 Medium
**Impact:** Same pattern repeated, could drift

**Pattern repeated in:**
- `/defalt-rendering/custom-source/handlebars/helpers.ts:36`
- `/defalt-rendering/custom-source/domManipulation.ts:1`
- `/defalt-rendering/custom-source/templateLoader.ts:1`
- `/defalt-rendering/HandlebarsRenderer.tsx:1`
- `/defalt-app/RootApp.tsx`

```typescript
(import.meta.env.VITE_BASE_PATH ?? '/').replace(/\/$/, '')
```

Could be centralized to `defalt-utils/config/environment.ts`.

---

### 23. sectionRegistry Has No Schema/Settings Validation

**Severity:** 🟡 Medium
**Impact:** Invalid definitions load silently

**sectionRegistry.ts validation (lines 72-85):**
```typescript
if (!definition.id) {
  console.warn(`[sectionRegistry] Section "${sectionId}" missing required field (id)`)
  continue
}

// Verify ID matches folder name
if (definition.id !== sectionId) {
  console.warn(`[sectionRegistry] Section ID mismatch...`)
}
```

**What it DOESN'T check:**
- ❌ Does `settingsSchema` only reference fields in `configSchema`?
- ❌ Do `settingsSchema` defaults match `configSchema` Zod defaults?
- ❌ Are there config fields with NO settingsSchema UI?
- ❌ Is templatePath a valid file?

---

## Module-by-Module Findings

### defalt-sections

#### Architecture (Working Well)
- Three-file pattern per section: `index.ts`, `schema.ts`, `defaults.ts`
- Zod for validation, `settingsSchema` for UI generation
- `createConfig` factory derives defaults from Zod parse

#### Issues
1. **Zod vs Settings defaults duplicated** - Same value in two places
2. **Tag fields omitted from settingsSchema** - Edited via custom SectionDetailPanel code
3. **commonSettings presets unused** - Dead exports
4. **Block schema defined but not wired** - Announcement bar blocksSchema ignored
5. **Backward compatibility fields** - `imagePosition`, `previewText` kept without migration plan

#### File References
| Issue | File | Lines |
|-------|------|-------|
| Duplicate defaults | All sections | schema.ts Zod + settingsSchema |
| Unused presets | commonSettings.ts | 170-500 |
| Block not wired | announcement-bar/index.ts | 4-23 |
| Legacy fields | hero/schema.ts | 32-33 |

---

### defalt-rendering

#### Architecture
- Handlebars template compilation in browser
- 6-stage rendering pipeline in `HandlebarsRenderer.tsx`
- CSS injection via `domManipulation.ts`

#### Issues
1. **Padding passes through 3 channels** - Global props, section config, header customizations
2. **CSS defaults override schema** - `domManipulation.ts` has different values
3. **2400 lines of hardcoded CSS** - Should be in templates
4. **Export doesn't include preview styles** - Different rendering paths
5. **Template visibility has two systems** - CSS classes vs DOM filtering

#### File References
| Issue | File | Lines |
|-------|------|-------|
| 3 padding channels | HandlebarsRenderer.tsx | 65, 248, 547 |
| CSS overrides schema | domManipulation.ts | 68-75, 210-212 |
| Massive CSS | domManipulation.ts | 25-1307 |
| Missing export styles | exportTheme.ts | 519-1800 |

---

### defalt-app

#### Architecture
- React Context for configuration (WorkspaceContext, ThemeContext)
- Zustand for UI state (uiStore)
- Hooks for business logic (useWorkspace, useSectionManager)

#### Issues
1. **useWorkspace has 10+ concerns** - 1200 lines, 20 useState calls
2. **State + Refs maintained in parallel** - Sync via useEffect
3. **Three-stage hydration** - No error boundaries
4. **Announcement bar config split** - Two separate configs merged/split in sidebar
5. **Header style controls section spacing** - Cross-context coupling

#### File References
| Issue | File | Lines |
|-------|------|-------|
| Monolithic hook | useWorkspace.ts | 1-1276 |
| State + refs | useSectionManager.ts | 230-269 |
| Hydration | useWorkspace.ts | 681-801, 741-750, 987-1018 |
| Config split | useAnnouncementBar.ts | 21-26 |

---

### defalt-ui

#### Architecture
- Primitive components (SliderField, ColorPicker, ToggleSwitch)
- Layout components (SettingSection, PanelHeader)
- Centralized `cn()` utility

#### Issues
1. **SliderField default step=1** - Schema uses step=4 for padding
2. **SchemaSectionSettings ignores bounds** - Hardcodes min=0, max=200
3. **Color swatches hardcoded** - Can't customize per section
4. **Three color input variants** - ColorControl, ColorPickerSetting, ColorPicker
5. **ToggleSwitch size prop unused** - Renderer passes it, component ignores it

#### File References
| Issue | File | Lines |
|-------|------|-------|
| Default step | SliderField.tsx | 22, 84 |
| Hardcoded bounds | SchemaSectionSettings.tsx | 222-263 |
| Hardcoded swatches | settingsRenderUtils.tsx | 150-158 |
| Unused size | ToggleSwitch.tsx | 1-23 |

---

### Server & API

#### Architecture
- Express server with database (PostgreSQL)
- Theme CRUD endpoints
- Export pipeline with ZIP generation

#### Issues
1. **No validation on save** - `theme_json` accepted without checks
2. **Database stores arbitrary JSON** - No constraints
3. **Premium validation only at export** - Can save premium features without subscription
4. **Export hardcodes fallbacks** - Masks missing schema properties
5. **Vite plugin duplicates server code** - `generateHomeTemplate` in both

#### File References
| Issue | File | Lines |
|-------|------|-------|
| No validation | server.ts | 392-410, 432-483 |
| Database schema | server.ts | 40-84 |
| Hardcoded fallbacks | exportTheme.ts | 1506-1520, 1333-1338 |
| Code duplication | vite-plugin-theme-config.ts vs server.ts | multiple |

---

### Cross-Cutting Concerns

#### Architecture (Good)
- Path aliases work correctly (`@defalt/*`)
- `cn()` utility centralized
- Error logging centralized (`errorLogger.ts`)
- Security sanitizers centralized

#### Issues
1. **Circular dependency** - `defalt-utils` imports from `defalt-sections`
2. **Multiple default chains** - themeConfig.ts, section schemas, CSS_DEFAULT_PADDING
3. **Environment vars repeated** - BASE_PATH pattern in 4+ files
4. **Path aliases duplicated** - vite.config.ts and tsconfig.app.json

#### File References
| Issue | File | Lines |
|-------|------|-------|
| Circular dep | defalt-utils/types/subscription.ts | 6 |
| Circular dep | defalt-utils/config/configStateHelpers.ts | 1 |
| Multiple defaults | themeConfig.ts | 66-191 |
| Env vars repeated | Various | multiple |

---

## Data Flow Analysis

### Setting Flow: Schema → UI → State → Export

```
┌─────────────────────────────────────────────────────────────────┐
│ Section Definition (defalt-sections/sections/*/schema.ts)       │
│  ├─ Zod configSchema (validation + defaults)                    │
│  └─ settingsSchema (UI field generation)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Section Engine (defalt-sections/engine/schemaTypes.ts)          │
│  └─ SettingSchema discriminated union                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Settings Renderer (defalt-app/layout/sidebar)                   │
│  ├─ SchemaSectionSettings.tsx                                   │
│  ├─ settingsRenderUtils.tsx                                     │
│  └─ User adjusts settings                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ State Storage (WorkspaceContext + localStorage)                 │
│  ├─ useWorkspace manages state                                  │
│  ├─ useSectionManager manages sections                          │
│  └─ ThemeDocument persisted                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Theme Config (defalt-utils/config/themeConfig.ts)               │
│  └─ normalizeThemeDocument validates and normalizes             │
│     ⚠️ Does NOT validate section customConfig!                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Export Pipeline (server.ts + exportTheme.ts)                    │
│  ├─ applyGhostCardsCustomization() ← expects undefined props    │
│  ├─ applyGhostGridCustomization() ← expects undefined props     │
│  └─ Hardcoded fallbacks mask missing data                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Handlebars Renderer (defalt-rendering)                          │
│  ├─ hbsRenderer.ts compiles templates                           │
│  └─ domManipulation.ts injects CSS (preview only!)              │
│     ⚠️ Export doesn't get these styles!                         │
└─────────────────────────────────────────────────────────────────┘
```

### Where Defaults Are Applied

| Stage | What Happens | Location |
|-------|--------------|----------|
| Schema parse | Zod `.default()` applied | schema.ts |
| UI render | settingsSchema `default:` shown | settingsRenderUtils.tsx |
| Instance build | Spread merge with base | sectionRegistry.ts:168-195 |
| Normalization | normalizeThemeDocument | themeConfig.ts:677-712 |
| CSS render | domManipulation.ts CSS vars | domManipulation.ts |
| Export | Hardcoded fallbacks | exportTheme.ts |

**Problem:** Defaults applied at 6 different stages, can conflict.

---

## Root Cause Analysis

### Pattern 1: Zod Default + UI Default

**Problem:** Same value written twice, can drift.

```typescript
// Zod schema
contentWidth: z.enum([...]).default('1120px'),

// Settings schema (DUPLICATE!)
{ type: 'select', id: 'contentWidth', default: '1120px', ... }
```

**Solution:** Remove `default` from settingsSchema. Derive from Zod at render time.

---

### Pattern 2: definition.defaultPadding + schema padding

**Problem:** Two systems for same thing.

```typescript
// index.ts
defaultPadding: { top: 48, bottom: 48 },
showPaddingControls: false,

// schema.ts
const paddingSchema = createPaddingConfigSchema({ defaultTop: 48, defaultBottom: 48 })
```

**Solution:** Remove `defaultPadding` from definition. Use only schema padding with UI mode flag.

---

### Pattern 3: commonSettings Presets Unused

**Problem:** Dead abstraction, inline duplication everywhere.

**Solution:** Refactor sections to use presets:
```typescript
export const heroSettingsSchema: SettingSchema[] = [
  ...appearanceHeader,
  ...widthSettings,
  ...paddingSettings,  // Use preset instead of inline
]
```

---

### Pattern 4: CSS in domManipulation.ts

**Problem:** Different from schema defaults, doesn't export.

**Solution:** Move CSS to section templates (`.hbs` files). Keep only preview-specific styles in domManipulation.

---

### Pattern 5: No Validation at API/Storage

**Problem:** Garbage in, garbage out.

**Solution:** Add Zod validation middleware to API endpoints:
```typescript
app.post('/api/themes', validateBody(themeDocumentSchema), async (req, res) => { ... })
```

---

### Pattern 6: Export Hardcoded Fallbacks

**Problem:** Masks missing schema properties.

**Solution:** Add missing properties to schemas. Remove inline fallbacks. Let schema defaults flow through.

---

## Recommended Refactoring Plan

### Phase 1: Single Source of Truth for Padding (Week 1)

**Goal:** Eliminate padding duplication, establish clear ownership.

1. Remove `defaultPadding` and `showPaddingControls` from section definitions
2. Add `paddingControls: 'none' | 'vertical' | 'full'` to section definitions
3. Use only `settings.padding` with values from Zod schema
4. Update all 6 sections

**Files to modify:**
- `hero/index.ts`
- `image-with-text/index.ts`
- `ghostCards/index.ts`
- `ghostGrid/index.ts`
- `header/index.ts`
- `announcement-bar/index.ts`
- `SchemaSectionSettings.tsx`

---

### Phase 2: Fix Schema/Export Mismatch (Week 1)

**Goal:** Export uses defined properties only.

1. Add `showHeader`, `headerAlignment` to ghostCards/ghostGrid schemas
2. Add `columnGap` to ghostGrid schema (or rename `gap` to `columnGap`)
3. Remove hardcoded fallbacks from export functions
4. Validate export reads only schema-defined properties

**Files to modify:**
- `ghostCards/schema.ts`
- `ghostGrid/schema.ts`
- `exportTheme.ts` (lines 1333-1338, 1506-1520)

---

### Phase 3: Use commonSettings Presets (Week 2)

**Goal:** Eliminate inline duplication, enable central updates.

1. Remove `default:` from settingsSchema UI fields
2. Derive UI defaults from Zod at render time
3. Refactor sections to spread commonSettings presets
4. Delete duplicate code from 6 section files

**Files to modify:**
- All section `schema.ts` files
- `settingsRenderUtils.tsx`
- `SchemaSectionSettings.tsx`

---

### Phase 4: Consolidate domManipulation.ts (Week 2-3)

**Goal:** Preview CSS matches export CSS.

1. Move section CSS to `.hbs` template files
2. Keep only preview-specific styles (selection highlighting)
3. Ensure export uses same CSS as preview
4. Reduce domManipulation.ts from 2400 to ~500 lines

**Files to modify:**
- `domManipulation.ts`
- All section `.hbs` files
- `exportTheme.ts`

---

### Phase 5: Add Validation Layer (Week 3)

**Goal:** Prevent invalid data from entering database.

1. Add Zod validation middleware to API endpoints
2. Validate `customConfig` against section schema at save time
3. Normalize on read, not just on export
4. Remove `.catchall(z.unknown())` from validation schemas

**Files to modify:**
- `server.ts`
- `themeValidation.ts`
- `themeConfig.ts`

---

### Phase 6: Split useWorkspace (Week 4)

**Goal:** Separate concerns, improve testability.

1. Extract `useThemeSettings` (colors, sticky mode, search)
2. Extract `usePersistence` (auto-save, cloud sync)
3. Extract `useHydration` (loading, error handling)
4. Keep `useWorkspace` for orchestration only

**Files to modify:**
- `useWorkspace.ts` (split into 4 files)
- `WorkspaceContext.tsx`

---

### Phase 7: Fix Circular Dependency (Week 4)

**Goal:** Restore module boundaries.

1. Move `isPremium` logic to `defalt-utils/config/premiumConfig.ts`
2. Update imports in `subscription.ts`
3. Update imports in `configStateHelpers.ts`
4. Verify no utils → sections imports remain

**Files to modify:**
- `defalt-sections/premiumConfig.ts` (move to utils)
- `defalt-utils/types/subscription.ts`
- `defalt-utils/config/configStateHelpers.ts`

---

## File Reference Index

### Critical Issues

| Issue | Primary File | Lines |
|-------|--------------|-------|
| Export expects undefined props | exportTheme.ts | 1333-1338, 1506-1520 |
| 7 padding sources | Multiple | See section |
| No API validation | server.ts | 392-410, 432-483 |
| Circular dependency | defalt-utils/types/subscription.ts | 6 |

### High Severity Issues

| Issue | Primary File | Lines |
|-------|--------------|-------|
| Duplicate defaults | All sections | schema.ts |
| Dead commonSettings | commonSettings.ts | 170-500 |
| Massive CSS | domManipulation.ts | 25-1307 |
| Monolithic hook | useWorkspace.ts | 1-1276 |
| State + refs | useSectionManager.ts | 230-269 |
| Block not wired | announcement-bar/index.ts | 4-23 |
| Content width x4 | Multiple schemas | See section |
| Text alignment x4 | Multiple schemas | See section |
| Image settings x2 | hero + image-with-text | See section |
| Bounds ignored | SchemaSectionSettings.tsx | 222-263 |

### Medium Severity Issues

| Issue | Primary File | Lines |
|-------|--------------|-------|
| Hardcoded swatches | settingsRenderUtils.tsx | 150-158 |
| Parent + block typography | announcement-bar/schema.ts | 114-138, 22-30 |
| Header controls spacing | SectionDetailRenderer.tsx | 294 |
| No hydration errors | useWorkspace.ts | 681-801 |
| Legacy fields | hero/schema.ts | 32-33 |
| Unused size prop | ToggleSwitch.tsx | 1-23 |
| Deprecated API | ColorPicker/types.ts | 13-32 |
| Env vars repeated | Multiple | See section |
| No registry validation | sectionRegistry.ts | 72-85 |

---

## Conclusion

This codebase has grown organically with good intentions but accumulated significant architectural debt. The core issues stem from **lacking a single source of truth** for configuration values, leading to duplication, drift, and silent failures.

The recommended refactoring prioritizes:
1. **Immediate fixes** for export/schema mismatches (breaking issues)
2. **Consolidation** of padding/defaults (prevent future drift)
3. **Cleanup** of dead code and duplication (maintenance burden)
4. **Structural improvements** (hooks, validation, module boundaries)

Estimated timeline: 4 weeks for comprehensive refactoring.

---

*Generated by Claude Code architectural audit - December 13, 2025*
