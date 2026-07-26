# First-run onboarding tour

Light **show-me-around** after the Magnus monogram intro. First visit only (localStorage); replay from Settings.

## Sequence

1. **Logo intro** (`MagnusIntro`) — brand splash on full page load when enabled in Settings.
2. Intro dismisses → short handoff (~180ms).
3. **Tour** opens over the live shell (z-index below intro, above app chrome).

The tour never replaces the logo intro. Startup animation and tour prefs are independent.

## Stops (5)

| # | Id | Target | Notes |
|---|-----|--------|--------|
| 1 | `home` | `[data-tour-home]` | Home header |
| 2 | `catch-me-up` | `[data-catch-me-up]` | Primary CTA — invite only, no auto-run |
| 3 | `messages` | `[data-tour-target="messages"]` | Sidebar (Home mode) |
| 4 | `feed` | `[data-tour-target="feed"]` | Sidebar (Home mode) |
| 5 | `chat-mode` | `[data-sidebar-top-mode]` | Home · Chat switch; **Next / Open Chat** opens a blank Magnus chat |

No search / command-palette stop. Messages + Feed run before Chat mode so home nav anchors still exist.

## Visual language

Aligned with the design system (flatmax, glass, quiet motion):

- **Light veil** — soft dim (~32%) + light `backdrop-blur` (~5px) so users still see where UI lives.
- **Rounded hole** — SVG mask with 16px radius so blur meets the spotlight edge (no harsh rect corners).
- **Spotlight** — inset hairline ring; edge-aware padding keeps the hole on-screen (sidebar rows near the left).
- **Coach card** — glass panel, step counter, **Skip tour** only (no second X control), Back / Next.
- **Reduced motion** — shorter delays, no bouncy motion.

## Persistence

| Key | Storage | Meaning |
|-----|---------|---------|
| `magnus-onboarding-tour-v1` | localStorage | `completed` \| `skipped` once done; missing = first visit |
| `magnus-onboarding-tour-force` | sessionStorage | Set by Settings Replay so the tour can run again this session |

Helpers: `src/lib/onboarding-tour.ts`  
Steps: `src/components/onboarding/tour-steps.ts`  
UI: `src/components/onboarding/OnboardingTour.tsx` (mounted in `src/app/layout.tsx`)

## First visit vs Replay

- **First visit:** status pending → after intro dismiss (or immediately if intro disabled) → tour starts.
- **Replay:** Settings → Appearance → **Show me around → Replay** calls `requestOnboardingTourReplay()` (clears done flag, sets force session, dispatches start event). Tour navigates home and opens from step 1.
- **Skip tour / Escape / Done:** marks done; auto-show will not return until Replay.

## Events

| Event | Source | Role |
|-------|--------|------|
| `magnus-intro-dismiss` | `MagnusIntro` | Intro finished or skipped — tour may hand off |
| `magnus-onboarding-tour-start` | Settings Replay | Force tour start |

## Dev / QA

```bash
npm run test:onboarding-tour
```

Reset for a true first-run in the browser console:

```js
localStorage.removeItem("magnus-onboarding-tour-v1");
sessionStorage.removeItem("magnus-onboarding-tour-force");
location.reload();
```

## Related

- Logo intro: `src/lib/intro.ts`, `src/components/brand/MagnusIntro.tsx`
- Design system: `docs/design-system.md` (overlays / quiet motion)
- View inventory: `docs/magnus-view-gap-inventory.md`
