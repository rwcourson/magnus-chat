"use client";

import { toUiMessages } from "@/lib/ai/messages";
import type { Message } from "@/types/chat";

export type StreamChatOptions = {
  messages: Pick<Message, "id" | "role" | "content">[];
  /** Optional provider/model override (placeholder until production id is set) */
  model?: string;
  /** UI surface for retrieval boosts */
  surface?: "main" | "popup" | "channel" | "dm";
  conversationId?: string;
  conversationLabel?: string;
  signal?: AbortSignal;
  /** Called as assistant text grows */
  onText?: (text: string) => void;
};

export type StreamChatResult =
  | { ok: true; text: string }
  | {
      ok: false;
      reason: "not_configured" | "http" | "empty" | "aborted" | "error";
      status?: number;
      message?: string;
    };

/**
 * Call /api/chat (AI SDK 7 UI message stream via AI Gateway).
 * Returns not_configured when gateway is unset so callers can use mock replies.
 */
export async function streamChatCompletion(
  opts: StreamChatOptions
): Promise<StreamChatResult> {
  const uiMessages = toUiMessages(opts.messages);

  let res: Response;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: uiMessages,
        ...(opts.model ? { model: opts.model } : {}),
        ...(opts.surface ? { surface: opts.surface } : {}),
        ...(opts.conversationId
          ? { conversationId: opts.conversationId }
          : {}),
        ...(opts.conversationLabel
          ? { conversationLabel: opts.conversationLabel }
          : {}),
      }),
      signal: opts.signal,
    });
  } catch (err) {
    if (opts.signal?.aborted) {
      return { ok: false, reason: "aborted" };
    }
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "Network error",
    };
  }

  if (res.status === 503) {
    return { ok: false, reason: "not_configured", status: 503 };
  }

  if (!res.ok) {
    let message: string | undefined;
    try {
      const j = (await res.json()) as { message?: string };
      message = j.message;
    } catch {
      /* ignore */
    }
    return {
      ok: false,
      reason: "http",
      status: res.status,
      message,
    };
  }

  if (!res.body) {
    return { ok: false, reason: "empty", message: "No response body" };
  }

  try {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assembled = "";

    const ingestLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      // SSE: `data: {...}`  — also tolerate bare JSON lines
      let data = trimmed;
      if (trimmed.startsWith("data:")) {
        data = trimmed.slice(5).trim();
      }
      if (!data || data === "[DONE]") return;

      try {
        const json = JSON.parse(data) as Record<string, unknown>;
        const type = typeof json.type === "string" ? json.type : "";

        // AI SDK 7 UI stream: text-delta
        if (
          (type === "text-delta" || type === "text-delta-part") &&
          typeof json.delta === "string"
        ) {
          assembled += json.delta;
          opts.onText?.(assembled);
          return;
        }

        if (typeof json.textDelta === "string") {
          assembled += json.textDelta;
          opts.onText?.(assembled);
          return;
        }
        if (type === "text" && typeof json.text === "string") {
          assembled = json.text;
          opts.onText?.(assembled);
          return;
        }
        // Some transports nest delta under `delta` without type
        if (!type && typeof json.delta === "string" && json.delta.length < 8000) {
          assembled += json.delta;
          opts.onText?.(assembled);
        }
      } catch {
        /* non-JSON data line */
      }
    };

    /**
     * Parse AI SDK UI message SSE (`data: {json}\n\n`).
     * Handles text-delta chunks (`type: "text-delta", delta: "..."`).
     */
    while (true) {
      if (opts.signal?.aborted) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        return { ok: false, reason: "aborted" };
      }

      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) ingestLine(line);
    }

    // Flush decoder + trailing line without newline
    buffer += decoder.decode();
    if (buffer.trim()) ingestLine(buffer);

    const finalText = assembled.trim();
    if (!finalText) {
      return {
        ok: false,
        reason: "empty",
        message: "Stream completed without text",
      };
    }
    return { ok: true, text: finalText };
  } catch (err) {
    if (opts.signal?.aborted) {
      return { ok: false, reason: "aborted" };
    }
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "Stream parse error",
    };
  }
}
