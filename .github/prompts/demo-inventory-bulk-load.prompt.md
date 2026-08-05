---
description: 'Complete Demo: Inventory Bulk-Load Admin Page with Vision and Agent Mode'
tools: ['search', 'edit', 'web','vscode/openSimpleBrowser', 'read', 'execute', 'azure-mcp-server/search', 'playwright/*', 'github/*']
---

# Demo: Inventory Bulk-Load Admin Page Implementation

> Slash command: `/demo-inventory-bulk-load`

## Context
This is a demo for GitHub Copilot Agent Mode and Vision capabilities. You are working with the OctoCAT Supply Chain Management System - a modern TypeScript web application with separate API and Frontend (React) projects.

## Current State
- The application has a Products page where users can view items
- There is NO inventory bulk-load functionality implemented yet
- There is no admin page for adding products in bulk

## Demo Goal
Implement a complete **Inventory Bulk-Load** admin page (backend/admin, no login — demo only) that lets an operator paste a **comma-delimited list of new products** and load them into the database in one step:
1. A dedicated admin/backend page with a large textarea to paste a comma-delimited list of product names
2. A "Bulk Load" action that parses the input and inserts rows via the existing repository/API pattern
3. A results/summary area showing counts: **added / skipped (duplicates) / errors**
4. Input validation (empty input, blank/whitespace entries, duplicate detection)
5. Consistent styling with the existing application (dark/light themes)

## Design Reference
Use the provided design mockup (`../../docs/design/inventory-bulk-load.svg`, rendered as `../../docs/design/inventory-bulk-load.png`) as the visual reference for implementation. The design shows:
- A page title and a short description
- A large "paste a comma-delimited list" textarea
- A "Bulk Load" button (plus a secondary "Clear")
- A results/summary area with added / skipped / error counts
- Consistent styling with the existing application

## Technical Requirements

### Architecture and Building
- Refer to the existing Architecture Doc (`../../docs/architecture.md`) for frontend + API structure
- Refer to the Build Doc (`../../docs/build.md`) for build instructions

### Implementation Specifications
1. **Bulk-import endpoint**: Add a `POST /api/products/bulk` route that accepts a list of product names, inserts new products via the existing `productsRepo` pattern, and returns a summary (`added`, `skipped`, `errors`). Use parameterized SQL — never build queries from the raw user-supplied string.
2. **Admin page**: A React page/route with the paste textarea, Bulk Load button, and results summary.
3. **Parsing**: Split the comma-delimited input, trim entries, drop blanks, and de-duplicate against existing product names.
4. **Integration**: Reuse the existing product model, repository, and API client patterns.

### Key Features to Implement
- Paste a comma-delimited list of product names
- Parse and validate the list (trim, drop blanks, detect duplicates)
- Insert new products via `POST /api/products/bulk`
- Show a success summary (count added / skipped / errors)
- Responsive design matching existing app style
- Works in both Dark and Light modes

## Success Criteria
After implementation, an operator should be able to:
1. Navigate to the inventory bulk-load admin page
2. Paste a comma-delimited list of product names
3. Click "Bulk Load" and have new products inserted into the database
4. See an accurate summary of how many were added, skipped, and errored
5. Re-run with duplicates and see them reported as skipped

## Implementation Instructions
1. Analyze the existing codebase structure (product model, `productsRepo`, product route, API client)
2. Add the `POST /api/products/bulk` endpoint with Swagger docs and unit tests
3. Create the bulk-load admin page component and route
4. Wire up parsing, validation, and the results summary
5. Style components to match the existing design system
6. Test the complete bulk-load workflow

## Notes
- Follow existing code patterns and styling conventions
- Maintain consistency with current navigation and routing
- Ensure responsive design and that styling works for both Dark and Light modes
- Handle edge cases (empty input, whitespace-only entries, duplicates)
- Treat the pasted list as untrusted user input — use parameterized queries to avoid SQL injection

Begin implementation by analyzing the current codebase structure and then proceed with the inventory bulk-load functionality development.
