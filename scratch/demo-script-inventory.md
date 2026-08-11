# Facilitator Demo Script — Inventory Bulk-Load Theme

> **Audience:** Workshop facilitator only (this file lives under `scratch/` and is demo-prep, not product docs).
>
> This runbook walks the **Inventory Bulk-Load** theme through all **12 modules** of the
> GitHub Copilot Immersive Experience, in order, mirroring
> <https://copilot-academy.github.io/workshops/immersive-experience>. The **hero feature** built
> live in Module 1 is an **admin/backend Inventory Bulk-Load page** (no login, demo only): paste a
> comma-delimited list of products → parse → insert → show a summary (added / skipped / errors).

## Pre-flight

- Build and test the baseline: `make build` and `make test` (both should pass).
- Open the Vision mockup for Module 1: `docs/design/inventory-bulk-load.svg`
  (rendered `docs/design/inventory-bulk-load.png`).
- Confirm the app runs (`make dev` / see `docs/build.md`).

---

## Module 1 — Feature Development (Planning, Agent, Vision)

- **Scenario:** Build the Inventory Bulk-Load admin page live from the new mockup.
- **Capabilities:** Agent Mode, Vision (design image → implementation), planning.
- **Run:**
  - Attach `docs/design/inventory-bulk-load.png` as the Vision reference.
  - Run the slash command **`/demo-inventory-bulk-load`** (file: `.github/prompts/demo-inventory-bulk-load.prompt.md`).
- **Success:** New admin page renders; pasting `Smart Feeder, Laser Toy, Heated Bed` inserts products
  via `POST /api/products/bulk` and shows a summary (added / skipped / errors). `make build` stays green.

## Module 2 — Test Coverage (Prompt Files, Self-Healing)

- **Scenario:** Raise API coverage on the product/supplier routes **and the new `POST /api/products/bulk` endpoint**.
- **Capabilities:** Prompt files, self-healing test loops.
- **Run:** **`/demo-unit-test-coverage`** (`.github/prompts/demo-unit-test-coverage.prompt.md`).
- **Success:** New/expanded route tests, including bulk-import cases (valid list, empty input,
  whitespace-only, duplicates, summary counts). `make test-api` passes; coverage climbs.

## Module 3 — Consistent Standards (Instructions, Handoffs, Skills)

- **Scenario:** Apply TAO observability to a Product/Supplier route; hand off a follow-up inventory feature.
- **Capabilities:** `.github/instructions/*.instructions.md`, `copilot-instructions.md`, handoff prompts, skills.
- **Run:** Reference `docs/tao.md`; run **`/handoff`** (`handoff.prompt.md`) or
  **`/handoff-to-copilot-coding-agent`** for a follow-up inventory task.
- **Success:** Changes follow repo instructions/conventions; a clean handoff issue/PR is produced.

## Module 4 — Delegate Tasks (Coding Agent, Mission Control, Custom Agents)

- **Scenario:** Delegate BDD tests and parallel design experimentation for the bulk-load feature.
- **Capabilities:** Coding Agent, Mission Control, custom agents (BDD Specialist, API Specialist).
- **Run:**
  - BDD Specialist agent (`.github/agents/bdd-specialist.agent.md`) → BDD tests for bulk-load.
  - Create a Coding Agent issue from `.github/prompts/demo-inventory-bulk-load.prompt.md` and assign to Copilot.
  - Run **`/demo-cca-parallel`** to spin up "Inventory Bulk-Load Experimentation" (3 parallel UX designs).
  - API Specialist agent for a backend inventory endpoint.
- **Success:** Parallel sub-issues assigned to Copilot; BDD/endpoint work returns as PRs.

## Module 5 — Code Review (Code Review Agent)

- **Scenario:** Review flow on the bulk-load feature branch.
- **Capabilities:** Code Review Agent.
- **Run:** Use branch `feature-add-inventory-bulk-load` (plus the existing `feature-add-tos-download`);
  request a review. (See `CONTRIBUTING.md` for the feature-branch workflow.)
