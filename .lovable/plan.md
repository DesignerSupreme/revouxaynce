

## Plan: Generate a Comprehensive Codebase Document

I'll create a single Markdown file at `/mnt/documents/revouxaynce-codebase-review.md` that contains everything another AI would need to understand and improve the app.

### What the document will include

1. **Project Overview** — what Revouxaynce is, tech stack, architecture
2. **File Structure** — all relevant files and their purposes
3. **Full Source Code** — complete contents of:
   - `src/pages/Index.tsx` (2,318 lines — the entire app)
   - `src/App.tsx`
   - `src/index.css`
   - `tailwind.config.ts`
   - `package.json`
   - `index.html`
4. **Design System** — color palette (monochrome HSL), fonts (Playfair Display + Instrument Sans), animations, component patterns
5. **Feature Inventory** — login, dashboard, events, clients, vendors, finances, expenses, guests, team management, settings panel
6. **Data Model** — all TypeScript interfaces
7. **Known Areas for Improvement** — prompts for the reviewing AI (e.g., single-file architecture, no backend, localStorage-only persistence, no dark mode, hardcoded credentials, no search/filter on some views)

### Technical approach
- Script writes a markdown file combining all source with code fences
- Output to `/mnt/documents/revouxaynce-codebase-review.md`

