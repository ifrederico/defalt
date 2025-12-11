# Code Audit Report: Architecture & Duplication Analysis

**Date:** 2025-12-11
**Scope:** `dashboard/` + `ghost/` directories
**Focus:** Architectural coupling, module boundaries, DRY violations

---

## Executive Summary

| Zone | Issue | Priority | Files Affected |
|------|-------|----------|----------------|
| **Zone 1** | Render vs Theme selector coupling | CRITICAL | 4 files, 14 selectors |
| **Zone 2** | Hook sprawl across 4 directories | MODERATE | 4 misplaced hooks |
| **Zone 3** | UI components in wrong packages | MODERATE | 4 components to move |
| **Zone 4** | Context factory pattern duplication | HIGH | 6+ files → 1 factory |
| **Zone 5** | Section schemas ignore commonSettings | HIGH | 7 schemas |
| **Zone 6** | Defaults duplicate Zod schema values | MODERATE | 7 defaults files |
**Total: 6 architectural zones + 11 micro-level issues**

---

# PART 1: ARCHITECTURAL ISSUES (Macro-Level)

## ZONE 1: Render vs Theme Gap - CRITICAL

### Executive Summary

The TypeScript rendering code is **tightly coupled to hardcoded theme selectors**. If someone modifies the Ghost theme (changes class names, section structure, header layout), the editor will break.

### The Problem

The files in `defalt-rendering/custom-source/handlebars/` hardcode CSS selectors and DOM structures that must match the theme in `public/themes/source-complete/`.

### Critical Hardcoded Dependencies

| File | Line | Selector | What Breaks If Changed |
|------|------|----------|------------------------|
| `sectionSelectors.ts` | 1 | `.gh-viewport` | Preview viewport |
| `sectionSelectors.ts` | 2 | `footer.gh-footer.gh-outer` | Footer manipulation |
| `sectionSelectors.ts` | 8 | `section.gh-header` | Subheader visibility |
| `sectionSelectors.ts` | 11 | `section.gh-container.is-grid/is-list` | Main section |
| `sectionSelectors.ts` | 15 | `.gh-footer-bar` | Footer bar reordering |
| `sectionSelectors.ts` | 22 | `#gh-navigation`, `.gh-navigation` | Header selection |
| `headerCustomization.ts` | 23 | `.gh-navigation.is-sticky-*` | Sticky header |
| `headerCustomization.ts` | 48 | `#gh-navigation .gh-navigation-brand/menu` | Typography case |
| `headerCustomization.ts` | 112 | `button.gh-search.gh-icon-button` | Search toggle |
| `headerCustomization.ts` | 133 | `getElementById('gh-navigation')` | Header lookup |
| `domManipulation.ts` | 26-50 | Multiple `.gh-*` selectors | Visibility hiding |
| `domManipulation.ts` | 2053 | `.announcement-bar` | Announcement sync |
| `templateLoader.ts` | 98-102 | `defalt-navigation-start/end` comments | Header filtering |
| `templateLoader.ts` | 267 | `/themes/source-complete/` path | Template loading |

### Example: sectionSelectors.ts

```typescript
// These are hardcoded - if theme changes, editor breaks
export const TEMPLATE_CONTAINER_SELECTOR = '.gh-viewport'
export const FOOTER_ROOT_SELECTOR = 'footer.gh-footer.gh-outer'

export const TEMPLATE_SECTION_SELECTORS = {
  subheader: 'section.gh-header',
  featured: 'section.gh-featured',
  main: ['section.gh-container.is-grid', 'section.gh-container.is-list']
}
```

### Example: domManipulation.ts (400+ lines of hardcoded CSS)

```typescript
const PREVIEW_INLINE_STYLES = `
body.app-hide-header #gh-navigation,
body.app-hide-header .gh-navigation {
  display: none !important;
}
body.app-hide-subheader section.gh-header {
  display: none !important;
}
// ... 400+ more lines
`
```

### Recommended Fix

1. **Extract theme structure to config**: Create `theme-structure.json` that documents all selectors
2. **Load selectors dynamically**: TypeScript reads from config instead of hardcoding
3. **Add runtime validation**: Warn when selectors don't exist in DOM
4. **Consider data attributes**: Use `data-defalt-section="header"` instead of class-based selection

---

## ZONE 2: Hook Sprawl - MODERATE

### The Problem

Hooks are scattered across 4 directories with no clear separation principle:

