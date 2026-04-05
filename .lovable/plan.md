

## Plan: Responsive, Animated, Data-Rich Revouxaynce

### 1. Responsive & Adaptive Layout
- Make all grid layouts use responsive breakpoints (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` etc.)
- Ensure tables scroll horizontally on mobile with proper touch targets
- Mobile bottom nav: show overflow menu for tabs beyond 5
- Cards, modals, charts all adapt to viewport width
- Login page scales properly on all devices

### 2. Smooth Animations (CSS + Intersection Observer)
- Add CSS keyframes to `tailwind.config.ts`: `fade-in-up`, `count-up`, `slide-in`, `bar-grow`
- Create an `AnimatedNumber` component that counts up from 0 to target value on mount using `requestAnimationFrame`
- Add `useInView` hook (Intersection Observer) to trigger animations when elements scroll into view
- Animate dashboard summary cards with staggered fade-in
- Animate bar chart bars growing from 0 height with CSS transitions
- Animate horizontal bar chart widths growing from 0
- Smooth page transitions between tabs (fade in/out)
- Modal entrance/exit with scale + fade
- Sidebar slide animation on mobile
- Toast slide-in animation

### 3. More Sample Data
- Expand seed data: 8 events, 6 clients, 8 vendors, 8 invoices, 10 guests, 10 expenses
- Add more Zimbabwean names (Tendai Ndlovu, Farai Mukombe, Nyasha Garwe, etc.) and English names (Sophie Lancaster, Oliver Bennett)
- Add diverse event types: product launch, birthday, anniversary, corporate retreat
- More expense categories and realistic amounts

### 4. More Charts
- **Dashboard**: Add a monthly revenue trend line chart (SVG), donut/ring chart for RSVP breakdown, event status distribution
- **Finances**: Add monthly cash flow bar chart (income vs expenses per month)
- **Expenses**: Add a trend line of expenses over time
- **Guests**: Add RSVP status donut chart and dietary breakdown chart

### 5. Sample Data Toggle & Settings
- Remove "Reset Sample Data" button from sidebar footer
- Add a **Settings** gear icon in the top-right of the main content area (or in user dropdown)
- Create a **Settings panel/modal** with:
  - "Sample Data" toggle switch (on/off) — when turned off, clears all data; when turned on, re-seeds
  - "Reset Sample Data" button within the same panel
  - Only visible to admin users

### Technical Details
- All in `src/pages/Index.tsx` (single-file architecture maintained)
- New SVG chart components: `LineChart`, `DonutChart`
- `AnimatedNumber` uses `useEffect` + `requestAnimationFrame` for smooth counting
- `useInView` hook wraps `IntersectionObserver` for scroll-triggered animations
- CSS transitions on chart elements with `transition-all duration-700 ease-out`
- Sample data toggle stored in localStorage key `sampleDataEnabled_v2`

