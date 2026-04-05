

## Plan: Link Seed Data and Portal Access

### How to Access the Portal
Navigate to `/portal` in the app (e.g., `https://revouxaynce.lovable.app/portal`). Log in with any client email from the seed data, such as:
- `tariro@moyo.co.zw`
- `tendai@ndlovu.co.zw`
- `sophie@lancaster.co.uk`

### The Problem
All seed data uses `clientId: ""`, `eventId: ""` — so the portal finds no matching events or invoices for any client. Everything appears empty.

### The Fix
Rewrite `seedData.ts` to use **stable, pre-generated IDs** instead of `uid()` so that records can reference each other:

1. **Generate fixed IDs** for all clients and events upfront
2. **Link events to clients** — e.g., "The Moyo Gala" → Tariro Moyo's ID
3. **Link invoices to clients AND events** — each invoice references both
4. **Link guests to events** — each guest belongs to a specific event
5. **Link expenses to events** — each expense tied to an event
6. **Link vendors to events** via `eventIds` array
7. **Add sample tasks** linked to events with proper stages (Planning, Vendor Coordination, etc.) so the portal progress bars work
8. **Bump localStorage keys** to `_v4` (or clear on seed) so existing users get the new linked data

### Files Changed
- `src/lib/seedData.ts` — rewrite with stable IDs and cross-references
- `src/pages/Index.tsx` — update localStorage keys if needed to force re-seed

### No Other Changes
All views, portal, and components stay the same — they already filter by `clientId`/`eventId`, they just need actual values in the data.