```
dashboard/defalt-app/hooks/     (9 hooks - mixed)
dashboard/defalt-ui/hooks/      (2 hooks - correct)
dashboard/defalt-utils/hooks/   (4 files - mixed)
dashboard/src/hooks/            (1 hook - orphaned legacy)
```

### Hook Inventory

#### Hooks in WRONG Location

| Hook | Current | Should Be | Reason |
|------|---------|-----------|--------|
| `useSaveQueue.ts` | defalt-app | defalt-utils | Zero app dependencies, pure utility |
| `useAIGenerate.ts` | defalt-app | defalt-utils | Only imports aiService utility |
| `useStripeActions.ts` | defalt-app | defalt-utils | Just URL navigation, no app logic |
| `useGhostMember.ts` | src/hooks | defalt-app | Orphaned, should consolidate |

#### Hooks Correctly Placed

| Hook | Location | Reason |
|------|----------|--------|
| `useAuth.ts` | defalt-app | Uses AuthContext |
| `useSubscription.ts` | defalt-app | Uses SubscriptionContext |
| `useWorkspace.ts` | defalt-app | Heavy app/context dependencies |
| `useSectionManager.ts` | defalt-app | Editor-specific state |
| `useAnnouncementBar.ts` | defalt-app | Editor-specific state |
| `useClickOutside.ts` | defalt-ui | Generic UI behavior |
| `usePreviousFocus.ts` | defalt-ui | Generic UI behavior |
| `useMediaQuery.ts` | defalt-utils | Generic utility |
| `usePackageJson.ts` | defalt-utils | Generic utility |

#### Non-Hooks Mislabeled as Hooks

| File | Location | Issue |
|------|----------|-------|
| `configStateDefaults.ts` | defalt-utils/hooks | Not a hook - just constants |
| `configStateHelpers.ts` | defalt-utils/hooks | Not a hook - just utilities |

### Recommended Fix

1. Move `useSaveQueue`, `useAIGenerate`, `useStripeActions` → `defalt-utils/hooks/`
2. Move `useGhostMember` → `defalt-app/hooks/` and consolidate with auth
3. Delete `src/hooks/` directory
4. Rename `configStateDefaults.ts` → `configDefaults.ts` (not in hooks folder)

---

## ZONE 3: UI Component Split - MODERATE

### The Problem

Generic reusable components are stuck in `defalt-app/` instead of the shared `defalt-ui/` library.

### Components That Should Move to defalt-ui

| Component | Current Location | Target | Reason |
|-----------|------------------|--------|--------|
| `Toast.tsx` + `ToastContext.ts` | defalt-app/components | defalt-ui/providers | Generic provider pattern |
| `ErrorBoundary.tsx` | defalt-app/components | defalt-ui/primitives | Generic error handling |
| `PreviewLoadingBar.tsx` | defalt-app/layout | defalt-ui/primitives | No app logic, pure visual |
| `RightDetailPanel.tsx` | defalt-app/layout | defalt-ui/layout | Generic container |

### Legacy Code That Should Be Consolidated

| File | Current | Target | Reason |
|------|---------|--------|--------|
| `src/context/MemberContext.tsx` | src/context | DELETE or merge | Legacy, duplicates AuthContext |
| `src/hooks/useGhostMember.ts` | src/hooks | DELETE or merge | Legacy, not used by main app |

### Components Correctly Placed

**In defalt-ui (correct):**
- `SettingSection`, `SettingField`, `SettingRow` - Form building blocks
- `PanelHeader` - Panel header with tag editing
- `SliderField`, `ColorControl`, `ToggleSwitch` - Form controls
- `Button`, `Dropdown`, `Tooltip` - UI primitives

**In defalt-app (correct - app-specific):**
- `UpgradeModal` - Has Stripe/subscription logic
- `SettingsModal` - Has auth/subscription logic
- `GhostConnectionSettings` - Has Ghost API logic
- `TopBar`, `EditorSidebar`, `SidebarRail` - App-specific layout

---

## ZONE 4: Context Factory Pattern - HIGH

### The Problem

Three contexts (`Theme`, `Workspace`, `History`) use **identical boilerplate** that differs only in type names:

```
defalt-app/contexts/
├── ThemeContextBase.ts      # 4 lines - createContext<ThemeContextValue | null>(null)
├── useThemeContext.ts       # 11 lines - useContext + throw if null
├── WorkspaceContextBase.ts  # 4 lines - createContext<WorkspaceContextValue | null>(null)
├── useWorkspaceContext.ts   # 11 lines - useContext + throw if null
├── HistoryInteractionBlockerContext.tsx  # Same pattern
└── useHistoryInteractionBlocker.ts       # Same pattern
```

