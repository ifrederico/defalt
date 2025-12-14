# Agent Prompts for Codebase Audit

**Date:** December 13, 2025
**Purpose:** Deep architectural audit of the Defalt dashboard codebase

---

## Agent 1: defalt-sections

```
Deep architectural audit of defalt-sections module.

DO NOT just grep for patterns. Read files thoroughly, understand the architecture, trace data flow.

Investigate:
1. How section definitions (index.ts) relate to schemas (schema.ts) and defaults (defaults.ts)
2. What fields are duplicated across these files and why
3. How commonSettings.ts is (or isn't) being used
4. The relationship between Zod schemas and settingsSchema UI definitions
5. Whether sectionRegistry.ts enforces any consistency or just accepts whatever
6. Template sections vs utility sections - different patterns?
7. How block-based sections (announcement-bar) differ and if that creates confusion

Read the actual files. Trace actual data flow. Report specific file:line references for issues found.

This is for a major refactoring effort - be thorough and critical.
```

---

## Agent 2: defalt-rendering

```
Deep architectural audit of defalt-rendering module.

DO NOT just grep for patterns. Read files thoroughly, understand the architecture, trace data flow.

Investigate:
1. How does the rendering engine consume section configurations?
2. Where does it get padding/spacing values from? Multiple sources?
3. How does Handlebars template rendering work with section settings?
4. The custom-source folder - what transformations happen to section data?
5. Theme export - does it need to reconcile multiple config sources?
6. domManipulation.ts - what does it do and does it duplicate logic elsewhere?
7. Any hardcoded values that duplicate what's in sections?

Read the actual files. Trace actual data flow. Report specific file:line references for issues found.

This is for a major refactoring effort - be thorough and critical.
```

---

## Agent 3: defalt-app

```
Deep architectural audit of defalt-app module (React application layer).

DO NOT just grep for patterns. Read files thoroughly, understand the architecture, trace data flow.

Investigate:
1. Stores (uiStore, etc.) - what state is duplicated between stores?
2. Hooks - do they have their own defaults that might conflict with section defaults?
3. How does the sidebar/settings UI get its field definitions? Does it trust the schema or add its own logic?
4. Layout components - do they apply their own padding/spacing that might conflict?
5. How do components consume section settings vs editor-level settings?
6. Any state that exists in multiple places (component state + store + URL params)?
7. The relationship between useWorkspace and other hooks - any overlapping concerns?

Read the actual files. Trace actual data flow. Report specific file:line references for issues found.

This is for a major refactoring effort - be thorough and critical.
```

---

## Agent 4: defalt-ui

```
Deep architectural audit of defalt-ui module (UI primitives and components).

DO NOT just grep for patterns. Read files thoroughly, understand the architecture, trace data flow.

Investigate:
1. Do UI components have their own default values that duplicate section/schema defaults?
2. Range sliders, color pickers, etc. - do they have hardcoded min/max/step that should come from schema?
3. Are there multiple input components that do similar things?
4. How do primitives handle their own styling vs accepting style props?
5. Any component that "knows too much" about section-specific logic?
6. Shared vs duplicated patterns in component implementations
7. The relationship between primitives and the settings rendering system

Read the actual files. Trace actual data flow. Report specific file:line references for issues found.

This is for a major refactoring effort - be thorough and critical.
```

---

## Agent 5: Server & API

```
Deep architectural audit of server, API, and data flow layers.

DO NOT just grep for patterns. Read files thoroughly, understand the architecture, trace data flow.

Investigate:
1. server.ts and API routes - do they validate/transform section data? Do they have their own defaults?
2. Theme storage and retrieval - any normalization or defaults applied at this layer?
3. vite-plugin-theme-config.ts - what does it do? Does it duplicate configuration logic?
4. How does data flow from database → server → client → rendering?
5. Any middleware that modifies section configurations?
6. Export functionality - does it reconcile conflicting settings from different sources?
7. Environment config vs runtime config vs section config - clear boundaries?

Read the actual files. Trace actual data flow. Report specific file:line references for issues found.

This is for a major refactoring effort - be thorough and critical.
```

---

## Agent 6: Cross-Cutting Concerns

```
Deep architectural audit: Cross-cutting concerns and data flow across the entire dashboard codebase.

DO NOT just grep for patterns. Read files thoroughly, understand the architecture, trace data flow.

Investigate:
1. TypeScript types - are they consistent across modules or do different modules define their own versions?
2. How does a "setting" flow from schema definition → UI rendering → state storage → template rendering → export?
3. Where are defaults applied in this chain? Multiple places?
4. Shared utilities in lib/ folder - are they actually used or duplicated elsewhere?
5. The cn() utility - is it consistently used or do some files have their own class merging?
6. Error handling patterns - consistent or ad-hoc?
7. Any circular dependencies or tight coupling between modules that should be independent?
8. Configuration that lives in multiple places (package.json, vite config, env, runtime)

Read the actual files. Trace actual data flow. Report specific file:line references for issues found.

This is for a major refactoring effort - be thorough and critical.
```

---

## Key Instructions Given to All Agents

1. **"DO NOT just grep for patterns"** - Emphasized deep reading over surface-level pattern matching
2. **"Read the actual files"** - Required file reads, not just searches
3. **"Trace actual data flow"** - Understand how data moves, not just where it exists
4. **"Report specific file:line references"** - Concrete citations for findings
5. **"Be thorough and critical"** - Permission to find problems, not just describe architecture

---

## Results

All 6 agents ran in parallel and produced comprehensive reports that were synthesized into [audit-12-13.md](audit-12-13.md).
