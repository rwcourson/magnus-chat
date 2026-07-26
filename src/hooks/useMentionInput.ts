"use client";

import { useCallback, useMemo, useState } from "react";
import {
  applyMention,
  filterMentionCandidates,
  getActiveMention,
  type MentionCandidate,
} from "@/lib/mentions";

/**
 * Wire a textarea to @mention autocomplete.
 */
export function useMentionInput(
  value: string,
  setValue: (v: string) => void,
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [caret, setCaret] = useState(0);
  /** When set, hide picker for this @ start until query changes */
  const [dismissedStart, setDismissedStart] = useState<number | null>(null);

  const active = useMemo(
    () => getActiveMention(value, caret),
    [value, caret]
  );

  const candidates = useMemo(
    () => (active ? filterMentionCandidates(active.query) : []),
    [active]
  );

  const open = Boolean(
    active &&
      candidates.length > 0 &&
      !(dismissedStart !== null && active.start === dismissedStart)
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      const nextCaret = e.target.selectionStart ?? next.length;
      setValue(next);
      setCaret(nextCaret);
      setActiveIndex(0);
      const m = getActiveMention(next, nextCaret);
      if (!m || m.start !== dismissedStart) {
        setDismissedStart(null);
      }
    },
    [setValue, dismissedStart]
  );

  const select = useCallback(
    (c: MentionCandidate) => {
      if (!active) return;
      const el = textareaRef.current;
      const caretNow = el?.selectionStart ?? caret;
      const { text, caret: nextCaret } = applyMention(
        value,
        caretNow,
        active.start,
        c.handle
      );
      setValue(text);
      setActiveIndex(0);
      setDismissedStart(null);
      requestAnimationFrame(() => {
        if (!el) return;
        el.focus();
        el.setSelectionRange(nextCaret, nextCaret);
        setCaret(nextCaret);
      });
    },
    [active, caret, setValue, textareaRef, value]
  );

  /**
   * Arrow/enter/tab/escape for the picker.
   * Returns true if the event was consumed.
   */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
      if (!open) return false;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % candidates.length);
        return true;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + candidates.length) % candidates.length);
        return true;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const c = candidates[activeIndex];
        if (c) select(c);
        return true;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        if (active) setDismissedStart(active.start);
        return true;
      }
      return false;
    },
    [open, candidates, activeIndex, select, active]
  );

  const syncCaret = useCallback(() => {
    const el = textareaRef.current;
    if (el) setCaret(el.selectionStart ?? el.value.length);
  }, [textareaRef]);

  return {
    candidates,
    activeIndex,
    setActiveIndex,
    open,
    onChange,
    onKeyDown,
    select,
    onSelect: select,
    syncCaret,
  };
}
