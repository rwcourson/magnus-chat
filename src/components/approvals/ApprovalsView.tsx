"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ClipboardCheck,
  Info,
  MessageSquareText,
  X,
} from "lucide-react";
import type { ApprovalItem, ApprovalStatus } from "@/types/approvals";
import { approvalItems } from "@/lib/approvals-data";
import { PageHeader } from "@/components/ui/PageHeader";
import { PillAction } from "@/components/ui/PillAction";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

type SourceFilter = "all" | "onbase" | "concur" | "successfactors";
type StatusFilter = "pending" | "done" | "all";

const SOURCE_TABS: { id: SourceFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "onbase", label: "OnBase" },
  { id: "concur", label: "Concur" },
  { id: "successfactors", label: "SuccessFactors" },
];

const KIND_LABEL: Record<ApprovalItem["kind"], string> = {
  invoice: "Invoice",
  expense: "Expense",
  submittal: "Submittal",
  hr: "HR",
};

function statusTone(status: ApprovalStatus) {
  if (status === "approved") return "text-emerald-600 dark:text-emerald-400";
  if (status === "rejected") return "text-rose-600 dark:text-rose-400";
  if (status === "info") return "text-amber-600 dark:text-amber-400";
  return "text-[var(--text-muted)]";
}

function statusLabel(status: ApprovalStatus) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  if (status === "info") return "Info requested";
  return "Pending";
}

/**
 * Approvals inbox — OnBase / Concur / SuccessFactors work queue.
 */
