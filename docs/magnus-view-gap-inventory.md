# Magnus mock — view inventory, gaps, brand consistency, production parity

**Date:** 2026-07-25  
**Repo:** `magnus-chat` (local intranet + AI chat mock)  
**Production probe:** `https://magnus.brasfieldgorrie.com/chat` (signed-in session via local Chrome; unauthenticated curl hits Microsoft SSO)  
**Scope:** Analysis & recommendations only — no product code changes in this goal.

---

## 1. Current inventory

Depth key:

| Class | Meaning |
|-------|---------|
| **Full mock** | Multi-state UI, mock data, interactions, polish close to Home / messaging / AI chat bar |
| **Thin list** | PageHeader + card/list grid; limited empty/detail/error states; little interaction beyond navigate |
| **Shell-only** | Route exists but view is stub, “coming soon”, or pure redirect placeholder |

### 1.1 App routes (`src/app/**/page.tsx`)

| Route | Entry | Primary view | Class | Notes |
|-------|--------|--------------|-------|--------|
| `/` | `app/page.tsx` | `ChatView` → `HomeLanding` \| `EmptyState` \| thread | **Full mock** | Home intranet when no AI messages + `appMode=home`; AI empty (`EmptyState`) in Chat mode; active AI thread with `MessageList` + composer veil |
| `/messages` | `app/messages/page.tsx` | `MessagingView` | **Full mock** | Slack-like channels/DMs, reactions, threads (`ThreadPanel`), attachments, @Magnus, rail + header |
| `/feed` | `app/feed/page.tsx` | `NewsFeed` + `MagnusChatPopup` | **Full mock** | Categories, bookmarks, composer, comments, detail panel |
| `/people` | `app/people/page.tsx` | `PeopleView` | **Thin list** | Card grid + avatars; no search/filter empty sophistication |
| `/people/[id]` | `app/people/[id]/page.tsx` | `PersonProfileView` | **Thin list** | Profile + activity; “person not found” shell for bad ids |
| `/notifications` | `app/notifications/page.tsx` | `NotificationsView` | **Thin list** | Simple list; limited group/filter states |
| `/comms` | `app/comms/page.tsx` | `CommsReviewView` | **Full mock** | Scout/comms review queue with empty selection state |
| `/approvals` | `app/approvals/page.tsx` | `ApprovalsView` | **Full mock** | Master-detail list; empty + “select an item” |
| `/calendar` | `app/calendar/page.tsx` | `CalendarView` | **Thin list** | Day agenda mock; lighter than `AvailabilityCalendar` in AI chat |
| `/skills` | `app/skills/page.tsx` | `SkillsView` | **Thin list** | Image cards, pin UI; no skill detail / run surface |
| `/routines` | `app/routines/page.tsx` | `RoutinesView` | **Thin list** | Toggle cards + last-run; no create flow or run history view |
| `/integrations` | `app/integrations/page.tsx` | `IntegrationsView` | **Thin list** | Connect/disconnect mock; no OAuth/detail pages |
| `/workspaces` | `app/workspaces/page.tsx` | `WorkspacesView` | **Thin list** | Cover + member stack; no workspace interior |
| `/settings` | `app/settings/page.tsx` | `SettingsView` | **Full mock** | Theme + sidebar prefs (order/visibility) |
| `/search` | `app/search/page.tsx` | `SearchResultsView` | **Full mock** | Unified mock index; empty/query states |
| `/help` | `app/help/page.tsx` | `HelpView` | **Thin list** | FAQ + shortcuts; not full academy |

### 1.2 Non-route surfaces (mode / chrome)

| Surface | Location | Class | Notes |
|---------|----------|-------|--------|
| App shell + dual sidebar | `AppShell`, `Sidebar`, `RailItem` | **Full mock** | Home vs Chat mode; collapsed rail flyouts; prefs-driven sections |
| AI composer | `Composer`, `AttachMenu`, voice | **Full mock** | Shared on Home / Empty / thread / messaging dock patterns |
| AI empty | `EmptyState` | **Full mock** | Logo, welcome, chips, recent posts dock |
| AI thread | `MessageList`, `MessageBubble`, `ThreadHeader` | **Full mock** | Blocks, calendar widget, regenerate/edit |
| Global command palette | `GlobalCommandPalette` | **Full mock** | ⌘K jump |
| Magnus intro | `MagnusIntro` + SVG | **Full mock** | Full-page brand splash each load |
| Magnus history | `MagnusChatControl`, `MagnusHistoryDrawer` | **Full mock** | Rail + header entry to AI history |
| Feed popup AI | `MagnusChatPopup` | **Full mock** | Floating chat on feed |
| Placeholder shell | `PlaceholderPage` | **Shell-only** | Component exists; **no route imports it** |
| Person hover | `PersonHoverCard` | **Full mock** | Messaging/thread identity hover |

