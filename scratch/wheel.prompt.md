---
description: 'Secret finale: build a Wheel of Names-style random winner picker from inventory/product names'
tools: ['search', 'edit', 'read', 'execute', 'playwright/*']
---

# Facilitator Finale: Wheel of Names Winner Picker

> **Facilitator-only, surprise finale.** Run this prompt **live** to build a spinning "Wheel of
> Names"-style picker (à la <https://wheelofnames.com>). Earlier in the demo, the facilitator
> secretly bulk-loads participant names as "inventory" using the Inventory Bulk-Load page. This
> wheel reads those names and randomly selects a winner.
>
> ⚠️ **Do NOT commit the generated wheel implementation.** Build it live, demo it, then revert.
> Only this prompt file is kept in source control (under `scratch/`).

## Context

You are working with the OctoCAT Supply Chain Management System — a TypeScript app with a React +
Vite + Tailwind frontend (`frontend/`) and an Express + SQLite API (`api/`). Products/inventory are
served by the product API and rendered from `frontend/src/components/entity/product/Products.tsx`.
Routing lives in `frontend/src/App.tsx` (`react-router-dom`), theming in
`frontend/src/context/ThemeContext.tsx`, and API base config in `frontend/src/api/config.ts`.

## Goal

Build a **spinning wheel winner picker** that:

1. **Reads current inventory/product names from the DB** — fetch the product list from the existing
   product API (the participant names bulk-loaded earlier) and use each product name as a wheel segment.
2. **Renders the names as segments** on a circular wheel (SVG or Canvas), each segment a different color,
   evenly distributed, with the name labeled on the segment.
3. **Spins with easing** — clicking "Spin" rotates the wheel with a smooth ease-out over ~4–6 seconds,
   landing on a **randomly selected** segment.
4. **Announces the winner** — clearly display the selected name (e.g., a modal or highlighted banner)
   when the wheel stops.
5. **Fits the existing stack and themes** — React + Vite + Tailwind, works in both dark and light modes,
   matching the app's visual style (use `ThemeContext`).
6. **Lives on its own route/page** that is **NOT linked in the nav** (to preserve the surprise) — e.g.
   add a `Route path="/wheel"` in `frontend/src/App.tsx` pointing at a new `Wheel` component, but do not
   add a NavBar/Footer link.

## Implementation Guidance

- Create a self-contained component (e.g. `frontend/src/components/wheel/Wheel.tsx`) and register only
  the route (no nav link).
- Fetch names via the existing product API client / `api/config.ts` base URL; handle empty state
  ("bulk-load some inventory first").
- Ensure random selection is uniform and the visual landing segment matches the announced winner.
- Keep it accessible: focusable "Spin" button, `aria-live` region for the winner announcement.
- Add a brief "Spin Again" affordance to reset.

## Success Criteria

- `make build` (and `cd frontend && npm run build`) passes.
- Navigating to `/wheel` renders a wheel populated with the current product/inventory names.
- Clicking "Spin" animates with easing and lands on a random segment.
- The winning name is clearly announced and matches the segment the wheel stops on.
- The page is not reachable from the nav.

## After the demo (REQUIRED)

Revert every file this prompt created or modified (component, route registration, any assets) so that
**none of the wheel implementation is committed**. Verify with `git status` that the working tree is
clean apart from this prompt file.
