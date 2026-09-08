# Revouxaynce System Handover PDF

Produce a single, polished PDF describing the whole system, written so another AI (or developer) can pick it up and improve it without further context.

## Why a new document

The existing review document was written before the backend migration. It predates the Lovable Cloud database, the client portal actions, milestone billing, invoice revisions, audit logs, team comments, automated reminders, the analytics dashboard, and the security hardening work. The handover PDF will be regenerated from the current code and database.

## Contents of the PDF

1. Cover page — product name, logo, date, purpose ("handover for AI-assisted improvement")
2. Executive summary — what the tool does and who uses it
3. Architecture overview — front end structure, backend services, hybrid storage (database vs. browser storage for expenses, vendors, guests)
4. Data model — every table with its fields, relationships, and an entity diagram
5. Access rules — who can read and write what, including how client portal access is checked
6. Feature inventory — dashboard, events, clients, vendors, guests, expenses, team, tasks, finances/invoicing, client portal, analytics, settings
7. Invoice lifecycle — quotation to paid, milestone billing, revisions, PDF output, reminders
8. Background automation — the scheduled reminder job and overdue marking
9. Design system — colors, typography, animation conventions
10. File-by-file map — each source file with its responsibility (no full source dumps; the PDF stays readable)
11. Known gaps and improvement backlog — prioritised, with reasoning
12. How to work on this app — conventions, pitfalls, things not to break

## How it gets built

- Gather current state first: read the source tree and query the live database schema and access rules so nothing is asserted from memory.
- Generate the PDF with a Python script using ReportLab, styled with the Revouxaynce brand colors and logo.
- Include an entity-relationship diagram and a feature/status table.
- Quality check: render every page to an image and inspect for clipped text, overlap, or broken layout; fix and re-render until clean.
- Deliver as a downloadable file in chat.

## Notes

- No application code changes. This task only produces a document.
- The older markdown review stays where it is; the PDF supersedes it.
