"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  FileText,
  Hash,
  MapPin,
  Paperclip,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type { Conversation, MessageAttachment } from "@/types/messaging";
import {
  displayName,
  isImageMime,
  resolveConversationIdentity,
} from "@/lib/messaging";
import { peopleDirectory } from "@/lib/people-data";
import { currentUser } from "@/lib/mock-data";
import { ConversationIdentityMark } from "@/components/messaging/ConversationIdentityMark";
import { MagnusLogo } from "@/components/brand/MagnusLogo";
import { PersonHoverCard } from "@/components/social/PersonHoverCard";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/lib/icons";

export const DETAILS_PANEL_WIDTH_PX = 360;
export const DETAILS_PANEL_GUTTER_PX = 16;

const PURPOSE_LABEL: Record<string, string> = {
  company: "Company-wide",
  project: "Project",
  safety: "EH&S",
  social: "Social",
  estimating: "Estimating",
  dm: "Direct message",
};

const PURPOSE_BLURB: Record<string, string> = {
  company:
    "Broadcast channel for company news, office hours, and cross-team coordination.",
  project:
    "Day-to-day project coordination — look-aheads, RFIs, and field updates.",
  safety:
    "Observations, toolbox talks, and EH&S playbooks. Keep the field safe.",
  social: "Watercooler and culture — light, professional, optional.",
  estimating: "Bids, takeoffs, and LRP working sessions.",
  dm: "Private conversation between two people.",
};

type MemberRow = {
  id: string;
  name: string;
  initials: string;
  handle?: string;
  role?: string;
  office?: string;
  avatarUrl?: string;
  isMagnus?: boolean;
  isYou?: boolean;
};

function collectChannelFiles(conv: Conversation): MessageAttachment[] {
  const out: MessageAttachment[] = [];
  const seen = new Set<string>();
  for (const m of conv.messages) {
    for (const a of m.attachments ?? []) {
      if (!seen.has(a.id)) {
        seen.add(a.id);
        out.push(a);
      }
    }
    for (const r of m.threadReplies ?? []) {
      for (const a of r.attachments ?? []) {
        if (!seen.has(a.id)) {
          seen.add(a.id);
          out.push(a);
        }
      }
    }
  }
  return out;
}

function resolveMembers(conv: Conversation): MemberRow[] {
  const rows: MemberRow[] = [];

  for (const id of conv.memberIds) {
    if (id === "self") {
      rows.push({
        id: "self",
        name: currentUser.name,
        initials: currentUser.initials,
        handle: "rcourson",
        role: "Platform",
        office: "Birmingham",
        avatarUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=faces",
        isYou: true,
      });
      continue;
    }
    const p = peopleDirectory.find((x) => x.id === id);
    if (p) {
      rows.push({
        id: p.id,
        name: p.name,
        initials: p.initials,
        handle: p.handle,
        role: p.role,
        office: p.office,
        avatarUrl: p.avatarUrl,
      });
    }
  }

  // Magnus participates in every channel as the AI app
  if (conv.kind === "channel") {
    rows.push({
      id: "magnus",
      name: "Magnus",
      initials: "M",
      handle: "magnus",
      role: "AI assistant",
      isMagnus: true,
    });
  }

  return rows;
}

