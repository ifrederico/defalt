# To-do list — 12/15 (dashboard)

## Decisions (locked)

- [x] `VITE_API_URL`: removed (unused). All dashboard API calls same-origin via `apiPath()` + `VITE_BASE_PATH`.
- [x] Analytics: prod-only. Umami script only loads in production builds.
- [x] Ghost config: `VITE_GHOST_URL` = main site/portal origin. Preview Content API creds remain user-configurable (`defalt:ghost-connection`).

---

## P0 — Base path / routing correctness ✅

- [x] Fix CSRF fetch path — now uses `apiPath(CSRF_ENDPOINT)` in `csrf.ts`
- [x] Verify: with `VITE_BASE_PATH=/app/`, CSRF hits `/app/api/auth/csrf`

---

## P1 — Remove duplicated sources of truth ✅

### Storage keys (localStorage/sessionStorage)

- [x] Centralized in `defalt-utils/constants.ts`:
  - `STORAGE_KEYS.GHOST_CONNECTION` (`defalt:ghost-connection`)
  - `STORAGE_KEYS.DATA_SOURCE` (`ghost-data-source`)
  - `STORAGE_KEYS.AI_SECTIONS` (`defalt-ai-sections`)
  - `STORAGE_KEYS.CSRF_TOKEN` (`ghost-theme-editor:csrf-token`)
  - `EVENTS.DATA_SOURCE_CHANGE` (`ghost-data-source-change`)
- [x] Replaced string literals across app with centralized constants

### Env vars: remove dead/unused + unify names

- [x] Removed `VITE_API_URL` from `env.d.ts` and `.env.example` files
- [x] Unified Ghost Content API key to `VITE_GHOST_CONTENT_KEY` (Dockerfile, railway.json)

### Railway action required

Rename env var in Railway dashboard:
```
VITE_GHOST_CONTENT_API_KEY → VITE_GHOST_CONTENT_KEY
```

---

## P1 — Analytics prod-only ✅

- [x] Removed hardcoded Umami `<script>` from `dashboard/index.html`
- [x] Added env vars + types: `VITE_UMAMI_WEBSITE_ID`, `VITE_UMAMI_HOST`
- [x] Umami script loads only in production when website ID is set

### Railway/prod env vars to add

```
VITE_UMAMI_WEBSITE_ID=cf482080-986e-475b-9b52-c4a252c39c47
VITE_UMAMI_HOST=https://cloud.umami.is  # optional, this is the default
```

---

## P2 — Hardcoded values that should be configurable ✅

### Preview base URL fallback

- [x] Centralized `PREVIEW_FALLBACK_URL` in `defalt-utils/constants.ts`
- [x] Updated `dataPreview.ts`, `dataResolvers.ts`, `usePreview.ts` to use constant

### UI magic numbers (skipped)

- [ ] Centralize UI layout constants — low priority, skipping for now

---

## P3 — Refactor (optional)

- [ ] Split `useWorkspace` into smaller hooks/modules (persistence, hydration, autosave, sync, analytics).

---

## Verification

- [ ] `bun test` (dashboard)
- [x] Manual (prod-like): run with `VITE_BASE_PATH=/app/` — CSRF path correct
- [ ] Manual (prod): confirm Umami script loads only in prod
