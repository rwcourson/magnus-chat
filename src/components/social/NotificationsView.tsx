"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { feedNotifications } from "@/lib/people-data";
import { formatFeedTime } from "@/lib/feed";
import { PageHeader } from "@/components/ui/PageHeader";
import { PillAction } from "@/components/ui/PillAction";
import { AvatarMark } from "@/components/ui/BrandMark";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ScrollFade } from "@/components/ui/ScrollFade";

const NOW = Date.parse("2026-07-23T19:00:00Z");

/**
 * Notifications — supporting social surface for feed activity.
 */
export function NotificationsView() {
  const [items, setItems] = useState(feedNotifications);

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin"
      >
        <div className="mx-auto w-full max-w-[680px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <div className="mb-2 flex items-start justify-between gap-3">
            <PageHeader
              eyebrow="Notifications"
              icon={Bell}
              title="Your activity"
              description="Replies, likes, mentions, and system nudges — tied to the feed and work tools."
              className="mb-0"
            />
            {unread > 0 && (
              <PillAction
                className="mt-8"
                arrow={false}
                onClick={markAllRead}
              >
                Mark all read
              </PillAction>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {items.map((n, i) => {
              const inner = (
                <motion.article
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(i * 0.035, 0.24),
                    duration: 0.34,
                    ease: easeSpring,
                  }}
                  className={cn(
                    "flex gap-3 rounded-[16px] border border-[var(--glass-border-soft)] p-3.5",
                    "bg-[var(--glass-strong-solid)] shadow-[var(--shadow-xs)]",
                    "transition-[border-color,background] duration-150",
                    "hover:border-[var(--glass-border)]",
                    !n.read && "bg-[var(--select-fill)]/40"
                  )}
                  data-notification={n.id}
                >
                  {n.actor ? (
                    <AvatarMark
                      src={n.actor.avatarUrl}
                      initials={n.actor.initials}
                      size={40}
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--hover-fill-strong)] text-[var(--text-muted)]">
                      <Bell className="h-4 w-4" strokeWidth={1.4} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13.5px] font-semibold tracking-tight text-[var(--text-primary)]">
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--text-primary)] opacity-70" />
                      )}
                    </div>
                    <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-secondary)]">
                      {n.body}
                    </p>
                    <p className="mt-1.5 text-[11.5px] tabular-nums text-[var(--text-muted)]">
                      {formatFeedTime(n.createdAt, NOW)} · {n.kind}
                    </p>
                  </div>
                </motion.article>
              );

              return n.href ? (
                <Link key={n.id} href={n.href} className="block">
                  {inner}
                </Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })}
          </div>
        </div>
      </ScrollFade>
    </div>
  );
}
