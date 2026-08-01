"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { FolderKanban, Files, MessageSquare, Plus } from "lucide-react";
import type { WorkspaceItem } from "@/types/catalog";
import { listWorkspaces } from "@/lib/catalog-data";
import { createAndRegisterWorkspace } from "@/lib/catalog-create";
import { PageHeader } from "@/components/ui/PageHeader";
import { AvatarMark } from "@/components/ui/BrandMark";
import {
  CatalogSearch,
  matchesCatalogQuery,
} from "@/components/ui/CatalogSearch";
import { useToast } from "@/context/ToastContext";
import { formatFeedTime } from "@/lib/feed";
import { cn } from "@/lib/utils";
import { easeSpring } from "@/lib/motion";
import { ICON_STROKE } from "@/lib/icons";
import { ScrollFade } from "@/components/ui/ScrollFade";

const NOW = Date.parse("2026-07-23T19:00:00Z");

function matchesQuery(ws: WorkspaceItem, q: string): boolean {
  return matchesCatalogQuery(
    [
      ws.name,
      ws.description,
      ws.projectCode,
      ...ws.members.map((m) => `${m.name} ${m.initials}`),
    ],
    q
  );
}

/**
 * Simple project list — small icon thumbnails, not banner covers.
 */
export function WorkspacesView({
  items,
  nowMs = NOW,
}: {
  /** Optional override; default is shared registry (seed + created). */
  items?: WorkspaceItem[];
  nowMs?: number;
}) {
  const { toast } = useToast();
  const [list, setList] = useState<WorkspaceItem[]>(
    () => items ?? listWorkspaces()
  );
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(
    () => list.filter((ws) => matchesQuery(ws, q)),
    [list, q]
  );

  const openCreate = () => {
    setCreating(true);
    setName("");
    setCode("");
  };

  const submitCreate = () => {
    const item = createAndRegisterWorkspace({
      name,
      projectCode: code || undefined,
    });
    if (!item) {
      toast({ title: "Name is required", tone: "danger", duration: 2000 });
      return;
    }
    // Re-read registry so list and detail share the same source of truth
    setList(listWorkspaces());
    setCreating(false);
    setQuery("");
    toast({
      title: "Workspace created",
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
        <div className="mx-auto w-full max-w-[640px] px-4 pb-16 pt-7 sm:px-6 sm:pt-9">
          <PageHeader
            eyebrow="Workspaces"
            icon={FolderKanban}
            title="Projects & shared context"
            description="Organize chats, files, and people by job or team."
            className="mb-5"
            actions={
              <button
                type="button"
                onClick={openCreate}
                className="btn-solid inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold"
                data-new-workspace
                aria-label="New workspace"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                New workspace
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
                data-new-workspace-form
              >
                <p className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
                  New workspace
                </p>
                <div className="mt-3 space-y-2.5">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name (e.g. Downtown tower)"
                    className={cn(
                      "w-full rounded-xl border border-[var(--glass-border)] bg-[var(--hover-fill)]",
                      "px-3 py-2 text-[14px] text-[var(--text-primary)] outline-none",
                      "placeholder:text-[var(--text-muted)]",
                      "focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                    )}
                    aria-label="Workspace name"
                    data-workspace-name
                    autoFocus
                  />
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Project code (optional)"
                    className={cn(
                      "w-full rounded-xl border border-[var(--glass-border)] bg-[var(--hover-fill)]",
                      "px-3 py-2 text-[14px] text-[var(--text-primary)] outline-none",
                      "placeholder:text-[var(--text-muted)]",
                      "focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                    )}
                    aria-label="Project code"
                    data-workspace-code
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={submitCreate}
                    className="btn-solid inline-flex h-9 items-center rounded-full px-3.5 text-[12.5px] font-semibold"
                    data-workspace-save
                  >
                    Create workspace
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

          <CatalogSearch
            value={query}
            onChange={setQuery}
            placeholder="Search projects, codes, people…"
            aria-label="Search workspaces"
            className="mb-4"
            data-testid="workspaces-search"
          />

          {filtered.length === 0 ? (
            <div
              className="rounded-[20px] border border-dashed border-[var(--glass-border)] px-4 py-12 text-center"
              data-workspaces-empty
            >
              <p className="text-[13px] text-[var(--text-muted)]">
                {query.trim()
                  ? `No workspaces match “${query.trim()}”`
                  : "No workspaces yet. Create one for a job or team."}
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="btn-solid mt-4 inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold"
                data-workspaces-empty-cta
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                New workspace
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5" data-workspaces-list>
              {filtered.map((ws, i) => (
                <motion.li
                  key={ws.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(i * 0.03, 0.18),
                    duration: 0.28,
                    ease: easeSpring,
                  }}
                >
                  <Link
                    href={`/workspaces/${ws.id}`}
                    className="block"
                    data-workspace-open
                  >
                    <article
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-2.5 py-2.5",
                        "border border-[var(--glass-border-soft)] bg-[var(--glass-strong-solid)]",
                        "shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,background] duration-150",
                        "hover:border-[var(--glass-border)] hover:bg-[var(--hover-fill)]/40 hover:shadow-[var(--shadow-md)]"
                      )}
                      data-workspace-card
                      data-workspace-id={ws.id}
                      data-cover-url={ws.coverUrl}
                    >
                      <div
                        className={cn(
                          "relative h-11 w-11 shrink-0 overflow-hidden rounded-xl",
                          "ring-1 ring-[var(--glass-border-soft)]"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ws.coverUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-baseline gap-2">
                          <h2 className="truncate text-[14px] font-semibold tracking-tight text-[var(--text-primary)]">
                            {ws.name}
                          </h2>
                          {ws.projectCode && (
                            <span className="shrink-0 text-[11px] font-medium tabular-nums text-[var(--text-muted)]">
                              {ws.projectCode}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[12.5px] leading-snug text-[var(--text-secondary)]">
                          {ws.description}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3">
                          <div className="flex items-center -space-x-1.5">
                            {ws.members.slice(0, 3).map((m) => (
                              <AvatarMark
                                key={m.initials + m.name}
                                src={m.avatarUrl}
                                initials={m.initials}
                                size={20}
                                className="ring-2 ring-[var(--glass-strong-solid)]"
                              />
                            ))}
                            {ws.members.length > 3 && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--hover-fill-strong)] text-[9px] font-semibold text-[var(--text-muted)] ring-2 ring-[var(--glass-strong-solid)]">
                                +{ws.members.length - 3}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5 text-[11px] text-[var(--text-muted)]">
                            <span className="inline-flex items-center gap-0.5">
                              <MessageSquare
                                className="h-3 w-3"
                                strokeWidth={ICON_STROKE}
                              />
                              {ws.chats}
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <Files
                                className="h-3 w-3"
                                strokeWidth={ICON_STROKE}
                              />
                              {ws.files}
                            </span>
                            <span className="tabular-nums">
                              {formatFeedTime(ws.updatedAt, nowMs)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </ScrollFade>
    </div>
  );
}
