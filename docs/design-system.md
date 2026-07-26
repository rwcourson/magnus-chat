# Magnus design system

High-level reference for the visual language used in **magnus-chat** (B&G intranet + AI shell). Use this document to port the same look into another product, or as living documentation for this repo.

**Canonical implementation:** `src/app/globals.css`, `src/app/layout.tsx`, `src/lib/motion.ts`, `src/lib/icons.ts`, shared UI under `src/components/ui/`.

---

## 1. Product philosophy

| Principle | What it means |
|-----------|----------------|
| **Flatmax** | Hierarchy from **fills and borders**, not drop shadows. Almost all `--shadow-*` tokens are `none`. Depth is inset highlights and hairline rings. |
| **Glass, not neon** | Surfaces are mid-navy (dark) or soft paper (light) with blur + translucent fill. No cyan / purple “AI glow.” Accents are cool neutrals or B&G navy. |
| **TV-legible dark** | Dark canvas is lifted (`#161e2e` family), not pure black—conference displays crush near-black. |
| **Quiet motion** | Short opacity + ease-out springs; no toy bounce. Respect `prefers-reduced-motion`. |
| **One radius language for faces** | **Rounded squares** (`rounded-lg` / `rounded-md`) for people and channel images—never mix circles and squares for portraits. |
| **Pills for chrome** | Filters, tags, primary CTAs, and the Ask Magnus FAB use **full pills** (`rounded-full`). |

---

## 2. Typography

| Role | Face | Notes |
|------|------|--------|
| **UI body** | **Inter** (Google Fonts) | `--font-inter` → CSS `--font-sans`. Features: `ss01`, `cv11`, `calt`. Antialiased. |
| **Code only** | **Geist Mono** | Chat code blocks / inline `` `code` `` only. Do **not** mono-style UI chrome, kbd, or labels. |

### Scale (product defaults)

Approximate sizes used across screens (Tailwind / rem):

| Use | Size | Weight | Tracking |
|-----|------|--------|----------|
| Page title (h1) | ~1.65–2rem | 600 | −0.03em |
| Section title | ~15px | 600 | tight |
| Body | 13.5–14.5px | 400–500 | −0.014em body |
| Meta / helper | 11–12.5px | 400–500 | normal / wide for labels |
| Eyebrow / section label | 10.5–11px | 600 | **0.08em**, uppercase |
| Sidebar label | 13px | 500 | −0.016em (`.side-label`) |

**Line height:** body ~1.45–1.6 relaxed; UI rows ~1.25.

---

## 3. Color system

Theme is switched with `html[data-theme="dark" | "light"]` (default dark). Prefer **CSS variables**, not hard-coded hex in components.

### 3.1 Brand anchors

| Name | Hex | Use |
|------|-----|-----|
| **B&G navy** | `#0c2048` | Light-mode primary fill, links, selection text |
| **Navy hover** | `#16356e` | Primary hover in light |
| **Navy deep** | `#081530` | Deep accent / hover text |
| **Dark canvas** | `#161e2e` | App background mid |
| **Dark deep** | `#121826` | Canvas bottom / deep |
| **Dark elevated** | `#1e283c` | Raised panels |
| **Soft primary (dark UI)** | `#4a5f88` | Ask Magnus / primary buttons in dark |
| **Soft primary hover** | `#5a70a0` | Primary hover in dark |

### 3.2 Semantic tokens (both themes)

Implement as CSS custom properties (see `globals.css`).

#### Canvas & glass

| Token | Role |
|-------|------|
| `--bg-deep` / `--bg-canvas` / `--bg-elevated` | Page depth stack |
| `--canvas-grad` | Full-app background gradient |
| `--glass-fill` / `--glass-fill-strong` / `--glass-strong-solid` | Panel frosts |
| `--glass-fill-sidebar` / `--glass-fill-composer` | Shell + input bar |
| `--glass-border` / `--soft` / `--strong` | Hairlines |
| `--glass-specular` / `--specular-soft` | Inset light edge |
| `--chat-glass-blur` | ~**28px** backdrop blur |

