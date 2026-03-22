# CLAUDE.md — BSB RFP Workbook

## Project Overview

An internal RFP (Request for Proposal) response workbook for **Brim Financial** responding to **Bangor Savings Bank's** credit card program RFP. The app provides a spreadsheet-like grid for reviewing, editing, and AI-rewriting RFP question responses, along with analytics dashboards and writing-rule management.

- **App title**: BSB RFP Workbook
- **Data source**: Static JSON file at `public/rfp_data.json` loaded at runtime via fetch

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.1 (App Router, Turbopack dev) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19.2.4 |
| Styling | Tailwind CSS 4 (PostCSS plugin) |
| Fonts | Geist Sans + Geist Mono via `next/font/google` |
| AI | Anthropic SDK (`@anthropic-ai/sdk` ^0.80.0), Claude claude-sonnet-4-20250514 |
| Linting | ESLint 9 with `eslint-config-next` |

## Project Structure

```
rfp-viewer/
├── public/
│   └── rfp_data.json          # RFP questions dataset (loaded client-side)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── rewrite/
│   │   │       └── route.ts   # POST /api/rewrite — AI rewrite endpoint
│   │   ├── globals.css        # Tailwind import + CSS custom properties
│   │   ├── layout.tsx         # Root layout (Geist fonts, metadata)
│   │   └── page.tsx           # Main page — all state, filters, orchestration
│   ├── components/
│   │   ├── GridView.tsx       # Editable spreadsheet table with inline editing
│   │   ├── ContextView.tsx    # Analytics dashboard (stats, risk scores, section cards)
│   │   ├── DetailPanel.tsx    # Slide-over panel for single question editing + AI rewrite
│   │   └── RulesPanel.tsx     # Slide-over panel for global/section writing rules
│   └── types.ts               # TypeScript interfaces (Question, RFPData, RFPStats, ViewTab)
├── next.config.ts             # Next.js config (default, no custom options)
├── tsconfig.json              # TS config with @/* path alias to ./src/*
├── postcss.config.mjs
├── eslint.config.mjs
└── package.json
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Key Architecture Decisions

### Single-page client app
The entire app is a single `"use client"` page (`src/app/page.tsx`) that owns all state. There is no server-side rendering of the main UI. Data is fetched client-side from `public/rfp_data.json`.

### localStorage persistence
All edits, cell history, global rules, and version snapshots are persisted to `localStorage` under keys: `rfp-edits`, `rfp-cell-history`, `rfp-global-rules`, `rfp-versions`. There is no database. Cmd+S triggers a manual save.

### AI rewrite via API route
`POST /api/rewrite` accepts a question object, a field name (`bullet` or `paragraph`), and global rules. It calls the Anthropic SDK with Claude claude-sonnet-4-20250514 to produce a strengthened response. The prompt is hard-coded in the route handler and includes the question's category, topic, requirement, current response, confidence level, committee score, and risk assessment.

### Cell history tracking
Every edit (human or AI) is appended to a `CellHistory` map keyed by `{ref}:{field}`. This enables per-field edit counts shown in the detail panel.

### Version snapshots
Users can save named version snapshots. Each snapshot deep-clones the full `RFPData` with a timestamp. Versions are stored in localStorage.

### Slide-over panels
`DetailPanel` and `RulesPanel` render as absolutely positioned overlays on the right side of the screen (z-20/z-30), not routed pages.

## Data Model

The core data type is `Question` (defined in `src/types.ts`) with fields including:
- `ref`, `category`, `number`, `topic`, `requirement` — question identity
- `bullet`, `paragraph` — two response formats
- `confidence` (GREEN/YELLOW/RED), `compliant` (Y/N/Partial) — status
- `a_oob`, `b_config`, `c_custom`, `d_dnm` — delivery method booleans
- `committee_score` (1-10), `committee_review`, `committee_risk` — risk assessment
- `strategic`, `reg_enable` — boolean flags

`RFPData` wraps `categories: string[]`, `questions: Question[]`, and `stats: RFPStats`.

## Conventions

- **Path alias**: `@/*` maps to `./src/*`
- **Components**: All components are `"use client"` with props interfaces defined inline in the same file
- **Styling**: Tailwind utility classes exclusively; no CSS modules or styled-components
- **State management**: React `useState`/`useCallback`/`useMemo` in the page component; no external state library
- **API routes**: Next.js App Router route handlers (`route.ts` with named exports like `POST`)
- **Exports**: Default exports for page and components; named exports for types
- **Env requirement**: `ANTHROPIC_API_KEY` must be set for the AI rewrite endpoint (used implicitly by the Anthropic SDK)

## AGENTS.md

The referenced `AGENTS.md` contains a warning that this project uses a newer version of Next.js with breaking changes. Consult `node_modules/next/dist/docs/` before writing code that touches Next.js APIs.
