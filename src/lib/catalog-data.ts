import type {
  IntegrationItem,
  RoutineItem,
  SkillItem,
  WorkspaceItem,
} from "@/types/catalog";

/**
 * Local demo brand marks under /public/integrations.
 * PNG preferred for multi-color marks; files are checked by verify-catalog.
 */
const logo = (file: string) => `/integrations/${file}`;

export const integrations: IntegrationItem[] = [
  {
    id: "int-slack",
    name: "Slack",
    category: "Collaboration",
    description: "Surface channels and share Magnus digests to project rooms.",
    logoUrl: logo("slack.png"),
    brandColor: "#E01E5A",
    status: "connected",
  },
  {
    id: "int-teams",
    name: "Microsoft Teams",
    category: "Collaboration",
    description: "Meeting notes, chat context, and calendar handoff.",
    logoUrl: logo("teams.png"),
    brandColor: "#6264A7",
    status: "connected",
  },
  {
    id: "int-outlook",
    name: "Outlook",
    category: "Productivity",
    description: "Availability, free/busy, and meeting prep briefs.",
    logoUrl: logo("outlook.png"),
    brandColor: "#0078D4",
    status: "connected",
  },
  {
    id: "int-sharepoint",
    name: "SharePoint",
    category: "Knowledge",
    description: "Search site libraries and policy packs from chat.",
    logoUrl: logo("sharepoint.png"),
    brandColor: "#038387",
    status: "available",
  },
  {
    id: "int-onbase",
    name: "OnBase",
    category: "Finance",
    description: "Invoice approvals and document workflows.",
    logoUrl: logo("onbase.svg"),
    brandColor: "#C45C2A",
    status: "connected",
    badge: 2,
  },
  {
    id: "int-concur",
    name: "Concur",
    category: "Finance",
    description: "Expense reports waiting on your approval.",
    logoUrl: logo("concur.svg"),
    brandColor: "#0FAAFF",
    status: "connected",
    badge: 3,
  },
  {
    id: "int-sf",
    name: "SuccessFactors",
    category: "People",
    description: "Performance reviews and learning assignments.",
    logoUrl: logo("successfactors.svg"),
    brandColor: "#008FD3",
    status: "pending",
    badge: 1,
  },
  {
    id: "int-procore",
    name: "Procore",
    category: "Field",
    description: "RFIs, submittals, and daily logs on active jobs.",
    logoUrl: logo("procore.png"),
    brandColor: "#F5471B",
    status: "available",
  },
  {
    id: "int-box",
    name: "Box",
    category: "Knowledge",
    description: "Secure file access for estimating and legal packs.",
    logoUrl: logo("box.png"),
    brandColor: "#0061D5",
    status: "available",
  },
  {
    id: "int-github",
    name: "GitHub",
    category: "Engineering",
    description: "Repo context for platform and internal tools teams.",
    logoUrl: logo("github.png"),
    brandColor: "#24292F",
    status: "connected",
  },
  {
    id: "int-jira",
    name: "Jira",
    category: "Delivery",
    description: "Sprint status and ticket summaries in chat.",
    logoUrl: logo("jira.png"),
    brandColor: "#0052CC",
    status: "available",
  },
  {
    id: "int-powerbi",
    name: "Power BI",
    category: "Insights",
    description: "Dashboards for safety, cost, and schedule health.",
    logoUrl: logo("powerbi.svg"),
    brandColor: "#F2C811",
    status: "pending",
  },
];

export const skills: SkillItem[] = [
  {
    id: "sk-safety",
    name: "Safety brief",
    description:
      "Generate a 5-minute toolbox talk from EH&S topics and site conditions.",
    category: "Field",
    imageUrl:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=640&h=400&fit=crop",
    author: {
      name: "Safety Ops",
      initials: "SO",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces",
    },
    uses: 428,
    pinned: true,
  },
  {
    id: "sk-rfi",
    name: "Draft RFI",
    description:
      "Structure a clear RFI with spec references, photos, and suggested wording.",
    category: "Project",
    imageUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=640&h=400&fit=crop",
    author: {
      name: "Maya Chen",
      initials: "MC",
      avatarUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&h=128&fit=crop&crop=faces",
    },
    uses: 312,
    pinned: true,
  },
  {
    id: "sk-submittal",
    name: "Submittal SLA guide",
    description:
      "Pull review windows and routing tips from B&G Knowledge for your trade.",
    category: "Knowledge",
    imageUrl:
      "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=640&h=400&fit=crop",
    author: {
      name: "Priya Nair",
      initials: "PN",
      avatarUrl:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=128&h=128&fit=crop&crop=faces",
    },
    uses: 267,
  },
  {
    id: "sk-estimate",
    name: "Quantity takeoff assist",
    description:
      "Summarize scope packages and flag long-lead items from drawings notes.",
    category: "Estimating",
    imageUrl:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=640&h=400&fit=crop",
    author: {
      name: "Derek Walsh",
      initials: "DW",
      avatarUrl:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&crop=faces",
    },
    uses: 189,
  },
  {
    id: "sk-risk",
    name: "Risk register draft",
    description:
      "Cluster schedule risks and draft a PM-ready email before look-ahead.",
    category: "PMO",
    imageUrl:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&h=400&fit=crop",
    author: {
      name: "Magnus",
      initials: "M",
    },
    uses: 541,
    pinned: true,
  },
  {
    id: "sk-onboard",
    name: "New hire Day-1",
    description:
      "Walk a new teammate through Magnus, Connect, and project systems.",
    category: "People",
    imageUrl:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=640&h=400&fit=crop",
    author: {
      name: "People & Culture",
      initials: "PC",
      avatarUrl:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=128&h=128&fit=crop&crop=faces",
    },
    uses: 96,
  },
];

