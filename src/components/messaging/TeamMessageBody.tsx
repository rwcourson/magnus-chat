"use client";

import type { ReactNode } from "react";
import { splitMentions } from "@/lib/mentions";
import { cn } from "@/lib/utils";

/**
 * Inline emphasis without leaking markdown:
 * **bold**, *italic*, `code`, and @mentions.
 */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // Split on mention-safe chunks first, then format each plain segment
  return splitMentions(text).flatMap((seg, si) => {
    if (seg.type === "mention") {
      return (
        <span
          key={`${keyPrefix}-m-${si}`}
          className="rounded-md bg-[var(--select-fill)] px-1 py-0.5 font-medium text-[var(--select-text)]"
        >
          {seg.value}
        </span>
      );
    }
    return formatEmphasis(seg.value, `${keyPrefix}-t-${si}`);
  });
}

function formatEmphasis(content: string, keyPrefix: string): ReactNode[] {
  // Order: code → bold → italic
  const parts = content.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    const k = `${keyPrefix}-${i}`;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={k}
          className="rounded-md bg-[var(--hover-fill-strong)] px-1 py-0.5 font-mono text-[0.9em] text-[var(--text-primary)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={k} className="font-semibold text-[var(--text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (
      part.startsWith("*") &&
      part.endsWith("*") &&
      part.length > 2 &&
      !part.startsWith("**")
    ) {
      return (
        <em key={k} className="italic text-[var(--text-primary)]">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={k}>{part}</span>;
  });
}

const BULLET_RE = /^(?:[-*•]|\d+[.)])\s+/;

type Block =
  | { type: "p"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "heading"; text: string };

function parseBlocks(body: string): Block[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i] ?? "";
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Soft heading: short line ending with no period, or markdown ## 
    const headingMd = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (headingMd) {
      blocks.push({ type: "heading", text: headingMd[1]!.trim() });
      i += 1;
      continue;
    }

    if (BULLET_RE.test(trimmed)) {
      const ordered = /^\d+[.)]\s+/.test(trimmed);
      const items: string[] = [];
      while (i < lines.length) {
        const t = (lines[i] ?? "").trim();
        if (!t) break;
        if (!BULLET_RE.test(t)) break;
        items.push(t.replace(BULLET_RE, ""));
        i += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    // Paragraph: gather consecutive non-empty, non-list lines
    const para: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const t = (lines[i] ?? "").trim();
      if (!t || BULLET_RE.test(t) || /^#{1,3}\s+/.test(t)) break;
      para.push(t);
      i += 1;
    }
    blocks.push({ type: "p", text: para.join(" ") });
  }

  return blocks;
}

/**
 * Clean team-message body: scannable lists, real emphasis, no raw markdown.
 * Used for Magnus and everyone so leaked ** never shows as source.
 */
export function TeamMessageBody({
  body,
  className,
  magnus,
}: {
  body: string;
  className?: string;
  /** Slightly tighter, polished rhythm for Magnus replies */
  magnus?: boolean;
}) {
  const blocks = parseBlocks(body);
  if (blocks.length === 0) return null;

  return (
    <div
      className={cn(
        "mt-0.5 text-[14.5px] leading-[1.5] text-[var(--text-primary)]",
        magnus && "space-y-2.5",
        !magnus && "space-y-2",
        className
      )}
      data-team-message-body
      data-magnus-body={magnus ? "true" : undefined}
    >
      {blocks.map((b, bi) => {
        if (b.type === "heading") {
          return (
            <p
              key={bi}
              className="text-[14.5px] font-semibold tracking-tight text-[var(--text-primary)]"
            >
              {renderInline(b.text, `h-${bi}`)}
            </p>
          );
        }
        if (b.type === "list") {
          const ListTag = b.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={bi}
              className={cn(
                "my-0.5 space-y-1.5 pl-0",
                b.ordered ? "list-none" : "list-none"
              )}
            >
              {b.items.map((item, ii) => (
                <li
                  key={ii}
                  className="relative flex gap-2 pl-0 text-[14.5px] leading-[1.45]"
                >
                  <span
                    className={cn(
                      "mt-[0.35em] shrink-0 select-none",
                      b.ordered
                        ? "w-4 text-right text-[12px] font-medium tabular-nums text-[var(--text-muted)]"
                        : "h-1 w-1 rounded-full bg-[var(--text-muted)] opacity-70"
                    )}
                    aria-hidden
                  >
                    {b.ordered ? `${ii + 1}.` : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    {renderInline(item, `l-${bi}-${ii}`)}
                  </span>
                </li>
              ))}
            </ListTag>
          );
        }
        // First short bold-ish paragraph as lead when magnus and only one sentence-ish
        const isLead =
          magnus &&
          bi === 0 &&
          b.text.length < 120 &&
          !b.text.endsWith(".");
        return (
          <p
            key={bi}
            className={cn(
              "text-[14.5px] leading-[1.5]",
              isLead && "font-semibold tracking-tight"
            )}
          >
            {renderInline(b.text, `p-${bi}`)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Plain-text cleanup for copy / tests: drop markdown emphasis markers.
 */
export function plainTeamMessageText(body: string): string {
  return body
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^[-*•]\s+/gm, "• ")
    .trim();
}
