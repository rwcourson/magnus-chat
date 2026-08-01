"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Files,
  FolderKanban,
  MessageSquare,
  Users,
} from "lucide-react";
import type { WorkspaceItem } from "@/types/catalog";
import { getWorkspaceEntitySubsets } from "@/lib/catalog-data";
import { PageHeader } from "@/components/ui/PageHeader";
import { AvatarMark } from "@/components/ui/BrandMark";
import { formatFeedTime } from "@/lib/feed";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";
import { ScrollFade } from "@/components/ui/ScrollFade";

const NOW = Date.parse("2026-07-23T19:00:00Z");

/**
 * Project workspace entity — members, scoped chats, files, recent activity.
 */
export function WorkspaceDetailView({
  workspace,
  nowMs = NOW,
}: {
  workspace: WorkspaceItem;
  nowMs?: number;
}) {
  const { members, chatEntries, fileEntries, activity } =
    getWorkspaceEntitySubsets(workspace);

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden"
      data-workspace-detail
      data-workspace-id={workspace.id}
    >
      <ScrollFade
        className="relative z-[1] min-h-0 flex-1"
        size="lg"
        contentClassName="scroll-thin"
      >
        <div className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <Link
            href="/workspaces"
            className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
            data-workspace-back
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
            All workspaces
          </Link>

          <PageHeader
            eyebrow={workspace.projectCode ?? "Workspace"}
            icon={FolderKanban}
            title={workspace.name}
            description={workspace.description}
            className="mb-5"
          />

          <div
            className={cn(
              "mb-6 overflow-hidden rounded-[20px] border border-[var(--glass-border-soft)]",
              "bg-[var(--glass-strong-solid)] shadow-[var(--shadow-sm)]"
            )}
          >
            <div className="relative h-[120px] sm:h-[140px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={workspace.coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-[var(--glass-strong-solid)] via-transparent to-transparent"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 px-4 pb-4 pt-2 text-[12px] text-[var(--text-muted)] sm:px-5">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                {members.length} members
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare
                  className="h-3.5 w-3.5"
                  strokeWidth={ICON_STROKE}
                />
                {chatEntries.length || workspace.chats} chats
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Files className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                {fileEntries.length || workspace.files} files
              </span>
              <span className="tabular-nums">
                Updated {formatFeedTime(workspace.updatedAt, nowMs)}
              </span>
            </div>
          </div>

          <Section title="Members" testId="workspace-members">
            <ul className="flex flex-col gap-1">
              {members.map((m) => (
                <li
                  key={`${m.name}-${m.initials}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[var(--hover-fill)]"
                  data-workspace-member
                >
                  <AvatarMark
                    src={m.avatarUrl}
                    initials={m.initials}
                    size={36}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-[var(--text-primary)]">
                      {m.name}
                    </p>
                    {m.role && (
                      <p className="text-[12px] text-[var(--text-muted)]">
                        {m.role}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Chats & threads" testId="workspace-chats">
            {chatEntries.length === 0 ? (
              <Empty note="No project chats yet." />
            ) : (
              <ul className="flex flex-col gap-1.5">
                {chatEntries.map((c, i) => (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: Math.min(i * 0.03, 0.15),
                      duration: 0.28,
                      ease: easeSpring,
                    }}
                  >
                    <article
                      className={cn(
                        "rounded-xl border border-[var(--glass-border-soft)] bg-[var(--glass-strong-solid)]",
                        "px-3.5 py-3 shadow-[var(--shadow-xs)]",
                        "transition-[border-color] duration-150 hover:border-[var(--glass-border)]"
                      )}
                      data-workspace-chat
                      data-chat-id={c.id}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[13.5px] font-semibold tracking-tight text-[var(--text-primary)]">
                          {c.title}
                        </h3>
                        <span className="shrink-0 text-[11px] tabular-nums text-[var(--text-muted)]">
                          {formatFeedTime(c.updatedAt, nowMs)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-[var(--text-secondary)]">
                        {c.preview}
                      </p>
                      {typeof c.messageCount === "number" && (
                        <p className="mt-1.5 text-[11px] tabular-nums text-[var(--text-muted)]">
                          {c.messageCount} messages
                        </p>
                      )}
                    </article>
                  </motion.li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Files" testId="workspace-files">
            {fileEntries.length === 0 ? (
              <Empty note="No files in this workspace yet." />
            ) : (
              <ul className="flex flex-col gap-1">
                {fileEntries.map((f) => (
                  <li
                    key={f.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-[var(--glass-border-soft)]",
                      "bg-[var(--glass-strong-solid)] px-3 py-2.5 shadow-[var(--shadow-xs)]"
                    )}
                    data-workspace-file
                    data-file-id={f.id}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--hover-fill)] text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                      {f.kind.slice(0, 3)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                        {f.name}
                      </p>
                      <p className="text-[11.5px] text-[var(--text-muted)]">
                        {f.kind}
                        {f.sizeLabel ? ` · ${f.sizeLabel}` : ""} ·{" "}
                        {formatFeedTime(f.updatedAt, nowMs)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Recent activity" testId="workspace-activity">
            {activity.length === 0 ? (
              <Empty note="No recent activity." />
            ) : (
              <ul className="flex flex-col gap-0 border-l border-[var(--glass-border-soft)] pl-3.5">
                {activity.map((a) => (
                  <li
                    key={a.id}
                    className="relative pb-4 last:pb-0"
                    data-workspace-activity
                    data-activity-id={a.id}
                  >
                    <span
                      aria-hidden
                      className="absolute -left-[calc(0.875rem+3px)] top-1.5 h-2 w-2 rounded-full bg-[var(--text-muted)] ring-2 ring-[var(--bg-deep)]"
                    />
                    <p className="text-[13px] leading-snug text-[var(--text-primary)]">
                      {a.summary}
                    </p>
                    <p className="mt-0.5 text-[11.5px] tabular-nums text-[var(--text-muted)]">
                      {formatFeedTime(a.at, nowMs)}
                      {a.actor ? ` · ${a.actor}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </ScrollFade>
    </div>
  );
}

function Section({
  title,
  testId,
  children,
}: {
  title: string;
  testId: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-8" data-testid={testId}>
      <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Empty({ note }: { note: string }) {
  return (
    <p className="rounded-xl border border-dashed border-[var(--glass-border)] px-3 py-6 text-center text-[13px] text-[var(--text-muted)]">
      {note}
    </p>
  );
}
