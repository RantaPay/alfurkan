# Alfurqan Pay — interface and code cleanup

## Current status

Implementation is ready for the user’s manual testing. Automated checks have stopped at the user’s request. TypeScript, 28 isolated financial/parser tests, and the Webpack production build passed. See the latest status at the top of [REDESIGN_HANDOFF.md](./REDESIGN_HANDOFF.md). The earlier checklist below remains a historical record; end-to-end acceptance is now with the user.

## Historical handoff and status

**Implementation stopped at the user's request on 28 October 2026.** Read [REDESIGN_HANDOFF.md](./REDESIGN_HANDOFF.md) before continuing. It documents the exact file changes, partial work, preserved payment requirements, validation evidence, temporary tooling, and restart sequence.

The design foundation, shared shell/components, server-service extraction, and frontend-controller extraction have been started. The latest TypeScript check passed. The visual redesign and behavioral verification remain incomplete; unchecked items below intentionally include partially implemented work. No database operations or deployment were performed during this redesign.

## Constraints

- Follow `redesign-skill/SKILL.md` using the existing Next.js / React / Tailwind v4 stack.
- Keep the existing green `#075E54`, supporting green `#128C7E`, amber `#FFB21D`, slate, and white palette.
- Preserve routes, navigation structure, features, fee rules, period allocation, printing, exports, and production records.
- Make no database, migration, seed, deployment, authentication-policy, or financial-rule changes during this cleanup.
- Keep receipt/report print layouts isolated from application styling.
- Validate with type checking, isolated financial tests, and browser checks with intercepted fixture APIs.

## Audit

- Excessive uppercase labels, font-black text, nested rounded cards, gradients, oversized shadows, decorative badges, and repeated actions obscure the task.
- Receipt and student forms mix state, calculations, API calls, and presentation. Fee presets and billing configuration parsing need shared ownership.
- The sidebar repeats its navigation markup for mobile and desktop.
- Settings combines school details, bank accounts, fees, concessions, receipt preferences, fee history, and staff management in a single large file.
- Reports combines filters, exports, statistics, and the student table. Dashboard and reports duplicate privacy-state handling.
- Technical staff-facing copy, inconsistent status wording, missing error feedback, icon-only actions, and modal keyboard behaviour need attention.

## Work, in order

- [x] Read the redesign skill, repository guidance, and current interface structure.
- [ ] Establish shared typography, spacing, controls, surfaces, focus states, and reduced-motion support while retaining the palette.
- [ ] Clean up the application shell, shared navigation, sign-in screen, and authentication loading state.
- [ ] Separate receipt form state/API/billing preview from presentation; simplify form labels, item controls, and status feedback without losing any option.
- [ ] Improve dashboard, receipt list, and student list hierarchy, filters, tables, loading, empty, and error states.
- [ ] Apply the same form and modal patterns to enrollment, editing, importing, and promotion.
- [ ] Break settings into focused sections while preserving every setting, save action, history action, and staff control.
- [ ] Separate report/export logic from the report interface and improve its filters and summaries.
- [ ] Consolidate server formatting/configuration code and split the data store into focused services behind its existing API.
- [ ] Polish receipt viewing, public verification, and shared status wording while retaining all three printable formats and sharing/void features.
- [ ] Add accessible not-found navigation and finish responsive/keyboard/error-state review.
- [ ] Run financial regression tests, TypeScript, lint review, production build, and browser smoke checks using fixture APIs; document outcomes and remaining limitations.

## Feature-preservation checklist

- [ ] Password sign-in, password visibility, redirects, logout, and existing session behaviour.
- [ ] Sidebar collapse, mobile navigation, dashboard actions, privacy toggle, and quick student search.
- [ ] Student search/filtering, enrollment, editing, deletion, spreadsheet preview/import, and promotion.
- [ ] Student/external-payer receipts, all fee presets/custom items, debt, term/session selection, bank/method/date/payer inputs, duplicate detection and override.
- [ ] Correct fee-category/term allocation, payment status, cancellation reason/confirmation, and audit operations.
- [ ] Receipt search/status/bank filtering, thermal/traditional/statement formats, PDF/print, sharing, and public verification.
- [ ] Report filters, bank reconciliation, sensitive-figure masking, and exports.
- [ ] School profile, banks, fees, concessions, fee history, receipt preferences, and staff management.

## Validation log

- TypeScript: `./node_modules/.bin/tsc --noEmit` passed after the latest controller extraction and binding repair, as well as earlier foundation/server/parser steps.
- Financial tests: 23 passed before the redesign; they have not been rerun after the current refactors.
- Lint: pre-redesign baseline had 109 findings (21 errors, 88 warnings). Current changes have not received a new full lint review; unused imports from extraction need cleanup.
- Production build, browser/mobile/keyboard checks, and print/export regression checks remain pending. Feature-preservation items above are not yet verified end to end.
- Playwright was installed under `/tmp`, outside project dependencies. Chromium download was incomplete at interruption; see the handoff before resuming browser setup.
- No database, schema, migration, seed, production-data, or deployment operations were performed during this redesign.