function Section({
  title,
  icon: Icon,
  children,
  count,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <section className="px-4 py-3.5">
      <div className="mb-2.5 flex items-center gap-2">
        <Icon
          className="h-3.5 w-3.5 text-[var(--text-muted)]"
          strokeWidth={ICON_STROKE}
        />
        <h3 className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
          {title}
        </h3>
        {count != null && (
          <span className="tabular-nums text-[11px] text-[var(--text-muted)]">
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * Channel / DM details — about, members, shared files.
 * Floating card inside the messaging stage (not a full-height rail).
 */
export function ChannelDetailsPanel({
  conversation,
  open,
  onClose,
}: {
  conversation: Conversation | null;
  open: boolean;
  onClose: () => void;
}) {
  const identity = conversation
    ? resolveConversationIdentity(conversation)
    : null;
  const members = useMemo(
    () => (conversation ? resolveMembers(conversation) : []),
    [conversation]
  );
  const files = useMemo(
    () => (conversation ? collectChannelFiles(conversation) : []),
    [conversation]
  );

  const purpose = conversation?.purpose ?? conversation?.kind;
  const purposeLabel = purpose ? PURPOSE_LABEL[purpose] : undefined;
  const blurb =
    (purpose && PURPOSE_BLURB[purpose]) ||
    "Shared space for your B&G team to coordinate work.";

  return (
    <AnimatePresence>
      {open && conversation && identity && (
        <motion.div
          key={`details-${conversation.id}`}
          role="dialog"
          aria-label={`${displayName(conversation)} details`}
          initial={{ opacity: 0, x: 24, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 14, scale: 0.98 }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 34,
            mass: 0.75,
          }}
          className={cn(
            /*
             * Even top/bottom inset on the full messaging column
             * (channel title → composer bottom), same as ThreadPanel.
             */
            "absolute z-[44] flex flex-col overflow-hidden",
            "inset-y-3 right-3 w-[min(calc(100%-1.5rem),360px)] sm:inset-y-4 sm:right-4",
            "rounded-[22px]",
            "border border-[var(--glass-border-strong)]",
            "bg-[var(--glass-strong-solid)]",
            "shadow-[var(--shadow-glass),0_0_0_1px_var(--glass-border-soft),0_20px_40px_-18px_rgba(15,23,42,0.16)]"
          )}
          data-channel-details
        >
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[var(--glass-border-soft)] px-4 py-3.5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                <ConversationIdentityMark identity={identity} size={44} />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="truncate text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
                  {identity.label}
                </p>
                {purposeLabel && (
                  <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                    {purposeLabel}
                    {conversation.kind === "channel" ? " channel" : ""}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--hover-fill)] hover:text-[var(--text-primary)]"
              data-channel-details-close
            >
              <X className="h-4 w-4" strokeWidth={ICON_STROKE} />
            </button>
          </div>

          {/* min-h-0 + flex-1 is required for nested scroll inside absolute flex card */}
          <ScrollFade
            className="min-h-0 flex-1"
            size="sm"
            hideBottom
            contentClassName="scroll-thin overscroll-contain pb-4"
          >
            <Section title="About" icon={Hash}>
              {conversation.topic && (
                <p className="mb-2 text-[13.5px] font-medium leading-snug text-[var(--text-primary)]">
                  {conversation.topic}
                </p>
              )}
              <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
                {blurb}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {purposeLabel && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--hover-fill)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                    <Building2 className="h-3 w-3" strokeWidth={ICON_STROKE} />
                    {purposeLabel}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--hover-fill)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
                  <Users className="h-3 w-3" strokeWidth={ICON_STROKE} />
                  {members.length} member{members.length === 1 ? "" : "s"}
                </span>
              </div>
            </Section>

            <div className="mx-4 h-px bg-[var(--glass-border-soft)]" />

            <Section title="Members" icon={Users} count={members.length}>
              <ul className="space-y-0.5" data-channel-members>
                {members.map((m) => {
                  const author = {
                    id: m.id,
                    name: m.name,
                    initials: m.initials,
                    handle: m.handle,
                    avatarUrl: m.avatarUrl,
                    isMagnus: m.isMagnus,
                  };
                  return (
                    <li key={m.id}>
                      <div className="flex items-center gap-2.5 rounded-xl px-1.5 py-2">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--hover-fill-strong)] text-[10px] font-semibold text-[var(--text-muted)]">
                          {m.isMagnus ? (
                            <MagnusLogo size={20} tone="sidebar" />
                          ) : m.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.avatarUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            m.initials
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            {m.isMagnus || m.isYou ? (
                              <span className="truncate text-[13px] font-medium text-[var(--text-primary)]">
                                {m.name}
                              </span>
                            ) : (
                              <PersonHoverCard author={author}>
                                <span className="truncate text-[13px] font-medium text-[var(--text-primary)] hover:underline">
                                  {m.name}
                                </span>
                              </PersonHoverCard>
                            )}
                            {m.isYou && (
                              <span className="text-[11px] text-[var(--text-muted)]">
                                you
                              </span>
                            )}
                            {m.isMagnus && (
                              <span className="rounded bg-[var(--hover-fill-strong)] px-1 py-px text-[9px] font-medium tracking-tight text-[var(--text-muted)]">
                                App
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11.5px] text-[var(--text-muted)]">
                            {m.role && (
                              <span className="inline-flex min-w-0 items-center gap-1 truncate">
                                <UserRound
                                  className="h-3 w-3 shrink-0"
                                  strokeWidth={ICON_STROKE}
                                />
                                {m.role}
                              </span>
                            )}
                            {m.office && (
                              <span className="inline-flex shrink-0 items-center gap-1">
                                <MapPin
                                  className="h-3 w-3"
                                  strokeWidth={ICON_STROKE}
                                />
                                {m.office}
                              </span>
                            )}
                          </span>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Section>

            <div className="mx-4 h-px bg-[var(--glass-border-soft)]" />

            <Section title="Files" icon={Paperclip} count={files.length}>
              {files.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[var(--glass-border-soft)] px-3 py-6 text-center text-[12.5px] text-[var(--text-muted)]">
                  No files shared in this conversation yet.
                </p>
              ) : (
                <ul className="space-y-1.5" data-channel-files>
                  {files.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center gap-2.5 rounded-xl border border-[var(--glass-border-soft)] bg-[var(--hover-fill)]/40 px-2.5 py-2"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--hover-fill-strong)] text-[var(--text-secondary)]">
                        {f.previewUrl && isImageMime(f.mime) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={f.previewUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FileText
                            className="h-4 w-4"
                            strokeWidth={ICON_STROKE}
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-[var(--text-primary)]">
                          {f.name}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {f.sizeLabel}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </ScrollFade>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