#### Text

| Token | Role |
|-------|------|
| `--text-primary` | Titles, body emphasis |
| `--text-secondary` | Supporting copy |
| `--text-muted` | Meta, timestamps, placeholders |
| `--sidebar-text-*` | Slightly different contrast inside sidebar |

#### Interaction

| Token | Role |
|-------|------|
| `--hover-fill` / `--hover-fill-strong` | Row / control hover |
| `--select-fill` / `--select-text` / `--select-shadow` | Active nav / selection (inset ring, not drop shadow) |
| `--accent` / `--accent-ring` | Focus rings, soft emphasis |
| `--danger` | Destructive actions |

#### Buttons

| Token family | Dark | Light |
|--------------|------|-------|
| **Primary** (`btn-primary`) | Soft navy `#4a5f88`, white label, top sheen | Deep navy `#0c2048`, white label, top sheen |
| **Solid** (`btn-solid`) | White pill, dark ink | Same navy treatment as primary |

Primary CTAs (Catch me up, Ask Magnus, Send) should share **primary** surface: fill + soft border + inset highlight + optional top sheen gradient.

#### Pills (secondary)

`--pill-bg`, `--pill-fg`, borders — ghost / glass chips (“All news”, filters). Not for primary actions.

#### Links

Dark: cool gray links. Light: navy links. Underlines use low-opacity token colors.

---

## 4. Layout & spacing

| Measure | Value |
|---------|--------|
| Sidebar expanded | **280px** |
| Sidebar collapsed | **72px** |
| Composer max width | **~720px** |
| Content columns | Home/feed ~**680–820px**; split views up to ~**1100px** |
| Page padding | ~16–24px (`px-4` / `sm:px-6`) |
| Card radius | **18–22px** panels; **20px** list shells |
| Control radius | **Pills** `full`; **tiles** `xl`/`2xl`; **portraits** `lg`/`md` |
| Icon stroke | **1.4** (Lucide `ICON_STROKE`) |
| Hit targets | Sidebar rail **36×36** (`h-9 w-9`) |

---

## 5. Components (recipe level)

### Surfaces

- **Page shell:** gradient canvas + optional B&G monogram watermark (very low opacity).
- **Cards / lists:** `border` + `bg-[var(--glass-strong-solid)]` (or glass fill) + soft border; hover slightly stronger border.
- **Sidebar:** dedicated fill + sheen gradient + remapped text tokens.
- **Composer / chat glass:** blurred bar, continuous bottom **veil** (dissolve into canvas—no hard dock line).

### Identity images

- People, DMs, channel thumbs: **rounded square** (`rounded-lg`, small: `rounded-md`).
- Use `AvatarMark` / `ConversationIdentityMark`—cap size so covers never become banners (header thumbs ~**32px**).
- Do **not** use circles for faces.

### Buttons

| Kind | Class / pattern |
|------|------------------|
| Primary (Magnus, Catch me up) | `.btn-primary` |
| Inverse / solid | `.btn-solid` (light mode maps to primary navy) |
| Secondary | `.chat-glass` / `PillAction` |
| Icon-only | Ghost hover fill, rounded square or full for icon buttons |

### Typography components

- **PageHeader:** eyebrow pill (icon + uppercase label) + large title + muted description.
- **Section labels:** 11px uppercase tracking.

### Scroll

- `ScrollFade`: soft multi-stop edge dissolve; bottom often always on; **hide bottom** when a composer owns the edge (comments panel, chat veil).

### Motion

From CSS + Framer tokens (`src/lib/motion.ts`):

