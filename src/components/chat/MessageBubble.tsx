"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  CornerDownRight,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Pencil,
} from "lucide-react";
import type { ContentBlock, Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/IconButton";
import { useToast } from "@/context/ToastContext";
import { easeSpring } from "@/lib/motion";
import {
  AvailabilityCalendar,
  ResearchChip,
} from "@/components/chat/AvailabilityCalendar";

interface MessageBubbleProps {
  message: Message;
  onFollowUp?: (text: string) => void;
  onRegenerate?: () => void;
  onEditUser?: (messageId: string, content: string) => void;
  isLastAssistant?: boolean;
  /** True while this assistant message is still receiving tokens */
  isStreaming?: boolean;
}

function formatInline(content: string) {
  // Bold + inline `code` (Geist Mono via .chat-code)
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-[var(--text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={i}
          className="chat-code rounded-md bg-[var(--hover-fill-strong)] px-1 py-0.5 text-[0.9em] text-[var(--text-primary)]"
          data-chat-code
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part.split("\n").map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });
}

function CalloutIcon({ tone }: { tone?: "info" | "warn" | "success" }) {
  if (tone === "warn")
    return (
      <AlertTriangle
        className="h-3.5 w-3.5 shrink-0 text-amber-500"
        strokeWidth={1.4}
      />
    );
  if (tone === "success")
    return (
      <CheckCircle2
        className="h-3.5 w-3.5 shrink-0 text-emerald-500"
        strokeWidth={1.4}
      />
    );
  return (
    <Info
      className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]"
      strokeWidth={1.4}
    />
  );
}

