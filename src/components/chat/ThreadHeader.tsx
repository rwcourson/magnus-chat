"use client";

import { SquarePen } from "lucide-react";
import type { ChatThread } from "@/types/chat";
import { useChat } from "@/context/ChatContext";
import { PillAction } from "@/components/ui/PillAction";
import { cn } from "@/lib/utils";

function formatRelative(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

interface ThreadHeaderProps {
  chat: ChatThread;
  className?: string;
}

export function ThreadHeader({ chat, className }: ThreadHeaderProps) {
  const { newChat } = useChat();
  const count = chat.messages.length;

  return (
    <header
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 border-b border-[var(--header-border)]",
        "bg-[var(--header-bg)] px-3 py-2.5 backdrop-blur-xl sm:gap-3 sm:px-6",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[14px] font-semibold tracking-tight text-[var(--text-primary)]">
          {chat.title}
        </h1>
        <p className="mt-0.5 truncate text-[11.5px] text-[var(--text-muted)]">
          {count} message{count === 1 ? "" : "s"}
          <span className="mx-1.5 text-[var(--glass-border-strong)]">·</span>
          Updated {formatRelative(chat.updatedAt)}
        </p>
      </div>
      <PillAction
        icon={SquarePen}
        arrow={false}
        onClick={() => newChat()}
        className="shrink-0"
      >
        <span className="sm:hidden">New</span>
        <span className="hidden sm:inline">New chat</span>
      </PillAction>
    </header>
  );
}
