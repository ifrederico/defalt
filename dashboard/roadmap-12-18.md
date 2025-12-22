# Roadmap (combined) — Defalt backlog

Note: paths use the old monorepo prefix (`dashboard/`). Drop the prefix when working from this repo root.

## Decisions (locked)
- Container width: incremental preview updates must match initial render (720/1120).
- Preview hiding: match export behavior (wrap hidden markup).
- Subscription gating: plus gets access to everything; free can add/experiment; export must block premium sections.
- Export gating: server derives tier from member data (not client).
- Multiple hero instances: canonical ids + tags (`hero`, `hero-2`, … with `#hero`, `#hero-2`, …). No backward compatibility.
- Announcement block `tag` + `link`: UI exposes both; auto-tag defaults per block; collisions are blocked.

## Remaining work
- Split `dashboard/defalt-utils/config/themeConfig.ts` and `dashboard/defalt-utils/hooks/usePackageJson.ts` into smaller modules.
- Add `dashboard/defalt-sections/engine/settingsWalker.ts` (`walkSettingsSchema`) for schema traversal (including blocks).
- Extract `dashboard/defalt-app/workspace/persistence.ts` and `dashboard/defalt-app/workspace/derive.ts` from `useWorkspace`.
- Design palette panel (railbar icon) for global styles; store in ThemeDocument; apply via utils.css overrides.
