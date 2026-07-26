import type {
  HeadlineDraft,
  LeadershipInsight,
  ScoutActivitySummary,
  ScoutSignal,
} from "@/types/scout";

/** Demo persona used to personalize Catch me up (Robert Courson). */
export const demoCatchUpPersona = {
  firstName: "Robert",
  fullName: "Robert Courson",
  projects: ["Downtown tower"] as const,
  office: "Birmingham",
  beats: ["safety", "project", "innovation"] as const,
};

/**
 * Demo scout signals — high-signal first.
 * Catch me up ranks + personalizes; Comms reviews only story-worthy drafts.
 */
export const scoutSignals: ScoutSignal[] = [
  {
    id: "sig-downtown-envelope",
    signalClass: "project",
    title: "Downtown tower — envelope package cleared",
    summary:
      "Week 28: AE comments closed. Crane picks shift north laydown Friday 6–9 AM.",
    whyNow: "Approval + Friday crane window both landed in the last 48 hours.",
    whoCares: "Downtown tower team, logistics, neighboring trades.",
    sources: [
      { label: "Procore", href: "/integrations" },
      { label: "Project feed", href: "/feed" },
    ],
    confidence: "high",
    category: "Project",
    imageUrl:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&h=640&fit=crop",
    timeLabel: "4h",
    window: "yesterday",
    rank: 1,
    forYou: "Your project · Downtown tower",
  },
  {
    id: "sig-safety-trir",
    signalClass: "safety",
    title: "Q3 safety: TRIR down another 12%",
    summary:
      "Field teams stacking clean observations. Division TRIR moved another 12% this quarter.",
    whyNow: "Clean observation streak across four major jobs this week.",
    whoCares: "Field + EH&S; Monday crew briefs.",
    sources: [
      { label: "EH&S", href: "/feed" },
      { label: "Feed", href: "/feed" },
    ],
    confidence: "high",
    category: "Safety",
    imageUrl:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=640&fit=crop",
    timeLabel: "2h",
    window: "week",
    rank: 2,
    forYou: "Worth a mention in Monday huddles",
  },
  {
    id: "sig-toolbox-fall",
    signalClass: "safety",
    title: "Fall protection toolbox is the week’s most-pulled pack",
    summary:
      "5-minute huddle version + Spanish notes. Supers are reusing it hard.",
    whyNow: "Highest toolbox reuse this week; ES notes just attached.",
    whoCares: "Superintendents, bilingual crews, EH&S.",
    sources: [
      { label: "EH&S", href: "/feed" },
      { label: "Knowledge", href: "/workspaces" },
    ],
    confidence: "high",
    category: "EH&S",
    imageUrl:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&h=640&fit=crop",
    timeLabel: "Yesterday",
    window: "week",
    rank: 3,
    forYou: "Ready to pull on site via /safety",
  },
  {
    id: "sig-onboarding-mentors",
    signalClass: "people",
    title: "Magnus cohort still needs mentors before Friday",
    summary:
      "Day-1 walkthroughs this month. Buddy slots open — good fit for project-side champions.",
    whyNow: "Deadline this Friday; feed ask still open across offices.",
    whoCares: "Project champions, HR, Magnus power users.",
    sources: [
      { label: "Feed", href: "/feed" },
      { label: "People", href: "/people" },
    ],
    confidence: "medium",
    category: "People",
    imageUrl:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=640&fit=crop",
    timeLabel: "2d",
    window: "week",
    rank: 4,
    forYou: "Optional — if you can spare a buddy slot",
  },
  {
    id: "sig-knowledge-submittal",
    signalClass: "knowledge",
    title: "Submittal SLA is the week’s top knowledge pull",
    summary:
      "Same timing questions across three offices — strong tip-of-the-week candidate.",
    whyNow: "Repeated chat questions, three offices.",
    whoCares: "PMs, project engineers, knowledge owners.",
    sources: [
      { label: "Knowledge", href: "/workspaces" },
      { label: "Skills", href: "/skills" },
    ],
    confidence: "medium",
    category: "Knowledge",
    imageUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=640&fit=crop",
    timeLabel: "3d",
    window: "week",
    rank: 5,
  },
  {
    id: "sig-ops-approvals",
    signalClass: "ops",
    title: "Approval backlogs easing after mid-month surge",
    summary:
      "OnBase + Concur queues down ~30% week over week — ops pattern, not a task list.",
    whyNow: "Clear week-over-week pattern, not one-off invoices.",
    whoCares: "Ops leads, controllers.",
    sources: [
      { label: "OnBase", href: "/integrations" },
      { label: "Concur", href: "/integrations" },
    ],
    confidence: "low",
    category: "Ops",
    imageUrl:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=640&fit=crop",
    timeLabel: "1d",
    window: "week",
    rank: 6,
  },
  {
    id: "sig-silence-nightshift",
    signalClass: "silence",
    title: "Night-shift fatigue is quiet on the company feed",
    summary:
      "Two near-miss notes this month reference fatigue; company feed has zero posts on night-shift recovery.",
    whyNow: "Safety notes and social surface are out of sync.",
    whoCares: "EH&S leadership, field ops, Internal Comms.",
    sources: [
      { label: "Safety notes", href: "/feed" },
      { label: "Company feed", href: "/feed" },
    ],
    confidence: "medium",
    category: "Silence",
    imageUrl:
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&h=640&fit=crop",
    timeLabel: "5d",
    window: "week",
    rank: 7,
    sensitive: true,
  },
];

