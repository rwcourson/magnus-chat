/**
 * @mention helpers for team messaging (people + Magnus).
 */

import { peopleDirectory, type PersonProfile } from "@/lib/people-data";
import { MAGNUS_AUTHOR } from "@/lib/messaging-data";

export type MentionCandidate = {
  id: string;
  kind: "person" | "magnus";
  name: string;
  handle: string;
  role?: string;
  avatarUrl?: string;
  initials: string;
};

const MAGNUS_CANDIDATE: MentionCandidate = {
  id: MAGNUS_AUTHOR.id,
  kind: "magnus",
  name: MAGNUS_AUTHOR.name,
  handle: "magnus",
  role: "AI assistant",
  initials: MAGNUS_AUTHOR.initials,
};

function personToCandidate(p: PersonProfile): MentionCandidate {
  return {
    id: p.id,
    kind: "person",
    name: p.name,
    handle: p.handle,
    role: p.role,
    avatarUrl: p.avatarUrl,
    initials: p.initials,
  };
}

/** All taggable identities (Magnus first, then directory). */
export function allMentionCandidates(): MentionCandidate[] {
  return [MAGNUS_CANDIDATE, ...peopleDirectory.map(personToCandidate)];
}

/**
 * Filter candidates by query (name or handle, no leading @).
 * Empty query returns a short default list.
 */
export function filterMentionCandidates(
  query: string,
  limit = 8
): MentionCandidate[] {
  const q = query.trim().toLowerCase().replace(/^@/, "");
  const all = allMentionCandidates();
  if (!q) return all.slice(0, limit);
  return all
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        (c.role?.toLowerCase().includes(q) ?? false)
    )
    .slice(0, limit);
}

export type ActiveMention = {
  /** Index of `@` in the text */
  start: number;
  /** Text after `@` up to caret */
  query: string;
};

/**
 * If the caret is inside an active @token (no space after @), return range + query.
 */
export function getActiveMention(
  text: string,
  caret: number
): ActiveMention | null {
  const before = text.slice(0, caret);
  const at = before.lastIndexOf("@");
  if (at < 0) return null;
  // Must be start of token: start of string or whitespace / punctuation before @
  if (at > 0) {
    const prev = before[at - 1];
    if (!/[\s([{,]/.test(prev)) return null;
  }
  const query = before.slice(at + 1);
  // Closed if space or newline after @
  if (/[\s\n]/.test(query)) return null;
  // Only allow handle-ish chars while typing
  if (query && !/^[a-zA-Z0-9._-]*$/.test(query)) return null;
  return { start: at, query };
}

/** Insert `@handle ` replacing from @start through caret. */
export function applyMention(
  text: string,
  caret: number,
  start: number,
  handle: string
): { text: string; caret: number } {
  const insert = `@${handle} `;
  const next = text.slice(0, start) + insert + text.slice(caret);
  const nextCaret = start + insert.length;
  return { text: next, caret: nextCaret };
}

/** Known handles for highlight (case-insensitive). */
const HANDLE_SET = new Set(
  allMentionCandidates().map((c) => c.handle.toLowerCase())
);

/**
 * Split body into text / mention segments for rendering.
 * Matches @handle against known people + magnus.
 */
export function splitMentions(
  body: string
): Array<{ type: "text" | "mention"; value: string }> {
  if (!body) return [];
  const re = /@([a-zA-Z0-9._-]+)/g;
  const out: Array<{ type: "text" | "mention"; value: string }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const handle = m[1];
    if (!HANDLE_SET.has(handle.toLowerCase())) continue;
    if (m.index > last) {
      out.push({ type: "text", value: body.slice(last, m.index) });
    }
    out.push({ type: "mention", value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < body.length) {
    out.push({ type: "text", value: body.slice(last) });
  }
  return out.length ? out : [{ type: "text", value: body }];
}
