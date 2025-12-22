# Dashboard

The editor app. This is where the magic happens.

## Getting started

```bash
bun install
cp .env.example .env
```

Set `VITE_GHOST_URL` to your Ghost site, then:

```bash
bun run dev
```

Open http://localhost:5173/app/ and you're in.

## Environment variables

- `VITE_GHOST_URL` — Your Ghost site URL (required)
- `VITE_DEV_BYPASS_AUTH` — Set to `true` to skip auth during development
- `VITE_BASE_PATH` — Change if you're not hosting at `/app/`
- `DATABASE_URL` — Postgres connection for theme storage

## Commands

```bash
bun run dev           # Start the dev server
bun run build         # Build everything
bun run build:theme   # Just build the Ghost theme
bun run test          # Run tests
```

## Notes

- Export needs an authenticated Ghost member (uses `/api/theme/export`)
- Hosting at root? Set `VITE_BASE_PATH=/`