### Evidence of Duplication

**ThemeContextBase.ts:**
```typescript
import { createContext } from 'react'
import type { ThemeContextValue } from './ThemeContext.types'

export const ThemeContext = createContext<ThemeContextValue | null>(null)
```

**WorkspaceContextBase.ts:**
```typescript
import { createContext } from 'react'
import type { WorkspaceContextValue } from './WorkspaceContext.types'

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)
```

**useThemeContext.ts:**
```typescript
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}
```

**useWorkspaceContext.ts:**
```typescript
export function useWorkspaceContext(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider')
  }
  return context
}
```

### Also Applies To

- `src/context/MemberContext.tsx` - Legacy code using same pattern
- Any future contexts will copy-paste this pattern

### Recommended Fix

Create a typed context factory:

```typescript
// defalt-utils/createTypedContext.ts
export function createTypedContext<T>(name: string) {
  const Context = createContext<T | null>(null)

  function useTypedContext(): T {
    const context = useContext(Context)
    if (!context) {
      throw new Error(`use${name}Context must be used within a ${name}Provider`)
    }
    return context
  }

  return [Context, useTypedContext] as const
}

// Usage:
const [ThemeContext, useThemeContext] = createTypedContext<ThemeContextValue>('Theme')
```

**Impact:** Reduces 6+ files to 1 factory + 3 one-liners.

---

## ZONE 5: Section Schema Duplication - HIGH

### The Problem

Section schemas in `defalt-sections/sections/*/schema.ts` manually define padding, colors, button settings etc. **despite** `commonSettings.ts` exporting ready-made presets.

### Available But Unused Presets

`commonSettings.ts` exports:
- `paddingSettings`, `createPaddingSettings()` - Top/bottom padding sliders
- `backgroundSettings`, `darkBackgroundSettings` - Background color
- `fullTextColorSettings` - Heading + text colors
- `fullButtonSettings` - Button toggle + text + link + colors
- `alignmentSettings` - Left/center/right
- `paddingShape`, `backgroundShape`, `buttonShape` - Zod schema fragments

### Example: hero/schema.ts (NOT using commonSettings)

```typescript
// Currently: 79 lines of manual schema definitions
export const heroSettingsSchema: SettingSchema[] = [
  { type: 'header', id: 'content-header', label: 'Content' },
  { type: 'text', id: 'heading', label: 'Heading', default: '', placeholder: 'Enter heading' },
  // ...
  { type: 'header', id: 'padding-header', label: 'Padding' },
  { type: 'range', id: 'paddingTop', label: 'Top', min: 0, max: 200, step: 4, default: 64, unit: 'px' },
  { type: 'range', id: 'paddingBottom', label: 'Bottom', min: 0, max: 200, step: 4, default: 64, unit: 'px' }
]
```

### Should Be

```typescript
import { sectionHeaderSettings, fullButtonSettings, darkSchemeSettings, createPaddingSettings } from '../../engine/commonSettings'

export const heroSettingsSchema: SettingSchema[] = [
  ...sectionHeaderSettings,
  ...fullButtonSettings,
  ...darkSchemeSettings,
  ...createPaddingSettings({ defaultTop: 64, defaultBottom: 64 })
]
```

### Affected Files (7 section schemas)

| Section | Lines | Could Use |
|---------|-------|-----------|
| `hero/schema.ts` | 79 | `sectionHeaderSettings`, `fullButtonSettings`, `darkSchemeSettings`, `paddingSettings` |
| `image-with-text/schema.ts` | 48 | `backgroundSettings`, `textColorSettings`, `paddingSettings` |
| `ghostCards/schema.ts` | ~50 | `paddingSettings`, `backgroundSettings` |
| `ghostGrid/schema.ts` | ~50 | `paddingSettings`, `backgroundSettings` |
| `announcement-bar/schema.ts` | ~30 | `backgroundSettings`, `textColorSettings` |
| `header/schema.ts` | ~40 | Various |
| `debug-kitchen-sink/schema.ts` | ~100 | Test file, low priority |

**Impact:** If padding range changes from 200 to 300, need to update 7+ files instead of 1.

---

## ZONE 6: Defaults Mirroring Schema - MODERATE

### The Problem

Each section has a `defaults.ts` that **manually repeats** the same values already defined in the Zod schema's `.default()` calls.

### Example: hero/defaults.ts

