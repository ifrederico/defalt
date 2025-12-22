# Defalt Dashboard

Editor app for the Defalt Ghost theme.

## Quickstart

```bash
bun install
cp .env.example .env
```

Set `VITE_GHOST_URL` in `.env`, then:

```bash
bun run dev
```

Open `http://localhost:5173/app/`.

## Useful env vars

- `VITE_GHOST_URL` (required): Ghost site URL for auth + content.
- `VITE_BASE_PATH` (optional): subpath for hosting (default `/app/`).
- `VITE_DEV_BYPASS_AUTH` (optional): set to `true` to skip Ghost auth in dev.
- `DATABASE_URL` (optional): enables theme storage in Postgres.

## Common commands

```bash
bun run dev           # Vite dev server
bun run dev:server    # Express server (watch mode)
bun run build         # TypeScript + Vite build
bun run start         # Production server
bun run build:theme   # Build the Ghost theme in public/themes/source-complete
bun run test          # Vitest
```

## Notes

- Export uses `/api/theme/export` and requires an authenticated Ghost member.
- If you host at root, set `VITE_BASE_PATH=/` and use `http://localhost:5173/`.
