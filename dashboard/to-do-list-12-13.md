# To-do list — 12/13

## Remaining

### Manual verification

- [ ] Verify: exported theme output matches preview for ghostCards/ghostGrid spacing.
- [ ] Verify: preview defaults === export defaults (no preview-only padding/typography drift).
- [ ] Verify runtime in Ghost:
  - Preview renders using the same templates Ghost will run
  - Exported theme in Ghost matches preview (no preview-only CSS dependency)

### Optional refactor

- [ ] Split `useWorkspace` into smaller hooks/modules (persistence, hydration, autosave, sync, analytics).

### Future consideration

- [ ] Make announcement bar a regular section (content-driven via `#announcement` tag, "Add section" above header).

---

## Decisions locked

- **Export templates:** `defalt-sections` templates are the only source. Preview emulates Ghost helpers (`{{#get}}`, `{{#foreach}}`, etc). Export copies templates as-is (Ghost runs them).
- **Parse failures:**
  - UI interaction: revert + toast
  - Hydration (localStorage): fallback to defaults + toast
  - API (server): normalize + store + log warning
  - Principle: never store invalid data
- **Import direction:** `defalt-utils` imports nothing from other `defalt-*` modules. Arrows point down only.

## Completed (12/13)

- ✅ Removed all legacy migration code:
  - Deleted `migrateLegacyHeroConfig.ts`
  - Removed legacy field mappings from `exportTheme.ts` (`showHeader`, `headerAlignment`, `columnGap`)
  - Removed `previewText` from announcement-bar schema and all usages