```typescript
// defaults.ts - 21 lines repeating schema defaults
export const heroDefaults: HeroConfig = {
  heading: '',
  subheading: '',
  showButton: true,
  buttonText: '',
  buttonLink: '',
  contentAlignment: 'center',
  contentWidth: 'full',
  backgroundColor: '#000000',
  textColor: '#ffffff',
  buttonColor: '#ffffff',
  buttonTextColor: '#000000',
  paddingTop: 64,
  paddingBottom: 64
}
```

### schema.ts already has the same defaults

```typescript
export const heroConfigSchema = z.object({
  heading: z.string().default(''),           // <- Same default
  showButton: z.boolean().default(true),     // <- Same default
  paddingTop: z.number().default(64),        // <- Same default
  // ...
})
```

### Recommended Fix

Derive defaults from schema:

```typescript
// hero/defaults.ts
import { heroConfigSchema } from './schema'

export const heroDefaults = heroConfigSchema.parse({})
```

**Impact:** Eliminates manual sync between schema defaults and defaults.ts across 7 sections.

---

# PART 2: MICRO-LEVEL DUPLICATION (Original Audit)

---

## Summary

| Priority | Issues | Estimated Impact |
|----------|--------|------------------|
| **CRITICAL** | 2 | High bug risk, immediate maintenance burden |
| **HIGH** | 3 | Inconsistent behavior, hard to maintain |
| **MEDIUM** | 4 | Code bloat, developer friction |
| **LOW** | 2 | Minor cleanup |

**Total: 11 refactor opportunities identified**

---

## CRITICAL Priority

### 1. Duplicate Icon Maps

**The same constant defined in two files:**

| File | Lines |
|------|-------|
| `defalt-app/layout/sidebar/pages/SectionsPanelBase.tsx` | 52-61 |
| `defalt-app/layout/sidebar/pages/components/AddSectionCard.tsx` | 41-50 |

Both define `SECTION_ICON_MAP` with 8 nearly identical icon mappings:

```typescript
// SectionsPanelBase.tsx
const SECTION_ICON_MAP: Record<string, LucideIcon> = {
  'hero': GalleryVertical,
  'grid': Grid3x3,
  'testimonials': MessageSquareQuote,
  'faq': MessageCircleQuestionMark,
  'about': SquareUserRound,
  'image-with-text': LayoutList,
  'ghostCards': GhostIcon,
  'ghostGrid': GhostIcon,
}

// AddSectionCard.tsx - nearly identical
const SECTION_ICON_MAP: Record<string, LucideIcon> = {
  'hero': GalleryVertical,
  'image-with-text': LayoutList,
  'grid': Grid3x3,
  'testimonials': MessageSquareQuote,
  'faq': MessageCircleQuestionMark,
  'about': SquareUserRound,
  'ghostCards': GhostIcon,
  'ghostGrid': GhostIcon,
}
```

**Impact:** If one is updated, the other gets forgotten. High bug risk.

**Fix:** Extract to `defalt-utils/config/sectionIcons.ts`

---

### 2. Icon Resolution Logic in 3 Places

| Location | Approach |
|----------|----------|
| `SectionsPanelBase.tsx:148-162` | `resolveGhostSectionIcon()` - checks GHOST_SECTION_IDS, then SECTION_ICON_MAP, then fallback |
| `useSectionManager.ts:335-338` | Inline `definitionIconMap` memo with only 3 entries |
| `AddSectionCard.tsx:142` | Direct lookup `SECTION_ICON_MAP[definition.id] \|\| GhostIcon` |

**Impact:** Three different approaches to resolve the same thing. Inconsistent behavior.

**Fix:** Single `resolveSectionIcon(sectionId, definitionId?)` utility

---

## HIGH Priority

### 3. Padding/Margin Sanitization - 3 Implementations

| File | Function | Lines |
|------|----------|-------|
| `defalt-app/layout/sidebar/pages/components/SectionPaddingSettings.tsx` | Inline IIFE for margin resolution | 29-46 |
| `defalt-app/hooks/editor/useSectionManager.ts` | `sanitizePadding()`, `sanitizeMarginValue()` | 228-240 |
| `defalt-app/hooks/useWorkspace.ts` | `resolvePaddingValue()` repeated 3x | 457-504 |

**Example from SectionPaddingSettings.tsx:**
```typescript
const marginBottomValue = (() => {
  if (margin && typeof margin.bottom === 'number') {
    return margin.bottom
  }
  if (defaultMargin && typeof defaultMargin.bottom === 'number') {
    return defaultMargin.bottom
  }
  return 0
})()
```

