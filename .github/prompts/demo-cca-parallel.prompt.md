---
description: 'Use Coding Agent to test multiple paths - in parallel!'
tools: ['search', 'edit', 'web','vscode/openSimpleBrowser', 'read', 'execute', 'azure-mcp-server/search', 'playwright/*', 'github/*']
---

# Demo: Use Coding Agent to test multiple paths - in parallel!

## Context
This is a demo for GitHub Copilot Coding Agent. Experimentation can be hard, expensive and take a long time. This demo shows how to use the Coding Agent to test multiple paths in parallel, allowing you to explore different solutions and approaches quickly.

## Current State
- The application has a Products page where users can view items
- There is NO inventory bulk-load functionality implemented yet
- There is no admin page for adding products in bulk

## Demo Goal
Explore three different **visual/UX design approaches** for an **Inventory Bulk-Load** admin page (backend/admin, no login — demo only) where an operator pastes a comma-delimited list of new products and loads them into the database, then sees a summary (added / skipped / errors).

## Instructions
1. First analyze the repo and use the instructions/context below to create a high-level plan for the implementation.
2. Create 3 different VISUAL/UX design approaches for the Inventory Bulk-Load page. Suggested directions:
   1. **Simple textarea** — one large paste box + Bulk Load button + summary line.
   2. **CSV-style table preview** — parse the pasted list into an editable table preview before committing.
   3. **Drag-and-drop file + paste** — accept a dropped `.csv`/`.txt` file or pasted text, with a preview.
   All three parse a comma-delimited list and call the same bulk-import endpoint (`POST /api/products/bulk`); they differ only in the page's structure and interaction. Do not modify other pages.
3. Summarize the designs in a sentence or two each.
4. Create an Epic issue in the GitHub repository called "Inventory Bulk-Load Experimentation".
5. For each design, create a separate sub-issue in the Epic issue.
6. Assign the Copilot Agent to each sub-issue to implement the design in parallel.

### Frontend Architecture and Building
- Refer to the existing Architecture Doc (../docs/architecture.md) for frontend structure
- Refer to the Build Doc (../docs/build.md) for build instructions

### Implementation Specifications
1. **Bulk-import endpoint**: All approaches call `POST /api/products/bulk`, inserting products via the existing `productsRepo` pattern with parameterized SQL.
2. **Parsing**: Split on commas, trim entries, drop blanks, de-duplicate against existing product names.
3. **Results summary**: Show counts for added / skipped (duplicate) / errors.
4. **Integration**: Reuse the existing product model, repository, and API client patterns.

### Key Features to Implement
- Paste (or drop) a comma-delimited list of product names
- Parse and validate the list (trim, drop blanks, detect duplicates)
- Insert new products via `POST /api/products/bulk`
- Show a results/summary area with added / skipped / error counts
- Responsive design matching existing app style

## Success Criteria
After implementation, an operator should be able to:
1. Navigate to the inventory bulk-load admin page
2. Paste (or drop) a comma-delimited list of product names
3. Bulk-load new products into the database
4. See an accurate summary of added / skipped / errored products
5. Re-run with duplicates and see them reported as skipped

## Implementation Instructions
1. Analyze the existing codebase structure
2. Build the `POST /api/products/bulk` endpoint (shared by all approaches)
3. Create the bulk-load admin page for each design approach
4. Wire up parsing, validation, and the results summary
5. Style components to match existing design system
6. Test the complete bulk-load workflow

## Notes
- Follow existing code patterns and styling conventions
- Maintain consistency with current navigation and routing
- Ensure responsive design
- Ensure styling works for both Dark and Light modes
- Handle edge cases (empty input, whitespace-only entries, duplicates)
- Treat the pasted list as untrusted user input — use parameterized queries to avoid SQL injection
