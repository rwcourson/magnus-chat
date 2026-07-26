import type { UIMessage } from "ai";
import type { Message } from "@/types/chat";

/**
 * Map app Message[] → AI SDK UIMessage[] for /api/chat.
 * UIMessage uses `parts` (AI SDK 7); we send plain text parts.
 */
export function toUiMessages(
  messages: Pick<Message, "id" | "role" | "content">[]
): UIMessage[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .filter((m) => (m.content ?? "").trim().length > 0)
    .map((m) => ({
      id: m.id || `msg-${Math.random().toString(36).slice(2, 9)}`,
      role: m.role,
      parts: [{ type: "text" as const, text: m.content.trim() }],
    }));
}

/** Extract plain text from a UIMessage (text parts only). */
export function uiMessageText(message: UIMessage): string {
  if (!message.parts?.length) return "";
  return message.parts
    .map((p) => (p.type === "text" && "text" in p ? p.text : ""))
    .filter(Boolean)
    .join("");
}
