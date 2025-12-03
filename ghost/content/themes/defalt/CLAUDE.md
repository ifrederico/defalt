# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ghost theme called "defalt" (based on Source theme). Uses Handlebars templating, Gulp build system, and PostCSS for CSS processing.

## Commands

```bash
yarn install         # Install dependencies
yarn dev             # Build + watch + livereload
yarn zip             # Build and package theme to dist/defalt.zip
yarn test            # Run gscan theme validator
yarn test:ci         # Run gscan with --fatal --verbose
npx gulp build       # Build CSS/JS only (no watch)
```

## Architecture

**Templates** (Handlebars):
- `default.hbs` - Base layout (includes navigation, footer)
- `home.hbs` - Homepage
- `index.hbs` - Post listing
- `post.hbs`, `page.hbs`, `tag.hbs`, `author.hbs` - Content templates
- `page-*.hbs` - Custom page templates (e.g., `page-changelog.hbs`)

**Partials** (`partials/`):
- `components/` - Header, footer, navigation, post-list, CTA
- `icons/` - SVG icons (use `{{> "icons/name"}}`)
- `typography/` - Font definitions
- `sections/` - Page sections

**Assets**:
- `assets/css/screen.css` - Main CSS entry point (PostCSS)
- `assets/js/` - JS files concatenated to `assets/built/source.js`
- `assets/built/` - Compiled output (gitignored)

**Theme Configuration** (`package.json` → `config.custom`):
- Navigation layout, colors, fonts, header styles
- Post feed settings, metadata display options

## Ghost Theme Notes

- Ghost's Handlebars helpers: https://ghost.org/docs/themes/
- Custom settings defined in `package.json` under `config.custom`
- SVG icons are Handlebars partials: `{{> "icons/search"}}`

# Instructions
- Be blunt and minimal. No narrative about your process or shifting approach.
- Prioritize correctness over speed. Slow and accurate > fast and wrong.
- After plans or code, include a short checklist of requirements and mark what is done.
- Before coding, restate task in 2–4 bullets; ask questions instead of guessing.

## Before Making Changes
- Search for ALL files that may need the same change (use Grep/Glob)
- List affected files before editing
- Verify completeness after edits


# GitHub Instructions

- Your primary method for interacting with GitHub should be the GitHub CLI.

## Git

- When creating branches, prefix them with frederico/ to indicate they came from me.

## Plans

- At the end of each plan, give me a list of unresolved questions to answer, if any. Be blunt and minimal. No narrative about your process or shifting approach.