export const routines: RoutineItem[] = [
  {
    id: "rt-standup",
    name: "Morning standup",
    description:
      "Compile overnight field notes, weather, and open RFIs for your jobs.",
    schedule: "Weekdays · 6:30 AM",
    active: true,
    imageUrl:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=640&h=360&fit=crop",
    owner: {
      name: "Robert Courson",
      initials: "RC",
      avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&crop=faces",
    },
    lastRun: "Today · 6:31 AM",
  },
  {
    id: "rt-safety",
    name: "Weekly safety digest",
    description:
      "TRIR trend, open observations, and toolbox topic for the week.",
    schedule: "Mondays · 7:00 AM",
    active: true,
    imageUrl:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=640&h=360&fit=crop",
    owner: {
      name: "Safety Ops",
      initials: "SO",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces",
    },
    lastRun: "Mon · 7:02 AM",
  },
  {
    id: "rt-risk",
    name: "Q2 risk snapshot",
    description: "Critical path risks clustered for PM review before Friday.",
    schedule: "Fridays · 2:00 PM",
    active: true,
    imageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=640&h=360&fit=crop",
    owner: {
      name: "Maya Chen",
      initials: "MC",
      avatarUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&h=128&fit=crop&crop=faces",
    },
    lastRun: "Last Fri · 2:01 PM",
  },
  {
    id: "rt-expense",
    name: "Expense nudge",
    description: "Remind you of Concur items aging past policy windows.",
    schedule: "Wednesdays · 9:00 AM",
    active: false,
    imageUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=640&h=360&fit=crop",
    owner: {
      name: "Robert Courson",
      initials: "RC",
      avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&crop=faces",
    },
  },
];

