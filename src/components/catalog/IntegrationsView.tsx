"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Blocks, Check, Link2, Loader2 } from "lucide-react";
import type { IntegrationItem, IntegrationStatus } from "@/types/catalog";
import { integrations as defaultItems } from "@/lib/catalog-data";
import { PageHeader } from "@/components/ui/PageHeader";
import { BrandMark } from "@/components/ui/BrandMark";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";
import { ScrollFade } from "@/components/ui/ScrollFade";

const filters: { id: "all" | IntegrationStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "connected", label: "Connected" },
  { id: "available", label: "Available" },
  { id: "pending", label: "Pending" },
];

export function IntegrationsView({
  items = defaultItems,
}: {
  items?: IntegrationItem[];
}) {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [statusMap, setStatusMap] = useState<Record<string, IntegrationStatus>>(
    () => Object.fromEntries(items.map((i) => [i.id, i.status]))
  );

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => (statusMap[i.id] ?? i.status) === filter);
  }, [items, filter, statusMap]);

  const toggleConnect = (id: string) => {
    setStatusMap((prev) => {
      const cur = prev[id] ?? "available";
      const next: IntegrationStatus =
        cur === "connected" ? "available" : cur === "pending" ? "connected" : "connected";
      return { ...prev, [id]: next };
    });
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin"
      >
        <div className="mx-auto w-full max-w-[920px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <PageHeader
            eyebrow="Integrations"
            icon={Blocks}
            title="Connect your tools"
            description="Link the systems your teams already use. Badges show items waiting on you — demo state only."
          />

          <div className="mb-5 flex flex-wrap gap-1.5" role="tablist" aria-label="Integration filters">
            {filters.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors duration-150",
                    active
                      ? "bg-[var(--select-fill)] text-[var(--select-text)] shadow-[var(--select-shadow)]"
                      : "border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map((item, i) => {
              const status = statusMap[item.id] ?? item.status;
              return (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(i * 0.03, 0.24),
                    duration: 0.35,
                    ease: easeSpring,
                  }}
                  className={cn(
                    "flex gap-3.5 rounded-[18px] border border-[var(--glass-border-soft)]",
                    "bg-[var(--glass-strong-solid)] p-4 shadow-[var(--shadow-sm)]",
                    "transition-[border-color,box-shadow] duration-200",
                    "hover:border-[var(--glass-border)] hover:shadow-[var(--shadow-md)]"
                  )}
                  data-integration-card
                  data-logo-url={item.logoUrl}
                >
                  <BrandMark
                    src={item.logoUrl}
                    initials={item.name.slice(0, 2)}
                    brandColor={item.brandColor}
                    size={44}
                    rounded="xl"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-[14.5px] font-semibold tracking-tight text-[var(--text-primary)]">
                          {item.name}
                        </h2>
                        <p className="text-[11.5px] text-[var(--text-muted)]">
                          {item.category}
                        </p>
                      </div>
                      <StatusPill status={status} badge={item.badge} />
                    </div>
                    <p className="mt-1.5 text-[13px] leading-snug text-[var(--text-secondary)]">
                      {item.description}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleConnect(item.id)}
                      className={cn(
                        "mt-3 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium",
                        "transition-colors duration-150",
                        status === "connected"
                          ? "border border-[var(--glass-border-soft)] text-[var(--text-secondary)] hover:bg-[var(--hover-fill)]"
                          : "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-bg-hover)]"
                      )}
                    >
                      {status === "connected" ? (
                        <>
                          <Check className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                          Connected
                        </>
                      ) : status === "pending" ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                          Finish setup
                        </>
                      ) : (
                        <>
                          <Link2 className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                          Connect
                        </>
                      )}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </ScrollFade>
    </div>
  );
}

function StatusPill({
  status,
  badge,
}: {
  status: IntegrationStatus;
  badge?: number;
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5">
      {typeof badge === "number" && badge > 0 && (
        <span className="inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-[#c45c5c] px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10.5px] font-medium tracking-tight",
          status === "connected" &&
            "bg-[var(--hover-fill-strong)] text-[var(--text-primary)]",
          status === "available" &&
            "bg-[var(--hover-fill)] text-[var(--text-muted)]",
          status === "pending" && "bg-amber-500/15 text-amber-500"
        )}
      >
        {status}
      </span>
    </span>
  );
}
