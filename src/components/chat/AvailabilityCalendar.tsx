"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  Copy,
  Check,
  Mail,
  MessageSquare,
  Clock,
  Maximize2,
  X,
} from "lucide-react";
import type {
  ScheduleAction,
  ScheduleData,
  ScheduleEvent,
  ScheduleOpenWindow,
  ScheduleStatus,
} from "@/types/chat";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";
import { Portal } from "@/components/ui/Portal";

const STATUS: Record<
  ScheduleStatus,
  { label: string; dot: string; bar: string; chip: string }
> = {
  free: {
    label: "Free",
    dot: "bg-emerald-400",
    bar: "border-l-emerald-400/90",
    chip: "bg-emerald-500/12 text-[var(--text-secondary)] border-emerald-500/20",
  },
  busy: {
    label: "Busy",
    dot: "bg-rose-400",
    bar: "border-l-rose-400/90",
    chip: "bg-rose-500/12 text-[var(--text-secondary)] border-rose-500/20",
  },
  tentative: {
    label: "Tentative",
    dot: "bg-amber-400",
    bar: "border-l-amber-400/90",
    chip: "bg-amber-500/12 text-[var(--text-secondary)] border-amber-500/20",
  },
  ooo: {
    label: "OOO",
    dot: "bg-violet-400",
    bar: "border-l-violet-400/90",
    chip: "bg-violet-500/12 text-[var(--text-secondary)] border-violet-500/20",
  },
  away: {
    label: "Away",
    dot: "bg-sky-400",
    bar: "border-l-sky-400/90",
    chip: "bg-sky-500/12 text-[var(--text-secondary)] border-sky-500/20",
  },
};

type ViewMode = "list" | "day" | "week";

interface AvailabilityCalendarProps {
  data: ScheduleData;
  className?: string;
  onAction?: (text: string) => void;
}

const springPop = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.75,
};