/**
 * Leadership pulse — company-level elevation for Insights.
 * Includes wins, themes, ops pattern, and silence (not all story-ready).
 */
export const seedLeadershipPulse: LeadershipInsight[] = [
  {
    id: "pulse-1",
    signalId: "sig-safety-trir",
    signalClass: "safety",
    title: "Q3 safety: TRIR down another 12%",
    takeaway: "Clean observation streaks stacking across four major jobs.",
    whyItMatters:
      "Company-wide safety win worth leadership visibility — field is already talking about it.",
    evidence: [
      {
        label: "EH&S",
        snippet: "TRIR −12% QoQ; clean streaks on 4 major jobs.",
        href: "/feed",
      },
      {
        label: "Feed",
        snippet: "Strong reactions from supers on the milestone post.",
        href: "/feed",
      },
    ],
    confidence: "high",
    category: "Safety",
    timeLabel: "2h",
    surfacesLabel: "Seen across 3 surfaces",
    storyReady: true,
  },
  {
    id: "pulse-2",
    signalId: "sig-downtown-envelope",
    signalClass: "project",
    title: "Downtown tower — envelope package cleared",
    takeaway: "AE comments closed; Friday crane window locked.",
    whyItMatters:
      "Flagship job milestone with logistics impact Friday — neighboring trades will feel it.",
    evidence: [
      {
        label: "Procore",
        snippet: "Envelope package → Approved; AE comments closed.",
        href: "/integrations",
      },
      {
        label: "#downtown-tower",
        snippet: "Week 28 update with crane window details.",
        href: "/messages",
      },
    ],
    confidence: "high",
    category: "Project",
    timeLabel: "4h",
    surfacesLabel: "Seen across 2 surfaces",
    storyReady: true,
  },
  {
    id: "pulse-3",
    signalId: "sig-knowledge-submittal",
    signalClass: "knowledge",
    title: "Submittal SLA is the week’s top knowledge pull",
    takeaway: "Same timing questions across three offices.",
    whyItMatters:
      "Repeated Magnus + knowledge hits signal a training gap — tip-of-the-week candidate.",
    evidence: [
      {
        label: "Knowledge",
        snippet: "Submittal review SLA pack: highest reuse this week.",
        href: "/workspaces",
      },
      {
        label: "Magnus chats",
        snippet: "12 similar questions from PMs in ATL, CLT, BHM.",
        href: "/",
      },
    ],
    confidence: "medium",
    category: "Knowledge",
    timeLabel: "3d",
    surfacesLabel: "Seen across 3 surfaces",
    storyReady: true,
  },
  {
    id: "pulse-4",
    signalId: "sig-ops-approvals",
    signalClass: "ops",
    title: "Approval backlogs easing after mid-month surge",
    takeaway: "OnBase + Concur queues down ~30% week over week.",
    whyItMatters:
      "Ops pattern for controllers — not a press story; good Monday leadership note.",
    evidence: [
      {
        label: "OnBase",
        snippet: "Pending queue −28% vs last week.",
        href: "/approvals",
      },
      {
        label: "Concur",
        snippet: "Expense queue −32% week over week.",
        href: "/approvals",
      },
    ],
    confidence: "low",
    category: "Ops",
    timeLabel: "1d",
    surfacesLabel: "Seen across 2 systems",
    storyReady: false,
    sensitive: false,
  },
  {
    id: "pulse-5",
    signalId: "sig-silence-nightshift",
    signalClass: "silence",
    title: "Night-shift fatigue is quiet on the company feed",
    takeaway:
      "Two near-miss notes reference fatigue; zero company-feed posts on recovery.",
    whyItMatters:
      "What isn’t being said may matter more than what’s trending — EH&S + IC should compare notes before a public push.",
    evidence: [
      {
        label: "Safety notes",
        snippet: "2 near-miss notes this month mention fatigue.",
        href: "/feed",
      },
      {
        label: "Company feed",
        snippet: "0 posts tagged night-shift or fatigue in 30 days.",
        href: "/feed",
      },
    ],
    confidence: "medium",
    category: "Silence",
    timeLabel: "5d",
    surfacesLabel: "Gap across 2 surfaces",
    storyReady: false,
    sensitive: true,
  },
  {
    id: "pulse-6",
    signalId: "sig-onboarding-mentors",
    signalClass: "people",
    title: "Magnus cohort still needs mentors before Friday",
    takeaway: "Buddy slots open for project-side champions.",
    whyItMatters:
      "Culture + platform adoption — light lift if leaders open a slot or ask teams to.",
    evidence: [
      {
        label: "Feed",
        snippet: "Open ask for Day-1 walkthrough buddies.",
        href: "/feed",
      },
      {
        label: "People",
        snippet: "Cohort roster still short on field mentors.",
        href: "/people",
      },
    ],
    confidence: "medium",
    category: "People",
    timeLabel: "2d",
    surfacesLabel: "Seen across 2 surfaces",
    storyReady: true,
  },
];

