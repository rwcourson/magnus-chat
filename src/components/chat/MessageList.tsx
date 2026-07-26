"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import type { Message } from "@/types/chat";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { easeSpring, sceneTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ICON_STROKE } from "@/lib/icons";

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  onFollowUp?: (text: string) => void;
  onRegenerate?: () => void;
  onEditUser?: (messageId: string, content: string) => void;
  /**
   * Compact list for floating popup / tight panels — smaller end spacer
   * and jump-to-latest anchors to the nearest popup/surface, not the
   * main-stage composer (which was pinning the pill over the popup header).
   */
  compact?: boolean;
}

const NEAR_BOTTOM_PX = 80;
/** Offset from scroller top when pinning a user message */
const USER_MSG_TOP_PAD = 16;
/**
 * Always leave room so the last bubble isn’t hidden under the floating
 * composer. Kept modest — the big empty band was from the old 42vh pad.
 */
const COMPOSER_CLEARANCE_PX = 132;
/** Popup / embedded: tiny pad only — never a full-panel pin spacer */
const COMPOSER_CLEARANCE_COMPACT_PX = 16;
/** While a turn is active, grow spacer so the user bubble can sit at the top */
const ACTIVE_TURN_MIN_EXTRA = 120;

/** Measure where “Jump to latest” should sit (viewport-fixed). */
function measureJumpAnchor(
  listRoot: HTMLElement | null,
  scroller: HTMLElement | null
): { left: number; bottom: number; width: number } | null {
  if (typeof window === "undefined") return null;
  const vh = window.innerHeight;

  // Prefer composer inside the same surface (popup / chat stage)
  const surface =
    listRoot?.closest<HTMLElement>("[data-magnus-popup]") ??
    listRoot?.closest<HTMLElement>("[data-chat-stage]") ??
    null;

  const scope: ParentNode = surface ?? document;
  const col =
    scope.querySelector<HTMLElement>("[data-popup-composer]") ??
    scope.querySelector<HTMLElement>("[data-composer-column]") ??
    (surface
      ? null
      : document.querySelector<HTMLElement>("[data-home-composer]"));

  if (col) {
    const r = col.getBoundingClientRect();
    // Sit just above the composer top
    return {
      left: r.left,
      width: r.width,
      bottom: Math.max(12, vh - r.top + 8),
    };
  }

  // Fallback: just above the bottom of this list’s scroller (popup-safe)
  if (scroller) {
    const s = scroller.getBoundingClientRect();
    return {
      left: s.left + 8,
      width: Math.max(120, s.width - 16),
      bottom: Math.max(12, vh - s.bottom + 12),
    };
  }

  return null;
}

/** Assistant still has nothing to show (streaming placeholder). */
function hasAssistantBody(m: Message): boolean {
  if (m.role !== "assistant") return true;
  if (m.content.trim().length > 0) return true;
  if (m.blocks && m.blocks.length > 0) return true;
  return false;
}

function findLastUser(messages: Message[]): Message | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i];
  }
  return undefined;
}

/** Latest turn is still open (user just sent, or empty/streaming assistant). */
function isLiveLatestTurn(messages: Message[]): boolean {
  const last = messages[messages.length - 1];
  if (!last) return false;
  if (last.role === "user") return true;
  if (last.role === "assistant" && !hasAssistantBody(last)) return true;
  return false;
}

function findScrollParent(from: HTMLElement | null): HTMLElement | null {
  let el: HTMLElement | null = from;
  while (el) {
    if (el.hasAttribute("data-scroll-fade-scroller")) return el;
    const style = window.getComputedStyle(el);
    const oy = style.overflowY;
    if (oy === "auto" || oy === "scroll" || oy === "overlay") {
      return el;
    }
    el = el.parentElement;
  }
  const fade = from?.closest("[data-scroll-fade]");
  return (
    fade?.querySelector<HTMLElement>("[data-scroll-fade-scroller]") ?? null
  );
}

