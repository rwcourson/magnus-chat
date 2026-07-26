import type {
  Conversation,
  ConversationIdentity,
  ConversationKind,
  MessageAttachment,
  MessageReaction,
  SendTeamMessageResult,
  TeamAuthor,
  TeamMessage,
} from "@/types/messaging";
import {
  MAGNUS_AUTHOR,
  SELF_AUTHOR,
  initialConversations,
} from "@/lib/messaging-data";
import { peopleDirectory } from "@/lib/people-data";
import {
  briefToAssistantMessage,
  buildCatchUpBrief,
  isCatchMeUpIntent,
} from "@/lib/scout";
import { scoutSignals, demoCatchUpPersona } from "@/lib/scout-data";
import { answerFromKnowledge } from "@/lib/ai/knowledge";

/** Member ids that represent the signed-in demo user (not a DM peer). */
export const SELF_MEMBER_IDS = ["self", "p-robert"] as const;

export type DirectoryPerson = {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  role?: string;
  handle?: string;
  office?: string;
};

/**
 * Resolve the other person in a 1:1 DM from memberIds + people directory.
 * Pure — safe for tests against real seed.
 */
export function resolveDmPeer(
  conv: Conversation,
  people: DirectoryPerson[] = peopleDirectory,
  selfIds: readonly string[] = SELF_MEMBER_IDS
): DirectoryPerson | null {
  if (conv.kind !== "dm") return null;
  const peerId = conv.memberIds.find((id) => !selfIds.includes(id));
  if (!peerId) return null;
  const fromDir = people.find((p) => p.id === peerId);
  if (fromDir) {
    return {
      id: fromDir.id,
      name: fromDir.name,
      initials: fromDir.initials,
      avatarUrl: fromDir.avatarUrl,
      role: fromDir.role,
      handle: fromDir.handle,
      office: fromDir.office,
    };
  }
  // Fallback initials from conversation display name
  const initials = conv.name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "??";
  return {
    id: peerId,
    name: conv.name,
    initials,
  };
}

/**
 * Unified identity for sidebar rows + messaging header.
 * DMs → peer portrait; channels → optional imageUrl or hash affordance.
 */
export function resolveConversationIdentity(
  conv: Conversation,
  people: DirectoryPerson[] = peopleDirectory
): ConversationIdentity {
  if (conv.kind === "dm") {
    const peer = resolveDmPeer(conv, people);
    return {
      kind: "dm",
      label: peer?.name ?? conv.name,
      subtitle:
        [peer?.role, peer?.office].filter(Boolean).join(" · ") ||
        "Direct message",
      imageUrl: peer?.avatarUrl,
      initials: peer?.initials ?? "??",
      peerId: peer?.id,
      hasChannelImage: false,
    };
  }

  const initials = (conv.slug ?? conv.name)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase() || "#";

  return {
    kind: "channel",
    label: `#${conv.name}`,
    subtitle: conv.topic,
    imageUrl: conv.imageUrl,
    initials,
    hasChannelImage: Boolean(conv.imageUrl),
  };
}

