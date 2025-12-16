# To-do list — 12/15 (dashboard)

## Decisions (lock these)

- [ ] `VITE_API_URL`: remove (unused). Keep all dashboard API calls same-origin via `apiPath()` + `VITE_BASE_PATH`.
- [ ] Analytics: prod-only. No Umami script in dev builds.
- [ ] Ghost config: `VITE_GHOST_URL` = main site/portal origin (ex: `https://defalt.org`). Preview Content API creds remain user-configurable (`defalt:ghost-connection`).

---

## P0 — Base path / routing correctness

- [ ] Fix CSRF fetch path (currently hardcoded `/api/auth/csrf`, breaks under `/app`):
  - [ ] Make CSRF requests go through `apiPath('/api/auth/csrf')` (or build `CSRF_ENDPOINT` via `withBasePath()`).
  - [ ] Remove duplicate CSRF fetch logic in `AuthContext` and use the shared CSRF helper (single source).
  - [ ] Verify: with `VITE_BASE_PATH=/app/`, CSRF hits `/app/api/auth/csrf` (not `/api/auth/csrf`).

---

## P1 — Remove duplicated sources of truth

### Storage keys (localStorage/sessionStorage)

- [ ] Centralize keys in one place (new module or extend `defalt-utils/constants.ts`):
  - [ ] `defalt:ghost-connection`
  - [ ] `ghost-data-source`
  - [ ] `defalt-ai-sections`
  - [ ] `ghost-theme-editor:*` keys (workspace, CSRF token, etc)
- [ ] Replace string literals across app with the centralized constants.
- [ ] Centralize Ghost creds parsing/validation (used by `SidebarRail`, `GhostConnectionSettings`, `defalt-utils/ghost/client`).

### Env vars: remove dead/unused + unify names

- [ ] Remove `VITE_API_URL` from:
  - [ ] root `.env.example`
  - [ ] `dashboard/.env.example`
  - [ ] `dashboard/src/env.d.ts`
  - [ ] any docs mentioning it
- [ ] `VITE_APP_URL`: either remove everywhere (if unused) or implement usage (pick one).
- [ ] Unify Ghost Content API key env var naming (pick one and update all refs):
  - [ ] `VITE_GHOST_CONTENT_KEY` (currently used in app code/types)
  - [ ] `VITE_GHOST_CONTENT_API_KEY` (currently used in Docker/Railway build args)
- [ ] Remove/rename `VITE_AUTH_SECRET` (types) vs `AUTH_SECRET` (server/plugin) mismatch:
  - [ ] Decide: keep `AUTH_SECRET` only (server-side) and delete `VITE_AUTH_SECRET` typing, or switch to `VITE_AUTH_SECRET` everywhere.
- [ ] Ensure `dashboard/CLAUDE.md` matches the real env surface area.

---

## P1 — Analytics prod-only

- [ ] Remove hardcoded Umami `<script>` from `dashboard/index.html`.
- [ ] Add env vars + types:
  - [ ] `VITE_UMAMI_WEBSITE_ID`
  - [ ] optional `VITE_UMAMI_HOST` (default `https://cloud.umami.is`)
- [ ] Load Umami script only when `import.meta.env.PROD` and website id exists.
- [ ] Verify:
  - [ ] Dev: Umami script NOT present, `trackEvent()` no-ops.
  - [ ] Prod: script present, events appear.

---

## P2 — Hardcoded values that should be configurable

### Preview base URL fallback

- [ ] Remove hardcoded `https://source-newsletter.ghost.io/` fallback(s):
  - [ ] Ensure placeholder `previewData.site.base_url` always exists, and use it everywhere.
  - [ ] Or add `VITE_PREVIEW_FALLBACK_URL` and type it.

### UI magic numbers (optional)

- [ ] Centralize UI layout constants (if you care):
  - [ ] sidebar rail width (52px), panel widths (300px), preview max widths (420/1280)

---

## P3 — Refactor (optional)

- [ ] Split `useWorkspace` into smaller hooks/modules (persistence, hydration, autosave, sync, analytics).

---

## Verification

- [ ] `bun test` (dashboard)
- [ ] Manual (prod-like): run with `VITE_BASE_PATH=/app/` and confirm:
  - [ ] CSRF request path includes `/app`
  - [ ] No API calls accidentally go to Ghost routes
- [ ] Manual (prod): confirm Umami script loads only in prod