function MessageBlocks({
  blocks,
  onFollowUp,
}: {
  blocks: ContentBlock[];
  onFollowUp?: (text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, i) => {
        if (block.type === "text") {
          return (
            <div
              key={i}
              className="bubble-assistant rounded-2xl px-4 py-3 text-[15px] leading-relaxed text-[var(--text-primary)]"
            >
              {formatInline(block.content)}
            </div>
          );
        }

        if (block.type === "section") {
          return (
            <div
              key={i}
              className="bubble-assistant space-y-1.5 rounded-2xl px-4 py-3"
            >
              <h4 className="text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
                {block.title}
              </h4>
              <p className="text-[14.5px] leading-relaxed text-[var(--text-primary)]">
                {formatInline(block.body)}
              </p>
            </div>
          );
        }

        if (block.type === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag
              key={i}
              className={cn(
                "bubble-assistant space-y-1.5 rounded-2xl px-4 py-3 pl-8 text-[14.5px] leading-relaxed text-[var(--text-primary)]",
                block.ordered ? "list-decimal" : "list-disc"
              )}
            >
              {block.items.map((item, j) => (
                <li key={j} className="pl-0.5">
                  {formatInline(item)}
                </li>
              ))}
            </Tag>
          );
        }

        if (block.type === "callout") {
          return (
            <div
              key={i}
              className={cn(
                "msg-glass-card flex gap-2.5 rounded-xl px-3 py-2.5",
                block.tone === "warn" &&
                  "border-amber-500/25 bg-amber-500/[0.08]",
                block.tone === "success" &&
                  "border-emerald-500/25 bg-emerald-500/[0.08]"
              )}
            >
              <CalloutIcon tone={block.tone} />
              <div className="min-w-0 space-y-0.5">
                {block.title && (
                  <p className="text-[12px] font-semibold text-[var(--text-primary)]">
                    {block.title}
                  </p>
                )}
                <p className="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
                  {formatInline(block.content)}
                </p>
              </div>
            </div>
          );
        }

        if (block.type === "code") {
          return (
            <div
              key={i}
              className="msg-glass-card overflow-hidden rounded-xl"
              data-chat-code-block
            >
              {block.language && (
                <div className="border-b border-[var(--glass-border-soft)] px-3 py-1.5 text-[10.5px] font-medium tracking-tight text-[var(--text-muted)]">
                  {block.language}
                </div>
              )}
              <pre
                className="chat-code scroll-thin max-h-[min(420px,50vh)] overflow-auto px-3.5 py-3 text-[12.5px] leading-relaxed text-[var(--text-primary)]"
                data-chat-code
              >
                <code>{block.content}</code>
              </pre>
            </div>
          );
        }

        if (block.type === "stats") {
          return (
            <div key={i} className="grid grid-cols-3 gap-2">
              {block.items.map((stat) => (
                <div
                  key={stat.label}
                  className="msg-glass-card rounded-xl px-2.5 py-2.5 text-center"
                >
                  <div>
                    <p className="text-[16px] font-semibold tabular-nums tracking-tight text-[var(--text-primary)]">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[10.5px] font-medium tracking-tight text-[var(--text-muted)]">
                      {stat.label}
                    </p>
                    {stat.hint && (
                      <p className="mt-0.5 text-[10.5px] text-[var(--text-secondary)]">
                        {stat.hint}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        }

        if (block.type === "cards") {
          return (
            <div key={i} className="flex flex-col gap-2">
              {block.items.map((card) => (
                <div
                  key={card.title}
                  className={cn(
                    "msg-glass-card rounded-xl px-3.5 py-3",
                    "transition-[border-color,background] duration-150",
                    "hover:border-[var(--glass-border)]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[14px] font-semibold leading-snug tracking-[-0.01em] text-[var(--text-primary)]">
                      {card.title}
                    </p>
                    {card.badge && (
                      <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-tight text-[var(--text-muted)]">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
                    {card.description}
                  </p>
                  {(card.forYou || card.meta) && (
                    <div className="mt-2 flex flex-col gap-0.5">
                      {card.forYou && (
                        <p className="text-[11.5px] font-semibold text-[var(--text-primary)]">
                          {card.forYou}
                        </p>
                      )}
                      {card.meta && (
                        <p className="text-[11px] font-medium text-[var(--text-muted)]">
                          {card.meta}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        }

        if (block.type === "research") {
          return <ResearchChip key={i} label={block.label} />;
        }

        if (block.type === "schedule") {
          return (
            <AvailabilityCalendar
              key={i}
              data={block.data}
              className="my-1 w-full max-w-full"
              onAction={onFollowUp}
            />
          );
        }

        return null;
      })}
    </div>
  );
}

export function MessageBubble({
  message,
  onFollowUp,
  onRegenerate,
  onEditUser,
  isLastAssistant,
  isStreaming = false,
}: MessageBubbleProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const isUser = message.role === "user";
  const hasBlocks = !isUser && message.blocks && message.blocks.length > 0;
  const hasBody =
    message.content.trim().length > 0 || Boolean(hasBlocks);
  /** Actions only after a real reply — never on empty/streaming placeholders */
  const showAssistantActions = !isUser && hasBody && !isStreaming;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast({ title: "Copied", tone: "success", duration: 1800 });
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ title: "Couldn’t copy", tone: "danger" });
    }
  };

  const setVote = (v: "up" | "down") => {
    setFeedback((cur) => (cur === v ? null : v));
    toast({
      title: v === "up" ? "Thanks for the feedback" : "Feedback recorded",
      description:
        v === "down" ? "We’ll use this to improve Magnus." : undefined,
      duration: 2200,
    });
  };

  const commitEdit = () => {
    const next = draft.trim();
    if (!next || next === message.content) {
      setEditing(false);
      setDraft(message.content);
      return;
    }
    onEditUser?.(message.id, next);
    setEditing(false);
  };

  // Empty assistant shell should never paint (list filters these; belt-and-suspenders)
  if (!isUser && !hasBody) return null;

  return (
    <motion.div
      /* Opacity only — transform on this node would break child backdrop-filter */
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: easeSpring }}
      data-message-id={message.id}
      data-message-role={message.role}
      className={cn(
        "group/msg flex w-full min-w-0 flex-col gap-2",
        isUser ? "items-end" : "items-start"
      )}
    >
      <div
        className={cn(
          "min-w-0 max-w-[min(100%,640px)] rounded-2xl text-[15px] leading-relaxed",
          isUser
            ? "bubble-user px-3.5 py-2.5 text-[var(--text-primary)] sm:px-4 sm:py-3"
            : hasBlocks
              ? "w-full max-w-[min(100%,720px)] border-0 bg-transparent p-0 shadow-none"
              : "bubble-assistant px-3.5 py-2.5 text-[var(--text-primary)] sm:px-4 sm:py-3",
          hasBlocks && "w-full"
        )}
      >
        {editing && isUser ? (
          <div className="min-w-[min(100%,280px)] space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className={cn(
                "w-full resize-y rounded-xl border border-[var(--glass-border)] bg-[var(--input-bg)]",
                "px-3 py-2 text-[14px] text-[var(--text-primary)] outline-none"
              )}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraft(message.content);
                }}
                className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-muted)] hover:bg-[var(--hover-fill)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={commitEdit}
                className="btn-solid rounded-lg px-2.5 py-1.5 text-[12px] font-semibold"
              >
                Save & resend
              </button>
            </div>
          </div>
        ) : hasBlocks ? (
          /* Each card/stat owns its own frosted glass — no outer shell muddying blur */
          <div className="w-full text-[var(--text-primary)]">
            <MessageBlocks
              blocks={message.blocks!}
              onFollowUp={onFollowUp}
            />
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {formatInline(message.content)}
          </div>
        )}
      </div>

      {isUser && !editing && onEditUser && (
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/msg:opacity-100 group-focus-within/msg:opacity-100 max-md:opacity-100">
          <IconButton
            label="Edit message"
            size="sm"
            onClick={() => {
              setDraft(message.content);
              setEditing(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton label="Copy" size="sm" onClick={copy}>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400/90" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </IconButton>
        </div>
      )}

      {showAssistantActions && (
        <div
          className={cn(
            "flex w-full flex-col gap-3 pl-0.5",
            "max-w-[min(100%,720px)]"
          )}
        >
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover/msg:opacity-100 group-focus-within/msg:opacity-100 max-md:opacity-100">
            <IconButton label="Copy" size="sm" onClick={copy}>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400/90" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </IconButton>
            <IconButton
              label="Good response"
              size="sm"
              onClick={() => setVote("up")}
              className={
                feedback === "up"
                  ? "bg-[var(--hover-fill-strong)] text-emerald-400"
                  : undefined
              }
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton
              label="Bad response"
              size="sm"
              onClick={() => setVote("down")}
              className={
                feedback === "down"
                  ? "bg-[var(--hover-fill-strong)] text-[var(--danger)]"
                  : undefined
              }
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </IconButton>
            {onRegenerate && isLastAssistant && (
              <IconButton label="Regenerate" size="sm" onClick={onRegenerate}>
                <RefreshCw className="h-3.5 w-3.5" />
              </IconButton>
            )}
            <IconButton
              label="More"
              size="sm"
              onClick={() =>
                toast({
                  title: "More actions",
                  description: "Share and report coming soon.",
                  duration: 2200,
                })
              }
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </IconButton>
          </div>

          {message.followUps && message.followUps.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="px-0.5 text-[12.5px] font-semibold tracking-tight text-[var(--text-muted)]">
                Suggested
              </p>
              <div className="flex flex-col gap-1">
                {message.followUps.map((chip, i) => (
                  <motion.div
                    key={chip}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: 0.06 + i * 0.04,
                      duration: 0.2,
                      ease: easeSpring,
                    }}
                  >
                    {/* Glass lives on a non-transformed node so backdrop-filter works */}
                    <button
                      type="button"
                      onClick={() => onFollowUp?.(chip)}
                      className={cn(
                        "chat-glass chat-glass-interactive group",
                        "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left",
                        "text-[13.5px] leading-snug text-[var(--text-secondary)]",
                        "hover:text-[var(--text-primary)] active:opacity-90",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                      )}
                    >
                      <span
                        className={cn(
                          "chat-glass-inset flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                          "text-[var(--text-muted)]",
                          "transition-colors duration-150",
                          "group-hover:text-[var(--text-primary)]"
                        )}
                      >
                        <CornerDownRight
                          className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
                          strokeWidth={1.4}
                        />
                      </span>
                      <span className="min-w-0 flex-1 font-medium">{chip}</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