/** Detect @magnus mention (Slack-style). */
export function isMagnusMention(text: string): boolean {
  if (!text?.trim()) return false;
  return /(?:^|[\s([{])@magnus\b/i.test(text) || /^@magnus\b/i.test(text.trim());
}

/** Magnus should respond when explicitly mentioned. */
export function shouldMagnusRespond(text: string): boolean {
  return isMagnusMention(text);
}

export function listChannels(
  conversations: Conversation[] = initialConversations
): Conversation[] {
  // Preserve array order so sidebar reorder sticks
  return conversations.filter((c) => c.kind === "channel");
}

/**
 * Remove a channel from the sidebar (leave). DMs are unchanged.
 */
export function leaveChannel(
  conversations: Conversation[],
  channelId: string
): Conversation[] {
  return conversations.filter(
    (c) => !(c.kind === "channel" && c.id === channelId)
  );
}

/**
 * Reorder channels to match `orderedIds`. Unknown ids ignored; missing channels
 * keep their relative order at the end. DMs / other kinds keep position after channels.
 */
export function reorderChannels(
  conversations: Conversation[],
  orderedIds: string[]
): Conversation[] {
  const channelById = new Map(
    conversations.filter((c) => c.kind === "channel").map((c) => [c.id, c])
  );
  const seen = new Set<string>();
  const ordered: Conversation[] = [];
  for (const id of orderedIds) {
    const c = channelById.get(id);
    if (!c || seen.has(id)) continue;
    ordered.push(c);
    seen.add(id);
  }
  for (const c of conversations) {
    if (c.kind === "channel" && !seen.has(c.id)) ordered.push(c);
  }
  const rest = conversations.filter((c) => c.kind !== "channel");
  return [...ordered, ...rest];
}

export function listDms(
  conversations: Conversation[] = initialConversations
): Conversation[] {
  return conversations
    .filter((c) => c.kind === "dm")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function slugifyChannelName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

/**
 * Create a new channel. Returns null if name empty or slug already exists.
 */
export function createChannelConversation(
  conversations: Conversation[],
  rawName: string
): { conversations: Conversation[]; conversation: Conversation } | null {
  const slug = slugifyChannelName(rawName);
  if (!slug) return null;
  if (conversations.some((c) => c.kind === "channel" && c.slug === slug)) {
    return null;
  }
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: `ch-${slug}-${Date.now().toString(36)}`,
    kind: "channel",
    name: slug,
    slug,
    purpose: "project",
    topic: "New channel",
    memberIds: ["self"],
    unreadCount: 0,
    updatedAt: now,
    messages: [],
  };
  return {
    conversations: [...conversations, conversation],
    conversation,
  };
}

/**
 * Open existing DM with person or create one. personId is directory id (p-maya).
 */
export function openOrCreateDm(
  conversations: Conversation[],
  personId: string,
  personName: string
): { conversations: Conversation[]; conversation: Conversation } {
  const existing = conversations.find(
    (c) => c.kind === "dm" && c.memberIds.includes(personId)
  );
  if (existing) {
    return { conversations, conversation: existing };
  }
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: `dm-${personId}-${Date.now().toString(36)}`,
    kind: "dm",
    name: personName,
    purpose: "dm",
    memberIds: ["self", personId],
    unreadCount: 0,
    updatedAt: now,
    messages: [],
  };
  return {
    conversations: [...conversations, conversation],
    conversation,
  };
}

export function getConversation(
  id: string,
  conversations: Conversation[] = initialConversations
): Conversation | undefined {
  return conversations.find((c) => c.id === id);
}

export function filterConversations(
  conversations: Conversation[],
  query: string
): Conversation[] {
  const q = query.trim().toLowerCase();
  if (!q) return conversations;
  return conversations.filter((c) => {
    const hay = [
      c.name,
      c.slug ?? "",
      c.topic ?? "",
      ...c.messages.map((m) => m.body),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function totalUnread(conversations: Conversation[]): number {
  return conversations.reduce((n, c) => n + (c.unreadCount || 0), 0);
}

export function displayName(c: Conversation): string {
  return resolveConversationIdentity(c).label;
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function makeTeamMessage(opts: {
  conversationId: string;
  body: string;
  author?: TeamAuthor;
  createdAt?: string;
  id?: string;
  attachments?: MessageAttachment[];
}): TeamMessage {
  const body = opts.body.trim();
  return {
    id: opts.id ?? uid("tm"),
    conversationId: opts.conversationId,
    author: opts.author ?? SELF_AUTHOR,
    body,
    createdAt: opts.createdAt ?? new Date().toISOString(),
    mentionsMagnus: isMagnusMention(body),
    attachments:
      opts.attachments && opts.attachments.length > 0
        ? opts.attachments
        : undefined,
    threadReplies: [],
  };
}

/** Mock attachment factory for demos / tests. */
export function makeMockAttachment(
  partial?: Partial<MessageAttachment>
): MessageAttachment {
  return {
    id: partial?.id ?? uid("att"),
    name: partial?.name ?? "look-ahead.pdf",
    sizeLabel: partial?.sizeLabel ?? "240 KB",
    mime: partial?.mime ?? "application/pdf",
    sizeBytes: partial?.sizeBytes,
    previewUrl: partial?.previewUrl,
  };
}

/** Human-readable file size. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10_485_760 ? 1 : 0)} MB`;
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

/**
 * Build attachment metadata from a real File (from <input type="file">).
 * Creates an object URL for image previews (caller may revoke on remove).
 */
export function attachmentFromFile(file: File): MessageAttachment {
  const mime = file.type || "application/octet-stream";
  const previewUrl = isImageMime(mime) ? URL.createObjectURL(file) : undefined;
  return {
    id: uid("att"),
    name: file.name,
    sizeBytes: file.size,
    sizeLabel: formatFileSize(file.size),
    mime,
    previewUrl,
  };
}

/** Revoke object URLs for attachments that own previews. */
export function revokeAttachmentPreviews(items: MessageAttachment[]): void {
  for (const a of items) {
    if (a.previewUrl?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(a.previewUrl);
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * Append a user (or any) message to a conversation. Immutable.
 */
export function appendTeamMessage(
  conversations: Conversation[],
  conversationId: string,
  message: TeamMessage
): Conversation[] {
  return conversations.map((c) => {
    if (c.id !== conversationId) return c;
    return {
      ...c,
      messages: [...c.messages, message],
      updatedAt: message.createdAt,
      unreadCount: 0,
    };
  });
}

/**
 * Send path for the current user: append message + flags for Magnus reply.
 */
export function sendTeamMessage(
  conversations: Conversation[],
  conversationId: string,
  body: string,
  opts?: {
    createdAt?: string;
    messageId?: string;
    attachments?: MessageAttachment[];
  }
): SendTeamMessageResult | null {
  const trimmed = body.trim();
  const hasAttach = (opts?.attachments?.length ?? 0) > 0;
  // Allow send with attachments only (no body)
  if (!trimmed && !hasAttach) return null;
  const conv = getConversation(conversationId, conversations);
  if (!conv) return null;

  const userMessage = makeTeamMessage({
    conversationId,
    body: trimmed || (hasAttach ? " " : ""),
    author: SELF_AUTHOR,
    createdAt: opts?.createdAt,
    id: opts?.messageId,
    attachments: opts?.attachments,
  });
  if (!trimmed && hasAttach) {
    userMessage.body = "";
  }

  const next = appendTeamMessage(conversations, conversationId, userMessage);
  const magnusShouldRespond = shouldMagnusRespond(trimmed);
  const catchUp = isCatchMeUpIntent(trimmed);

  return {
    conversations: next,
    userMessage,
    magnusShouldRespond,
    catchUp,
  };
}

/**
 * Append a reply into a parent message’s thread (immutable).
 */
export function appendThreadReply(
  conversations: Conversation[],
  conversationId: string,
  parentMessageId: string,
  reply: TeamMessage
): Conversation[] {
  return conversations.map((c) => {
    if (c.id !== conversationId) return c;
    return {
      ...c,
      updatedAt: reply.createdAt,
      messages: c.messages.map((m) => {
        if (m.id !== parentMessageId) return m;
        const threadReplies = [...(m.threadReplies ?? []), reply];
        return { ...m, threadReplies };
      }),
    };
  });
}

/** Send a thread reply as the current user. */
export function replyInThread(
  conversations: Conversation[],
  conversationId: string,
  parentMessageId: string,
  body: string,
  opts?: { createdAt?: string; messageId?: string; attachments?: MessageAttachment[] }
): { conversations: Conversation[]; reply: TeamMessage } | null {
  const trimmed = body.trim();
  const hasAttach = (opts?.attachments?.length ?? 0) > 0;
  if (!trimmed && !hasAttach) return null;
  const parent = getMessage(conversations, conversationId, parentMessageId);
  if (!parent) return null;

  const reply = makeTeamMessage({
    conversationId,
    body: trimmed,
    author: SELF_AUTHOR,
    createdAt: opts?.createdAt,
    id: opts?.messageId,
    attachments: opts?.attachments,
  });

  return {
    conversations: appendThreadReply(
      conversations,
      conversationId,
      parentMessageId,
      reply
    ),
    reply,
  };
}

export function threadReplyCount(message: TeamMessage): number {
  return message.threadReplies?.length ?? 0;
}

/**
 * Build Magnus reply body for a team conversation.
 * Catch-me-up → structured day brief; else grounded answer from intranet knowledge.
 */
export function buildMagnusTeamReplyBody(
  userBody: string,
  conversation?: Conversation
): string {
  const catchUp = isCatchMeUpIntent(userBody);
  if (catchUp) {
    const firstName = demoCatchUpPersona.firstName;
    const projects =
      conversation?.kind === "channel" && conversation.slug === "downtown-tower"
        ? ["Downtown tower", "ATL-2841"]
        : [...demoCatchUpPersona.projects];
    const brief = buildCatchUpBrief(scoutSignals, {
      window: "week",
      limit: 3,
      firstName,
      projects,
    });
    const lines = [
      brief.greeting,
      brief.intro.replace(/\*\*/g, ""),
      "",
      ...brief.cards.map(
        (c, i) =>
          `${i + 1}. ${c.title} — ${c.whyItMatters}${c.forYou ? ` (${c.forYou})` : ""}`
      ),
      "",
      brief.scannedLabel,
    ];
    return lines.join("\n");
  }

  // Strip @magnus for retrieval query
  const query = userBody.replace(/@magnus\b/gi, " ").trim() || userBody;
  const place =
    conversation?.kind === "channel"
      ? `#${conversation.name}`
      : conversation?.name ?? "this chat";

  const grounded = answerFromKnowledge(query, {
    limit: 5,
    surface: conversation?.kind === "dm" ? "dm" : "channel",
    conversationId: conversation?.id,
    conversationLabel: place,
  });

  return `${grounded}\n\n— answered in ${place}`;
}

/**
 * Create a Magnus TeamMessage for a conversation after a mention.
 */
export function createMagnusTeamReply(
  conversationId: string,
  userBody: string,
  conversations: Conversation[] = initialConversations,
  opts?: { createdAt?: string; id?: string }
): TeamMessage {
  const conv = getConversation(conversationId, conversations);
  const body = buildMagnusTeamReplyBody(userBody, conv);
  return makeTeamMessage({
    conversationId,
    body,
    author: MAGNUS_AUTHOR,
    createdAt: opts?.createdAt ?? new Date().toISOString(),
    id: opts?.id,
  });
}

/**
 * Full send + optional Magnus reply (sync helper for tests).
 * Production UI may delay Magnus with setTimeout; tests use this path.
 */
export function sendTeamMessageWithMagnus(
  conversations: Conversation[],
  conversationId: string,
  body: string,
  opts?: { createdAt?: string; magnusDelayMs?: number }
): {
  conversations: Conversation[];
  userMessage: TeamMessage;
  magnusMessage: TeamMessage | null;
  magnusShouldRespond: boolean;
  catchUp: boolean;
} | null {
  const sent = sendTeamMessage(conversations, conversationId, body, {
    createdAt: opts?.createdAt,
  });
  if (!sent) return null;

  if (!sent.magnusShouldRespond) {
    return {
      conversations: sent.conversations,
      userMessage: sent.userMessage,
      magnusMessage: null,
      magnusShouldRespond: false,
      catchUp: sent.catchUp,
    };
  }

  const magnusMessage = createMagnusTeamReply(
    conversationId,
    body,
    sent.conversations,
    {
      createdAt:
        opts?.createdAt != null
          ? new Date(Date.parse(opts.createdAt) + 1000).toISOString()
          : undefined,
    }
  );
  const withMagnus = appendTeamMessage(
    sent.conversations,
    conversationId,
    magnusMessage
  );

  return {
    conversations: withMagnus,
    userMessage: sent.userMessage,
    magnusMessage,
    magnusShouldRespond: true,
    catchUp: sent.catchUp,
  };
}

/** Mark conversation read. */
export function markConversationRead(
  conversations: Conversation[],
  conversationId: string
): Conversation[] {
  return conversations.map((c) =>
    c.id === conversationId ? { ...c, unreadCount: 0 } : c
  );
}

/**
 * Toggle an emoji reaction on a message (current user).
 * If already reacted with that emoji, remove self and decrement count.
 */
export function toggleMessageReaction(
  conversations: Conversation[],
  conversationId: string,
  messageId: string,
  emoji: string
): Conversation[] {
  return conversations.map((c) => {
    if (c.id !== conversationId) return c;
    return {
      ...c,
      messages: c.messages.map((m) => {
        if (m.id !== messageId) return m;
        return {
          ...m,
          reactions: applyReactionToggle(m.reactions, emoji),
        };
      }),
    };
  });
}

/**
 * Edit own message body (top-level or thread reply under parentMessageId).
 * No-op if message missing or not authored by self.
 */
export function editTeamMessage(
  conversations: Conversation[],
  conversationId: string,
  messageId: string,
  body: string,
  opts?: { parentMessageId?: string; editedAt?: string }
): Conversation[] {
  const trimmed = body.trim();
  if (!trimmed) return conversations;
  const editedAt = opts?.editedAt ?? new Date().toISOString();
  const parentId = opts?.parentMessageId;

  return conversations.map((c) => {
    if (c.id !== conversationId) return c;

    if (parentId) {
      return {
        ...c,
        messages: c.messages.map((m) => {
          if (m.id !== parentId) return m;
          return {
            ...m,
            threadReplies: (m.threadReplies ?? []).map((r) =>
              r.id === messageId && r.author.id === "self"
                ? { ...r, body: trimmed, editedAt }
                : r
            ),
          };
        }),
      };
    }

    return {
      ...c,
      messages: c.messages.map((m) =>
        m.id === messageId && m.author.id === "self"
          ? { ...m, body: trimmed, editedAt }
          : m
      ),
    };
  });
}

/** Pure reaction list update — unit-testable without full conversations. */
export function applyReactionToggle(
  reactions: MessageReaction[] | undefined,
  emoji: string
): MessageReaction[] {
  const list = [...(reactions ?? [])];
  const idx = list.findIndex((r) => r.emoji === emoji);
  if (idx < 0) {
    list.push({ emoji, count: 1, me: true });
    return list;
  }
  const cur = list[idx]!;
  if (cur.me) {
    const nextCount = cur.count - 1;
    if (nextCount <= 0) {
      list.splice(idx, 1);
    } else {
      list[idx] = { ...cur, count: nextCount, me: false };
    }
    return list;
  }
  list[idx] = { ...cur, count: cur.count + 1, me: true };
  return list;
}

export function getMessage(
  conversations: Conversation[],
  conversationId: string,
  messageId: string
): TeamMessage | undefined {
  return getConversation(conversationId, conversations)?.messages.find(
    (m) => m.id === messageId
  );
}

export function conversationsByKind(
  conversations: Conversation[],
  kind: ConversationKind
): Conversation[] {
  return kind === "channel"
    ? listChannels(conversations)
    : listDms(conversations);
}

/** Expose catch-up intent for messaging tests without re-implementing scout. */
export { isCatchMeUpIntent };

/** Optional: convert catch-up brief to rich AI message (AI history path). */
export function magnusCatchUpAsAiContent(firstName?: string) {
  const brief = buildCatchUpBrief(scoutSignals, {
    window: "week",
    limit: 3,
    firstName: firstName ?? demoCatchUpPersona.firstName,
    projects: [...demoCatchUpPersona.projects],
  });
  return briefToAssistantMessage(
    brief,
    uid("a"),
    new Date().toISOString()
  );
}
