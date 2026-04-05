

## Plan: Force Re-seed with New Data

Since clearing localStorage manually is proving difficult, I'll update the code to force a re-seed automatically. This is the simplest approach.

### What I'll do

1. **Change the seed detection keys** in `src/pages/Index.tsx` — each `useLocalStorage` call checks if data exists under a specific key. I'll rename the localStorage keys (e.g., `events` → `events_v2`, `clients` → `clients_v2`, etc.) so the app treats existing data as non-existent and seeds fresh data with the new Zimbabwean/English names.

2. **Add a "Reset Data" button** in the sidebar footer (admin only) so in the future, you can reset all sample data with one click without needing to open DevTools.

### Why this works
- Changing the key names means the old data is ignored and new seed data loads automatically on next page refresh.
- No manual browser steps required from you.

