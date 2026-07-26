export interface SlashCommand {
  id: string;
  command: string;
  label: string;
  description: string;
  icon: "search" | "web" | "file" | "image" | "code" | "help";
}

export const slashCommands: SlashCommand[] = [
  {
    id: "search",
    command: "/search",
    label: "Search",
    description: "Search B&G knowledge base",
    icon: "search",
  },
  {
    id: "web",
    command: "/web",
    label: "Web",
    description: "Browse the web for answers",
    icon: "web",
  },
  {
    id: "file",
    command: "/file",
    label: "File",
    description: "Attach or reference a file",
    icon: "file",
  },
  {
    id: "image",
    command: "/image",
    label: "Image",
    description: "Analyze or generate an image",
    icon: "image",
  },
  {
    id: "code",
    command: "/code",
    label: "Code",
    description: "Write or review code",
    icon: "code",
  },
  {
    id: "help",
    command: "/help",
    label: "Help",
    description: "Show available commands",
    icon: "help",
  },
];

export function filterCommands(query: string): SlashCommand[] {
  // query is the text after "/"
  const q = query.toLowerCase().replace(/^\//, "");
  if (!q) return slashCommands;
  return slashCommands.filter(
    (c) =>
      c.command.slice(1).startsWith(q) ||
      c.label.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
  );
}

/** Detect mid-slash-command: starts with / and command token not finished (no space). */
export function getSlashQuery(value: string): string | null {
  if (!value.startsWith("/")) return null;
  // hide once the user finishes the command token
  if (/\s/.test(value)) return null;
  return value;
}
