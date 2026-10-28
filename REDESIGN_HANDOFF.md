# Alfurqan Pay — redesign and refactoring handoff

Written: 28 October 2026. Project: `/home/spectre/Documents/Works/ranta/alfurqan-pay`.

## Current status — ready for manual testing (28 October 2026)

The user has asked to conclude implementation and stop automated testing. The redesign changes are in the working tree and ready for manual review. The historical checkpoint below describes the earlier interruption and is superseded by this status.

- Receipt, settings, and report views now use focused presentation sections around their controllers.
- Dashboard, sign-in, navigation, mobile dialogs, search, statuses, loading/error feedback, and public verification have been updated. The global receipt action opens the form across routes.
- Server extraction was reviewed: 39 declarations retain their original behavior after accounting for the shared billing parser; transaction locks are preserved.
- TypeScript and all 28 isolated financial/parser tests passed. The production build passed with Webpack. Default Turbopack build encountered an environment port restriction.
- Earlier fixture browser passes covered core pages, mobile layouts, duplicate override, nested dialogs, and receipt submission. The final expanded browser run was interrupted before its completion was collected; do not count it as a completed final pass. No more automated checks are requested.
- Full lint reports seven existing import errors in backup/restore scripts and 20 warnings; source lint has no errors.
- No database patches, migrations, seeds, production-data edits, commits, or deployment were performed. Printable receipt geometry and financial rules remain unchanged.
- The preview on port 3100 is being restarted with the project’s normal environment for the user’s manual testing. The earlier fixture-only server used an unreachable database.

## Historical checkpoint: stop point and how to use this document

**Implementation stopped at the user's explicit request. The redesign is incomplete and has not been approved for deployment.** The latest work after that request is this handoff and an update to the task list. Do not interpret this document as an instruction to resume before the user asks.

The execution checklist is [todolist.md](./todolist.md). Read it alongside this document: the checklist records the intended scope; this document explains the actual working-tree state, partially completed work, verification, and restart order. Most checklist items intentionally remain unchecked because implementation or verification is still incomplete.

No commit or deployment was made during this redesign. The changes are in the working tree, including important **untracked source files**. Preserve those files when transferring the project or preparing a commit. The large deletion shown in `src/lib/data-store.ts` is primarily code moved into new services, not a request to remove backend functionality.

## User requirements and boundaries

The user wants a professional, clean interface, simpler staff-facing language, less redundant code, and a careful separation of logic from presentation. They explicitly asked to work through the whole application using [redesign-skill/SKILL.md](./redesign-skill/SKILL.md).

- Preserve existing features and the overall structure unless a necessary improvement requires a change.
- Retain the current palette: primary green `#075E54`, supporting green `#128C7E`, amber `#FFB21D`, slate, and white. Existing semantic status colors can remain.
- This application already serves production. Do not wipe, reset, seed, or casually modify the database.
- This redesign does not authorize schema changes, financial-rule changes, authentication-policy changes, production-data edits, or deployment.
- Preserve receipt printing, all three formats, PDF, sharing, verification, exports, student administration, settings, staff administration, and allocation behavior.
- Simplify wording in the interface without changing persisted enums, API contracts, business rules, or receipt records.

The skill has been read and applied. Its generic visual recommendations are subordinate to the user's palette, structure, and feature requirements. Do not introduce a replacement framework, unrelated palette, or unnecessary new icon library. Follow repository `AGENTS.md` too; it specifically calls attention to the installed Next.js version and its local documentation.

## Stack and operating context

- Next.js 16.3.8, React 19.2.8, TypeScript 5, Tailwind CSS 4.
- Prisma 6.19.3 with PostgreSQL.
- Existing integrations include Lucide icons, jsPDF, html2canvas-pro, XLSX, QR codes, and canvas-confetti.
- No application dependency was added during this redesign.
- The installed Next CSS guide was read at `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`.
- Workspace shell is Bash. Writable project root is under `/home/spectre/Documents/Works/ranta`.

## Earlier payment fixes: baseline to preserve

These payment changes existed in HEAD before the redesign began. They are not unfinished redesign edits, and must not be reverted while cleaning up the interface.

