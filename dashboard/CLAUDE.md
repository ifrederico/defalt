# CLAUDE.md

Technical documentation for the dashboard module. See [../AGENTS.md](../AGENTS.md) for AI behavior guidelines.

## Environment Setup

Copy `.env.example` to `.env` and configure:

**Required to run end-to-end:**
- `VITE_GHOST_URL` - Ghost site URL (member auth + content)

**Recommended for local dev:**
- `VITE_BASE_PATH` - Base path for routing/assets (dev scripts default to `/app/`)

**Optional:**
- `DATABASE_URL` - PostgreSQL connection string (theme storage; without it storage is disabled)
- `VITE_DEV_BYPASS_AUTH` - `true` to skip Ghost auth in dev
- `VITE_AI_SERVICE_URL` / `VITE_AI_API_KEY` - AI section generator
- `VITE_UMAMI_WEBSITE_ID` / `VITE_UMAMI_HOST` - analytics
- `PORT` - production server port

Install dependencies with `bun install`.

## Testing

```bash
bun run test              # Run all tests via Vitest
bun run test -- sanitizers.test.ts  # Run single test file
```

Primary test suite: [sanitizers.test.ts](defalt-utils/security/sanitizers.test.ts) validates input sanitization for CSS, hex colors, and tokens.
Use `bun run test` (Vitest). `bun test` runs Bun's test runner and will fail on Vitest APIs.

## Development Commands

```bash
bun run dev           # Start Vite dev server (http://localhost:5173/app/)
bun run dev:server    # Start Express server with watch mode
bun run build         # TypeScript compile + Vite build
bun run build:theme   # Build the Ghost theme in public/themes/source-complete
bun run build:all     # Build both app and theme
bun run start         # Start Express production server
bun run lint          # Run ESLint
bun run preview       # Preview production build
```

**Dev Server Endpoints** (via vite-plugin-theme-config):
- `GET /api/auth/csrf` - CSRF token endpoint
- `GET /api/member` - Ghost member proxy (dev only)
- `GET /api/theme-config` - Read theme document
- `POST /api/theme-config` - Save theme document
- `DELETE /api/theme-config` - Delete theme document
- `POST /api/theme/export` - Export theme ZIP
Note: `/api/ghost/content` proxy is disabled and returns 410.

**Express Server Endpoints** (server.ts):
- `GET /api/auth/csrf` - CSRF token endpoint
- `GET /api/theme-config` - Read theme document
- `POST /api/theme-config` - Save theme document
- `DELETE /api/theme-config` - Delete theme document
- `POST /api/theme/export` - Export theme ZIP
- `GET /api/themes` - List user themes
- `GET /api/themes/:id` - Get single theme
- `POST /api/themes` - Create/update theme
- `DELETE /api/themes/:id` - Delete theme

## Architecture

### Module Boundaries (Enforced Directional Imports)

```
defalt-app
  ├─▶ defalt-ui
  ├─▶ defalt-sections
  ├─▶ defalt-rendering
  └─▶ defalt-utils

defalt-ui ─▶ defalt-utils
defalt-sections ─▶ defalt-ui, defalt-utils
defalt-rendering ─▶ defalt-sections, defalt-utils
defalt-utils ─▶ (no defalt-* dependencies)
```

**Never import `defalt-app` from other modules.** Use path aliases from tsconfig/vite.config instead of `../../`:
- `@defalt/app/*`
- `@defalt/ui/*`
- `@defalt/sections/*`
- `@defalt/rendering/*`
- `@defalt/utils/*`

### Key Systems

**Manual Router**: [RootApp.tsx](defalt-app/RootApp.tsx) implements a manual router with these routes:
- `/` - Landing screen (sign-in CTA)
- `/dashboard` - Main editor (App.tsx)

Unauthenticated users see the landing screen; sign-in triggers Ghost login. Navigation listens to `popstate`.

**Authentication**: Ghost member auth via cookies:
- `MemberContext` - Ghost member data from cookies
- `AuthContext` - Auth status wrapper around MemberContext
- Members managed through Ghost portal, not custom auth

**Theme Configuration**: Single source of truth at `public/theme-config/defalt-theme.json`. Structure:
- `header` - Global header config
- `footer` - Global footer config (includes `order` array)
- `pages.{pageId}` - Per-page layouts with `order` array and `sections` object
- `packageJson` - Serialized package.json for theme export

**Handlebars Rendering**: Iframe-based rendering system using **actual Ghost theme templates** (not CSS recreation):
- Uses `public/themes/source-complete/` (Ghost Source theme) for all templates/partials/styles
- `HandlebarsRenderer.tsx` - Main orchestrator with useMemo for template filtering to prevent re-render flashes
- `handlebars/helpers.ts` - Ghost helper mocks (asset, navigation, match, etc.)
- `handlebars/templateLoader.ts` - Template/partial loading + visibility filtering (removes sections from DOM)
- `handlebars/domManipulation.ts` - Post-render DOM reordering
- `handlebars/headerCustomization.ts` - Header sticky behavior and typography

**Architecture Decision**: Switched from CSS recreation to using Ghost's actual Handlebars templates. This ensures exported themes match preview exactly and eliminates CSS drift. Preview compiles real Ghost templates in browser using `handlebars` runtime.

Preview data lives in `defalt-rendering/preview-data/dataPreview.ts`.

