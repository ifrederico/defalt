# Defalt Improvements Plan

**Date:** 2024-12-12
**Source:** Analysis of Onlook (visual editor) and Zustand (state management) codebases
**Status:** Planned

---

## Executive Summary

After comparing Defalt's architecture against Onlook and Zustand source code, the codebase is already well-architected. Only two practical improvements were identified:

| Improvement | Effort | Impact | Priority |
|-------------|--------|--------|----------|
| Centralize `cn()` utility | 10 min | Medium | High |
| Add `persist` middleware to uiStore | 10 min | Medium | Medium |

---

## Improvement 1: Centralize `cn()` Utility

### Problem

The `cn()` class name utility is duplicated in 3 files:

```
dashboard/defalt-ui/primitives/Button.tsx
dashboard/defalt-ui/primitives/ColorPicker/ColorPicker.tsx
dashboard/defalt-ui/primitives/TextInput.tsx
```

Each defines the same function:
```typescript
function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}
```

Additionally, `tailwind-merge` is installed but underutilized - only `AppButton.tsx` uses it.

### Why This Matters

**1. DRY Violation** - Same code in 3 places means 3 places to update if logic changes.

**2. Current `cn()` has a subtle bug** - It doesn't handle Tailwind class conflicts:

```typescript
// Current behavior (BROKEN):
cn('px-2', 'px-4')  // => 'px-2 px-4' (both classes applied, CONFLICT!)

// With tailwind-merge (CORRECT):
cn('px-2', 'px-4')  // => 'px-4' (later class wins, as expected)
```

**3. Real-world scenario** - When a component accepts `className` prop:

```tsx
// Button.tsx defines base padding
<button className={cn('px-4 py-2', className)}>

// Consumer tries to override padding
<Button className="px-8" />  // User wants more padding

// CURRENT: Results in "px-4 py-2 px-8" - browser picks one arbitrarily!
// WITH FIX: Results in "py-2 px-8" - px-8 correctly overrides px-4
```

### Solution

Create a shared utility that combines `clsx` pattern with `tailwind-merge`:

**File:** `dashboard/defalt-ui/utils/cn.ts`

```typescript
import { twMerge } from 'tailwind-merge'

type ClassValue = string | false | null | undefined | 0 | ClassValue[]

/**
 * Combines class names and merges Tailwind classes intelligently.
 *
 * Why tailwind-merge?
 * - Resolves conflicting Tailwind classes (px-2 + px-4 = px-4)
 * - Handles responsive variants (md:px-2 + md:px-4 = md:px-4)
 * - Handles state variants (hover:bg-red + hover:bg-blue = hover:bg-blue)
 *
 * @example
 * cn('px-2 py-1', isActive && 'bg-primary', className)
 * cn('px-2', 'px-4') // => 'px-4' (tailwind-merge resolves conflicts)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(inputs.flat().filter(Boolean).join(' '))
}
```

**Export from:** `dashboard/defalt-ui/index.ts`

```typescript
export { cn } from './utils/cn'
```

### Before / After

**Before (Button.tsx):**
```tsx
// Local function - duplicated, no tailwind-merge
function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function Button({ className, ...props }) {
  return (
    <button className={cn('px-4 py-2 bg-primary', className)}>
      {/* If className="px-8", results in "px-4 py-2 bg-primary px-8" - CONFLICT */}
    </button>
  )
}
```

**After (Button.tsx):**
```tsx
import { cn } from '@defalt/ui'

export function Button({ className, ...props }) {
  return (
    <button className={cn('px-4 py-2 bg-primary', className)}>
      {/* If className="px-8", results in "py-2 bg-primary px-8" - CORRECT */}
    </button>
  )
}
```

### Files to Update

1. `Button.tsx` - Remove local `cn()`, import from `@defalt/ui`
2. `ColorPicker.tsx` - Remove local `cn()`, import from `@defalt/ui`
3. `TextInput.tsx` - Remove local `cn()`, import from `@defalt/ui`

### Benefits

- **Single source of truth** - One place to update if logic changes
- **Correct class merging** - `tailwind-merge` prevents CSS conflicts
- **Composable components** - Consumers can safely override styles
- **Consistent pattern** - Same utility across entire codebase

---

## Improvement 2: Add `persist` Middleware to uiStore

### Problem

User preferences in `uiStore` reset on every page refresh:
- `sidebarExpanded` - User has to re-expand sidebar
- `activeTab` - Returns to default tab

### Why This Matters

**1. User frustration** - Every time you refresh the page:

```
Current behavior:
1. User expands sidebar to see full section names
2. User switches to "Settings" tab
3. User refreshes page (or navigates away and back)
4. Sidebar is collapsed again ❌
5. Tab is back to "Sections" ❌
6. User has to redo their preferences every time
```

**2. Inconsistent experience** - Most modern apps remember UI preferences:

```
Expected behavior (what users are used to):
- VS Code remembers sidebar width
- Figma remembers panel states
- Gmail remembers inbox view preferences
- These don't reset on refresh
```

**3. No code complexity** - Zustand's `persist` middleware handles everything:
- Automatic localStorage read/write
- Version migrations when state shape changes
- Selective persistence (only save what matters)

### Solution

Add Zustand's `persist` middleware to save preferences to localStorage.

### Before / After