**Example from useSectionManager.ts:**
```typescript
const sanitizePadding = (value: number | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }
  return Math.max(0, value)
}
```

**Impact:** Same business logic implemented 3+ times with slight variations.

**Fix:** Single `sanitizeNumericValue(value, fallback, min?)` utility

---

### 4. Ghost Card ID/Tag Parsing - Duplicated Regex

| File | Functions |
|------|-----------|
| `defalt-app/hooks/editor/useSectionManager.ts:65-110` | `parseGhostCardIdSuffix()`, `parseGhostCardTagSuffix()`, `getNextGhostCardsSuffix()` |
| `defalt-utils/tagUtils.ts:15-34` | `formatInternalTag()` with regex `/^ghost-cards?-?(\d+)?$/` |

**useSectionManager.ts:**
```typescript
const parseGhostCardIdSuffix = (id: string): number | null => {
  const match = id.match(/^ghost-cards-(\d+)$/)
  if (match) {
    return parseInt(match[1], 10)
  }
  if (id === 'ghost-cards') {
    return 1
  }
  return null
}
```

**tagUtils.ts:**
```typescript
const ghostMatch = stripped.toLowerCase().match(/^ghost-cards?-?(\d+)?$/)
if (ghostMatch) {
  const suffix = ghostMatch[1]
  return suffix ? `#ghost-card-${suffix}` : '#ghost-card'
}
```

**Impact:** Similar regex patterns with different implementations.

**Fix:** Consolidate into `tagUtils.ts` with clear API

---

### 5. Margin Value Calculation - Copy-Pasted 3 Times

In `useWorkspace.ts:560-606`, this exact pattern appears **3 times**:

```typescript
const resolvedTop = (() => {
  if (sectionMargin && typeof sectionMargin.top === 'number') {
    return Math.max(0, sectionMargin.top)
  }
  if (cssMarginDefault && typeof cssMarginDefault.top === 'number') {
    return Math.max(0, cssMarginDefault.top)
  }
  return undefined
})()

const resolvedBottom = (() => {
  if (sectionMargin && typeof sectionMargin.bottom === 'number') {
    return Math.max(0, sectionMargin.bottom)
  }
  if (cssMarginDefault && typeof cssMarginDefault.bottom === 'number') {
    return Math.max(0, cssMarginDefault.bottom)
  }
  return undefined
})()
```

**Impact:** Literal copy-paste. Any bug fix needs to be applied 3 times.

**Fix:** Extract `resolveMarginPair(margin, defaults)` helper

---

## MEDIUM Priority

### 6. Clone Utilities - 5 Similar Functions

All in `useSectionManager.ts:130-209`:

```typescript
const cloneSidebarItems = (items: SidebarItem[]) => items.map((item) => ({ ...item }))
const cloneVisibilityState = (state: Record<string, boolean>) => ({ ...state })
const cloneSectionPaddingState = (state: Record<string, { top: number; bottom: number }>) => {
  const result: Record<string, { top: number; bottom: number }> = {}
  for (const [key, value] of Object.entries(state)) {
    result[key] = { ...value }
  }
  return result
}
// ... and 2 more similar functions
```

**Impact:** 5 functions doing essentially the same shallow clone with minor variations.

**Fix:** Generic `shallowCloneState<T>(state: T)` or use `structuredClone()`

---

### 7. State Equality Comparisons - 2 Nearly Identical Functions

In `useSectionManager.ts:150-198`:

```typescript
const arePaddingStatesEqual = (
  a: Record<string, { top: number; bottom: number }>,
  b: Record<string, { top: number; bottom: number }>
) => {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    if (!b[key]) return false
    if (a[key].top !== b[key].top || a[key].bottom !== b[key].bottom) return false
  }
  return true
}

const areMarginStatesEqual = (
  a: Record<string, { top?: number; bottom?: number }>,
  b: Record<string, { top?: number; bottom?: number }>
) => {
  // ... nearly identical implementation
}
```

**Impact:** Two functions with identical structure, only differing in type.

**Fix:** Generic `areNestedStatesEqual(a, b, compareFn)` or use lodash `isEqual`

---

### 8. Padding Slider Rendering - Same Pattern 3 Places

| File | Lines | Pattern |
|------|-------|---------|
| `defalt-app/layout/sidebar/pages/components/SectionPaddingSettings.tsx` | 60-98 | Full padding controls |
| `defalt-app/layout/sidebar/components/SchemaThemeSettings.tsx` | 125-136 | Single "Block" slider |
| `defalt-app/layout/sidebar/components/SchemaSectionSettings.tsx` | 211-254 | top/bottom/left/right sliders |

All render `SliderField` with identical props:
```typescript
<SliderField
  label="Top"
  value={paddingTop}
  onChange={handlePaddingTopChange}
  onCommit={handlePaddingTopCommit}
  min={0}
  max={200}
  step={1}
  unit="px"