export function AvailabilityCalendar({
  data,
  className,
  onAction,
}: AvailabilityCalendarProps) {
  const layoutId = useId();
  const [view, setView] = useState<ViewMode>("week");
  const [monthOpen, setMonthOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(
    data.todayIndex ?? Math.min(3, data.days.length - 1)
  );
  const [hoverEvent, setHoverEvent] = useState<string | null>(null);
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const views: ViewMode[] = ["list", "day", "week"];
  const activeDay = data.days[selectedDay] ?? data.days[0];
  const initials =
    data.person.initials ??
    data.person.name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1600);
  }, []);

  const freeHint = useMemo(() => {
    const day = data.days[data.todayIndex ?? selectedDay];
    if (!day) return null;
    const busyish = day.events.filter((e) => e.status !== "free");
    if (busyish.length === 0) return "Wide open today";
    if (busyish.length === 1)
      return `Only ${busyish[0]!.start}–${busyish[0]!.end} held`;
    return `${busyish.length} blocks today`;
  }, [data, selectedDay]);

  const runAction = (action: ScheduleAction) => {
    if (action.kind === "copy" && action.value) {
      void navigator.clipboard.writeText(action.value);
      flash("Email copied");
      return;
    }
    if (action.kind === "email" && action.value) {
      void navigator.clipboard.writeText(action.value);
      flash("Email copied");
      onAction?.(`Email ${data.person.name} at ${action.value}`);
      return;
    }
    if (action.kind === "teams") {
      flash("Teams message…");
      onAction?.(
        `Message ${data.person.name} on Teams about a meeting this week`
      );
      return;
    }
    if (action.kind === "invite") {
      const slot =
        data.openWindows?.find((w) => w.id === selectedWindow)?.label ??
        "this week";
      flash("Drafting invite…");
      onAction?.(`Draft a meeting invite with ${data.person.name} for ${slot}`);
    }
  };

  const pickWindow = (w: ScheduleOpenWindow) => {
    setSelectedWindow(w.id);
    setSelectedDay(w.dayIndex);
    setView("day");
    flash(`Selected ${w.label}`);
  };

  const pickEvent = (ev: ScheduleEvent, dayIndex: number) => {
    setSelectedEvent(ev.id);
    setSelectedDay(dayIndex);
    if (view === "week") setView("day");
  };

  const defaultActions: ScheduleAction[] = data.actions ?? [
    { id: "teams", label: "Teams", kind: "teams" },
    {
      id: "email",
      label: "Email",
      kind: "email",
      value: data.person.email,
    },
    { id: "invite", label: "Invite", kind: "invite" },
  ];

  return (
    <motion.div
      layoutId={`schedule-shell-${layoutId}`}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: easeSpring, delay: 0.05 }}
      className={cn(
        "relative overflow-hidden rounded-[20px]",
        "border border-[var(--glass-border)]",
        "bg-[var(--glass-strong-solid)]",
        "shadow-[var(--shadow-lg)]",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[var(--hover-fill)] via-transparent to-transparent"
      />

      {/* Person */}
      <div className="relative border-b border-[var(--glass-border-soft)] px-4 pb-3.5 pt-4">
        <div className="flex items-start gap-3.5">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.38, ease: easeSpring }}
            className="relative shrink-0"
          >
            <div className="h-[52px] w-[52px] overflow-hidden rounded-lg shadow-[var(--shadow-sm)] ring-1 ring-[var(--glass-border)]">
              {data.person.imageUrl && !imgFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.person.imageUrl}
                  alt={data.person.name}
                  className="h-full w-full object-cover"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#4a5568] to-[#1e2530] text-[14px] font-semibold tracking-wide text-white">
                  {initials}
                </div>
              )}
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--glass-strong-solid)] bg-emerald-400"
              title="Available"
            />
          </motion.div>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                  {data.person.name}
                </h3>
                <p className="mt-0.5 truncate text-[12.5px] leading-snug text-[var(--text-secondary)]">
                  {data.person.title}
                  <span className="text-[var(--text-muted)]"> · </span>
                  {data.person.office}
                </p>
              </div>
              <span className="mt-0.5 shrink-0 rounded-md bg-[var(--hover-fill)] px-1.5 py-0.5 text-[10px] font-medium tracking-tight text-[var(--text-muted)]">
                {data.timezone}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.09] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Available today
              </span>
              {freeHint && (
                <span className="text-[11px] text-[var(--text-muted)]">
                  {freeHint}
                </span>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {defaultActions.map((action, i) => (
                <motion.button
                  key={action.id}
                  type="button"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.14 + i * 0.04,
                    duration: 0.28,
                    ease: easeSpring,
                  }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => runAction(action)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5",
                    "text-[12px] font-medium tracking-tight",
                    "border border-[var(--glass-border-soft)] bg-[var(--hover-fill)]",
                    "text-[var(--text-secondary)]",
                    "transition-colors duration-150",
                    "hover:border-[var(--glass-border)] hover:bg-[var(--hover-fill-strong)] hover:text-[var(--text-primary)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                  )}
                >
                  <ActionIcon kind={action.kind} />
                  {action.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="relative flex items-center justify-between gap-2 border-b border-[var(--glass-border-soft)] px-3 py-2">
        <div className="flex items-center">
          <IconBtn label="Previous week">
            <ChevronLeft className="h-4 w-4" strokeWidth={ICON_STROKE} />
          </IconBtn>
          <p className="min-w-[7.25rem] select-none text-center text-[12.5px] font-semibold tracking-tight text-[var(--text-primary)]">
            {data.rangeLabel}
          </p>
          <IconBtn label="Next week">
            <ChevronRight className="h-4 w-4" strokeWidth={ICON_STROKE} />
          </IconBtn>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex rounded-full border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] p-0.5">
            {views.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "relative rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition-colors",
                  view === v
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                )}
              >
                {view === v && (
                  <motion.span
                    layoutId={`view-pill-${layoutId}`}
                    className="absolute inset-0 rounded-full bg-[var(--bg-elevated)] shadow-[var(--shadow-xs)]"
                    transition={springPop}
                  />
                )}
                <span className="relative z-[1]">{v}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setMonthOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={monthOpen}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-full px-2.5",
              "border border-[var(--glass-border-soft)]",
              "text-[11px] font-medium text-[var(--text-secondary)]",
              "transition-colors duration-150",
              "hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
            )}
          >
            <Maximize2 className="h-3 w-3" strokeWidth={ICON_STROKE} />
            Month
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-5 border-b border-[var(--glass-border-soft)]">
        {data.days.map((day, i) => {
          const isToday = i === data.todayIndex;
          const isSelected = i === selectedDay;
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => {
                setSelectedDay(i);
                setView("day");
              }}
              className={cn(
                "relative flex flex-col items-center gap-1 px-1 py-2.5 transition-colors",
                i < data.days.length - 1 &&
                  "border-r border-[var(--glass-border-soft)]",
                isSelected && "bg-[var(--hover-fill)]",
                "hover:bg-[var(--hover-fill)]"
              )}
            >
              <span className="text-[10px] font-medium tracking-tight text-[var(--text-muted)]">
                {day.weekday}
              </span>
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums transition-colors",
                  isToday
                    ? "bg-[var(--btn-solid-bg)] text-[var(--btn-solid-fg)]"
                    : "text-[var(--text-primary)]"
                )}
              >
                {day.dayNum}
              </span>
              {day.events.some((e) => e.status === "busy") ? (
                <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-rose-400" />
              ) : day.events.some((e) => e.status === "tentative") ? (
                <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-amber-400/80" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="relative min-h-[148px]">
        <AnimatePresence mode="wait" initial={false}>
          {view === "week" && (
            <motion.div
              key="week"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.24, ease: easeSpring }}
              className="grid grid-cols-5"
            >
              {data.days.map((day, di) => (
                <div
                  key={day.date}
                  className={cn(
                    "min-h-[148px] space-y-1 p-1.5",
                    di < data.days.length - 1 &&
                      "border-r border-[var(--glass-border-soft)]",
                    di === data.todayIndex && "bg-[var(--hover-fill)]/30"
                  )}
                >
                  {day.events.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDay(di);
                        setView("day");
                        flash("Day is open");
                      }}
                      className="flex h-full min-h-[92px] w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--glass-border-soft)] text-[var(--text-muted)] transition-colors hover:border-[var(--glass-border)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-secondary)]"
                    >
                      <span className="text-[10px] font-medium">Open</span>
                    </button>
                  ) : (
                    day.events.map((ev, ei) => (
                      <EventChip
                        key={ev.id}
                        event={ev}
                        delay={0.06 + di * 0.03 + ei * 0.03}
                        compact
                        active={
                          hoverEvent === ev.id || selectedEvent === ev.id
                        }
                        onHover={setHoverEvent}
                        onClick={() => pickEvent(ev, di)}
                      />
                    ))
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {(view === "day" || view === "list") && activeDay && (
            <motion.div
              key={`${view}-${activeDay.date}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.24, ease: easeSpring }}
              className="space-y-1.5 p-3"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-[var(--text-muted)]">
                  {activeDay.weekday} {activeDay.dayNum}
                  {" · "}
                  {activeDay.events.length === 0
                    ? "Fully free"
                    : `${activeDay.events.length} block${activeDay.events.length === 1 ? "" : "s"}`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onAction?.(
                      `Propose a meeting with ${data.person.name} on ${activeDay.weekday} ${activeDay.dayNum}`
                    );
                    flash("Propose started");
                  }}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                >
                  <CalendarPlus
                    className="h-3 w-3"
                    strokeWidth={ICON_STROKE}
                  />
                  Propose
                </button>
              </div>
              {activeDay.events.length === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    onAction?.(
                      `Book time with ${data.person.name} on ${activeDay.weekday} ${activeDay.dayNum}`
                    );
                    flash("Ready to book");
                  }}
                  className="w-full rounded-xl border border-dashed border-[var(--glass-border)] bg-[var(--hover-fill)] px-3 py-5 text-center transition-colors hover:bg-[var(--hover-fill-strong)]"
                >
                  <p className="text-[13px] font-medium text-[var(--text-primary)]">
                    Wide open
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-[var(--text-muted)]">
                    Tap to draft an invite
                  </p>
                </button>
              ) : (
                activeDay.events.map((ev, ei) => (
                  <EventChip
                    key={ev.id}
                    event={ev}
                    delay={0.04 + ei * 0.04}
                    compact={false}
                    active={hoverEvent === ev.id || selectedEvent === ev.id}
                    onHover={setHoverEvent}
                    onClick={() => pickEvent(ev, selectedDay)}
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Open windows */}
      {data.openWindows && data.openWindows.length > 0 && (
        <div className="border-t border-[var(--glass-border-soft)] px-3.5 py-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Clock
              className="h-3.5 w-3.5 text-[var(--text-muted)]"
              strokeWidth={ICON_STROKE}
            />
            <p className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
              Open windows
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.openWindows.map((w, i) => {
              const active = selectedWindow === w.id;
              return (
                <motion.button
                  key={w.id}
                  type="button"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.18 + i * 0.04,
                    duration: 0.28,
                    ease: easeSpring,
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => pickWindow(w)}
                  className={cn(
                    "rounded-[12px] border px-2.5 py-1.5 text-left transition-colors duration-150",
                    active
                      ? "border-[var(--glass-border-strong)] bg-[var(--hover-fill-strong)]"
                      : "border-[var(--glass-border-soft)] bg-[var(--hover-fill)] hover:bg-[var(--hover-fill-strong)]"
                  )}
                >
                  <p className="text-[12px] font-semibold tracking-tight text-[var(--text-primary)]">
                    {w.label}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-[var(--text-muted)]">
                    {w.detail}
                  </p>
                </motion.button>
              );
            })}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={!selectedWindow}
              onClick={() => {
                const w = data.openWindows?.find(
                  (x) => x.id === selectedWindow
                );
                if (!w) return;
                onAction?.(
                  `Draft a meeting invite with ${data.person.name} for ${w.label}`
                );
                flash("Invite draft started");
              }}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium",
                "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]",
                "transition-opacity duration-150",
                "disabled:cursor-not-allowed disabled:opacity-35",
                "hover:bg-[var(--btn-primary-bg-hover)]"
              )}
            >
              <CalendarPlus className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
              Book selected
            </button>
            <button
              type="button"
              onClick={() => {
                onAction?.(
                  `Find a mutual time between my calendar and ${data.person.name}`
                );
                flash("Checking mutual free time…");
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--glass-border-soft)] bg-[var(--hover-fill)] px-3 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              Find mutual time
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--glass-border-soft)] px-3.5 py-2">
        {(Object.keys(STATUS) as ScheduleStatus[]).map((key) => (
          <span
            key={key}
            className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-[var(--text-muted)]"
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", STATUS[key].dot)} />
            {STATUS[key].label}
          </span>
        ))}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--glass-strong-solid)] px-3 py-1.5 text-[11.5px] font-medium text-[var(--text-primary)] shadow-[var(--shadow-md)]">
              <Check
                className="h-3 w-3 text-emerald-400"
                strokeWidth={ICON_STROKE}
              />
              {toast}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <MonthPopout
        open={monthOpen}
        data={data}
        selectedDay={selectedDay}
        personImageFailed={imgFailed}
        onClose={() => setMonthOpen(false)}
        onSelectDay={(index) => {
          setSelectedDay(index);
          setView("day");
          setMonthOpen(false);
          flash("Day opened");
        }}
        onPropose={(label) => {
          onAction?.(
            `Draft a meeting invite with ${data.person.name} for ${label}`
          );
          setMonthOpen(false);
          flash("Invite draft started");
        }}
      />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Month popout — refined full-month experience
   ═══════════════════════════════════════════════════════════ */

function MonthPopout({
  open,
  data,
  selectedDay,
  personImageFailed,
  onClose,
  onSelectDay,
  onPropose,
}: {
  open: boolean;
  data: ScheduleData;
  selectedDay: number;
  personImageFailed: boolean;
  onClose: () => void;
  onSelectDay: (dayIndex: number) => void;
  onPropose: (label: string) => void;
}) {
  const [cursor, setCursor] = useState(() => monthCursorFromData(data));
  const [hoverIso, setHoverIso] = useState<string | null>(null);

  // Reset to schedule month when opening
  useEffect(() => {
    if (open) setCursor(monthCursorFromData(data));
  }, [open, data]);

  useEscClose(open, onClose);
  useBodyScrollLock(open);

  const month = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month, data),
    [cursor, data]
  );

  const hoverMeta = useMemo(() => {
    if (!hoverIso) return null;
    return month.byIso.get(hoverIso) ?? null;
  }, [hoverIso, month.byIso]);

  const weekIsos = useMemo(
    () => new Set(data.days.map((d) => d.date)),
    [data.days]
  );

  const shiftMonth = (delta: number) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const initials =
    data.person.initials ??
    data.person.name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              key="month-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-[rgba(8,10,14,0.55)] backdrop-blur-[10px]"
              onClick={onClose}
            />

            <motion.div
              key="month-panel"
              role="dialog"
              aria-modal
              aria-label={`${data.person.name} — ${month.label}`}
              initial={{ opacity: 0, scale: 0.9, y: 36 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={springPop}
              className={cn(
                "relative z-[1] flex w-full max-w-[480px] flex-col overflow-hidden",
                "max-h-[min(88vh,640px)] rounded-[24px]",
                "border border-[var(--glass-border)]",
                "bg-[var(--glass-strong-solid)]",
                "shadow-[0_0_0_1px_var(--glass-border-soft)_inset]"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative flex items-center gap-3 border-b border-[var(--glass-border-soft)] px-4 pb-3.5 pt-4">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg shadow-[var(--shadow-sm)] ring-1 ring-[var(--glass-border)]">
                  {data.person.imageUrl && !personImageFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.person.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#4a5568] to-[#1e2530] text-[12px] font-semibold text-white">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                    {data.person.name}
                  </p>
                  <p className="truncate text-[12px] text-[var(--text-muted)]">
                    {data.person.title} · {data.timezone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--glass-border-soft)] text-[var(--text-muted)] transition-colors hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" strokeWidth={ICON_STROKE} />
                </button>
              </div>

              {/* Month nav */}
              <div className="relative flex items-center justify-between px-3 pt-3">
                <IconBtn label="Previous month" onClick={() => shiftMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" strokeWidth={ICON_STROKE} />
                </IconBtn>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={month.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="text-[14px] font-semibold tracking-tight text-[var(--text-primary)]"
                  >
                    {month.label}
                  </motion.p>
                </AnimatePresence>
                <IconBtn label="Next month" onClick={() => shiftMonth(1)}>
                  <ChevronRight className="h-4 w-4" strokeWidth={ICON_STROKE} />
                </IconBtn>
              </div>

              {/* Weekday row */}
              <div className="relative grid grid-cols-7 px-4 pb-1 pt-3">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div
                    key={d}
                    className="pb-2 text-center text-[10px] font-medium tracking-tight text-[var(--text-muted)]"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="relative px-3 pb-2">
                <div className="grid grid-cols-7 gap-1">
                  {month.cells.map((cell, i) => {
                    if (!cell.inMonth) {
                      return (
                        <div
                          key={`pad-${i}`}
                          className="aspect-square rounded-2xl"
                        />
                      );
                    }

                    const weekIdx = data.days.findIndex(
                      (d) => d.date === cell.iso
                    );
                    const inFocusWeek = weekIsos.has(cell.iso);
                    const isToday = cell.iso === month.todayIso;
                    const isSelected =
                      weekIdx >= 0 && weekIdx === selectedDay;
                    const isHover = hoverIso === cell.iso;
                    const level = cell.load; // 0–3

                    return (
                      <motion.button
                        key={cell.iso}
                        type="button"
                        initial={{ opacity: 0, scale: 0.86 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: Math.min(0.02 + i * 0.01, 0.28),
                          duration: 0.3,
                          ease: easeSpring,
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        onMouseEnter={() => setHoverIso(cell.iso)}
                        onMouseLeave={() => setHoverIso(null)}
                        onClick={() => {
                          if (weekIdx >= 0) onSelectDay(weekIdx);
                          else
                            onPropose(
                              `${month.label.split(" ")[0]} ${cell.day}`
                            );
                        }}
                        className={cn(
                          "group relative flex aspect-square flex-col items-center justify-center rounded-2xl",
                          "text-[13px] font-semibold tabular-nums",
                          "transition-[background,box-shadow,color] duration-150",
                          "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]",
                          inFocusWeek
                            ? "bg-[var(--hover-fill)] text-[var(--text-primary)]"
                            : "text-[var(--text-primary)] hover:bg-[var(--hover-fill)]",
                          isSelected &&
                            "bg-[var(--hover-fill-strong)] shadow-[0_0_0_1px_var(--glass-border)_inset]",
                          isHover && !isSelected && "bg-[var(--hover-fill-strong)]"
                        )}
                      >
                        {/* Focus-week highlight band */}
                        {inFocusWeek && (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-[var(--glass-border-soft)]"
                          />
                        )}

                        <span
                          className={cn(
                            "relative z-[1] flex h-8 w-8 items-center justify-center rounded-full",
                            isToday &&
                              "bg-[var(--btn-solid-bg)] text-[var(--btn-solid-fg)] shadow-[var(--btn-solid-shadow)]"
                          )}
                        >
                          {cell.day}
                        </span>

                        {/* Load indicators */}
                        <span className="absolute bottom-1.5 flex h-1 items-center gap-0.5">
                          {level >= 1 && (
                            <span
                              className={cn(
                                "h-1 w-1 rounded-full",
                                cell.hasBusy
                                  ? "bg-rose-400"
                                  : cell.hasTentative
                                    ? "bg-amber-400"
                                    : "bg-emerald-400/80"
                              )}
                            />
                          )}
                          {level >= 2 && (
                            <span
                              className={cn(
                                "h-1 w-1 rounded-full",
                                cell.hasBusy
                                  ? "bg-rose-400/70"
                                  : "bg-amber-400/70"
                              )}
                            />
                          )}
                          {level >= 3 && (
                            <span className="h-1 w-1 rounded-full bg-[var(--text-muted)]/50" />
                          )}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Hover / selection preview */}
              <div className="relative mx-3 mb-3 min-h-[72px]">
                <AnimatePresence mode="wait">
                  {hoverMeta ? (
                    <motion.div
                      key={hoverMeta.iso}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.18 }}
                      className={cn(
                        "rounded-2xl border border-[var(--glass-border-soft)]",
                        "bg-[var(--hover-fill)] px-3.5 py-2.5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[12.5px] font-semibold text-[var(--text-primary)]">
                            {hoverMeta.weekdayLabel}
                          </p>
                          <p className="mt-0.5 text-[11.5px] text-[var(--text-muted)]">
                            {hoverMeta.summary}
                          </p>
                        </div>
                        {hoverMeta.weekIndex >= 0 ? (
                          <span className="shrink-0 rounded-md bg-[var(--hover-fill-strong)] px-1.5 py-0.5 text-[10px] font-medium tracking-tight text-[var(--text-secondary)]">
                            In week
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                            Outside week
                          </span>
                        )}
                      </div>
                      {hoverMeta.events.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {hoverMeta.events.slice(0, 3).map((ev) => (
                            <span
                              key={ev.id}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                                STATUS[ev.status].chip
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1 w-1 rounded-full",
                                  STATUS[ev.status].dot
                                )}
                              />
                              {ev.start} {ev.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex h-[72px] items-center justify-center rounded-2xl border border-dashed border-[var(--glass-border-soft)] px-3 text-center"
                    >
                      <p className="text-[12px] text-[var(--text-muted)]">
                        Hover a day for details · Click a focused week day to
                        open it
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer actions */}
              <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-[var(--glass-border-soft)] px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] text-[var(--text-muted)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    Busy
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] text-[var(--text-muted)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Tentative
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] text-[var(--text-muted)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Light
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-8 rounded-full border border-[var(--glass-border-soft)] px-3 text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = data.days[selectedDay];
                      onPropose(
                        d
                          ? `${d.weekday} ${d.dayNum}`
                          : data.rangeLabel
                      );
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--btn-primary-bg)] px-3 text-[12px] font-medium text-[var(--btn-primary-fg)] transition-colors hover:bg-[var(--btn-primary-bg-hover)]"
                  >
                    <CalendarPlus
                      className="h-3.5 w-3.5"
                      strokeWidth={ICON_STROKE}
                    />
                    Propose time
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/* ── month helpers ───────────────────────────────────────── */

function monthCursorFromData(data: ScheduleData) {
  const anchor = data.days[0]?.date ?? "2026-07-01";
  const [y, m] = anchor.split("-").map(Number) as [number, number];
  return { year: y, month: m - 1 };
}

type MonthCellMeta = {
  iso: string;
  day: number;
  inMonth: boolean;
  load: number;
  hasBusy: boolean;
  hasTentative: boolean;
  weekIndex: number;
  weekdayLabel: string;
  summary: string;
  events: ScheduleEvent[];
};

function buildMonthGrid(
  year: number,
  month: number,
  data: ScheduleData
) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = first.getDay();
  const label = first.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  // Prefer schedule “today” if present
  const scheduleToday =
    data.todayIndex != null ? data.days[data.todayIndex]?.date : undefined;

  const byDate = new Map(data.days.map((d, i) => [d.date, { day: d, index: i }]));

  const cells: MonthCellMeta[] = [];
  const total = startPad + daysInMonth;
  const rows = Math.ceil(total / 7) * 7;

  for (let i = 0; i < rows; i++) {
    const dayNum = i - startPad + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push({
        iso: `pad-${i}`,
        day: 0,
        inMonth: false,
        load: 0,
        hasBusy: false,
        hasTentative: false,
        weekIndex: -1,
        weekdayLabel: "",
        summary: "",
        events: [],
      });
      continue;
    }
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const hit = byDate.get(iso);
    const events = hit?.day.events ?? [];
    // Light synthetic load outside the focus week so the month feels alive
    const synthetic =
      !hit && dayNum % 5 === 0
        ? 1
        : !hit && dayNum % 7 === 0
          ? 2
          : 0;
    const load = hit ? Math.min(3, events.length) : synthetic;
    const hasBusy = events.some((e) => e.status === "busy") || (!hit && dayNum % 11 === 0);
    const hasTentative =
      events.some((e) => e.status === "tentative") ||
      (!hit && synthetic > 0 && !hasBusy);

    const dt = new Date(year, month, dayNum);
    const weekdayLabel = dt.toLocaleString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    let summary = "Mostly free";
    if (hit) {
      if (events.length === 0) summary = "Open all day";
      else if (hasBusy) summary = `${events.length} block${events.length > 1 ? "s" : ""} · has busy`;
      else summary = `${events.length} tentative hold${events.length > 1 ? "s" : ""}`;
    } else if (hasBusy) summary = "Likely busy (outlook)";
    else if (hasTentative) summary = "Light holds";

    cells.push({
      iso,
      day: dayNum,
      inMonth: true,
      load,
      hasBusy,
      hasTentative,
      weekIndex: hit?.index ?? -1,
      weekdayLabel,
      summary,
      events,
    });
  }

  const byIso = new Map(
    cells.filter((c) => c.inMonth).map((c) => [c.iso, c] as const)
  );

  return {
    label,
    cells,
    byIso,
    todayIso: scheduleToday ?? todayIso,
  };
}

function useEscClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

function useBodyScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

/* ── shared bits ─────────────────────────────────────────── */

function ActionIcon({ kind }: { kind: ScheduleAction["kind"] }) {
  const cls = "h-3.5 w-3.5";
  if (kind === "teams")
    return <MessageSquare className={cls} strokeWidth={ICON_STROKE} />;
  if (kind === "email")
    return <Mail className={cls} strokeWidth={ICON_STROKE} />;
  if (kind === "copy")
    return <Copy className={cls} strokeWidth={ICON_STROKE} />;
  return <CalendarPlus className={cls} strokeWidth={ICON_STROKE} />;
}

function IconBtn({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
    >
      {children}
    </button>
  );
}

function EventChip({
  event,
  delay,
  compact,
  active,
  onHover,
  onClick,
}: {
  event: ScheduleEvent;
  delay: number;
  compact: boolean;
  active: boolean;
  onHover: (id: string | null) => void;
  onClick?: () => void;
}) {
  const s = STATUS[event.status];
  const label = compact
    ? `${event.start.replace(" ", "")} ${event.title.slice(0, 8)}${event.title.length > 8 ? "…" : ""}`
    : `${event.start} – ${event.end}`;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 5, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.28, ease: easeSpring }}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => onHover(event.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border border-l-[3px] text-left transition-shadow duration-150",
        s.bar,
        "border-[var(--glass-border-soft)] bg-[var(--hover-fill)]",
        "hover:bg-[var(--hover-fill-strong)] hover:shadow-[var(--shadow-xs)]",
        active && "ring-1 ring-[var(--glass-border-strong)]",
        compact ? "px-1.5 py-1" : "px-2.5 py-2"
      )}
    >
      <p
        className={cn(
          "font-medium leading-snug text-[var(--text-primary)]",
          compact ? "truncate text-[10px]" : "text-[12.5px]"
        )}
      >
        {label}
      </p>
      {!compact && (
        <>
          <p className="mt-0.5 text-[11.5px] text-[var(--text-secondary)]">
            {event.title}
          </p>
          <span
            className={cn(
              "mt-1.5 inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-tight",
              s.chip
            )}
          >
            {s.label}
          </span>
        </>
      )}
    </motion.button>
  );
}

export function ResearchChip({
  label = "Did some research",
}: {
  label?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: easeSpring }}
    >
      <div
        className={cn(
          "chat-glass mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
          "text-[12px] text-[var(--text-secondary)]"
        )}
      >
        <span className="relative flex h-3.5 w-3.5 items-center justify-center">
          <svg
            viewBox="0 0 16 16"
            className="relative h-3 w-3 text-[var(--text-secondary)]"
            fill="none"
            aria-hidden
          >
            <path
              d="M3 4.5h10M3 8h7M3 11.5h5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="font-medium">{label}</span>
      </div>
    </motion.div>
  );
}