**Section Visibility**: Template filtering approach (not CSS hiding):
- `filterTemplatesByVisibility()` removes hidden sections from templates before compilation
- Sections completely removed from DOM (default.hbs, home.hbs, page.hbs, post.hbs)
- Footer partial re-registered on every render to handle visibility changes
- `useMemo` in HandlebarsRenderer prevents flashes by memoizing filtered templates
- Loading indicator (PreviewLoadingBar) shows during visibility toggles for UX feedback

**State Management**: React Context API for global state:
- `AuthContext` - Ghost member auth status
- `MemberContext` - Ghost member data from cookies
- `SubscriptionContext` - User subscription tier (free/monthly/lifetime)
- `ThemeContext` - Theme config state (header, footer, announcement bar)
- `WorkspaceContext` - Page-specific workspace state (sections, order, visibility)
- `HistoryContext` - Undo/redo via command pattern

Contexts in `defalt-app/contexts/` use base classes (`*Base.ts`) for shared logic and custom hooks (`use*Context.ts`) for type-safe access.

**Key Hooks** in `defalt-app/hooks/`:
- `useWorkspace.ts` - Main workspace state orchestrator (sections, ordering, persistence)
- `usePreview.ts` - Preview rendering and iframe communication
- `useExport.ts` - Theme export flow

**History System** (`defalt-utils/history/`):
- `HistoryManager.ts` - Command pattern implementation with per-page undo/redo stacks
- `commands.ts` - Command types and metadata

**Premium Features** (`defalt-utils/config/premiumConfig.ts`):
- Premium sections: `hero`, `grid`, `testimonials`, `faq`, `about`, `image-with-text`
- Free sections: `announcement-bar`, `ghostCards`, `ghostGrid`, `custom-css`
- Use `isPremium(featureId)` / `isFree(featureId)` to check access

**Announcement Bar**: Global header feature with granular typography controls:
- Enabled/disabled per theme config
- Typography: weight (light/medium/semibold/bold), style (normal/italic), size, line height, letter spacing, text transform
- Layout: background color, text color, border width
- Applied via `applyAnnouncementBarCustomization` in export pipeline
- Uses schema engine: [announcement-bar/schema.ts](defalt-sections/sections/announcement-bar/schema.ts)

**Header Section**: Navigation header with schema-driven settings:
- Uses schema engine: [header/schema.ts](defalt-sections/sections/header/schema.ts)
- Settings: navigation layout, sticky header, search toggle, typography case

**Error Boundary**: [DashboardErrorBoundary.tsx](defalt-app/components/DashboardErrorBoundary.tsx) wraps main app with error UI for runtime errors. Displays error message with reload option.

**Export Pipeline** (vite-plugin-theme-config.ts):
1. Copy `public/themes/source-complete` to temp workspace
2. Generate `home.hbs` and partials from JSON config via `defalt-rendering/theme/exportTheme.ts`
3. Apply navigation/footer/default.hbs customizations
4. Apply page.hbs and post.hbs visibility filtering (via `applyPageTemplateCustomization`, `applyPostTemplateCustomization`)
5. Inject inline styles for custom sections (Hero, Ghost cards)
6. Create ZIP archive (exclude node_modules/dist)
7. Return ZIP to browser

**Security**: Input sanitization utilities in [defalt-utils/security/sanitizers.ts](defalt-utils/security/sanitizers.ts):
- `sanitizeHexColor()` - Validates hex color codes
- `sanitizeToken()` - Validates CSS tokens (class names, IDs)
- `sanitizeCustomCss()` - Validates CSS using css-tree parser
- All user inputs are sanitized before rendering or export

**Styling**: Use semantic tokens (`text-secondary`, `bg-subtle`, `border-border`) not raw colors (`text-gray-600`). Use `font-md`/`font-sm` for body text, `rounded-md` for buttons, `rounded-lg` for cards.

### Directory Structure

- `src/` - App entry point (main.tsx)
- `defalt-app/` - React app shell (RootApp, layout, routes, contexts, hooks)
- `defalt-ui/` - Shared UI primitives (color picker, settings controls)
- `defalt-sections/` - Section definitions, settings panels, premium config
- `defalt-rendering/` - Handlebars renderer, preview data, template generation, drag-drop
- `defalt-utils/` - Core utilities (config, security, history, API helpers)
- `db/` - Database schema (PostgreSQL)
- `public/themes/source-complete/` - Ghost Source theme (templates, assets, app.css)
- `public/theme-config/` - JSON config files

### Tech Stack

- React 19 + TypeScript + Vite 7
- Radix UI components (Dialog, Dropdown Menu, Popover, Tabs, Slider, Switch, Toggle Group, Separator, Alert Dialog)
- Tailwind CSS + PostCSS
- Handlebars runtime
- CodeMirror (CSS/JSON editing)
- Lucide React
- react-colorful (color picker)
- sonner (toast notifications)
- Express 5 (production server)
- PostgreSQL (theme storage via `pg`)
- Ghost (auth + memberships)
- Vitest (testing)
- Zod (validation)
- css-tree (CSS parsing/validation)
- Archiver (ZIP generation)

### Deployment

Railway with Docker. Services:
- **Dashboard**: Express server serving Vite build + API endpoints
- **Ghost**: Ghost CMS with bundled defalt theme
- **Caddy**: Reverse proxy routing `/app/*` to dashboard, rest to Ghost
- **PostgreSQL**: Theme storage
