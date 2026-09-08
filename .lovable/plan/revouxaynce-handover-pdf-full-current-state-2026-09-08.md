# Revouxaynce Handover PDF — Full Current State

Produce a fresh, polished PDF handover covering the whole system as it stands today (Phases 0 through 6.2), suitable to hand to another AI or developer.

## What the document will contain

1. Overview — what Revouxaynce is, who uses it, standing product rules (no payment processing, tracking only).
2. Architecture — React + TypeScript front end, Lovable Cloud backend, file map of the main screens and hooks.
3. Data model — every table, its purpose, key columns, and how records relate. Includes the newer areas: roles and profiles, soft delete, currencies and FX rates, client pipeline stages, vendor payables, concepts, mood boards, budgets, vendor options, portal responses.
4. Security — how sign-in works, the four roles (admin, planner, assistant, viewer) and what each can do, how the client portal token links work, and what the portal is never allowed to see.
5. Features by area — Dashboard, Events, Clients, Vendors, Finances and invoicing, Expenses, Guests, Team, Tasks, and the new Design workspace with mood boards.
6. Invoicing in depth — line items, discounts and tax, milestone billing, versions, PDF output and branding, audit trail, comments and assignment.
7. Automation — daily reminder emails, overdue marking, invoice totals and event financials calculated in the database.
8. Client portal — how a client gets a link, what they see, and the accept / request-revision / favourite / approve actions.
9. Design system — colours, type, spacing, motion and accessibility rules.
10. Known gaps and a prioritised backlog — including anything still stored in the browser rather than the database, and outstanding security-linter notes.

## How it will be produced

- Re-read the current code, hooks, views and live database schema first, so the document reflects reality rather than the previous handover.
- Check the database linter and role/permission setup so the security section is accurate.
- Generate the PDF with ReportLab, then render every page to images and visually check for clipped text, overlap, bad tables or spacing before delivering.
- Saved as a downloadable PDF attached in chat. The previous handover PDF is left untouched.

## Notes

No application code or data changes. This is a documentation task only.
