"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Building2 } from "lucide-react";
import {
  peopleDirectory,
  type PersonProfile,
} from "@/lib/people-data";
import type { TeamAuthor } from "@/types/messaging";
import { Portal } from "@/components/ui/Portal";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";

export function resolvePerson(
  author: Pick<TeamAuthor, "id" | "name" | "handle">
): PersonProfile | null {
  if (author.id === "self" || author.id === "magnus") return null;
  return (
    peopleDirectory.find(
      (p) =>
        p.id === author.id ||
        p.handle === author.handle ||
        p.name === author.name
    ) ?? null
  );
}

/**
 * Click name → profile card. No hover open (avoids accidental popups).
 */
export function PersonHoverCard({
  author,
  children,
  className,
}: {
  author: TeamAuthor;
  children: ReactNode;
  className?: string;
}) {
  const person = resolvePerson(author);
  const ref = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const measure = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const cardW = 280;
    let left = r.left;
    if (left + cardW > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - cardW - 12);
    }
    let top = r.bottom + 8;
    if (top + 200 > window.innerHeight - 12) {
      top = Math.max(12, r.top - 208);
    }
    setPos({ top, left });
  };

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!person) return;
    if (open) {
      setOpen(false);
      return;
    }
    measure();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t)) return;
      if (cardRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  if (!person) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span
      ref={ref}
      className={cn("relative inline-flex", className)}
      data-person-hover={person.id}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "inline-flex max-w-full cursor-pointer appearance-none border-0 bg-transparent p-0 text-left",
          "outline-none"
        )}
        data-person-name-trigger
      >
        {children}
      </button>
      <Portal>
        <AnimatePresence>
          {open && pos && (
            <motion.div
              key={person.id}
              ref={cardRef}
              role="dialog"
              aria-label={`${person.name} profile`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              transition={{ duration: 0.16, ease: easeSpring }}
              style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                zIndex: 220,
              }}
              className="w-[280px]"
              data-person-card-popup={person.id}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={cn(
                  "overflow-hidden rounded-2xl",
                  "border border-[var(--glass-border-soft)]",
                  "bg-[var(--glass-strong-solid)] shadow-[var(--shadow-menu)]"
                )}
              >
                <div className="flex gap-3 p-3.5">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--hover-fill-strong)]">
                    {person.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={person.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[13px] font-semibold text-[var(--text-muted)]">
                        {person.initials}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold tracking-tight text-[var(--text-primary)]">
                      {person.name}
                    </p>
                    <p className="truncate text-[12px] text-[var(--text-muted)]">
                      @{person.handle}
                      {person.role ? ` · ${person.role}` : ""}
                    </p>
                    <div className="mt-1.5 flex flex-col gap-0.5 text-[11.5px] text-[var(--text-secondary)]">
                      {person.office && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin
                            className="h-3 w-3 shrink-0 opacity-70"
                            strokeWidth={ICON_STROKE}
                          />
                          {person.office}
                        </span>
                      )}
                      {person.division && (
                        <span className="inline-flex items-center gap-1">
                          <Building2
                            className="h-3 w-3 shrink-0 opacity-70"
                            strokeWidth={ICON_STROKE}
                          />
                          {person.division}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="px-3.5 pb-2 text-[12.5px] leading-relaxed text-[var(--text-secondary)]">
                  {person.bio}
                </p>
                {person.projects && person.projects.length > 0 && (
                  <div className="flex flex-wrap gap-1 px-3.5 pb-3">
                    {person.projects.map((p) => (
                      <span
                        key={p}
                        className="rounded-md bg-[var(--hover-fill)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--text-muted)]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
                <div className="px-2.5 pb-2.5">
                  <Link
                    href={`/people/${person.id}`}
                    className="flex w-full items-center justify-center rounded-xl bg-[var(--hover-fill)] py-2 text-[12.5px] font-semibold text-[var(--text-primary)] hover:bg-[var(--hover-fill-strong)]"
                    onClick={() => setOpen(false)}
                  >
                    View profile
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </span>
  );
}
