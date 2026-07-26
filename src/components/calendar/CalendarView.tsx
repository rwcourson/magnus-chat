"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  MapPin,
  ClipboardList,
  Users,
} from "lucide-react";
import type { CalendarEvent, CalendarEventKind } from "@/types/calendar";
import { calendarDays, todayCalendar } from "@/lib/calendar-data";
import { PageHeader } from "@/components/ui/PageHeader";
import { PillAction } from "@/components/ui/PillAction";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { useChat } from "@/context/ChatContext";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

const KIND_LABEL: Record<CalendarEventKind, string> = {
  meeting: "Meeting",
  site: "Site",
  focus: "Focus",
  travel: "Travel",
  deadline: "Deadline",
};

const KIND_TONE: Record<CalendarEventKind, string> = {
  meeting: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  site: "bg-amber-500/12 text-amber-800 dark:text-amber-300",
  focus: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  travel: "bg-slate-500/12 text-slate-700 dark:text-slate-300",
  deadline: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
};

function prepPrompt(event: CalendarEvent, dayLabel: string) {
  const bits = [
    `Prep me for "${event.title}" (${dayLabel}, ${event.start}–${event.end}).`,
    event.project ? `Project: ${event.project}.` : "",
    event.withWhom ? `With: ${event.withWhom}.` : "",
    event.location ? `Location: ${event.location}.` : "",
    event.prepHint ? `Hint: ${event.prepHint}` : "What should I review first?",
  ];
  return bits.filter(Boolean).join(" ");
}

/**
 * Day / week agenda — mock Outlook surface with Prep in Magnus.
 */
export function CalendarView() {
  const router = useRouter();
  const { sendMessage, setAppMode } = useChat();
  const today = useMemo(() => todayCalendar(), []);
  const [dayIndex, setDayIndex] = useState(() =>
    Math.max(
      0,
      calendarDays.findIndex((d) => d.isToday)
    )
  );

  const day = calendarDays[dayIndex] ?? today;

  const prep = (event: CalendarEvent) => {
    const prompt = prepPrompt(event, `${day.weekday} ${day.dateLabel}`);
    setAppMode("chat");
    router.push("/");
    // Defer so navigation settles before thread creation
    window.setTimeout(() => sendMessage(prompt), 40);
  };

  const prepToday = () => {
    const events = day.events;
    const lines = events
      .map(
        (e) =>
          `• ${e.start}–${e.end}: ${e.title}${e.prepHint ? ` — ${e.prepHint}` : ""}`
      )
      .join("\n");
    const prompt = `What's on my calendar for ${day.weekday} ${day.dateLabel}? Walk me through prep.\n\n${lines}`;
    setAppMode("chat");
    router.push("/");
    window.setTimeout(() => sendMessage(prompt), 40);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin"
      >
        <div className="mx-auto w-full max-w-[760px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              eyebrow="Calendar"
              icon={CalendarDays}
              title="Your agenda"
              description="Today’s meetings, site blocks, and deadlines — prep any item with Magnus before you walk in."
              className="mb-0"
            />
            <div className="mt-8" data-prep-day>
              <PillAction
                icon={ClipboardList}
                arrow={false}
                onClick={prepToday}
              >
                Prep this day
              </PillAction>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2" data-calendar-days>
            {calendarDays.map((d, i) => (
              <button
                key={`${d.dateLabel}-${d.weekday}`}
                type="button"
                onClick={() => setDayIndex(i)}
                className={cn(
                  "min-w-[4.5rem] rounded-[14px] border px-3 py-2.5 text-left transition-colors",
                  i === dayIndex
                    ? "border-[var(--glass-border)] bg-[var(--select-fill)]"
                    : "border-[var(--glass-border-soft)] bg-[var(--glass-strong-solid)] hover:border-[var(--glass-border)]"
                )}
                data-calendar-day={d.dateLabel}
                data-calendar-today={d.isToday ? "true" : undefined}
              >
                <p className="text-[10.5px] font-medium tracking-tight text-[var(--text-muted)]">
                  {d.weekday}
                  {d.isToday ? " · Today" : ""}
                </p>
                <p className="mt-0.5 text-[14px] font-semibold text-[var(--text-primary)]">
                  {d.dateLabel}
                </p>
                <p className="mt-0.5 text-[11px] tabular-nums text-[var(--text-muted)]">
                  {d.events.length} event{d.events.length === 1 ? "" : "s"}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2.5" data-calendar-events>
            {day.events.length === 0 ? (
              <div className="rounded-[18px] border border-[var(--glass-border-soft)] bg-[var(--glass-strong-solid)] px-5 py-10 text-center">
                <p className="text-[14px] font-medium text-[var(--text-primary)]">
                  Free day
                </p>
                <p className="mt-1 text-[13px] text-[var(--text-muted)]">
                  Nothing on the agenda. Catch me up or clear approvals instead.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <PillAction href="/approvals">Approvals</PillAction>
                  <PillAction href="/">Home</PillAction>
                </div>
              </div>
            ) : (
              day.events.map((event, i) => (
                <motion.article
                  key={event.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(i * 0.04, 0.24),
                    duration: 0.34,
                    ease: easeSpring,
                  }}
                  className={cn(
                    "rounded-[16px] border border-[var(--glass-border-soft)]",
                    "bg-[var(--glass-strong-solid)] p-4 shadow-[var(--shadow-xs)] sm:p-5",
                    "transition-[border-color] duration-150 hover:border-[var(--glass-border)]"
                  )}
                  data-calendar-event={event.id}
                  data-event-kind={event.kind}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10.5px] font-medium tracking-tight",
                            KIND_TONE[event.kind]
                          )}
                        >
                          {KIND_LABEL[event.kind]}
                        </span>
                        <span className="text-[12.5px] font-medium tabular-nums text-[var(--text-secondary)]">
                          {event.start} – {event.end}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-[15.5px] font-semibold tracking-tight text-[var(--text-primary)]">
                        {event.title}
                      </h3>
                      <div className="mt-2 flex flex-col gap-1 text-[12.5px] text-[var(--text-muted)]">
                        {event.location && (
                          <p className="inline-flex items-center gap-1.5">
                            <MapPin
                              className="h-3.5 w-3.5 shrink-0"
                              strokeWidth={ICON_STROKE}
                            />
                            {event.location}
                          </p>
                        )}
                        {event.withWhom && (
                          <p className="inline-flex items-center gap-1.5">
                            <Users
                              className="h-3.5 w-3.5 shrink-0"
                              strokeWidth={ICON_STROKE}
                            />
                            {event.withWhom}
                          </p>
                        )}
                        {event.project && (
                          <p className="text-[var(--text-secondary)]">
                            {event.project}
                          </p>
                        )}
                      </div>
                      {event.prepHint && (
                        <p className="mt-3 rounded-xl bg-[var(--hover-fill)] px-3 py-2 text-[12.5px] leading-snug text-[var(--text-secondary)]">
                          <span className="font-medium text-[var(--text-primary)]">
                            Prep
                          </span>
                          {" — "}
                          {event.prepHint}
                        </p>
                      )}
                    </div>
                    <div data-prep-event={event.id}>
                      <PillAction
                        size="sm"
                        icon={ClipboardList}
                        arrow={false}
                        onClick={() => prep(event)}
                      >
                        Prep with Magnus
                      </PillAction>
                    </div>
                  </div>
                </motion.article>
              ))
            )}
          </div>
        </div>
      </ScrollFade>
    </div>
  );
}