/** Header strip for Insights — reinforces always-on scout. */
export const seedScoutActivity: ScoutActivitySummary = {
  windowLabel: "This week",
  scannedCount: 48,
  elevatedCount: 6,
  storyDraftsReady: 4,
  surfacesLabel: "feed, channels, knowledge & systems",
  lastScanLabel: "Just now",
};

/**
 * Story desk inbox — only story-worthy drafts (high / med).
 * Keep the queue short so review feels calm.
 */
export const seedHeadlineDrafts: HeadlineDraft[] = [
  {
    id: "draft-1",
    signalId: "sig-safety-trir",
    status: "pending",
    headline: "Q3 safety milestone: TRIR down another 12%",
    summary:
      "Field teams keep stacking clean observations. Every report feeds the same playbook — keep looking out for each other.",
    whySurfaced: "Company win · safety trend this quarter",
    evidence: [
      {
        label: "EH&S",
        snippet: "TRIR −12% QoQ; clean streaks on 4 major jobs.",
        href: "/feed",
      },
      {
        label: "Feed",
        snippet: "Strong reactions from supers on the milestone post.",
        href: "/feed",
      },
    ],
    confidence: "high",
    suggestedChannel: "carousel",
    category: "Safety",
    imageUrl:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=640&fit=crop",
    sources: [{ label: "EH&S" }, { label: "Feed" }],
    createdAt: "2026-07-23T14:00:00Z",
  },
  {
    id: "draft-2",
    signalId: "sig-downtown-envelope",
    status: "pending",
    headline: "Downtown tower — envelope package cleared",
    summary:
      "Week 28: AE comments closed. Crane picks shift north laydown Friday 6–9 AM.",
    whySurfaced: "Project milestone · logistics impact Friday",
    evidence: [
      {
        label: "Procore",
        snippet: "Envelope package → Approved; AE comments closed.",
        href: "/integrations",
      },
      {
        label: "Project feed",
        snippet: "Week 28 update with crane window details.",
        href: "/feed",
      },
    ],
    confidence: "high",
    suggestedChannel: "carousel",
    category: "Project",
    imageUrl:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&h=640&fit=crop",
    sources: [{ label: "Downtown tower" }, { label: "Procore" }],
    createdAt: "2026-07-23T12:30:00Z",
  },
  {
    id: "draft-3",
    signalId: "sig-toolbox-fall",
    status: "pending",
    headline: "Toolbox of the week: fall protection",
    summary:
      "5-minute morning huddle version is live, plus Spanish notes. Pull it on site with /safety.",
    whySurfaced: "High reuse · new Spanish notes",
    evidence: [
      {
        label: "Knowledge",
        snippet: "Fall protection pack: EN + ES notes attached.",
        href: "/workspaces",
      },
    ],
    confidence: "high",
    suggestedChannel: "carousel",
    category: "EH&S",
    imageUrl:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&h=640&fit=crop",
    sources: [{ label: "EH&S" }, { label: "Knowledge" }],
    createdAt: "2026-07-22T16:00:00Z",
  },
  {
    id: "draft-4",
    signalId: "sig-knowledge-submittal",
    status: "pending",
    headline: "Tip of the week: submittal review SLA",
    summary:
      "10 business days standard, 15 engineered. Same questions hit three offices — pull the cheat sheet before your next package.",
    whySurfaced: "Knowledge theme · multi-office repeat questions",
    evidence: [
      {
        label: "Knowledge",
        snippet: "Highest pack reuse this week across SE offices.",
        href: "/workspaces",
      },
      {
        label: "Magnus",
        snippet: "12 similar PM questions this week.",
        href: "/",
      },
    ],
    confidence: "medium",
    suggestedChannel: "feed",
    category: "Knowledge",
    imageUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=640&fit=crop",
    sources: [{ label: "Knowledge" }, { label: "Magnus" }],
    createdAt: "2026-07-22T11:00:00Z",
  },
];