### 1.3 Brand anchors (local design system)

| Anchor | Path | What “on-brand” means |
|--------|------|------------------------|
| Tokens | `src/app/globals.css` | Canvas grad, glass fills, `--hover-fill`, `--select-fill`, sidebar text, Inter, flat elevation |
| Home stage | `HomeLanding`, `NewsCarousel`, `ActionTiles` | max-w ~820, motion enter, glass cards, news scrim, Ask Magnus section |
| AI chat | `EmptyState`, `ChatView` composer veil | Continuous bottom veil, centered empty, `MagnusLogo` tones |
| Team messaging | `MessagingView` | Borderless header, composer-screen-veil, reaction bar, side thread |
| Secondary pages | `PageHeader` | Eyebrow pill + title + description; glass card grids |
| Logo | `MagnusLogo` | tones: `white` / `navy` / `sidebar`; asset `/logo.png` |

---

## 2. Gaps (subviews + details + states)

### 2.1 Channel / DM visual identity (must-have)

| Gap | Evidence | Impact |
|-----|----------|--------|
| **No channel image / branded mark on `Conversation`** | `types/messaging.ts` `Conversation` has `id, kind, name, slug, topic, memberIds, unreadCount, messages, updatedAt` — **no `imageUrl` / `iconUrl` / `color`** | Rail and header always generic `Hash` |
| **Header always Hash / Users** | `MessagingView.tsx` header uses Lucide `Hash` (channel) or `Users` (DM), not peer avatar or channel art | Feels unfinished vs people/feed identity |
| **Collapsed rail channels are hash-only** | `ConversationNav` compact mode: `Hash` / `Users` icons + unread dot | Hard to scan multiple channels |
| **DM rail does not use peer `avatarUrl`** | Authors have `avatarUrl` from `people-data`; conversation rows do not surface peer portrait | DMs look same as channels when collapsed |
| **No channel “about” / members drawer** | Messaging has topic string only; no members list, pins, or channel settings subview | Slack-parity gap |

### 2.2 Magnus logo / mark usage

| Gap | Evidence |
|-----|----------|
| **AI assistant bubbles lack Magnus mark** | `MessageBubble` has no `MagnusLogo`; assistant is text blocks without left logo column |
| **In-channel Magnus uses logo** | `MessagingView` MessageRow uses `MagnusLogo` when `author.isMagnus` — good |
| **Empty AI uses logo; Home ask bar does not emphasize mark** | `EmptyState` logo; HomeLanding Ask Magnus is typography-first |
| **Production uses cyan “m” wordmark + logo in empty stage** | Observed prod empty: large cyan mark + “Hello! I'm Magnus…” (local empty uses monochrome `logo.png` via filters) |
| **No dedicated “channel is Magnus / AI” identity** | Only bot author flag; no channel icon for AI-related rooms |

### 2.3 Missing subviews (product surfaces we lack or thin)

Relative to **production Magnus (observed 2026-07-25)** and intranet direction of this mock:

| Missing / thin subview | Why it matters | Prod / intent |
|------------------------|----------------|---------------|
| **Skill detail / run** | Skills are cards only; no “open skill → prompt → chat” | Prod: rich Skills catalog (Official/Active counts, filters, brand standards skill) |
| **Routine create + run history** | Toggle list only | Prod: “You don't have any routines yet” empty + New routine |
| **Workspace interior** | Cards only, no chat list scoped to workspace | Prod: workspaces with shared context |
| **Knowledge / B&G search surface** | Home/search mock only; no `/knowledge` | Prod: `/knowledge`, B&G Knowledge Engine integration |
| **Academy / User Guide** | Thin `/help` FAQ | Prod: `/academy` guided course + docs |
| **Announcements** | Not a surface | Prod user menu: Announcements |
| **Download app** | N/A | Prod user menu |
| **Chat history search in rail** | Compact list only; expanded has channel search | Prod: “Search chats…” on AI history |
| **Channel empty conversation** | Always seed messages | Need empty channel state with invite CTA |
| **Select-a-channel polish** | One muted line: “Select a channel or DM” | Needs branded empty (logo / illustration) matching AI `EmptyState` |
| **New channel / New DM** | No create flows | Expected in Slack-like shell |
| **Pinned messages / bookmarks in channel** | Absent | Common team chat state |
| **File / gallery drawer** | Mock attach chips only | Prod has attachments in chat UX elsewhere |
| **Loading skeletons** | Text “Loading…” Suspense only | No shared skeleton cards matching glass design |
| **Offline / error** | None | Production-like resilience mock |

