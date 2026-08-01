/**
 * Person profile → private Magnus chat thread (not a draft-to-Magnus prompt).
 */

import type { ChatThread, Message } from "@/types/chat";
import type { PersonProfile } from "@/lib/people-data";

export function personChatId(personId: string): string {
  return `dm-person-${personId}`;
}

/** Build a private 1:1 chat shell for a directory person. */
export function buildPrivateChatWithPerson(
  person: Pick<PersonProfile, "id" | "name" | "handle" | "role">,
  nowIso: string = new Date().toISOString()
): ChatThread {
  const intro: Message = {
    id: `${personChatId(person.id)}-hello`,
    role: "assistant",
    content: `Private chat with ${person.name}${
      person.role ? ` · ${person.role}` : ""
    }. This thread is just between you two in the demo — not a Magnus draft.`,
    createdAt: nowIso,
  };

  return {
    id: personChatId(person.id),
    title: person.name,
    preview: `Private · @${person.handle}`,
    private: true,
    updatedAt: nowIso,
    messages: [intro],
  };
}

/**
 * Find existing private person chat or create one.
 * Pure — caller upserts into chat store.
 */
export function ensurePrivateChatWithPerson(
  chats: ChatThread[],
  person: Pick<PersonProfile, "id" | "name" | "handle" | "role">,
  nowIso?: string
): { chat: ChatThread; created: boolean } {
  const id = personChatId(person.id);
  const existing = chats.find((c) => c.id === id);
  if (existing) {
    return { chat: existing, created: false };
  }
  return {
    chat: buildPrivateChatWithPerson(person, nowIso),
    created: true,
  };
}
