import type { LucideIcon } from "lucide-react";
import {
  House,
  Newspaper,
  Users,
  Bell,
  Radar,
  FolderKanban,
  SquarePen,
  Zap,
  Clock3,
  Blocks,
  ListChecks,
  Moon,
  PanelLeft,
  Settings,
  HelpCircle,
  MessageCircle,
  Keyboard,
  ClipboardCheck,
  CalendarDays,
  Search,
} from "lucide-react";

export type GlobalCommandGroup =
  | "Actions"
  | "Results"
  | "Navigate"
  | "Chats"
  | "System";

export interface GlobalCommand {
  id: string;
  label: string;
  description?: string;
  group: GlobalCommandGroup;
  keywords?: string[];
  icon: LucideIcon;
  shortcut?: string;
  /** Internal action key handled by the palette host */
  action:
    | "new-chat"
    | "go-home"
    | "catch-me-up"
    | "toggle-theme"
    | "toggle-sidebar"
    | "shortcuts-help"
    | "navigate"
    | "select-chat";
  href?: string;
  chatId?: string;
}

export const staticGlobalCommands: GlobalCommand[] = [
  {
    id: "new-chat",
    label: "New Magnus chat",
    description: "Start a fresh AI conversation",
    group: "Actions",
    icon: SquarePen,
    shortcut: "⌘N",
    action: "new-chat",
    keywords: ["compose", "message", "ai"],
  },
  {
    id: "nav-messages",
    label: "Messages",
    description: "Team channels and DMs",
    group: "Navigate",
    icon: MessageCircle,
    action: "navigate",
    href: "/messages",
    keywords: ["slack", "channels", "dm", "team", "chat"],
  },
  {
    id: "catch-me-up",
    label: "Catch me up",
    description: "Personal week brief from Scout",
    group: "Actions",
    icon: ListChecks,
    action: "catch-me-up",
    keywords: ["brief", "summary", "scout"],
  },
  {
    id: "go-home",
    label: "Go to home",
    description: "Intranet landing",
    group: "Actions",
    icon: House,
    action: "go-home",
    keywords: ["intranet"],
  },
  {
    id: "nav-home",
    label: "Home",
    group: "Navigate",
    icon: House,
    action: "navigate",
    href: "/",
  },
  {
    id: "nav-feed",
    label: "Feed",
    group: "Navigate",
    icon: Newspaper,
    action: "navigate",
    href: "/feed",
    keywords: ["news", "posts"],
  },
  {
    id: "nav-people",
    label: "People",
    group: "Navigate",
    icon: Users,
    action: "navigate",
    href: "/people",
  },
  {
    id: "nav-approvals",
    label: "Approvals",
    description: "Invoices, expenses, reviews",
    group: "Navigate",
    icon: ClipboardCheck,
    action: "navigate",
    href: "/approvals",
    keywords: ["onbase", "concur", "invoice", "expense"],
  },
  {
    id: "nav-calendar",
    label: "Calendar",
    description: "Agenda and prep",
    group: "Navigate",
    icon: CalendarDays,
    action: "navigate",
    href: "/calendar",
    keywords: ["agenda", "meetings", "schedule", "outlook"],
  },
  {
    id: "nav-search",
    label: "Search",
    description: "Find people, posts, tools…",
    group: "Navigate",
    icon: Search,
    action: "navigate",
    href: "/search",
    keywords: ["find", "lookup"],
  },
  {
    id: "nav-notifications",
    label: "Notifications",
    group: "Navigate",
    icon: Bell,
    action: "navigate",
    href: "/notifications",
  },
  {
    id: "nav-insights",
    label: "Insights",
    group: "Navigate",
    icon: Radar,
    action: "navigate",
    href: "/insights",
    keywords: ["insights", "comms", "scout", "headlines", "leadership"],
  },
  {
    id: "nav-skills",
    label: "Agent Skills",
    group: "Navigate",
    icon: Zap,
    action: "navigate",
    href: "/skills",
  },
  {
    id: "nav-routines",
    label: "Routines",
    group: "Navigate",
    icon: Clock3,
    action: "navigate",
    href: "/routines",
  },
  {
    id: "nav-workspaces",
    label: "Workspaces",
    group: "Navigate",
    icon: FolderKanban,
    action: "navigate",
    href: "/workspaces",
  },
  {
    id: "nav-integrations",
    label: "Integrations",
    group: "Navigate",
    icon: Blocks,
    action: "navigate",
    href: "/integrations",
  },
  {
    id: "nav-settings",
    label: "Settings",
    group: "Navigate",
    icon: Settings,
    action: "navigate",
    href: "/settings",
    keywords: ["preferences", "theme"],
  },
  {
    id: "nav-help",
    label: "Help center",
    group: "Navigate",
    icon: HelpCircle,
    action: "navigate",
    href: "/help",
    keywords: ["faq", "support"],
  },
  {
    id: "toggle-theme",
    label: "Toggle theme",
    description: "Switch light / dark",
    group: "System",
    icon: Moon,
    shortcut: "⌘.",
    action: "toggle-theme",
  },
  {
    id: "toggle-sidebar",
    label: "Toggle sidebar",
    group: "System",
    icon: PanelLeft,
    shortcut: "⌘B",
    action: "toggle-sidebar",
  },
  {
    id: "shortcuts-help",
    label: "Keyboard shortcuts",
    group: "System",
    icon: Keyboard,
    shortcut: "⌘/",
    action: "shortcuts-help",
    keywords: ["hotkeys", "keys"],
  },
];

export function chatToCommand(chat: {
  id: string;
  title: string;
  preview?: string;
}): GlobalCommand {
  return {
    id: `chat-${chat.id}`,
    label: chat.title,
    description: chat.preview ?? "Open conversation",
    group: "Chats",
    icon: MessageCircle,
    action: "select-chat",
    chatId: chat.id,
    keywords: [chat.title, chat.preview ?? ""],
  };
}

export function filterGlobalCommands(
  commands: GlobalCommand[],
  query: string
): GlobalCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands;
  return commands.filter((c) => {
    const hay = [
      c.label,
      c.description ?? "",
      c.group,
      ...(c.keywords ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export const GROUP_ORDER: GlobalCommandGroup[] = [
  "Actions",
  "Results",
  "Chats",
  "Navigate",
  "System",
];