1. The only previous-term debt option is **Debt (Previous Term)**, with stored name `Previous Term Debt`. Do not reintroduce `3T Debt`.
2. Student receipts have a separate payment-period selector, visible before selecting a student. The options are `1st Term`, `2nd Term`, `3rd Term`, and `Whole Session` for the current academic session.
3. Tuition must be cleared by tuition payments, not the total receipt amount. Textbooks, notebooks, uniform, sportswear, and previous-term debt must not cover an unpaid tuition balance.
4. The user's example is a useful regression case: Maryam is an SR student with tuition due ₦30,000. Her receipt contains textbooks ₦19,000, notebooks ₦8,000, uniform ₦18,000, tuition ₦16,500, and previous-term debt ₦2,500. Total paid is ₦64,000, but tuition remains **partial**, with ₦13,500 unpaid.
5. A future-term payment must not clear the current term. Whole-session tuition covers three term bills using configured fees, allocating to outstanding terms in order. Material charges are not multiplied across all terms; they are counted once for the active term under the existing rules.
6. Per-line payment-period allocation and charge/balance snapshots support correct receipt display and void recalculation. Receipt creation and voiding share a PostgreSQL advisory transaction lock; keep this concurrency protection.

Relevant baseline modules are [fee-ledger.ts](./src/lib/fee-ledger.ts), [payment-period.ts](./src/lib/payment-period.ts), their test files, and [student-importer.ts](./src/lib/student-importer.ts).

The existing nullable `ReceiptItem` fields are `chargeAmount`, `chargeBalance`, and `paymentTerm`. Earlier additive SQL patches and instructions are in:

- [Receipt charge snapshots patch](./prisma/patches/20261028_receipt_item_charge_snapshots.sql).
- [Payment-term patch](./prisma/patches/20261028_receipt_item_payment_term.sql).
- [Payment allocation rollout notes](./docs/payment-allocation-rollout.md).

Earlier attempts by the agent to apply database patches failed because of connection/DNS/certificate issues. No successful patch application by the agent was established. The user was given commands and may have run them independently; **the actual production patch status is unknown**. Do not infer database state from these source files. No database commands were run as part of this redesign.

## Work implemented so far

### Global styling and font foundation — partial

[globals.css](./src/app/globals.css) now defines the existing brand colors as shared tokens and introduces reusable page, panel, button, field, feedback/loading, and skip-link styles. Base font size changed from 17px to 16px. Focus outlines, disabled controls, transitions, responsive padding, mobile input sizing, and reduced-motion support were added. Existing receipt print CSS was retained.

[layout.tsx](./src/app/layout.tsx) now loads local Geist through `next/font/local` instead of remotely loading Google Inter. The font is at [geist-latin.woff2](./src/assets/fonts/geist-latin.woff2), copied from the installed Next devtools assets. [The font README](./src/assets/fonts/README.md) records provenance and licensing notes. It was not downloaded as a new project dependency. Review provenance/licensing if preparing distribution.

Metadata was simplified to `Alfurqan Pay | School accounts`. Provider behavior was preserved.

Shared presentation components were added:

| File | Purpose | Integration status |
| --- | --- | --- |
| [feedback.tsx](./src/components/ui/feedback.tsx) | Inline notices, empty states, loading rows | Available; not consistently integrated |
| [page-header.tsx](./src/components/ui/page-header.tsx) | Consistent page heading/actions | Available; broader integration pending |
| [payment-status.tsx](./src/components/ui/payment-status.tsx) | Shared status wording and badge | Available; broader integration pending |
| [dialog.tsx](./src/components/ui/dialog.tsx) | Dialog semantics, focus trap, Escape, scroll lock, focus restoration | Used by mobile navigation only so far |

The dialog still needs real keyboard and nested-dialog testing. In particular, review nested body-scroll restoration and topmost-dialog handling before adopting it everywhere.

### Broad visual token cleanup — partial, ne

eds inspection

Application pages and existing components received an initial utility-class cleanup: very heavy text became semibold, large radii and shadows were reduced, uppercase label styling was removed, tracking was normalized, hover scaling was reduced, and viewport sizing uses dynamic viewport units where applicable.

This was a broad mechanical pass, **not a completed visual redesign**. Original layouts, gradients, technical text, and nested cards still exist in several screens. Inspect for malformed or redundant utility classes. One substring replacement temporarily produced `group- transition...`; that specific pattern was repaired, but the remaining class lists have not had a complete visual audit.

`ReceiptDocument.tsx` was deliberately excluded from this pass. Keep receipt print geometry isolated from application design changes.