- **Success:** Agent surfaces actionable review comments; iterate and resolve.

## Module 6 — Security (CodeQL, Secret Scanning, Code Quality)

- **Scenario:** The bulk-load parser is the perfect teaching moment for injection risk.
- **Capabilities:** CodeQL, secret scanning, code quality.
- **Run:** Show that parsing the **user-supplied comma-delimited list** and feeding it into SQL can
  trigger the CodeQL "database query built from user-controlled sources" (SQL injection) alert; fix
  with parameterized queries via the repository pattern.
- **Success:** CodeQL alert demonstrated and remediated; no secrets flagged.

## Module 7 — Legacy Code (Ask, Inline Chat, Refactoring)

- **Scenario:** Understand and refactor `suppliersRepo.ts` (unchanged legacy code); optionally point
  at the newly built bulk-load repo logic.
- **Capabilities:** Ask mode, Inline Chat, refactoring.
- **Run:** Ask Copilot to explain `api/src/repositories/suppliersRepo.ts`, then propose a refactor.
- **Success:** Clear explanation + a safe, minimal refactor with tests still green.

## Module 8 — Agent Skills (api-endpoint skill)

- **Scenario:** Generate an inventory-themed entity with one prompt.
- **Capabilities:** Agent Skills (`.github/skills/api-endpoint/`).
- **Run:** Ask Copilot to "add a new API endpoint for a `StockLocation` (or `InventoryAdjustment`) entity";
  the api-endpoint skill scaffolds model + repo + route + Swagger + seed + tests.
- **Success:** Full CRUD slice generated for the inventory entity; `make build` and `make test-api` pass.

## Module 9 — End-to-End Tests (Playwright MCP)

- **Scenario:** E2E for the bulk-load flow (replaces the old cart-badge test).
- **Capabilities:** Playwright MCP, BDD Specialist agent.
- **Run:** Author `frontend/tests/features/inventory-bulk-load.feature` and
  `frontend/tests/e2e/inventory-bulk-load.spec.ts`: paste list → submit → verify products/counts.
- **Success:** `make test-e2e` passes for the bulk-load journey.

## Module 10 — Spec-Driven Development (Spec Kit)

- **Scenario:** Reframe the Spec Kit example to an inventory-adjacent feature.
- **Capabilities:** Spec Kit.
- **Run:** Drive a spec for **Stock Replenishment** or **Inventory Reconciliation** (spec → plan → tasks → implement).
- **Success:** A spec produces a scoped, testable plan for the inventory feature.

## Module 11 — Governance with Hooks

- **Scenario:** Checkpoint-commit hooks guard the inventory work (hooks themselves unchanged).
- **Capabilities:** Hooks (`.github/hooks/hooks.json`, `.github/hooks/checkpoint-commit.sh`).
- **Run:** Make an inventory change and show the checkpoint-commit hook firing.
- **Success:** Hook runs on the inventory work as expected.

## Module 12 — Agentic Workflows

- **Scenario:** Automated workflows narrated around the inventory work (workflows unchanged).
- **Capabilities:** auto-analyze-failures, daily summary, multi-device tester
  (`.github/agents/agentic-workflows.agent.md`).
- **Run:** Trigger the relevant agentic workflow(s) referencing the inventory feature/PRs.
- **Success:** Workflows execute and report against the inventory work.

---

## Finale — The Secret Wheel of Names (do NOT commit)

- **Scenario:** The facilitator has (secretly, earlier) bulk-loaded **participant names as "inventory."**
  Now reveal a **Wheel of Names**-style random winner picker.
- **Run:** Live-run **`scratch/spin-wheel-reveal.prompt.md`** to build a spinning wheel on its own
  unlinked route that reads the current product/inventory names, spins with easing, and announces a winner.
- **Guardrails:** Build it live for the surprise, then **discard/revert** the generated implementation —
  it must **never** be committed. Only the prompt file is delivered.
- **Success:** Wheel renders, spins, and randomly selects a winner in the existing React + Vite +
  Tailwind stack (dark/light themes).