export const workspaces: WorkspaceItem[] = [
  {
    id: "ws-tower",
    name: "Downtown tower",
    description: "Envelope, crane logistics, and trade coordination.",
    projectCode: "ATL-2841",
    coverUrl:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=480&fit=crop",
    members: [
      {
        name: "Maya Chen",
        initials: "MC",
        role: "Senior PM",
        avatarUrl:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&h=128&fit=crop&crop=faces",
      },
      {
        name: "Derek Walsh",
        initials: "DW",
        role: "Superintendent",
        avatarUrl:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&crop=faces",
      },
      {
        name: "James Courson",
        initials: "JC",
        role: "Sponsor",
        avatarUrl:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=128&h=128&fit=crop&crop=faces",
      },
      { name: "Robert Courson", initials: "RC", role: "Product" },
    ],
    chats: 18,
    files: 142,
    updatedAt: "2026-07-23T15:10:00Z",
    chatEntries: [
      {
        id: "ws-tower-chat-crane",
        title: "Crane & laydown",
        preview: "Maya: Pick window confirmed for Friday AM — flaggers on call.",
        updatedAt: "2026-07-23T14:40:00Z",
        messageCount: 42,
      },
      {
        id: "ws-tower-chat-envelope",
        title: "Envelope trade",
        preview: "Derek: Mockup panel photos uploaded after lunch huddle.",
        updatedAt: "2026-07-23T12:15:00Z",
        messageCount: 28,
      },
      {
        id: "ws-tower-chat-look-ahead",
        title: "3-week look-ahead",
        preview: "Magnus: Draft look-ahead ready for PM review.",
        updatedAt: "2026-07-22T18:00:00Z",
        messageCount: 15,
      },
    ],
    fileEntries: [
      {
        id: "ws-tower-file-logistics",
        name: "Crane logistics plan v4.pdf",
        kind: "PDF",
        updatedAt: "2026-07-23T10:00:00Z",
        sizeLabel: "2.4 MB",
      },
      {
        id: "ws-tower-file-rfi",
        name: "Envelope RFI log.xlsx",
        kind: "Sheet",
        updatedAt: "2026-07-22T16:30:00Z",
        sizeLabel: "840 KB",
      },
      {
        id: "ws-tower-file-photos",
        name: "Week 28 site photos.zip",
        kind: "Archive",
        updatedAt: "2026-07-21T20:00:00Z",
        sizeLabel: "48 MB",
      },
    ],
    activity: [
      {
        id: "ws-tower-act-1",
        summary: "Maya Chen posted look-ahead notes to Crane & laydown",
        at: "2026-07-23T14:42:00Z",
        actor: "Maya Chen",
      },
      {
        id: "ws-tower-act-2",
        summary: "Crane logistics plan v4.pdf uploaded",
        at: "2026-07-23T10:05:00Z",
        actor: "Derek Walsh",
      },
      {
        id: "ws-tower-act-3",
        summary: "Routine · Safety digest tagged this project",
        at: "2026-07-23T07:00:00Z",
        actor: "Magnus",
      },
    ],
  },
  {
    id: "ws-safety",
    name: "Enterprise EH&S",
    description: "Toolbox talks, observations, and TRIR playbooks.",
    projectCode: "ENT-SAFE",
    coverUrl:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=480&fit=crop",
    members: [
      {
        name: "Safety Ops",
        initials: "SO",
        role: "Ops",
        avatarUrl:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces",
      },
      {
        name: "Priya Nair",
        initials: "PN",
        role: "QA",
        avatarUrl:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=128&h=128&fit=crop&crop=faces",
      },
    ],
    chats: 9,
    files: 64,
    updatedAt: "2026-07-22T21:30:00Z",
    chatEntries: [
      {
        id: "ws-safety-chat-trir",
        title: "TRIR playbook",
        preview: "Priya: Q3 milestone language cleared with marketing.",
        updatedAt: "2026-07-22T20:10:00Z",
        messageCount: 19,
      },
      {
        id: "ws-safety-chat-toolbox",
        title: "Toolbox talk drafts",
        preview: "Safety Ops: Heat illness talk ready for field packs.",
        updatedAt: "2026-07-22T15:00:00Z",
        messageCount: 11,
      },
    ],
    fileEntries: [
      {
        id: "ws-safety-file-trir",
        name: "TRIR Q3 brief.pdf",
        kind: "PDF",
        updatedAt: "2026-07-22T19:00:00Z",
        sizeLabel: "1.1 MB",
      },
      {
        id: "ws-safety-file-obs",
        name: "Observation checklist.docx",
        kind: "Doc",
        updatedAt: "2026-07-21T14:00:00Z",
        sizeLabel: "220 KB",
      },
    ],
    activity: [
      {
        id: "ws-safety-act-1",
        summary: "TRIR Q3 brief shared company-wide",
        at: "2026-07-22T19:05:00Z",
        actor: "Priya Nair",
      },
      {
        id: "ws-safety-act-2",
        summary: "Toolbox talk pack published for Southeast",
        at: "2026-07-22T15:10:00Z",
        actor: "Safety Ops",
      },
    ],
  },
  {
    id: "ws-magnus",
    name: "Magnus platform",
    description: "Architecture, governance, and rollout playbooks.",
    projectCode: "BG-MAG",
    coverUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=480&fit=crop",
    members: [
      {
        name: "James Courson",
        initials: "JC",
        role: "Sponsor",
        avatarUrl:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=128&h=128&fit=crop&crop=faces",
      },
      {
        name: "Robert Courson",
        initials: "RC",
        role: "Product",
        avatarUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&crop=faces",
      },
    ],
    chats: 24,
    files: 88,
    updatedAt: "2026-07-23T17:00:00Z",
    chatEntries: [
      {
        id: "ws-magnus-chat-arch",
        title: "Architecture reviews",
        preview: "Robert: Entity model for workspaces lands this sprint.",
        updatedAt: "2026-07-23T16:45:00Z",
        messageCount: 56,
      },
      {
        id: "ws-magnus-chat-gov",
        title: "Governance",
        preview: "James: AI use policy draft for legal pass.",
        updatedAt: "2026-07-23T11:00:00Z",
        messageCount: 22,
      },
    ],
    fileEntries: [
      {
        id: "ws-magnus-file-adr",
        name: "ADR-014 workspace entities.md",
        kind: "Doc",
        updatedAt: "2026-07-23T16:00:00Z",
        sizeLabel: "48 KB",
      },
      {
        id: "ws-magnus-file-rollout",
        name: "Rollout playbook v2.pdf",
        kind: "PDF",
        updatedAt: "2026-07-20T12:00:00Z",
        sizeLabel: "3.2 MB",
      },
    ],
    activity: [
      {
        id: "ws-magnus-act-1",
        summary: "ADR-014 workspace entities committed",
        at: "2026-07-23T16:05:00Z",
        actor: "Robert Courson",
      },
      {
        id: "ws-magnus-act-2",
        summary: "Governance chat: policy draft attached",
        at: "2026-07-23T11:05:00Z",
        actor: "James Courson",
      },
    ],
  },
  {
    id: "ws-nashville",
    name: "Nashville Level 3",
    description: "Concrete pour windows, QA checklists, night shift notes.",
    projectCode: "NSH-0912",
    coverUrl:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=480&fit=crop",
    members: [
      {
        name: "Derek Walsh",
        initials: "DW",
        role: "Superintendent",
        avatarUrl:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&crop=faces",
      },
      { name: "Field Night", initials: "FN", role: "Crew lead" },
    ],
    chats: 11,
    files: 53,
    updatedAt: "2026-07-21T19:20:00Z",
    chatEntries: [
      {
        id: "ws-nsh-chat-pour",
        title: "Pour windows",
        preview: "Field Night: Level 3 slab pour locked for Thu 2am.",
        updatedAt: "2026-07-21T18:40:00Z",
        messageCount: 33,
      },
      {
        id: "ws-nsh-chat-qa",
        title: "QA checklists",
        preview: "Derek: Pre-pour checklist signed by QC.",
        updatedAt: "2026-07-21T16:00:00Z",
        messageCount: 9,
      },
    ],
    fileEntries: [
      {
        id: "ws-nsh-file-checklist",
        name: "Pre-pour QA checklist.pdf",
        kind: "PDF",
        updatedAt: "2026-07-21T15:30:00Z",
        sizeLabel: "410 KB",
      },
      {
        id: "ws-nsh-file-schedule",
        name: "Night shift schedule.xlsx",
        kind: "Sheet",
        updatedAt: "2026-07-20T09:00:00Z",
        sizeLabel: "96 KB",
      },
    ],
    activity: [
      {
        id: "ws-nsh-act-1",
        summary: "Pour window confirmed for Thursday night",
        at: "2026-07-21T18:45:00Z",
        actor: "Field Night",
      },
      {
        id: "ws-nsh-act-2",
        summary: "Pre-pour QA checklist signed",
        at: "2026-07-21T16:05:00Z",
        actor: "Derek Walsh",
      },
    ],
  },
];