### Application shell — implemented, browser verification pending

[SidebarLayout.tsx](./src/components/layout/SidebarLayout.tsx) was rewritten around one shared navigation renderer for desktop and mobile. It retains collapse, mobile drawer, school identity, current term, user details, logout, and the issue-receipt action. Navigation destinations remain `/`, `/receipts`, `/reports`, `/students`, and `/settings`.

The header and sidebar use restrained white/green surfaces, amber actions, clearer active links, accessible button names, `aria-current`, a skip link, and a shared dialog for the mobile drawer. The hidden desktop sidebar is made inert.

**Known unresolved behavior to investigate:** the shell's fallback issue action navigates to `/?action=issue`, but the dashboard was observed not to consume that query parameter. This is a pre-existing integration issue identified during review, not fixed yet. Verify that issuing a receipt from every page actually opens the modal before marking shell work complete.

Login and `AuthGuard` received token changes only. Login still needs a deliberate visual cleanup; `AuthGuard` still has technical loading copy such as “Checking Accounts Credentials...”.

### Backend service separation — implemented, regression review pending

[data-store.ts](./src/lib/data-store.ts) is now a small compatibility facade that re-exports focused modules and retains compatibility `readDB()` / `writeDB()` functions. Existing consumers can continue importing from the same path.

| New module | Responsibility |
| --- | --- |
| [config.ts](./src/server/config.ts) | Existing defaults and session-code formatting |
| [formatters.ts](./src/server/formatters.ts) | Student, receipt, school, and staff record formatting |
| [billing-config.ts](./src/server/billing-config.ts) | Shared compatibility parser for fee structure and concessions |
| [receipt-service.ts](./src/server/receipt-service.ts) | Receipt queries, duplicate checks, creation, voiding, input types |
| [student-service.ts](./src/server/student-service.ts) | Student queries, CRUD, import, and promotion |
| [settings-service.ts](./src/server/settings-service.ts) | School settings and existing recalculation behavior |
| [report-service.ts](./src/server/report-service.ts) | Report retrieval |
| [staff-service.ts](./src/server/staff-service.ts) | Existing staff and authentication operations |

The move used TypeScript AST declaration extraction to retain existing function bodies. The billing parser consolidates three duplicated parsers used by creation, voiding, and student editing, preserving existing fallback semantics. It still needs regression verification, especially malformed JSON/default/concession behavior.

The extraction copied more imports than necessary. **Unused imports and dependency boundaries still need cleanup.** Some config/formatter modules currently have broad imports from the old file. Do not treat `src/server/config.ts` as a clean client-safe defaults module yet. A pure shared defaults module was considered but was not created.

Do not restore the old monolith merely because its tracked diff looks like a large deletion. The new service files are currently untracked and contain the moved functionality.

### Frontend controllers — implemented, presentation split incomplete

State, requests, actions, and calculations were extracted into these hooks:

| Controller | Current consumer |
| --- | --- |
| [useDashboard.tsx](./src/features/dashboard/useDashboard.tsx) | Dashboard |
| [useReceiptForm.tsx](./src/features/receipts/useReceiptForm.tsx) | Receipt modal |
| [useReceiptsPage.tsx](./src/features/receipts/useReceiptsPage.tsx) | Receipt list |
| [useStudentsPage.tsx](./src/features/students/useStudentsPage.tsx) | Student list |
| [useSettingsForm.tsx](./src/features/settings/useSettingsForm.tsx) | Settings |
| [useReport.tsx](./src/features/reports/useReport.tsx) | Reports |

[fee-options.ts](./src/features/receipts/fee-options.ts) centralizes existing receipt fee presets, retaining compatibility exports from the modal and the sole previous-term-debt choice.

The existing views now call these hooks and render their existing JSX with the initial styling changes. This is only the first separation step: `ReceiptModal.tsx` remains roughly 878 lines, settings roughly 1,559 lines, and reports roughly 501 lines at this checkpoint. They still need focused presentation components.

Specific rough edges:

- Hooks and views retain broad unused imports from extraction.
- `useReport` still contains a JSX bank-badge renderer and export logic. Move presentation to a component and exports to helpers deliberately.
- Settings still combines all form areas in one controller and uses native alerts/confirmations.
- The receipt controller exposes a large binding set, and its callback typing still includes `any`.
- Closed receipt-modal calculations now execute within the hook before the view returns `null`; hooks remain unconditional. Verify closed/open lifecycle and request guards.
- Dashboard/report privacy storage is still duplicated. No shared privacy hook exists yet.
- No shared API-resource abstraction or stale-response guards were added.
- Student search accessibility and request races are not resolved.
- Most new feedback/status/header components are not wired into the pages yet.
- Student dialogs still need consistent feedback and accessibility. Preserve delete/promotion/import safeguards when replacing native dialogs.
- The dashboard still has its original decorative hero/gradient structure.
- No custom not-found page was added.

An initial extraction script had an AST traversal bug that generated empty hook bindings and TypeScript errors. That bug was repaired, correct binding sets were regenerated, and the subsequent full TypeScript check passed. The earlier extraction errors are not the current state.

## Working-tree inventory and preservation

Tracked modifications currently include:

```text
src/app/globals.css
src/app/layout.tsx
src/app/login/page.tsx
src/app/page.tsx
src/app/receipts/[id]/page.tsx
src/app/receipts/page.tsx
src/app/reports/page.tsx
src/app/settings/page.tsx
src/app/students/page.tsx
src/app/verify/[receiptNumber]/page.tsx
src/components/auth/AuthGuard.tsx
src/components/dashboard/QuickStudentSearch.tsx
src/components/layout/SidebarLayout.tsx
src/components/receipts/ReceiptModal.tsx
src/components/students/AddStudentModal.tsx
src/components/students/DatabaseImportModal.tsx
src/components/students/EditStudentModal.tsx
src/components/students/SessionPromotionModal.tsx
src/lib/data-store.ts
```

New/untracked content includes `src/assets/`, `src/components/ui/`, `src/features/`, `src/server/`, `todolist.md`, and this handoff. The user-provided `redesign-skill/` was already untracked before this work. `pos80-driver` already had nested/untracked changes before this redesign; leave it alone.

At the checkpoint, the tracked diff was approximately 519 insertions and 3,732 deletions, **excluding the new untracked modules**. That number is misleading unless those new files are included in review.

A read-only diff check showed no redesign modifications under `prisma`, `src/app/api`, or to `src/lib/fee-ledger.ts`, `src/lib/payment-period.ts`, `src/lib/student-importer.ts`, and `src/lib/types.ts`.

## Validation: established facts and missing checks

| Check | Actual status |
| --- | --- |
| `./node_modules/.bin/tsc --noEmit` | Passed after foundation/shell changes, service extraction, parser consolidation, and finally controller extraction/repair |
| Financial regression tests | 23 passed before this redesign; not rerun after these refactors |
| ESLint | Before redesign: 109 findings, including 21 errors and 88 warnings; not rerun after current edits |
| Production build | Not run during this redesign |
| Browser/mobile/keyboard checks | Not run |
| Print/PDF/share/export regression checks | Not run during this redesign |
| Database/schema/migration/seed operations | None during redesign |
| Production deployment | None |

Do not claim the redesign is feature-complete, browser-verified, lint-clean, or production-ready. Type checking passing establishes compilation compatibility, not complete behavioral preservation. Existing lint findings included unused imports, hook rules, script `require` imports, and unescaped text; clean relevant problems without disabling rules wholesale.

## Temporary browser tooling and processes

No browser automation connector was available. Playwright was installed outside the project with:

```sh
npm install --prefix /tmp/alfurqan-redesign-browser playwright --no-save --no-audit --no-fund
```

The planned Chromium install was:

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/alfurqan-redesign-browser/browsers \
  node /tmp/alfurqan-redesign-browser/node_modules/playwright/cli.js install chromium