### 2.4 UI states under-covered

| State | Where missing or weak |
|-------|------------------------|
| **Select a channel** | Plain text; not EmptyState-quality |
| **No search results** | Partial in Search/ConversationNav (“No channels”) |
| **No chats yet** | Magnus history flyout has short copy; OK |
| **Loading** | Suspense text only (approvals/feed/search/home) |
| **Not found** | People id only; no 404 layout for unknown routes |
| **Empty feed category / bookmarks** | Present in NewsFeed — good reference |
| **Empty approvals / select detail** | Present — good reference |
| **Routines empty** | Local always has seed data; no “create first routine” empty like prod |
| **Collapsed rail hover** | Recently fixed via `RailItem` — keep as standard |

### 2.5 Consistency gaps (secondary vs Home/Messaging)

- Catalog pages share `PageHeader` + glass cards but **lack continuous composer veil / stage density** of Home and messaging (OK for lists; weak when empty).
- **CalendarView** is thinner than in-chat `AvailabilityCalendar` (visual hierarchy diverges).
- **Help** does not use the same card image treatment as Skills/Workspaces.
- **PlaceholderPage** still “Coming soon” aesthetic — unused, but pattern is off-brand vs polished Home.
- Secondary surfaces rarely use **MagnusLogo** or B&G watermark storytelling (watermark only in main shell stage).

---

## 3. Brand consistency matrix

**Anchors:** HomeLanding layout + news glass; MessagingView borderless header + composer veil; CSS tokens; PageHeader; MagnusLogo tones.

| Surface | Grade | One-line evidence |
|---------|-------|-------------------|
| **Home (`/` home mode)** | **Pass** | `HomeLanding` max-w stage, news scrim, action tiles, Ask Magnus, tokens |
| **AI empty / thread** | **Pass** | `EmptyState` logo + composer; `ChatView` continuous veil; Inter/glass |
| **Team messaging** | **Pass** (identity **Partial**) | Borderless chrome, reactions, threads, veil; **fails** channel/DM marks (Hash-only) |
| **Feed** | **Pass** | Glass posts, filters, empty category copy, Magnus popup |
| **People + profile** | **Partial** | PageHeader + glass cards + `AvatarMark`; thin interactions; no search |
| **Notifications** | **Partial** | PageHeader list; sparse empty/group polish vs feed |
| **Comms / Approvals** | **Pass** | PageHeader, selection empty states, glass panels |
| **Skills / Routines / Integrations / Workspaces** | **Partial** | Shared PageHeader + glass cards; missing detail/empty/create depth vs prod catalog |
| **Settings** | **Pass** | PageHeader, prefs cards, token-aligned toggles |
| **Search** | **Pass** | PageHeader + grouped results + empty guidance |
| **Help** | **Partial** | PageHeader FAQ; no academy imagery / course structure |
| **Calendar** | **Partial** | PageHeader agenda; weaker than AI availability calendar craft |
| **Collapsed rail** | **Pass** | `RailItem` hover + flyouts after recent work |
| **PlaceholderPage** | **Fail** | Generic “Coming soon” glass — not used by routes, pattern outdated |

---

## 4. Production Magnus access note

### 4.1 Unauthenticated (curl)

- `GET https://magnus.brasfieldgorrie.com/chat` → **307** → `/api/auth/sso?callbackUrl=%2Fchat` → **302** → `login.microsoftonline.com/.../oauth2/v2.0/authorize` (Microsoft Entra).
- Final body: Microsoft **“Sign in to your account”** — **SSO blocks** scrapers without credentials.
- Log: `{SCRATCH}/magnus-prod-access.log`.

