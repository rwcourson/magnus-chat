import type { ActionTile, NewsStory } from "@/types/home";

/**
 * Hero news for the intranet home carousel (above the fold).
 * Photo-forward — channel consensus: news must not be buried.
 */
export const newsStories: NewsStory[] = [
  {
    id: "ns-1",
    title: "Q3 safety milestone: TRIR down another 12%",
    summary:
      "Field teams keep stacking clean observations in Magnus. Every report feeds the same playbook — keep looking out for each other.",
    category: "Safety",
    imageUrl:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=640&fit=crop",
    href: "/feed",
    timeLabel: "2h",
    reason: "Popular with your division",
  },
  {
    id: "ns-2",
    title: "Downtown tower — envelope package cleared",
    summary:
      "Week 28 update: AE comments closed. Crane picks shift north laydown Friday 6–9 AM. Logistics map lives in Workspaces.",
    category: "Project",
    imageUrl:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&h=640&fit=crop",
    href: "/feed",
    timeLabel: "4h",
    reason: "Your project team reacted",
  },
  {
    id: "ns-3",
    title: "Toolbox talk of the week: fall protection",
    summary:
      "5-minute morning huddle version is live, plus Spanish notes. Use /safety in chat to pull it on site.",
    category: "EH&S",
    imageUrl:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&h=640&fit=crop",
    href: "/feed",
    timeLabel: "Yesterday",
  },
  {
    id: "ns-4",
    title: "Magnus onboarding cohort — mentors needed",
    summary:
      "New hires get a Day-1 walkthrough this month. Claim a buddy slot before Friday so we can pair project-side champions.",
    category: "People",
    imageUrl:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=640&fit=crop",
    href: "/feed",
    timeLabel: "2d",
  },
];

/**
 * Intelligent action tiles — Emily / Russ feedback:
 * badges beat dead links (OnBase, Concur, SuccessFactors, LRP).
 */
export const actionTiles: ActionTile[] = [
  {
    id: "onbase",
    label: "OnBase",
    detail: "Invoices to approve",
    badge: 2,
    href: "/approvals?source=onbase",
    mark: "OB",
    logoUrl: "/integrations/onbase.svg",
    brandColor: "#C45C2A",
    accent: "from-[#3d4f6f] to-[#1e2838]",
  },
  {
    id: "concur",
    label: "Concur",
    detail: "Expense reports",
    badge: 3,
    href: "/approvals?source=concur",
    mark: "C",
    logoUrl: "/integrations/concur.svg",
    brandColor: "#0FAAFF",
    accent: "from-[#4a5d4a] to-[#243028]",
  },
  {
    id: "successfactors",
    label: "SuccessFactors",
    detail: "Performance review",
    badge: 1,
    href: "/approvals?source=successfactors",
    mark: "SF",
    logoUrl: "/integrations/successfactors.svg",
    brandColor: "#008FD3",
    accent: "from-[#5c4a3d] to-[#2e241c]",
  },
  {
    id: "lrp",
    label: "Long Range Plan",
    detail: "Updated this month",
    href: "/workspaces",
    mark: "LR",
    logoUrl: "/integrations/lrp.svg",
    brandColor: "#1e3a5f",
    accent: "from-[#3d4558] to-[#1c2030]",
  },
];

/** Default favorites for chat-mode sidebar (Hittie / Rickey). */
export const defaultFavorites = [
  {
    id: "fav-safety",
    label: "Safety brief",
    href: "/skills",
    detail: "Skill",
  },
  {
    id: "fav-rfi",
    label: "Draft RFI",
    href: "/skills",
    detail: "Skill",
  },
  {
    id: "fav-standup",
    label: "Morning standup",
    href: "/routines",
    detail: "Routine",
  },
  {
    id: "fav-knowledge",
    label: "B&G Knowledge",
    href: "/integrations",
    detail: "Tool",
  },
] as const;
