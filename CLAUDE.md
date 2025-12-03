# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See [AGENTS.md](AGENTS.md) for AI assistant behavior guidelines.

## Project Overview

Defalt is an open source Ghost Theme Editor (MIT License). It's a web app for customizing the Ghost "Source" theme with live preview and export capabilities.

## Repository Structure

```
defalt/
├── dashboard/     # Vite + React theme editor (main development)
└── ghost/         # Ghost CMS Docker image with bundled defalt theme
```

## Development

All development happens in the `dashboard/` directory. See [dashboard/CLAUDE.md](dashboard/CLAUDE.md) for detailed architecture, module boundaries, and development commands.

### Quick Commands (run from `dashboard/`)

```bash
npm run dev           # Start Vite dev server (localhost:5173)
npm run dev:vercel    # Start with serverless functions (for /api/* routes)
npm run build:all     # Build app and theme
npm run lint          # Run ESLint
npm test              # Run Vitest tests
```

### Environment Setup

Copy `dashboard/.env.example` to `dashboard/.env` and configure Supabase credentials. Stripe keys required for subscription features (see `dashboard/DEPLOYMENT.md`).

## Deployment

Deploys to Railway on push to main. Services:
- **Dashboard**: Express server serving Vite build + API endpoints
- **Ghost**: Ghost CMS with bundled defalt theme
- **Caddy**: Reverse proxy routing `/app/*` to dashboard, rest to Ghost
- **PostgreSQL**: Theme storage
