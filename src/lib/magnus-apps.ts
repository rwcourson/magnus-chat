/**
 * Thin Magnus apps launcher + employee resources catalogs.
 * Existing destinations only — not a Connect-style app store.
 */

export type MagnusAppLink = {
  id: string;
  label: string;
  description: string;
  href: string;
};

export type EmployeeResourceLink = {
  id: string;
  label: string;
  description: string;
  /** External-style or internal help href */
  href: string;
  external?: boolean;
};

/** Compact list of real Magnus destinations (skills, routines, …). */
export const magnusAppsCatalog: MagnusAppLink[] = [
  {
    id: "app-skills",
    label: "Skills",
    description: "Agent packs for field, estimating, and PMO",
    href: "/skills",
  },
  {
    id: "app-routines",
    label: "Routines",
    description: "Scheduled digests and recurring Magnus runs",
    href: "/routines",
  },
  {
    id: "app-workspaces",
    label: "Workspaces",
    description: "Project entities — chats, files, people",
    href: "/workspaces",
  },
  {
    id: "app-knowledge",
    label: "Knowledge",
    description: "Browse company knowledge without a chat turn",
    href: "/knowledge",
  },
  {
    id: "app-integrations",
    label: "Integrations",
    description: "Connect tools Magnus can use",
    href: "/integrations",
  },
];

/** External-style employee resources (not Magnus apps). */
export const employeeResourcesCatalog: EmployeeResourceLink[] = [
  {
    id: "res-benefits",
    label: "Benefits portal",
    description: "Elections, dependents, and plan docs",
    href: "https://www.brasfieldgorrie.com/",
    external: true,
  },
  {
    id: "res-hr",
    label: "HR & payroll",
    description: "Pay stubs, time off, and HR contacts",
    href: "https://www.brasfieldgorrie.com/",
    external: true,
  },
  {
    id: "res-safety",
    label: "Safety resources",
    description: "EH&S bulletins and field policies",
    href: "https://www.brasfieldgorrie.com/",
    external: true,
  },
  {
    id: "res-it",
    label: "IT help desk",
    description: "Devices, access, and support tickets",
    href: "https://www.brasfieldgorrie.com/",
    external: true,
  },
  {
    id: "res-magnus-help",
    label: "Magnus help",
    description: "In-product tips for this demo",
    href: "/help",
    external: false,
  },
];

export function validAppHrefs(items: MagnusAppLink[] = magnusAppsCatalog): boolean {
  return items.length >= 3 && items.every((i) => i.href.startsWith("/"));
}

export function validResourceHrefs(
  items: EmployeeResourceLink[] = employeeResourcesCatalog
): boolean {
  return (
    items.length >= 3 &&
    items.every(
      (i) => i.href.startsWith("/") || i.href.startsWith("https://")
    )
  );
}