```

The first download failed with DNS resolution inside the sandbox. An approved retry outside the sandbox progressed to about 40% of 191.1 MiB before the user interrupted. Its last tool session ID was `20048`. At inspection, the browser directory contained `.links/` and `__dirlock/`, with no confirmed completed Chromium installation. A sandbox process listing did not show an active Next/Playwright/TypeScript process, but that does not conclusively establish the state of an escalated process. Check before restarting; do not assume the browser is installed or blindly delete locks belonging to a live process.

No local Next dev server was started, no browser fixture script was created, and no application browser navigation occurred during this redesign.

Temporary extraction scripts exist in `/tmp`:

- `/tmp/alfurqan-split-services.cjs`
- `/tmp/alfurqan-extract-controllers.cjs`
- `/tmp/alfurqan-repair-controller-bindings.cjs`

They have already been run. **Do not rerun the original extraction scripts on the already-extracted sources.** They expected the previous monolith/views. The current repository files are the source of truth; temporary files may not survive another environment.

## Resume sequence when the user authorizes continuation

1. Read this document, [todolist.md](./todolist.md), the [redesign skill](./redesign-skill/SKILL.md), and repository guidance. Inspect `git status`, tracked diffs, and all new source directories. Preserve unrelated work and do not reset the tree.
2. Re-establish the local baseline with TypeScript and the isolated existing financial tests. Inspect test scripts before running them; avoid anything that connects to production, resets data, seeds, or applies migrations.
3. Review service extraction against HEAD, checking exported functions/types/defaults, formatter behavior, transaction boundaries, locks, parser fallback behavior, and import cycles. Remove unused imports and organize dependencies in new modules and controllers. Do not make financial-policy changes as part of cleanup.
4. Finish the receipt workflow first: split student selection, item editing, period selection/summary, payment details, and duplicate confirmation into presentation components around the controller. Preserve external payer behavior, every preset/custom option, debt, payer/date/bank/method, duplicate override, and the always-visible term/session control.
5. Finish dashboard and list hierarchy with shared headings, controls, readable tables, restrained summaries, and real loading/error/empty states. Resolve the global issue-action query integration. Keep search, privacy, enrollment, and import entry points.
6. Apply shared dialog and form patterns to enrollment/edit/import/promotion. Verify Escape, focus, scroll, busy states, validation, and destructive confirmations, including nested dialogs.
7. Split settings into identity, banks, fee schedule/concessions/history, receipt preferences, and staff sections. Keep every existing setting and save/history/staff action. Split reports into filters, summary/table, bank presentation, and export helpers. Consolidate privacy handling only if behavior is retained.
8. Deliberately redesign login/loading, receipt viewing, and public verification. Preserve valid/voided/partial distinctions, all receipt formats, PDF/print/share/void controls, public record details, and business terminology. Leave printable document geometry intact unless separately verified.
9. Finish plain-language copy, consistent statuses, accessible names, not-found navigation, mobile layouts, keyboard access, and retry/error states. Inspect class lists left by the mechanical cleanup.
10. Run feature verification using fully intercepted fixture APIs before any browser navigation. Do not use production logins, writes, or live records. Run final TypeScript, financial regressions, lint review, and a build after inspecting build-time database access. Review desktop/mobile screenshots and print output. Record real results and limitations in the checklist.

For fixture browser work, intercept authentication, settings, staff, students, class/import, receipts/duplicate/void, and report endpoints before navigation. Prefer a deliberately non-production database URL for the local process so a missed route cannot reach production. Include Maryam's partial-payment example, future-term and whole-session payments, voided receipts, and external-payer receipts.

## Feature acceptance checklist for the next agent

Use the checkboxes in [todolist.md](./todolist.md) as the live record. None of the following has been fully reverified during this redesign:

| Area | Required preserved behavior |
| --- | --- |
| Authentication | Password login/visibility, redirects, session behavior, logout |
| Shell/dashboard | Desktop collapse, mobile drawer, issue action on all routes, school/term details, quick search, privacy |
| Students | Search/filter, enrollment, editing, deletion, spreadsheet preview/import, promotion |
| Receipt entry | Student/external modes, fee presets/custom items, sole previous-term-debt choice, term/session selection before student selection, bank/method/date/payer, duplicate warning and override |
| Financial behavior | Category-specific allocation, partial/cleared statuses, future-term isolation, whole-session allocation, snapshots, void reversal, locking and audit behavior |
| Receipt output | Search/status/bank filters, thermal/traditional/statement layouts, print/PDF, sharing/link copying, public verification, void reason/confirmation |
| Reports | Filters, reconciliation, privacy masking, existing export formats and values |
| Settings | School identity, banks, fees, concessions, fee history, receipt preferences, staff controls |
| Accessibility/responsiveness | Keyboard focus, Escape/focus restoration, nested dialogs, readable mobile forms/tables, reduced motion, useful errors/empty states |

The next agent should continue from the current extracted modules and partially updated presentation, not begin a second rewrite. Mark a checklist item complete only after its implementation and relevant preservation checks are actually finished.
