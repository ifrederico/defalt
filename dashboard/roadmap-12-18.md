# Roadmap (combined) — Defalt backlog

Note: paths use the old monorepo prefix (`dashboard/`). Drop the prefix when working from this repo root.

## Decisions (locked)
- Container width: incremental preview updates must match initial render (720/1120).
- Preview hiding: match export behavior (wrap hidden markup).
- Subscription gating: plus gets access to everything; free can add/experiment; export must block premium sections.
- Export gating: server derives tier from member data (not client).
- Multiple hero instances: canonical ids + tags (`hero`, `hero-2`, … with `#hero`, `#hero-2`, …). No backward compatibility.
- Announcement block `tag` + `link`: UI exposes both; auto-tag defaults per block; collisions are blocked.

## Technical debt (low priority)
- **Prop drilling in EditorSidebar** (partially addressed): Migrated ThemeContext to Zustand (`themeStore.ts`). Created `workspaceStore.ts` for direct component access. `SectionDetailRenderer` now reads from stores directly. ~60 props still passed through `SectionsPanelBase` for callbacks. Consider migrating callbacks to stores when capacity allows.

- **defalt-sections engine improvements**:
  - Zod pinned at 4.1.12. Add tests for schema introspection (`_def` access in `engine/sectionRegistry.ts`) when upgrading Zod.

- **defalt-rendering components**: `HandlebarsRenderer.tsx` (772 lines) and `SectionActionBar/index.tsx` (509 lines) are large but manageable. Consider extracting hooks if they grow further.

- **defalt-utils improvements**:
  - Replace unsafe type assertions (`value as Record<string, unknown>`) with Zod runtime validation or proper type guards.
