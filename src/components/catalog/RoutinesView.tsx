"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock3, Plus } from "lucide-react";
import type { RoutineItem } from "@/types/catalog";
import { routines as defaultRoutines } from "@/lib/catalog-data";
import {
  createRoutineItem,
  prependCatalogItem,
} from "@/lib/catalog-create";
import { PageHeader } from "@/components/ui/PageHeader";
import { AvatarMark } from "@/components/ui/BrandMark";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";
import { ScrollFade } from "@/components/ui/ScrollFade";

export function RoutinesView({
  items = defaultRoutines,
}: {
  items?: RoutineItem[];
}) {
  const { toast } = useToast();
  const [list, setList] = useState<RoutineItem[]>(items);
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((r) => [r.id, r.active]))
  );
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState("Weekdays · 7:00 AM");

  const openCreate = () => {
    setCreating(true);
    setName("");
    setSchedule("Weekdays · 7:00 AM");
  };

  const submitCreate = () => {
    const item = createRoutineItem({ name, schedule });
    if (!item) {
      toast({ title: "Name is required", tone: "danger", duration: 2000 });
      return;
    }
    setList((prev) => prependCatalogItem(prev, item));
    setActiveMap((p) => ({ ...p, [item.id]: true }));
    setCreating(false);
    setName("");
    toast({
      title: "Routine added",
      description: item.name,
      tone: "success",
      duration: 2200,
    });
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin"
      >
        <div className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <PageHeader
            eyebrow="Routines"
            icon={Clock3}
            title="Automations on your schedule"
            description="Recurring prompts for standups, safety digests, and risk reviews — toggle on or off anytime."
            actions={
              <button
                type="button"
                onClick={openCreate}
                className="btn-solid inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold"
                data-add-routine
                aria-label="Add routine"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Add routine
              </button>
            }
          />

          <AnimatePresence>
            {creating && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: easeSpring }}
                className={cn(
                  "mb-4 rounded-[16px] border border-[var(--glass-border-soft)]",
                  "bg-[var(--glass-strong-solid)] p-4 shadow-[var(--shadow-sm)]"
                )}
                data-add-routine-form
              >
                <p className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
                  New routine
                </p>
                <div className="mt-3 space-y-2.5">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name (e.g. Monday safety digest)"
                    className={cn(
                      "w-full rounded-xl border border-[var(--glass-border)] bg-[var(--hover-fill)]",
                      "px-3 py-2 text-[14px] text-[var(--text-primary)] outline-none",
                      "placeholder:text-[var(--text-muted)]",
                      "focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                    )}
                    aria-label="Routine name"
                    data-routine-name
                    autoFocus
                  />
                  <input
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="Schedule"
                    className={cn(
                      "w-full rounded-xl border border-[var(--glass-border)] bg-[var(--hover-fill)]",
                      "px-3 py-2 text-[14px] text-[var(--text-primary)] outline-none",
                      "placeholder:text-[var(--text-muted)]",
                      "focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                    )}
                    aria-label="Routine schedule"
                    data-routine-schedule
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={submitCreate}
                    className="btn-solid inline-flex h-9 items-center rounded-full px-3.5 text-[12.5px] font-semibold"
                    data-routine-save
                  >
                    Save routine
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="rounded-full px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-muted)] hover:bg-[var(--hover-fill)]"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {list.length === 0 ? (
            <div
              className="rounded-[20px] border border-dashed border-[var(--glass-border)] px-4 py-14 text-center"
              data-routines-empty
            >
              <p className="text-[13.5px] text-[var(--text-muted)]">
                No routines yet. Add one to put Magnus on a schedule.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="btn-solid mt-4 inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Add routine
              </button>
            </div>
          ) : (
            <div
              className={cn(
                "overflow-hidden rounded-[20px] border border-[var(--glass-border-soft)]",
                "bg-[var(--glass-strong-solid)] shadow-[var(--shadow-sm)]"
              )}
              data-routines-list
            >
              {list.map((routine, i) => {
                const on = activeMap[routine.id] ?? routine.active;
                const isLast = i === list.length - 1;
                return (
                  <motion.article
                    key={routine.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: Math.min(i * 0.035, 0.2),
                      duration: 0.32,
                      ease: easeSpring,
                    }}
                    className={cn(
                      "flex items-start gap-3.5 px-4 py-4 sm:gap-4 sm:px-5",
                      !isLast && "border-b border-[var(--glass-border-soft)]"
                    )}
                    data-routine-card
                    data-routine-id={routine.id}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        "bg-[var(--hover-fill)] text-[var(--text-muted)]",
                        on && "text-[var(--text-secondary)]"
                      )}
                      aria-hidden
                    >
                      <Clock3 className="h-4 w-4" strokeWidth={ICON_STROKE} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-[14.5px] font-semibold tracking-tight text-[var(--text-primary)]">
                            {routine.name}
                          </h2>
                          <p className="mt-0.5 text-[12px] font-medium tabular-nums text-[var(--text-muted)]">
                            {routine.schedule}
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={on}
                          aria-label={`${on ? "Disable" : "Enable"} ${routine.name}`}
                          onClick={() =>
                            setActiveMap((p) => ({ ...p, [routine.id]: !on }))
                          }
                          className={cn(
                            "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200",
                            on
                              ? "bg-[var(--btn-solid-bg)] shadow-[var(--btn-solid-shadow)]"
                              : "bg-[var(--hover-fill-strong)]"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 left-0.5 h-6 w-6 rounded-full ring-1 ring-[var(--glass-border-soft)] transition-[transform,background] duration-200",
                              on
                                ? "translate-x-5 bg-[var(--btn-solid-fg)]"
                                : "bg-white"
                            )}
                          />
                        </button>
                      </div>

                      <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[var(--text-secondary)]">
                        {routine.description}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--text-muted)]">
                        <span className="inline-flex items-center gap-1.5">
                          <AvatarMark
                            src={routine.owner.avatarUrl}
                            initials={routine.owner.initials}
                            size={18}
                          />
                          {routine.owner.name}
                        </span>
                        {routine.lastRun && (
                          <>
                            <span
                              aria-hidden
                              className="text-[var(--glass-border)]"
                            >
                              ·
                            </span>
                            <span className="tabular-nums">
                              Last run · {routine.lastRun}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </ScrollFade>
    </div>
  );
}