/**
 * Mutable demo registry: seed workspaces + user-created ones.
 * List and detail routes share this so create → open works.
 */
let workspaceRegistry: WorkspaceItem[] = workspaces.slice();

/** Current list (seed + created). Prefer this over raw `workspaces` in UI. */
export function listWorkspaces(): WorkspaceItem[] {
  return workspaceRegistry.slice();
}

/** Lookup by id — includes workspaces registered after create. */
export function getWorkspaceById(id: string): WorkspaceItem | undefined {
  return workspaceRegistry.find((w) => w.id === id);
}

/** Insert or replace a workspace in the shared registry (list + detail). */
export function upsertWorkspace(item: WorkspaceItem): WorkspaceItem {
  workspaceRegistry = [
    item,
    ...workspaceRegistry.filter((w) => w.id !== item.id),
  ];
  return item;
}

/** Reset registry to seed (tests). */
export function resetWorkspaceRegistry(): void {
  workspaceRegistry = workspaces.slice();
}

/** Entity subsets used by detail UI and verify scripts. */
export function getWorkspaceEntitySubsets(ws: WorkspaceItem): {
  members: WorkspaceItem["members"];
  chatEntries: NonNullable<WorkspaceItem["chatEntries"]>;
  fileEntries: NonNullable<WorkspaceItem["fileEntries"]>;
  activity: NonNullable<WorkspaceItem["activity"]>;
} {
  return {
    members: ws.members,
    chatEntries: ws.chatEntries ?? [],
    fileEntries: ws.fileEntries ?? [],
    activity: ws.activity ?? [],
  };
}

/** Whether seed data is a full project entity (not list-only). */
export function workspaceHasEntityContent(ws: WorkspaceItem): boolean {
  const s = getWorkspaceEntitySubsets(ws);
  return (
    s.members.length >= 1 &&
    s.chatEntries.length >= 1 &&
    s.fileEntries.length >= 1 &&
    s.activity.length >= 1
  );
}
