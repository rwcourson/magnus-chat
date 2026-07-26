import type { ApprovalItem } from "@/types/approvals";

export const approvalItems: ApprovalItem[] = [
  {
    id: "ap-1",
    kind: "invoice",
    title: "Concrete supply — pour #14",
    subtitle: "Vendor: Southern Aggregates",
    amount: "$48,200",
    project: "Downtown tower",
    requester: "Maya Chen",
    dueLabel: "Due today",
    status: "pending",
    source: "OnBase",
    sourceKey: "onbase",
    detail:
      "Invoice matches PO-8841 quantities. Superintendent signed field ticket. Ready for AP release.",
  },
  {
    id: "ap-2",
    kind: "invoice",
    title: "Temp power rental — 3 weeks",
    subtitle: "Vendor: Metro Power Co.",
    amount: "$6,450",
    project: "ATL-2841",
    requester: "Derek Walsh",
    dueLabel: "Due in 2d",
    status: "pending",
    source: "OnBase",
    sourceKey: "onbase",
    detail: "Rental extension through week 29. Within contingency line 4.2.",
  },
  {
    id: "ap-3",
    kind: "expense",
    title: "Client dinner — structural workshop",
    subtitle: "James Courson · Birmingham",
    amount: "$286.40",
    project: "Magnus platform",
    requester: "James Courson",
    dueLabel: "Due in 3d",
    status: "pending",
    source: "Concur",
    sourceKey: "concur",
    detail: "Attendees: owner’s rep + two AE partners. Receipt attached.",
  },
  {
    id: "ap-4",
    kind: "expense",
    title: "Site travel — Nashville pour night",
    subtitle: "Mileage + lodging",
    amount: "$412.00",
    project: "Nashville Level 3",
    requester: "Derek Walsh",
    dueLabel: "Due in 5d",
    status: "pending",
    source: "Concur",
    sourceKey: "concur",
    detail: "Two nights hotel + 186 mi. Policy OK with superintendent approval.",
  },
  {
    id: "ap-5",
    kind: "expense",
    title: "Safety boots — field hire kit",
    subtitle: "New craft orientation",
    amount: "$164.00",
    project: "Enterprise EH&S",
    requester: "Safety Ops",
    dueLabel: "Due in 1d",
    status: "pending",
    source: "Concur",
    sourceKey: "concur",
    detail: "Bulk order for 4 new hires. Charged to EH&S training code.",
  },
  {
    id: "ap-6",
    kind: "hr",
    title: "Mid-year performance review",
    subtitle: "Self-assessment due",
    project: "Enterprise",
    requester: "SuccessFactors",
    dueLabel: "Due Friday",
    status: "pending",
    source: "SuccessFactors",
    sourceKey: "successfactors",
    detail:
      "Complete goals + competency ratings. Manager review unlocks after submit.",
  },
];

export function pendingApprovals(items: ApprovalItem[] = approvalItems) {
  return items.filter((i) => i.status === "pending");
}

export function approvalsBySource(
  sourceKey: string,
  items: ApprovalItem[] = approvalItems
) {
  return items.filter((i) => i.sourceKey === sourceKey && i.status === "pending");
}

export function pendingCount(items: ApprovalItem[] = approvalItems) {
  return pendingApprovals(items).length;
}
