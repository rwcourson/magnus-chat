import type { AppUser, ChatThread } from "@/types/chat";

export const currentUser: AppUser = {
  name: "Robert Courson",
  initials: "RC",
  /** Demo: leadership / IC Insights desk */
  capabilities: ["insights"],
};

/**
 * Re-apply seed-only meta (e.g. `private`) onto chats restored from localStorage.
 * Only fills missing flags so an explicit user toggle to false is preserved.
 */
export function mergeSeedChatMeta(
  saved: ChatThread[],
  seed: ChatThread[] = initialChats
): ChatThread[] {
  const seedById = new Map(seed.map((c) => [c.id, c]));
  return saved.map((c) => {
    const s = seedById.get(c.id);
    if (!s) return c;
    if (s.private === true && typeof c.private !== "boolean") {
      return { ...c, private: true };
    }
    return c;
  });
}

export const initialChats: ChatThread[] = [
  {
    id: "cal-1",
    title: "James Courson availability",
    preview: "B&G calendar · Innovation Manager",
    updatedAt: "2026-07-23T18:30:00Z",
    private: true,
    messages: [
      {
        id: "cal-u1",
        role: "user",
        content: "When is James Courson free?",
        createdAt: "2026-07-23T18:28:00Z",
      },
      {
        id: "cal-a1",
        role: "assistant",
        content: "Here’s James’s week.",
        createdAt: "2026-07-23T18:28:20Z",
        blocks: [
          { type: "research", label: "Did some research" },
          {
            type: "schedule",
            data: {
              person: {
                name: "James Courson",
                title: "Innovation Manager",
                office: "Birmingham",
                email: "jcourson@brasfieldgorrie.com",
                initials: "JC",
                // Professional portrait (stable stock headshot)
                imageUrl:
                  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=256&h=256&fit=crop&crop=faces",
              },
              timezone: "CDT",
              rangeLabel: "Jul 20 – Jul 24",
              todayIndex: 3,
              days: [
                {
                  date: "2026-07-20",
                  weekday: "MON",
                  dayNum: 20,
                  events: [
                    {
                      id: "m1",
                      title: "Project sync hold",
                      start: "9:45 AM",
                      end: "10 AM",
                      status: "tentative",
                    },
                    {
                      id: "m2",
                      title: "Vendor review",
                      start: "1 PM",
                      end: "2:30 PM",
                      status: "tentative",
                    },
                  ],
                },
                {
                  date: "2026-07-21",
                  weekday: "TUE",
                  dayNum: 21,
                  events: [
                    {
                      id: "t1",
                      title: "Innovation standup",
                      start: "9 AM",
                      end: "10 AM",
                      status: "tentative",
                    },
                  ],
                },
                {
                  date: "2026-07-22",
                  weekday: "WED",
                  dayNum: 22,
                  events: [
                    {
                      id: "w1",
                      title: "Leadership briefing",
                      start: "12 PM",
                      end: "12:30 PM",
                      status: "busy",
                    },
                  ],
                },
                {
                  date: "2026-07-23",
                  weekday: "THU",
                  dayNum: 23,
                  events: [
                    {
                      id: "th1",
                      title: "Quick sync",
                      start: "10 AM",
                      end: "10:15 AM",
                      status: "tentative",
                    },
                  ],
                },
                {
                  date: "2026-07-24",
                  weekday: "FRI",
                  dayNum: 24,
                  events: [
                    {
                      id: "f1",
                      title: "Field visit hold",
                      start: "8 AM",
                      end: "9 AM",
                      status: "tentative",
                    },
                    {
                      id: "f2",
                      title: "Deep work block",
                      start: "9 AM",
                      end: "1 PM",
                      status: "tentative",
                    },
                  ],
                },
              ],
              openWindows: [
                {
                  id: "ow1",
                  label: "Thu after 10:15 AM",
                  detail: "Best today · CDT",
                  dayIndex: 3,
                },
                {
                  id: "ow2",
                  label: "Wed morning",
                  detail: "Before noon busy",
                  dayIndex: 2,
                },
                {
                  id: "ow3",
                  label: "Tue after 10 AM",
                  detail: "Light afternoon",
                  dayIndex: 1,
                },
                {
                  id: "ow4",
                  label: "Mon 10 AM–1 PM",
                  detail: "Between holds",
                  dayIndex: 0,
                },
              ],
              actions: [
                { id: "teams", label: "Teams", kind: "teams" },
                {
                  id: "email",
                  label: "Email",
                  kind: "email",
                  value: "jcourson@brasfieldgorrie.com",
                },
                { id: "invite", label: "Invite", kind: "invite" },
              ],
            },
          },
          {
            type: "text",
            content:
              "Free after 10:15 AM today. Soft holds the rest of the week — pick an open window to book.",
          },
        ],
        followUps: [
          "Find a mutual time with my calendar",
          "Draft a meeting invite for Thursday afternoon",
          "Show next week instead",
        ],
      },
    ],
  },
  {
    id: "1",
    title: "Magnus architecture ownership",
    preview: "Governance paths and platform owners",
    updatedAt: "2026-07-22T18:00:00Z",
    messages: [
      {
        id: "1-u1",
        role: "user",
        content:
          "Who owns the Magnus platform architecture, and where should I look for governance docs?",
        createdAt: "2026-07-22T18:01:00Z",
      },
      {
        id: "1-a1",
        role: "assistant",
        content:
          "For Magnus platform architecture, ownership sits with the platform architecture team, while governance documentation lives in B&G knowledge and the internal wiki.",
        createdAt: "2026-07-22T18:01:15Z",
        blocks: [
          {
            type: "text",
            content:
              "Here's a practical map of ownership, docs, and how to move forward without guessing from stale org charts.",
          },
          {
            type: "section",
            title: "Where to start",
            body: "Search B&G knowledge for “Magnus governance” for approval paths, change control, and standards. Confirm live owners with platform architecture before structural decisions.",
          },
          {
            type: "cards",
            items: [
              {
                title: "Platform Architecture",
                description: "Owns system design, ADRs, and cross-service standards.",
                meta: "Primary owner",
                badge: "Core",
              },
              {
                title: "B&G Knowledge",
                description: "Canonical governance docs, templates, and playbooks.",
                meta: "Documentation",
                badge: "Docs",
              },
              {
                title: "Change Control Board",
                description: "Reviews high-impact platform changes and risk exceptions.",
                meta: "Approvals",
                badge: "Process",
              },
            ],
          },
          {
            type: "list",
            ordered: true,
            items: [
              "Pull the latest governance pack from B&G knowledge",
              "Confirm named owners for the subsystem you care about",
              "Send a short note before any structural decision",
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Tip",
            content:
              "I can draft outreach to platform owners or dig into a specific policy section if you want to go deeper.",
          },
        ],
        followUps: [
          "Search for Magnus governance documentation",
          "Find the Magnus platform owners",
          "Draft an outreach email",
        ],
      },
    ],
  },
  {
    id: "2",
    title: "Q2 project schedule risks",
    preview: "Lead times, RFIs, weather contingency",
    updatedAt: "2026-07-21T14:20:00Z",
    messages: [
      {
        id: "2-u1",
        role: "user",
        content: "Summarize risks on the Q2 project schedule.",
        createdAt: "2026-07-21T14:20:00Z",
      },
      {
        id: "2-a1",
        role: "assistant",
        content:
          "Top Q2 risks center on long-lead materials, RFI lag, and weather on exterior packages.",
        createdAt: "2026-07-21T14:20:20Z",
        blocks: [
          {
            type: "text",
            content:
              "Here's a field-ready risk snapshot for Q2. Severity is based on schedule float and likelihood from recent PM updates.",
          },
          {
            type: "stats",
            items: [
              { label: "Critical risks", value: "3", hint: "Need weekly review" },
              { label: "Days of float", value: "6", hint: "Across critical path" },
              { label: "Open RFIs", value: "14", hint: "Avg age 9 days" },
            ],
          },
          {
            type: "cards",
            items: [
              {
                title: "Long-lead materials",
                description:
                  "Subcontractor lead times on switchgear and curtain wall still threaten mid-quarter milestones.",
                meta: "High · Procurement",
                badge: "Critical",
              },
              {
                title: "Foundation RFIs",
                description:
                  "Late RFI responses on foundation packages are compressing rebar and pour sequences.",
                meta: "High · Design",
                badge: "Critical",
              },
              {
                title: "Exterior weather",
                description:
                  "Limited contingency on envelope work — recommend a 2-week lookahead with trade partners.",
                meta: "Medium · Field",
                badge: "Watch",
              },
            ],
          },
          {
            type: "section",
            title: "Recommended cadence",
            body: "Run a weekly risk register with PMs and share a 2-week lookahead every Friday with trade partners. Escalate any item that burns more than 2 days of float.",
          },
          {
            type: "callout",
            tone: "warn",
            title: "Attention",
            content:
              "If switchgear slips past the procurement gate this week, re-baseline the mid-quarter energization milestone.",
          },
        ],
        followUps: [
          "Draft a risk register email",
          "List long-lead items",
          "Build a 2-week lookahead outline",
        ],
      },
    ],
  },
  {
    id: "3",
    title: "Fall protection toolbox talk",
    preview: "5-minute site safety brief",
    updatedAt: "2026-07-20T09:10:00Z",
    messages: [
      {
        id: "3-u1",
        role: "user",
        content: "Write a 5-minute toolbox talk on fall protection.",
        createdAt: "2026-07-20T09:10:00Z",
      },
      {
        id: "3-a1",
        role: "assistant",
        content:
          "A concise fall protection toolbox talk covering controls, inspection, anchors, and stop-work.",
        createdAt: "2026-07-20T09:10:30Z",
        blocks: [
          {
            type: "text",
            content:
              "Here's a 5-minute toolbox talk you can deliver as-is. Keep the close-out on three field checks before anyone works near an open edge.",
          },
          {
            type: "section",
            title: "1. Hierarchy of controls (60s)",
            body: "Eliminate the fall hazard first (cover, guardrail). Use personal fall arrest only when higher controls aren't feasible. Never treat a harness as a convenience.",
          },
          {
            type: "section",
            title: "2. Harness inspection (90s)",
            body: "Check webbing, stitching, D-rings, and labels. Any cut, fray, chemical damage, or missing tag = tag out and replace. If you're unsure, don't wear it.",
          },
          {
            type: "section",
            title: "3. Anchors & use (90s)",
            body: "Anchor above the worker when possible, rated for the load, and free of swing-fall hazards. Maintain 100% tie-off when moving at height.",
          },
          {
            type: "callout",
            tone: "success",
            title: "Three field checks",
            content:
              "1) Guardrails or covers in place · 2) Harness inspected today · 3) Anchor verified before stepping out",
          },
          {
            type: "list",
            items: [
              "Who inspected harnesses this morning?",
              "Where are today's designated anchors?",
              "What's the stop-work signal if something looks wrong?",
            ],
          },
        ],
        followUps: [
          "Make this a one-page handout",
          "Add Spanish translation notes",
          "Add a checklist for supervisors",
        ],
      },
    ],
  },
  {
    id: "4",
    title: "Submittal process FAQ",
    preview: "Review SLAs and routing",
    updatedAt: "2026-07-18T16:45:00Z",
    messages: [
      {
        id: "4-u1",
        role: "user",
        content: "What's the standard submittal review SLA?",
        createdAt: "2026-07-18T16:45:00Z",
      },
      {
        id: "4-a1",
        role: "assistant",
        content:
          "Standard SLA is 10 business days; complex engineered packages are typically 15.",
        createdAt: "2026-07-18T16:45:25Z",
        blocks: [
          {
            type: "text",
            content:
              "Always confirm against the project's front-end documents — contract language wins when it differs from the defaults below.",
          },
          {
            type: "stats",
            items: [
              { label: "Standard", value: "10d", hint: "Business days" },
              { label: "Engineered", value: "15d", hint: "Complex packages" },
              { label: "Resubmittal", value: "7d", hint: "Typical target" },
            ],
          },
          {
            type: "cards",
            items: [
              {
                title: "Shop drawings",
                description: "Route through discipline lead → design team → GC log.",
                meta: "10 business days",
              },
              {
                title: "Product data",
                description: "Often faster when pre-approved product list applies.",
                meta: "5–10 days",
              },
              {
                title: "Engineering calcs",
                description: "Allow full engineered SLA; flag early if peer review is required.",
                meta: "15 business days",
              },
            ],
          },
          {
            type: "callout",
            tone: "info",
            content:
              "Log received date in the submittal tracker the same day — SLA clocks usually start on complete packages only.",
          },
        ],
        followUps: [
          "Show the submittal routing diagram",
          "Draft a late-submittal reminder",
          "List common rejection reasons",
        ],
      },
    ],
  },
  {
    id: "5",
    title: "B&G knowledge search tips",
    preview: "Filters, phrases, and noise reduction",
    updatedAt: "2026-07-15T11:00:00Z",
    messages: [
      {
        id: "5-u1",
        role: "user",
        content: "How do I search B&G knowledge effectively?",
        createdAt: "2026-07-15T11:00:00Z",
      },
      {
        id: "5-a1",
        role: "assistant",
        content:
          "Use precise project codes, discipline keywords, and document-type filters.",
        createdAt: "2026-07-15T11:00:18Z",
        blocks: [
          {
            type: "section",
            title: "Query style",
            body: "Prefer short noun phrases over full sentences — e.g. “concrete mix design template” — then refine with office, date, or doc type.",
          },
          {
            type: "list",
            ordered: true,
            items: [
              "Start with project code + discipline",
              "Add document type (spec, checklist, template)",
              "Filter by office or last updated if results are noisy",
              "Open the highest-trust source first (standards > drafts)",
            ],
          },
          {
            type: "cards",
            items: [
              {
                title: "High signal",
                description: "Project code · discipline · doc type",
                badge: "Do",
              },
              {
                title: "Low signal",
                description: "Long conversational questions without filters",
                badge: "Avoid",
              },
            ],
          },
        ],
        followUps: [
          "Give example queries for safety",
          "How do I find superseded docs?",
        ],
      },
    ],
  },
  {
    id: "6",
    title: "Weekly standup digest",
    preview: "Wins, blockers, and asks",
    updatedAt: "2026-07-14T08:30:00Z",
    messages: [
      {
        id: "6-u1",
        role: "user",
        content: "Turn yesterday's notes into a standup digest for leadership.",
        createdAt: "2026-07-14T08:30:00Z",
      },
      {
        id: "6-a1",
        role: "assistant",
        content: "Leadership-ready standup digest with wins, blockers, and asks.",
        createdAt: "2026-07-14T08:30:40Z",
        blocks: [
          {
            type: "text",
            content:
              "Digest for week of Jul 14. Tone is executive-brief — three sections, no filler.",
          },
          {
            type: "section",
            title: "Wins",
            body: "Envelope package unlocked after AE clarification. Safety observations down 18% week-over-week. Magnus chat pilot expanded to two more project teams.",
          },
          {
            type: "section",
            title: "Blockers",
            body: "Waiting on owner decision for alternate switchgear. Two open change orders still lack pricing from trade partners.",
          },
          {
            type: "cards",
            items: [
              {
                title: "Ask · Owner",
                description: "Decision on switchgear alternate by Friday EOD.",
                meta: "Priority 1",
                badge: "Ask",
              },
              {
                title: "Ask · Procurement",
                description: "Confirm curtain wall ship date with vendor.",
                meta: "Priority 2",
                badge: "Ask",
              },
            ],
          },
          {
            type: "callout",
            tone: "success",
            content: "No new critical safety incidents reported this period.",
          },
        ],
        followUps: [
          "Format this as an email",
          "Add last week's carryover items",
        ],
      },
    ],
  },
  {
    id: "7",
    title: "RFI response draft",
    preview: "Clear, contract-aware reply",
    updatedAt: "2026-07-12T15:00:00Z",
    private: true,
    messages: [
      {
        id: "7-u1",
        role: "user",
        content:
          "Draft a professional RFI response about slab edge condition at grid line C.",
        createdAt: "2026-07-12T15:00:00Z",
      },
      {
        id: "7-a1",
        role: "assistant",
        content: "Draft RFI response for slab edge condition at grid C.",
        createdAt: "2026-07-12T15:00:35Z",
        blocks: [
          {
            type: "section",
            title: "Subject",
            body: "RFI-084 — Slab edge condition at Grid C / Level 3",
          },
          {
            type: "section",
            title: "Response body",
            body: "Please proceed with a 2\" continuous pour-stop at Grid C Level 3 per detail 5/S-401. Edge reinforcement remains as shown on S-302. No change to camber or finish tolerance. Confirm formwork layout with the structural PE before the next pour.",
          },
          {
            type: "list",
            items: [
              "Reference: detail 5/S-401",
              "No cost / time impact anticipated",
              "Field verify pour-stop material with approved submittal",
            ],
          },
          {
            type: "callout",
            tone: "info",
            title: "Attachments to include",
            content: "Marked-up S-401 excerpt · photo of existing edge condition · pour schedule snippet",
          },
        ],
        followUps: [
          "Make the tone more formal",
          "Add cost-impact language",
          "Generate a one-line log entry",
        ],
      },
    ],
  },
  {
    id: "8",
    title: "Site logistics plan",
    preview: "Gates, laydown, crane paths",
    updatedAt: "2026-07-10T12:00:00Z",
    messages: [
      {
        id: "8-u1",
        role: "user",
        content: "Outline a temporary site logistics plan for the downtown tower.",
        createdAt: "2026-07-10T12:00:00Z",
      },
      {
        id: "8-a1",
        role: "assistant",
        content: "Temporary logistics plan covering access, laydown, and crane swing.",
        createdAt: "2026-07-10T12:00:45Z",
        blocks: [
          {
            type: "stats",
            items: [
              { label: "Gates", value: "3", hint: "1 pedestrian" },
              { label: "Laydown zones", value: "4", hint: "Color-coded" },
              { label: "Crane radius", value: "180′", hint: "Tower crane A" },
            ],
          },
          {
            type: "cards",
            items: [
              {
                title: "Gate A — Truck",
                description: "Primary material entry on 5th Ave. Timed deliveries 6–9am and 1–3pm.",
                meta: "Heavy vehicles",
              },
              {
                title: "Gate B — Pedestrian",
                description: "Badge-only worker entry. Separate from public sidewalk flow.",
                meta: "Workforce",
              },
              {
                title: "Laydown North",
                description: "Rebar and formwork only. Keep fire lane clear at all times.",
                meta: "Materials",
              },
              {
                title: "Crane exclusion",
                description: "No occupied work under live pick path without lift plan.",
                meta: "Safety",
                badge: "Critical",
              },
            ],
          },
          {
            type: "section",
            title: "Communication",
            body: "Post gate schedule on the site board daily. Notify adjacent property managers 48 hours before oversized deliveries.",
          },
        ],
        followUps: [
          "Turn this into a one-page site map legend",
          "Add night-work constraints",
        ],
      },
    ],
  },
  {
    id: "9",
    title: "Change order summary",
    preview: "COR package for owner review",
    private: true,
    updatedAt: "2026-07-08T17:20:00Z",
    messages: [
      {
        id: "9-u1",
        role: "user",
        content: "Summarize open change orders for the owner meeting.",
        createdAt: "2026-07-08T17:20:00Z",
      },
      {
        id: "9-a1",
        role: "assistant",
        content: "Owner-ready COR summary with totals and status.",
        createdAt: "2026-07-08T17:20:30Z",
        blocks: [
          {
            type: "stats",
            items: [
              { label: "Open CORs", value: "7", hint: "3 need decision" },
              { label: "Requested $", value: "$412k", hint: "Gross" },
              { label: "Days pending", value: "11", hint: "Oldest COR" },
            ],
          },
          {
            type: "cards",
            items: [
              {
                title: "COR-22 · MEP shaft revision",
                description: "Owner-directed redesign of Level 4 shaft. Pricing complete.",
                meta: "$186k · Awaiting approval",
                badge: "Decision",
              },
              {
                title: "COR-19 · Soil over-excavation",
                description: "Unforeseen condition at Grid B. Third-party letter attached.",
                meta: "$94k · Under review",
                badge: "Review",
              },
              {
                title: "COR-17 · Finish upgrade",
                description: "Lobby stone allowance upgrade. Optional — not critical path.",
                meta: "$72k · Optional",
                badge: "Optional",
              },
            ],
          },
          {
            type: "callout",
            tone: "warn",
            title: "Meeting goal",
            content:
              "Secure written direction on COR-22 this week to protect the Level 4 rough-in sequence.",
          },
        ],
        followUps: [
          "Draft owner meeting talking points",
          "Export a table for slides",
        ],
      },
    ],
  },
  {
    id: "10",
    title: "Onboarding Magnus users",
    preview: "First-week enablement plan",
    updatedAt: "2026-07-05T10:00:00Z",
    messages: [
      {
        id: "10-u1",
        role: "user",
        content: "Create a first-week onboarding plan for new Magnus users.",
        createdAt: "2026-07-05T10:00:00Z",
      },
      {
        id: "10-a1",
        role: "assistant",
        content: "A practical first-week enablement plan for Magnus.",
        createdAt: "2026-07-05T10:00:40Z",
        blocks: [
          {
            type: "text",
            content:
              "Keep onboarding task-based, not feature tours. Each day ends with one real work outcome.",
          },
          {
            type: "cards",
            items: [
              {
                title: "Day 1 · Orientation",
                description: "Account setup, model selection, slash commands, and User Guide walkthrough.",
                meta: "30–45 min",
              },
              {
                title: "Day 2 · Knowledge",
                description: "Run three B&G knowledge searches tied to their project.",
                meta: "Practice",
              },
              {
                title: "Day 3 · Field use",
                description: "Draft a toolbox talk or RFI with Magnus; peer review output.",
                meta: "Apply",
              },
              {
                title: "Day 5 · Habits",
                description: "Pin routines, connect integrations, set a weekly standup digest.",
                meta: "Embed",
              },
            ],
          },
          {
            type: "list",
            ordered: true,
            items: [
              "Assign a Magnus buddy for the first five days",
              "Collect one “saved me time” example by Friday",
              "Review privacy / data handling expectations",
            ],
          },
          {
            type: "callout",
            tone: "success",
            content:
              "Success metric: new users complete two real project tasks with Magnus by end of week one.",
          },
        ],
        followUps: [
          "Write the Day 1 checklist",
          "Suggest three practice prompts",
        ],
      },
    ],
  },
];

export const mockAssistantReplies = [
  "I've looked across B&G knowledge and general best practice for this. Here's a clear take you can act on right away — and I can go deeper on any section you want.",
  "Good question. Here's a structured answer based on typical Magnus / B&G workflows. Let me know if you'd like sources or a draft you can share with the team.",
  "Here's what I'd recommend. This balances speed with the governance expectations most platform owners care about.",
];