**Before (current `uiStore.ts`):**
```typescript
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export const useUIStore = create<UIStore>()(
  subscribeWithSelector((set) => ({
    ...initialState,  // Always starts from defaults on refresh
    // ... actions
  }))
)

// User experience:
// 1. Expand sidebar ✓
// 2. Refresh page
// 3. Sidebar collapsed again ✗ (frustrating!)
```

**After (with `persist`):**
```typescript
import { create } from 'zustand'
import { subscribeWithSelector, persist } from 'zustand/middleware'

export const useUIStore = create<UIStore>()(
  persist(
    subscribeWithSelector((set) => ({
      ...initialState,
      // ... actions (unchanged)
    })),
    {
      name: 'defalt-ui-preferences',  // localStorage key
      partialize: (state) => ({
        // Only persist user preferences, not transient state
        sidebarExpanded: state.sidebarExpanded,
        activeTab: state.activeTab,
      }),
      version: 1,  // For future migrations
    }
  )
)

// User experience:
// 1. Expand sidebar ✓
// 2. Refresh page
// 3. Sidebar still expanded ✓ (remembers preference!)
```

**What gets saved to localStorage:**
```json
{
  "state": {
    "sidebarExpanded": true,
    "activeTab": "settings"
  },
  "version": 1
}
```

### What Gets Persisted (and Why)

| State | Persisted | Reason |
|-------|-----------|--------|
| `sidebarExpanded` | **Yes** | User preference - should survive refresh |
| `activeTab` | **Yes** | User preference - should survive refresh |
| `activeDetail` | No | Session-specific - which section is selected depends on current editing context |
| `hoveredSectionId` | No | Transient - changes constantly during interaction |
| `scrollToSectionId` | No | Transient - one-time scroll trigger |

### Future-Proofing with Migrations

If you later add new preferences, the `version` field handles migrations:

```typescript
{
  name: 'defalt-ui-preferences',
  version: 2,  // Bump when state shape changes
  migrate: (persistedState, version) => {
    if (version === 1) {
      // Add new field with default value
      return { ...persistedState, newPreference: 'default' }
    }
    return persistedState
  },
}
```

### Benefits

- **Remembers sidebar state** - User doesn't re-expand every time
- **Remembers active tab** - User stays in Settings/AI tab across sessions
- **Zero manual code** - No custom localStorage logic needed
- **Selective persistence** - Only preferences, not transient state
- **Version migrations** - Safe to evolve state shape over time
- **SSR-safe** - Zustand handles server-side rendering edge cases

---

## What Was Evaluated But NOT Needed

### From Onlook Analysis

| Pattern | Why Not Needed |
|---------|----------------|
| MobX stores | Zustand is simpler and already working well |
| Discriminated union actions | Class-based `commands.ts` is equivalent and solid |
| Provider abstraction | Ghost API is already well-isolated in `defalt-utils/ghost/` |
| Models package restructure | Types are scattered but manageable - high effort, low return |
| tRPC routers | No complex server routes - Express is sufficient |

### From Zustand Analysis

| Pattern | Why Not Needed |
|---------|----------------|
| More Zustand stores | Contexts work fine for complex state |
| `useShallow` improvements | Already using correctly in `useUIActions()` |
| `subscribeWithSelector` | Already using correctly |

---

## Architecture Validation

The analysis confirmed Defalt's architecture is solid:

| Area | Assessment |
|------|------------|
| State Management | Zustand used correctly with proper selectors |
| Command Pattern | `commands.ts` has proper undo/redo with class hierarchy |
| Button Variants | `AppButton.tsx` uses variant matrix pattern |
| Type Safety | String unions work fine (`ActiveTab`) |
| Module Boundaries | Clear separation between `defalt-ui`, `defalt-app`, `defalt-utils` |

---

## Implementation Checklist

### Phase 1: cn() Utility (10 min)

- [ ] Create `dashboard/defalt-ui/utils/cn.ts`
- [ ] Export from `dashboard/defalt-ui/index.ts`
- [ ] Update `Button.tsx` - remove local `cn()`, add import
- [ ] Update `ColorPicker.tsx` - remove local `cn()`, add import
- [ ] Update `TextInput.tsx` - remove local `cn()`, add import
- [ ] Run `bun run lint` to verify no issues
- [ ] Test components still render correctly

### Phase 2: Persist Middleware (10 min)

- [ ] Update `dashboard/defalt-app/stores/uiStore.ts`
- [ ] Add `persist` middleware wrapping `subscribeWithSelector`
- [ ] Configure `partialize` for `sidebarExpanded` and `activeTab`
- [ ] Test: expand sidebar, refresh page, verify it stays expanded
- [ ] Test: switch to Settings tab, refresh, verify tab persists

### Phase 3: Commit

- [ ] `git add -A`
- [ ] Commit with message: `refactor: centralize cn() utility and add persist to uiStore`
- [ ] Push to branch

---

## Future Considerations (Not Urgent)

These items were noted but are low priority:

1. **Template literal classNames (37 occurrences)** - Could migrate to `cn()` for consistency, but current approach works fine

2. **Page type enum** - Could replace string literals (`'homepage'`, `'post'`) with enum, but risk of typos is low

3. **Context factory already implemented** - `createTypedContext` factory was added during this session, reducing boilerplate

---

## References

- Onlook source: `/Users/welkin/Downloads/code-to-study-2`
- Zustand source: `/Users/welkin/Downloads/zustand-main`
- Zustand `persist` docs: https://docs.pmnd.rs/zustand/integrations/persisting-store-data