export function MessageList({
  messages,
  isTyping,
  onFollowUp,
  onRegenerate,
  onEditUser,
  compact = false,
}: MessageListProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const clearancePx = compact
    ? COMPOSER_CLEARANCE_COMPACT_PX
    : COMPOSER_CLEARANCE_PX;
  /**
   * When true, keep the latest content in view (soft follow).
   * Cleared after a user send so the reply grows under their message.
   * Compact (popup) always sticks to bottom — no pin-to-top spacer.
   */
  const stickRef = useRef(compact);
  /** Last user message we already scrolled into place */
  const anchoredUserIdRef = useRef<string | null>(null);
  const didInitialPinRef = useRef(false);
  /** Pin target for the active turn (spacer sizing) */
  const activeUserIdRef = useRef<string | null>(null);
  const spacerHeightRef = useRef(clearancePx);
  const [showJump, setShowJump] = useState(false);
  const [jumpPos, setJumpPos] = useState<{
    left: number;
    bottom: number;
    width: number;
  } | null>(null);
  const [spacerPx, setSpacerPx] = useState(clearancePx);

  const measureNearBottom = useCallback((el: HTMLElement) => {
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    return dist <= NEAR_BOTTOM_PX;
  }, []);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollerRef.current;
    if (!el) return;
    const top = Math.max(0, el.scrollHeight - el.clientHeight);
    if (smooth) {
      el.scrollTo({ top, behavior: "smooth" });
    } else {
      el.scrollTop = top;
    }
  }, []);

  /** Keep a message near the top of the scroller (reply flows down from here). */
  const scrollMessageToTop = useCallback((messageId: string) => {
    const scroller = scrollerRef.current;
    const root = rootRef.current;
    if (!scroller || !root) return;
    const node = root.querySelector<HTMLElement>(
      `[data-message-id="${CSS.escape(messageId)}"]`
    );
    if (!node) return;
    const sRect = scroller.getBoundingClientRect();
    const nRect = node.getBoundingClientRect();
    const delta = nRect.top - sRect.top - USER_MSG_TOP_PAD;
    scroller.scrollTop += delta;
  }, []);

  /**
   * Bottom spacer:
   * - Idle / finished thread: just clear the floating composer (tight).
   * - Active turn (full stage only): fill under the user bubble so the turn
   *   can pin at the top. Compact/popup never does this — it caused empty
   *   scroll space filling the whole panel.
   */
  const updateSpacer = useCallback(
    (opts?: { activeUserId?: string | null; forceActive?: boolean }) => {
      const scroller = scrollerRef.current;
      const root = rootRef.current;
      if (!scroller || !root) return;

      let next = clearancePx;

      // Popup / compact: fixed tiny pad only
      if (!compact) {
        const activeId =
          opts?.activeUserId !== undefined
            ? opts.activeUserId
            : activeUserIdRef.current;
        const active =
          opts?.forceActive ??
          Boolean(isTyping || (activeId && isLiveLatestTurn(messages)));

        if (active && activeId) {
          const node = root.querySelector<HTMLElement>(
            `[data-message-id="${CSS.escape(activeId)}"]`
          );
          const userH = node?.offsetHeight ?? 72;
          const fill = scroller.clientHeight - USER_MSG_TOP_PAD - userH;
          next = Math.max(clearancePx + ACTIVE_TURN_MIN_EXTRA, fill);
        }
      }

      if (Math.abs(spacerHeightRef.current - next) < 2) return;
      spacerHeightRef.current = next;
      if (spacerRef.current) {
        spacerRef.current.style.height = `${next}px`;
      }
      setSpacerPx(next);
    },
    [isTyping, messages, clearancePx, compact]
  );

  const updateJumpPos = useCallback(() => {
    const next = measureJumpAnchor(rootRef.current, scrollerRef.current);
    if (next) setJumpPos(next);
  }, []);

  const refreshJump = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const near = measureNearBottom(el);
    if (near) {
      stickRef.current = true;
      setShowJump(false);
    } else {
      setShowJump(true);
      updateJumpPos();
    }
  }, [measureNearBottom, updateJumpPos]);

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const near = measureNearBottom(el);
    if (near) {
      stickRef.current = true;
      setShowJump(false);
    } else {
      stickRef.current = false;
      setShowJump(true);
      updateJumpPos();
    }
  }, [measureNearBottom, updateJumpPos]);

  /** Intentional scroll — unlock stick so streaming never fights the user */
  const onUserScrollIntent = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (!measureNearBottom(el)) {
      stickRef.current = false;
      setShowJump(true);
      updateJumpPos();
    }
  }, [measureNearBottom, updateJumpPos]);

  // Bind scroll parent once mounted
  useLayoutEffect(() => {
    const scroller = findScrollParent(bottomRef.current);
    scrollerRef.current = scroller;
    if (!scroller) return;

    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("wheel", onUserScrollIntent, { passive: true });
    scroller.addEventListener("touchmove", onUserScrollIntent, {
      passive: true,
    });
    const onResize = () => {
      updateJumpPos();
      updateSpacer();
    };
    window.addEventListener("resize", onResize);
    onScroll();
    updateJumpPos();

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("wheel", onUserScrollIntent);
      scroller.removeEventListener("touchmove", onUserScrollIntent);
      window.removeEventListener("resize", onResize);
    };
  }, [onScroll, onUserScrollIntent, updateJumpPos, updateSpacer]);

  /**
   * Full-stage: pin latest user message to the top on send.
   * Compact/popup: always stick to bottom with a tiny spacer (no empty scroll).
   */
  useLayoutEffect(() => {
    const lastUser = findLastUser(messages);
    const last = messages[messages.length - 1];
    const live = isLiveLatestTurn(messages);

    // ── Compact (Magnus popup): no pin spacer; stick to bottom on open/send ──
    if (compact) {
      activeUserIdRef.current = null;
      updateSpacer({ activeUserId: null, forceActive: false });

      if (!didInitialPinRef.current) {
        didInitialPinRef.current = true;
        if (lastUser) anchoredUserIdRef.current = lastUser.id;
        stickRef.current = true;
        requestAnimationFrame(() => {
          scrollToBottom(false);
          setShowJump(false);
        });
        return;
      }

      if (lastUser && lastUser.id !== anchoredUserIdRef.current) {
        anchoredUserIdRef.current = lastUser.id;
        stickRef.current = true;
        requestAnimationFrame(() => {
          scrollToBottom(false);
          setShowJump(false);
        });
        return;
      }

      // Streaming follow only if still stuck to bottom
      if (stickRef.current) {
        requestAnimationFrame(() => scrollToBottom(false));
      } else {
        refreshJump();
      }
      return;
    }

    // First paint for this thread
    if (!didInitialPinRef.current) {
      didInitialPinRef.current = true;
      if (lastUser) {
        anchoredUserIdRef.current = lastUser.id;
      }

      if (live && lastUser) {
        // Brand-new send (or re-mount mid-stream): pin user to top
        activeUserIdRef.current = lastUser.id;
        stickRef.current = false;
        updateSpacer({ activeUserId: lastUser.id, forceActive: true });
        requestAnimationFrame(() => {
          scrollMessageToTop(lastUser.id);
          // Second frame: spacer/user height settled
          requestAnimationFrame(() => {
            scrollMessageToTop(lastUser.id);
            refreshJump();
          });
        });
      } else {
        // Opening history: show the end, tight bottom clearance
        activeUserIdRef.current = null;
        stickRef.current = true;
        updateSpacer({ activeUserId: null, forceActive: false });
        requestAnimationFrame(() => {
          scrollToBottom(false);
          setShowJump(false);
        });
      }
      return;
    }

    // Subsequent updates — new user turn
    if (lastUser && lastUser.id !== anchoredUserIdRef.current) {
      // Only pin if this user message is the latest turn (not deep history edit)
      const lastUserIdx = messages.findIndex((m) => m.id === lastUser.id);
      const isLatestTurn =
        lastUserIdx === messages.length - 1 ||
        (last?.role === "assistant" && lastUserIdx === messages.length - 2);

      if (isLatestTurn) {
        anchoredUserIdRef.current = lastUser.id;
        activeUserIdRef.current = lastUser.id;
        stickRef.current = false;
        updateSpacer({ activeUserId: lastUser.id, forceActive: true });
        requestAnimationFrame(() => {
          scrollMessageToTop(lastUser.id);
          requestAnimationFrame(() => {
            scrollMessageToTop(lastUser.id);
            refreshJump();
          });
        });
        return;
      }

      anchoredUserIdRef.current = lastUser.id;
    }

    // Turn finished → collapse spacer (keep content from jumping)
    if (!isTyping && !live && activeUserIdRef.current) {
      activeUserIdRef.current = null;
      updateSpacer({ activeUserId: null, forceActive: false });
      refreshJump();
      return;
    }

    // Keep spacer in sync while streaming under a pinned user turn
    if (activeUserIdRef.current && (isTyping || live)) {
      updateSpacer({ activeUserId: activeUserIdRef.current, forceActive: true });
    }
  }, [
    messages,
    isTyping,
    compact,
    scrollMessageToTop,
    scrollToBottom,
    refreshJump,
    updateSpacer,
  ]);

  /**
   * Soft follow only when the user is already stuck to the bottom
   * (e.g. they hit “Jump to latest”). Never yank them back while a turn
   * is pinned at the user message.
   */
  useLayoutEffect(() => {
    if (!stickRef.current || activeUserIdRef.current) {
      refreshJump();
      return;
    }
    scrollToBottom(false);
    setShowJump(false);
  }, [messages, isTyping, scrollToBottom, refreshJump]);

  const jumpLatest = () => {
    activeUserIdRef.current = null;
    stickRef.current = true;
    setShowJump(false);
    updateSpacer({ activeUserId: null, forceActive: false });
    requestAnimationFrame(() => scrollToBottom(true));
  };

  const lastAssistantId = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && hasAssistantBody(m))?.id;

  /**
   * Hide empty assistant placeholders (created for streaming).
   * They previously rendered as blank bubbles + action bars — very noisy.
   */
  const displayMessages = messages.filter((m) => {
    if (m.role !== "assistant") return true;
    return hasAssistantBody(m);
  });

  /** Only while waiting for first tokens — not once the reply is streaming in */
  const last = messages[messages.length - 1];
  const showThinking =
    Boolean(isTyping) &&
    (!last || last.role === "user" || !hasAssistantBody(last));

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative mx-auto flex w-full min-w-0 max-w-[680px] flex-col",
        compact
          ? "gap-3 px-2 pt-3"
          : "gap-5 px-3 pt-5 sm:gap-6 sm:px-6 sm:pt-6"
      )}
      data-message-list-root
      data-message-list-compact={compact ? true : undefined}
      style={{ overflowAnchor: "none" }}
    >
      {displayMessages.map((m) => (
        <div
          key={m.id}
          className="w-full"
          style={{ overflowAnchor: m.role === "user" ? "auto" : "none" }}
        >
          <MessageBubble
            message={m}
            onFollowUp={onFollowUp}
            onRegenerate={
              m.id === lastAssistantId && !isTyping ? onRegenerate : undefined
            }
            onEditUser={onEditUser}
            isLastAssistant={m.id === lastAssistantId}
            isStreaming={Boolean(isTyping && m.id === last?.id)}
          />
        </div>
      ))}

      <AnimatePresence mode="popLayout">
        {showThinking && (
          <motion.div
            key="typing"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: easeSpring }}
            className="flex w-full justify-start"
          >
            <div
              className="inline-flex items-center gap-2.5 py-1"
              role="status"
              aria-live="polite"
              aria-label="Magnus is thinking"
              data-thinking-status
            >
              <span className="inline-flex items-center gap-1" aria-hidden>
                <span className="thinking-dot" />
                <span className="thinking-dot" />
                <span className="thinking-dot" />
              </span>
              <span className="text-[13px] font-medium tracking-[-0.01em] text-[var(--text-muted)]">
                Thinking…
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic end spacer — tight when idle; fills viewport under pinned user while replying */}
      <div
        ref={spacerRef}
        className="w-full shrink-0"
        style={{ height: spacerPx }}
        aria-hidden
        data-message-list-spacer
      />

      <div ref={bottomRef} className="h-px w-full shrink-0" aria-hidden />

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showJump && jumpPos && (
              <motion.div
                key="jump-latest"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={sceneTransition}
                style={{
                  position: "fixed",
                  left: jumpPos.left,
                  width: jumpPos.width,
                  bottom: jumpPos.bottom,
                  /* Above FAB/popup (z-90) so the control stays tappable */
                  zIndex: compact ? 120 : 40,
                  display: "flex",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
                data-jump-latest-anchor
              >
                <button
                  type="button"
                  onClick={jumpLatest}
                  data-jump-latest
                  className={cn(
                    "chat-glass chat-glass-interactive pointer-events-auto",
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5",
                    "text-[12px] font-semibold text-[var(--text-primary)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
                  )}
                >
                  <ArrowDown
                    className="h-3.5 w-3.5"
                    strokeWidth={ICON_STROKE}
                  />
                  Jump to latest
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
