# ◇ Defalt

## https://defalt.org

## A visual theme editor for Ghost
### Drag, drop, customize. Export when ready.

Defalt lets you customize the Ghost Source theme without touching code. See your changes live, rearrange sections, tweak colors, and download a ready-to-upload theme when you're done.

## What you can do

- See changes instantly in a live preview
- Drag sections around to reorder them
- Show or hide sections per page type
- Write custom CSS (we'll tell you if something's wrong)
- Export a ZIP and upload it to Ghost

## Contributions

Not accepting contributions right now. Check back later!

## Can I self-host this?

Defalt is built as a platform, not a standalone tool. It runs alongside Ghost and uses Ghost's member authentication.

For local development:

```bash
cd dashboard
bun install
cp .env.example .env
bun run dev
```

Set `VITE_DEV_BYPASS_AUTH=true` in `.env` to skip auth during development.

## License

MIT
