# Revouxaynce: Event Atelier

Build a full-featured, polished event planning web application for a professional 
event planner. The app is called Revouxaynce. Built in React (single file .jsx) 
using Tailwind utility classes only. Use localStorage for all persistent data. 
Use lucide-react for icons.

---

AESTHETIC DIRECTION

Sharp monochrome editorial. Think luxury fashion magazine — Vogue meets 
high-end agency portfolio.
- Color palette: pure white (#ffffff) background, true black (#0a0a0a) text, 
  mid-grey (#6b6b6b) for secondary text, light grey (#f0f0f0) for card 
  backgrounds and table stripes, black for all accents and CTAs
- Typography: use Google Fonts — "Playfair Display" for display headings, 
  "Instrument Sans" for body/UI text. Import via @import in a <style> tag.
- App name "Revouxaynce" displayed in the sidebar header in "Playfair Display" 
  italic, large, with generous letter-spacing. No logo needed — the wordmark 
  is the brand.
- High contrast cards with crisp 1px black borders, no colored shadows
- Status badges: black pill for active/confirmed, grey outline for pending, 
  light grey fill for inactive/wrapped
- Sidebar navigation with black active state and white text on active item
- Buttons: solid black with white text for primary, white with black border 
  for secondary
- No color anywhere — not even for charts or status indicators. Use fill 
  patterns, border weights, and typography scale to create hierarchy instead.
- Feels like the software equivalent of a black-and-white lookbook.

---

NAVIGATION (sidebar)

Dashboard | Events | Clients | Vendors | Finances | Guests

---

MODULES TO BUILD

1. DASHBOARD
   - Summary cards: Upcoming Events (count), Active Clients, Unpaid Invoices (count 
     + total value), Tasks Due This Week
   - Mini calendar showing event dates this month (visual dots on dates)
   - Recent activity feed (last 5 actions across the app)
   - Quick-action buttons: + New Event, + New Client, + New Vendor

2. EVENTS
   - Event list view with cards: event name, date, venue, client name, status badge
   - Status options: Planning | Confirmed | Day-Of | Wrapped
   - Click event to open Event Detail view with sub-tabs:
       - Overview: name, date, time, venue, client, notes
       - Timeline: drag-reorderable run-of-show blocks 
         (each block: time, activity, person responsible, notes)
       - Budget: line items table (item, category, estimated cost, actual cost), 
         totals row, variance indicator
       - Vendors: assigned vendors list with payment status per vendor
       - Guests: guest list table for this event
   - Add / Edit / Delete events via modal form

3. CLIENTS (CRM)
   - Client list with: name, email, phone, event type, status
   - Status pipeline: Inquiry | Quoted | Confirmed | Completed
   - Kanban board view of pipeline (drag between columns)
   - Click client to open Client Profile: contact details, linked events, notes log
     (timestamped notes that can be added inline)
   - Add / Edit / Delete clients via modal form

4. VENDORS
   - Vendor directory: name, category (Catering | Florals | Photography | AV | 
     Decor | Transport | Entertainment | Other), contact, rating (1-5 stars), notes
   - Filter by category
   - Click vendor to view profile and see which events they are assigned to
   - Add / Edit / Delete vendors via modal form

5. FINANCES
   - Invoice list: client name, event, amount, status (Draft | Sent | Paid | Overdue)
   - Click invoice to view/edit line items, due date, notes
   - Summary panel: Total Billed, Total Paid, Outstanding, Overdue
   - Per-event P&L: revenue (invoice amount) vs total actual costs from budget
   - Add / Edit / Delete invoices via modal form

6. GUESTS
   - Master guest list across all events (filterable by event)
   - Columns: Name, Event, Email, Phone, RSVP Status (Attending | Declined | Pending),
     Dietary Notes, Table/Group
   - RSVP summary bar at top: X Attending / X Declined / X Pending
   - CSV export button (generates downloadable CSV of current filtered view)
   - Add / Edit / Delete guests via modal form

---

DATA LAYER

Use localStorage with these keys:
- events, clients, vendors, invoices, guests
- Each record has a unique id (use crypto.randomUUID())
- Seed with 3-4 realistic sample records per module on first load so the app 
  does not feel empty

---

UI PATTERNS

- All forms open in a centered modal overlay with backdrop blur
- Confirm delete with an inline confirmation (not browser alert)
- Toast notifications for save/delete actions (top-right, auto-dismiss 3s)
- Empty states with a helpful icon and prompt (e.g. "No events yet. Create your first.")
- Tables use alternating row shading (very subtle)
- All monetary values formatted as currency (e.g. $1,200.00)
- Dates displayed in human-readable format (e.g. Saturday, 14 June 2026)

---

CONSTRAINTS

- Single .jsx file, everything self-contained
- The app is called Revouxaynce — this name must appear in the sidebar, 
  the browser tab title, and any empty-state or onboarding moments
- Tailwind utility classes only (no custom CSS except the Google Fonts @import)
- No required props on the default export
- Default export the root App component
- Data persists across page refreshes via localStorage
- Mobile-responsive: sidebar collapses to bottom tab bar on small screens

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://revouxaynce.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4a942951-5094-43f4-a39c-bc6606e69a78).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
