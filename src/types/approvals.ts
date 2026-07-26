export type ApprovalKind = "invoice" | "expense" | "submittal" | "hr";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "info";

export type ApprovalItem = {
  id: string;
  kind: ApprovalKind;
  title: string;
  subtitle: string;
  amount?: string;
  project?: string;
  requester: string;
  dueLabel: string;
  status: ApprovalStatus;
  source: string;
  /** Integration tile key: onbase | concur | successfactors */
  sourceKey: string;
  detail: string;
};
