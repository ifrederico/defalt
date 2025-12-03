# Defalt

A visual theme editor for Ghost CMS. Customize the Ghost Source theme with live preview and one-click export.

## Features

- **Live Preview** - See changes instantly in a real Ghost theme preview
- **Drag & Drop** - Reorder sections with drag and drop
- **One-Click Export** - Download a ready-to-upload Ghost theme ZIP
- **Ghost Memberships** - Authentication via Ghost's built-in member system
- **Section Visibility** - Show/hide sections per page type
- **Custom CSS** - Add custom styles with live validation

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **UI**: Radix UI, Lucide Icons
- **Rendering**: Handlebars (compiles actual Ghost templates in browser)
- **Backend**: Express, PostgreSQL
- **Auth**: Ghost member cookies
- **Deployment**: Railway (Ghost + Dashboard)

## Quick Start

```bash
# Clone and install
git clone https://github.com/ifrederico/defalt.git
cd defalt/dashboard
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Ghost URL

# Start development server
npm run dev
```

Open http://localhost:5173

## Environment Variables

See [.env.example](.env.example) for all options. Minimum required:

```bash
VITE_GHOST_URL=https://your-ghost-site.com
```

For local development without Ghost auth:
```bash
VITE_DEV_BYPASS_AUTH=true
```

## Project Structure

```
defalt/
├── dashboard/          # Main React app
│   ├── defalt-app/     # App shell, routing, contexts
│   ├── defalt-ui/      # Shared UI components
│   ├── defalt-sections/# Section definitions & settings
│   ├── defalt-rendering/# Handlebars preview engine
│   └── defalt-utils/   # Utilities, security, API
├── ghost/              # Ghost CMS Docker image
└── caddy-proxy/        # Reverse proxy config
```

## Deployment

### Railway (recommended)

Both Ghost and Dashboard deploy to Railway. See [dashboard/CLAUDE.md](dashboard/CLAUDE.md) for detailed deployment docs.

### Self-hosted

1. Build the dashboard: `npm run build:all`
2. Run with: `npm start`
3. Point at your Ghost instance via `VITE_GHOST_URL`

## Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes
4. Push and open a PR

## License

MIT - see [LICENSE](LICENSE)

## Links

- [Live Demo](https://defalt.org)
- [Ghost CMS](https://ghost.org)