| Token | Value |
|-------|--------|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-spring` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Fast / default / slow | 160 / 240 / 360 ms |
| Springs | Snappy ~520/40; soft ~380/36; layout ~420/38 |

Prefer **opacity + small x/y**; avoid layout thrash that reflows the whole page.

---

## 6. Iconography

- Library: **Lucide React**
- Stroke: **1.4** globally
- Size: UI 14–18px; rail 16px; empty states larger
- Avoid “sparkle” / emoji-style AI ornaments—use neutral icons (`ListChecks`, `MessageCircle`, `Clock3`, etc.)

---

## 7. Theme behavior

```html
<html data-theme="dark" class="dark">  <!-- default -->
<html data-theme="light">
```

- Persist preference in app (localStorage via theme context).
- Favicon swaps: light mark on dark chrome, dark/navy mark on light chrome.
- Logo monochrome via CSS filters (white on dark, navy on light)—see `.logo-mark-sidebar`.

---

## 8. Content tone (product copy)

- Professional construction / ops: concise, scannable, practical.
- No hype AI language; verify safety/money claims against systems of record.
- Meta lines use **middle dots** (`·`) for density (e.g. `ATL-2841 · envelope`).

---

## 9. Porting checklist (new project)

1. **Copy token blocks** from `globals.css` (`:root` / dark + `html[data-theme="light"]`).
2. **Load Inter + Geist Mono**; wire `--font-inter` / mono only for code.
3. **Implement** `.btn-primary`, `.btn-solid`, glass panel utilities, scroll-fade if needed.
4. **Avatar system:** rounded-square portraits only; fixed max sizes.
5. **Layout constants:** sidebar 280 / 72, composer max ~720.
6. **Motion:** ease-out + short springs; reduced motion.
7. **Do not** reintroduce colored brand cyan/purple glows or heavy box-shadows.
8. **Optional assets:** monochrome logo PNG + monogram watermark SVGs; dual favicons.

### Minimal token subset (if you only need a start)

```css
/* Dark essentials */
--bg-canvas: #161e2e;
--glass-strong-solid: #222c42;
--glass-border: rgba(255, 255, 255, 0.12);
--text-primary: #f4f6fa;
--text-secondary: #c4cbd8;
--text-muted: #9aa3b5;
--hover-fill: rgba(255, 255, 255, 0.06);
--btn-primary-bg: #4a5f88;
--btn-primary-fg: #ffffff;

/* Light essentials */
--bg-canvas: #eef0f4;
--glass-strong-solid: #ffffff;
--glass-border: rgba(15, 23, 42, 0.1);
--text-primary: #0c0e12;
--text-secondary: #3a4250;
--text-muted: #64708a;
--btn-primary-bg: #0c2048;
--btn-primary-fg: #ffffff;
--navy: #0c2048;
```

---

## 10. File map (this repo)

| Concern | Location |
|---------|----------|
| All color/type/layout tokens | `src/app/globals.css` |
| Font loading | `src/app/layout.tsx` |
| Icon stroke | `src/lib/icons.ts` |
| Motion tokens | `src/lib/motion.ts` |
| Avatars / marks | `src/components/ui/BrandMark.tsx` |
| Channel/DM identity | `src/components/messaging/ConversationIdentityMark.tsx` |
| Page headers | `src/components/ui/PageHeader.tsx` |
| Secondary pills | `src/components/ui/PillAction.tsx` |
| Scroll dissolve | `src/components/ui/ScrollFade.tsx` |
| Shell | `src/components/layout/AppShell.tsx`, `Sidebar.tsx` |

---

## 11. Anti-patterns (don’t reintroduce)

- Pure black `#000` full-bleed backgrounds  
- Multi-color neon gradients / sparkle AI icons  
- Heavy drop shadows for cards  
- Circular profile photos mixed with square channel art  
- Geist Mono on navigation or body UI  
- Hard 1px dock lines under composers (use veils / fades)  
- Layout animations that re-center the page when expanding side panels  

---

*Last aligned with magnus-chat mid-navy glass system (flatmax, Inter, dual theme, primary FAB language).*
