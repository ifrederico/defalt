# UI Primitives Standardization - Handoff

## Context

We're standardizing the "vocabulary" of UI primitives before AI integration. The goal is to create a **Standard Library** for the Theme Engine that ensures consistent, premium-feeling UI controls.

## Work Completed

### 1. Schema Types Audit
Identified all 10 setting types in use:
- `text`, `textarea`, `richtext`, `url` (text inputs)
- `color` (color picker)
- `checkbox` (renders as toggle switch)
- `range` (slider)
- `select` (dropdown)
- `header`, `paragraph` (display-only grouping elements)

### 2. Kitchen Sink Debug Section
Created `sections/debug-kitchen-sink/` with one of every primitive type for testing:
- **Files**: `schema.ts`, `defaults.ts`, `index.ts`, `debug-kitchen-sink.hbs`
- **Purpose**: Dev-only section for testing all UI controls
- **Location**: Add via sidebar "Add Section" in editor

### 3. Paragraph Schema Fix
Fixed inconsistency where `paragraph` type used `label` but should use `content`:
- `engine/schemaTypes.ts` - Changed schema definition
- `SchemaSectionSettings.tsx` - Updated UI renderer to use `setting.content`

### 4. Data Persistence Analysis
Traced the full save/load flow and verified types are preserved correctly:
- UI components produce correct types (SliderField → number, ToggleSwitch → boolean)
- JSON round-trip preserves JavaScript primitive types
- No Zod validation on load (trusts stored data)

## Next Steps

### 1. Refresh Test Protocol (Manual Testing Required)
Run `bun run dev` and test the Kitchen Sink section:
1. Add "Kitchen Sink (Debug)" section
2. Modify values: change text, toggle a boolean to `false`, move slider to `50`, pick a color
3. Click "Save"
4. Hard refresh (Cmd+R)
5. Verify: Do values persist? Does slider stay at `50`? Does toggle stay `false`?

### 2. UI Polish Phase
If persistence passes, fix these issues:

#### SliderField Unit Display
**File**: `defalt-ui/primitives/SliderField.tsx` (line 114)
**Issue**: Hardcodes "px" as unit, but some sliders have no unit (opacity 0-1) or different units
**Fix**: Pass `unit` prop from schema and display conditionally

#### Select Dropdowns
**Issue**: Currently uses native `<select>`, should use Radix UI Select
**File**: `defalt-app/layout/sidebar/components/SchemaSectionSettings.tsx` (line 75-86)

#### Polish Requirements (from original task)
- **Toggles**: Smooth animation, clear on/off states
- **Sliders**: Smooth dragging, live value display, proper unit formatting
- **Dropdowns**: Radix UI with consistent styling

## Key Files

| File | Purpose |
|------|---------|
| `engine/schemaTypes.ts` | Zod schemas for all setting types |
| `engine/commonSettings.ts` | Reusable setting presets |
| `engine/sectionRegistry.ts` | Auto-discovery and section instance building |
| `sections/debug-kitchen-sink/*` | Test section with all primitives |
| `SchemaSectionSettings.tsx` | UI renderer for schema-based settings |
| `defalt-ui/primitives/SliderField.tsx` | Slider component (needs unit fix) |

## Architecture Notes

### Section Definition Structure
```typescript
interface SectionDefinition {
  id: string
  label: string
  category: 'template'
  configSchema: ZodSchema      // Validation
  settingsSchema: SettingSchema[]  // UI generation
  createConfig: () => Config   // Default factory
  templatePath: string         // HBS template
}
```

### Data Flow
1. **UI → State**: Components produce typed values
2. **State → Storage**: `JSON.stringify()` preserves types
3. **Storage → State**: `JSON.parse()` restores types
4. **Hydration**: `buildSectionInstance()` merges saved config with defaults

### Auto-Discovery
Sections are auto-discovered via `import.meta.glob('../sections/*/index.ts')`.
Each section must export `definition` from its `index.ts`.