export function ApprovalsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const sourceParam = searchParams.get("source") as SourceFilter | null;
  const idParam = searchParams.get("id");

  const [items, setItems] = useState<ApprovalItem[]>(approvalItems);
  const [source, setSource] = useState<SourceFilter>(
    sourceParam && SOURCE_TABS.some((t) => t.id === sourceParam)
      ? sourceParam
      : "all"
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(idParam);

  useEffect(() => {
    if (sourceParam && SOURCE_TABS.some((t) => t.id === sourceParam)) {
      setSource(sourceParam);
    }
  }, [sourceParam]);

  useEffect(() => {
    if (idParam) {
      setSelectedId(idParam);
      setStatusFilter("all");
    }
  }, [idParam]);

  const pendingCount = useMemo(
    () => items.filter((i) => i.status === "pending").length,
    [items]
  );

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (source !== "all" && item.sourceKey !== source) return false;
      if (statusFilter === "pending" && item.status !== "pending") return false;
      if (statusFilter === "done" && item.status === "pending") return false;
      return true;
    });
  }, [items, source, statusFilter]);

  const selected =
    filtered.find((i) => i.id === selectedId) ??
    items.find((i) => i.id === selectedId) ??
    filtered[0] ??
    null;

  useEffect(() => {
    if (selected && selectedId !== selected.id) {
      setSelectedId(selected.id);
    }
    if (!selected && selectedId) {
      setSelectedId(null);
    }
  }, [selected, selectedId]);

  const setStatus = useCallback(
    (id: string, status: ApprovalStatus) => {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status } : i))
      );
      const item = items.find((i) => i.id === id);
      const title = item?.title ?? "Item";
      if (status === "approved") {
        toast({
          title: "Approved",
          description: title,
          tone: "success",
        });
      } else if (status === "rejected") {
        toast({
          title: "Rejected",
          description: title,
          tone: "danger",
        });
      } else if (status === "info") {
        toast({
          title: "Info requested",
          description: `Asked for more detail on ${title}`,
        });
      }
    },
    [items, toast]
  );

  const setSourceFilter = (next: SourceFilter) => {
    setSource(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("source");
    else params.set("source", next);
    const qs = params.toString();
    router.replace(qs ? `/approvals?${qs}` : "/approvals", { scroll: false });
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin"
      >
        <div className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              eyebrow="Approvals"
              icon={ClipboardCheck}
              title="Needs your sign-off"
              description="Invoices, expenses, and reviews from OnBase, Concur, and SuccessFactors — one inbox for the day."
              className="mb-0"
            />
            {pendingCount > 0 && (
              <span
                className="mt-8 rounded-full border border-[var(--glass-border-soft)] bg-[var(--select-fill)] px-3 py-1 text-[12px] font-semibold tabular-nums text-[var(--text-primary)]"
                data-approvals-pending-count
              >
                {pendingCount} pending
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {SOURCE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSourceFilter(tab.id)}
                data-approvals-source={tab.id}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  source === tab.id
                    ? "bg-[var(--select-fill)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-secondary)]"
                )}
              >
                {tab.label}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-[var(--glass-border-soft)]" />
            {(
              [
                ["pending", "Pending"],
                ["done", "Done"],
                ["all", "All"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setStatusFilter(id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  statusFilter === id
                    ? "bg-[var(--select-fill)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-secondary)]"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
            <div className="flex flex-col gap-2.5" data-approvals-list>
              <AnimatePresence mode="popLayout" initial={false}>
                {filtered.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-[18px] border border-[var(--glass-border-soft)] bg-[var(--glass-strong-solid)] px-5 py-10 text-center"
                  >
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">
                      All clear
                    </p>
                    <p className="mt-1 text-[13px] text-[var(--text-muted)]">
                      No items match this filter. Check Done for recent
                      decisions, or open Calendar for prep blocks.
                    </p>
                    <div className="mt-4 flex justify-center">
                      <PillAction href="/calendar">Open calendar</PillAction>
                    </div>
                  </motion.div>
                ) : (
                  filtered.map((item, i) => {
                    const isSelected = selected?.id === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{
                          delay: Math.min(i * 0.03, 0.2),
                          duration: 0.3,
                          ease: easeSpring,
                        }}
                        onClick={() => setSelectedId(item.id)}
                        data-approval-card={item.id}
                        data-approval-status={item.status}
                        className={cn(
                          "w-full rounded-[16px] border p-4 text-left shadow-[var(--shadow-xs)]",
                          "bg-[var(--glass-strong-solid)] transition-[border-color,box-shadow] duration-150",
                          "hover:border-[var(--glass-border)] hover:shadow-[var(--shadow-sm)]",
                          isSelected
                            ? "border-[var(--glass-border)] ring-2 ring-[var(--accent-ring)]"
                            : "border-[var(--glass-border-soft)]"
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
                            {KIND_LABEL[item.kind]}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            ·
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            {item.source}
                          </span>
                          {item.amount && (
                            <>
                              <span className="text-[11px] text-[var(--text-muted)]">
                                ·
                              </span>
                              <span className="text-[12px] font-semibold tabular-nums text-[var(--text-primary)]">
                                {item.amount}
                              </span>
                            </>
                          )}
                          <span
                            className={cn(
                              "ml-auto text-[11px] font-medium",
                              statusTone(item.status)
                            )}
                          >
                            {statusLabel(item.status)}
                          </span>
                        </div>
                        <h3 className="mt-1.5 text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
                          {item.title}
                        </h3>
                        <p className="mt-0.5 text-[12.5px] text-[var(--text-secondary)]">
                          {item.subtitle}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-[var(--text-muted)]">
                          {item.project && <span>{item.project}</span>}
                          <span>{item.requester}</span>
                          <span className="font-medium text-[var(--text-secondary)]">
                            {item.dueLabel}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            <aside className="lg:sticky lg:top-4 lg:self-start" data-approval-detail>
              {selected ? (
                <div
                  className={cn(
                    "rounded-[18px] border border-[var(--glass-border-soft)]",
                    "bg-[var(--glass-strong-solid)] p-5 shadow-[var(--shadow-sm)]"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2 text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
                    <span>{KIND_LABEL[selected.kind]}</span>
                    <span>·</span>
                    <span>{selected.source}</span>
                  </div>
                  <h2 className="mt-2 text-[18px] font-semibold tracking-tight text-[var(--text-primary)]">
                    {selected.title}
                  </h2>
                  <p className="mt-1 text-[13.5px] text-[var(--text-secondary)]">
                    {selected.subtitle}
                  </p>

                  <dl className="mt-4 grid gap-2.5 text-[13px]">
                    {selected.amount && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-[var(--text-muted)]">Amount</dt>
                        <dd className="font-semibold tabular-nums text-[var(--text-primary)]">
                          {selected.amount}
                        </dd>
                      </div>
                    )}
                    {selected.project && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-[var(--text-muted)]">Project</dt>
                        <dd className="text-right text-[var(--text-primary)]">
                          {selected.project}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--text-muted)]">Requester</dt>
                      <dd className="text-right text-[var(--text-primary)]">
                        {selected.requester}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--text-muted)]">Due</dt>
                      <dd className="text-right font-medium text-[var(--text-primary)]">
                        {selected.dueLabel}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[var(--text-muted)]">Status</dt>
                      <dd className={cn("font-medium", statusTone(selected.status))}>
                        {statusLabel(selected.status)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 rounded-xl bg-[var(--hover-fill)] px-3.5 py-3">
                    <p className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
                      Detail
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                      {selected.detail}
                    </p>
                  </div>

                  {selected.status === "pending" && (
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--glass-border-soft)] pt-4">
                      <button
                        type="button"
                        onClick={() => setStatus(selected.id, "approved")}
                        className="btn-solid inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
                        data-approve-item
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(selected.id, "rejected")}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border-soft)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-secondary)] hover:bg-[var(--hover-fill)]"
                        data-reject-item
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(selected.id, "info")}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border-soft)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-secondary)] hover:bg-[var(--hover-fill)]"
                        data-info-item
                      >
                        <MessageSquareText
                          className="h-3.5 w-3.5"
                          strokeWidth={ICON_STROKE}
                        />
                        Request info
                      </button>
                    </div>
                  )}

                  {selected.status !== "pending" && (
                    <p className="mt-4 flex items-center gap-1.5 text-[12.5px] text-[var(--text-muted)]">
                      <Info className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                      Decision recorded for this demo session.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-[18px] border border-dashed border-[var(--glass-border-soft)] px-5 py-10 text-center text-[13px] text-[var(--text-muted)]">
                  Select an item to review details.
                </div>
              )}
            </aside>
          </div>
        </div>
      </ScrollFade>
    </div>
  );
}