/>
```

**Impact:** Same slider configuration repeated. If we change max from 200 to 300, need to update 3 places.

**Fix:** `<PaddingSlider direction="top" value={} onChange={} />` component

---

### 9. Section ID Normalization - Scattered

| File | Location |
|------|----------|
| `defalt-utils/hooks/configStateDefaults.ts:41-46` | `normalizeHeroSectionId()` function |
| `defalt-app/hooks/useWorkspace.ts:347-350` | Calls normalizeHeroSectionId inline |
| `defalt-app/hooks/editor/useSectionManager.ts:54-63` | `generateCustomSectionId()` with different logic |

```typescript
// configStateDefaults.ts
export const normalizeHeroSectionId = (value: string): string => {
  if (value.startsWith(LEGACY_HERO_ID_PREFIX)) {
    return value.replace(LEGACY_HERO_ID_PREFIX, HERO_ID_PREFIX)
  }
  return value
}
```

**Impact:** Hero ID prefixes defined in multiple places (`hero-defalt`, `defalt-hero`).

**Fix:** Centralize all section ID logic in one module

---

## LOW Priority

### 10. Default Values Scattered

| Value | Locations |
|-------|-----------|
| Subheader padding `160` | `useSectionManager.ts:48`, `themeConfig.ts:165` |
| Hero ID prefixes | `configStateDefaults.ts:12-13`, inline in multiple files |

```typescript
// useSectionManager.ts
const SUBHEADER_PADDING_DEFAULT = 160

// themeConfig.ts
export const CSS_DEFAULT_PADDING: Record<string, number> = {
  subheader: 160,
  // ...
}
```

**Impact:** If default changes, easy to miss one location.

**Fix:** Single source of truth for all defaults

---

### 11. Thin Panel Wrappers

Three files that just wrap `SectionsPanelBase`:

| File | Content |
|------|---------|
| `PostSectionsPanel.tsx` | `<SectionsPanelBase panelTitle="Post" allowTemplateAdd={false} {...props} />` |
| `HomepageSectionsPanel.tsx` | `<SectionsPanelBase panelTitle="Homepage" {...props} />` |
| `AboutSectionsPanel.tsx` | `<SectionsPanelBase panelTitle="About" {...props} />` |

Each is ~7 lines wrapping the same base component with different `panelTitle`.

**Impact:** Minor - these do serve as explicit entry points.

**Fix (optional):** Factory function or keep as-is for clarity

---

## Recommended Action Plan

### Phase 1: Critical (Immediate)

1. **Zone 1: Extract theme selectors to config** - Decouples rendering from theme structure
2. **Extract `SECTION_ICON_MAP`** to `defalt-utils/config/sectionIcons.ts`
3. **Create `resolveSectionIcon()`** utility function

### Phase 2: High Priority

4. **Zone 4: Create `createTypedContext()` factory** - Reduces 6+ files to 1
5. **Zone 5: Refactor section schemas to use commonSettings** - 7 files benefit
6. **Zone 6: Derive defaults from Zod schemas** - Eliminates manual sync
7. **Create `sanitizeNumericValue()`** utility in `defalt-utils`
8. **Consolidate Ghost card ID/tag parsing** in `tagUtils.ts`

### Phase 3: Medium Priority

9. **Zone 2: Reorganize hooks** - Move 4 hooks to correct locations
10. **Zone 3: Move generic components to defalt-ui** - 4 components
11. **Generic clone/equality utilities** - consider lodash or custom
12. **`<PaddingSlider />`** reusable component

### Phase 4: Low Priority (When Convenient)

13. Delete legacy `src/context/`, `src/hooks/` directories
14. Consolidate default values
15. Consider panel wrapper factory (optional)

---

## Notes

- The SectionDetailPanel refactor (completed 2025-12-11) fixed the tag duplication issue between `SectionsPanelBase` and `RightDetailPanel`
- Many of these issues are "death by a thousand cuts" - individually small but collectively create significant maintenance burden
- Priority should be given to issues that have caused bugs or near-misses