### 4.2 Authenticated local Chrome (browser-use, 2026-07-25)

Session was already signed in as **Robert Courson**. Observed **AI-first product**, not Slack team chat:

| Prod surface | Path | Observed |
|--------------|------|----------|
| Chat empty | `/chat` | Cyan **m** mark, “Hello! I'm Magnus…”, B&G knowledge + User Guide links, composer (+ / Auto / mic / voice), chat history sidebar with date groups + search |
| Skills | `/skills` | Catalog, New Skill, filters Official/Active/Public, skill cards (e.g. Brand Standards, HTML UX/UI) |
| Routines | `/routines` | Empty state: “You don't have any routines yet…” + New routine |
| Integrations | `/integrations` | Excel/Word copilot, connectors (Databricks, M365, Knowledge Engine, Procore soon, etc.) |
| Workspaces | `/workspaces` | Workspace cards + New Workspace |
| Knowledge | `/knowledge` | Loaded slowly / “Loading page…” at capture |
| Academy | `/academy` | User Guide + guided course (~49 min) + docs |
| Account menu | — | Download app, User Guide, Announcements, Settings, Light, Log out |

**Not observed in production (do not invent):** Slack-style **company channels / DMs** as primary nav. Production sidebar is **New chat · Skills · Routines · Integrations · Workspaces · Chats**.

### 4.3 Parity targets (honest)

Local mock should have **at least**:

1. AI chat entry + empty stage + history (present).
2. Catalog entry points: Skills, Routines, Integrations, Workspaces (present as thin lists).
3. Help/onboarding equivalent (thin Help vs prod Academy).

Local mock **intentionally adds** intranet (Home news, feed, people, team messaging, approvals, comms) beyond prod `/chat` shell. Team messaging is **product direction for this mock**, not a claim that prod already shows `#general`.

Screenshots: `{SCRATCH}/prod-chat.png`, `prod-skills.png`, `prod-routines.png`, `prod-integrations.png`, `prod-workspaces.png`, `prod-academy.png`.

---

## 5. Prioritized “build next” (recommendations only)

### P0 — Identity & messaging polish (must-have details)

1. **Channel visual identity** — extend `Conversation` with `imageUrl` / `color` / optional emoji; render in header, expanded list, and collapsed rail (not bare Hash only).
2. **DM peer avatars** — resolve DM peer from `memberIds` + `peopleDirectory.avatarUrl` in rail, list, and header (replace generic Users icon).
3. **Select-a-channel empty** — branded empty matching AI `EmptyState` (logo/mark, short copy, 2–3 channel chips).
4. **AI MessageBubble mark** — optional left `MagnusLogo` for assistant rows for parity with messaging Magnus rows and prod empty mark emphasis.

### P1 — Missing subviews (depth)

5. **Skill detail / “Use skill” → new chat** with skill context (parity with prod Skills depth).
6. **Routines empty + create sheet** (match prod empty copy pattern).
7. **Workspace interior** — chats/files placeholder scoped to workspace.
8. **Channel members / about panel** (side drawer from messaging header).
9. **Help → Academy-lite** — course outline cards linking FAQ (without inventing unobserved lesson content).

### P2 — Consistency cleanups

10. Shared **skeleton** components using glass tokens (replace plain “Loading…”).
11. Align **CalendarView** chrome with Home PageHeader spacing + AvailabilityCalendar density where sensible.
12. **Catalog empty states** (no skills filtered, no integrations connected) using same empty language as feed/approvals.
13. Remove or restyle unused **PlaceholderPage** to match Home glass language if kept.
14. Optional **Knowledge** mock route if intranet search needs a dedicated surface (prod has `/knowledge`).

### Explicit non-goals for next builds

- Real Microsoft SSO or production data scrape.
- Pixel clone of prod cyan logo treatment without design decision (local monochrome system is intentional).
- Claiming Slack channels exist on production Magnus without observation.

---

## 6. Source map (for verification)

Routes under `src/app` (16 pages):

```
/  /approvals  /calendar  /comms  /feed  /help  /integrations
/messages  /notifications  /people  /people/[id]  /routines
/search  /settings  /skills  /workspaces
```

Key type gap: `src/types/messaging.ts` → `Conversation` lacks image fields; `TeamAuthor` has optional `avatarUrl`.

---

*End of analysis deliverable.*
