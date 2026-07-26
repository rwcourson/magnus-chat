import {
  convertToModelMessages,
  isStepCount,
  streamText,
  type UIMessage,
} from "ai";
import {
  getMagnusModel,
  isMockAiForced,
  isAiGatewayConfigured,
  MAGNUS_SYSTEM_PROMPT,
  shouldUseAiGateway,
} from "@/lib/ai/config";
import {
  extractLastUserText,
  retrieveContextForQuery,
  type ChatSurface,
} from "@/lib/ai/knowledge";
import { buildMagnusTools } from "@/lib/ai/tools";

export const maxDuration = 60;

type ChatRequestBody = {
  messages?: UIMessage[];
  /** Optional override; must be provider/model form when set */
  model?: string;
  /** Which UI surface is calling Magnus */
  surface?: ChatSurface;
  conversationId?: string;
  conversationLabel?: string;
};

/**
 * POST /api/chat
 *
 * AI SDK 7 + Vercel AI Gateway + intranet knowledge retrieval.
 * Injects a ranked context pack and registers tools over demo data
 * (news, feed, people, channels, approvals, calendar, catalog).
 */
export async function POST(req: Request) {
  if (isMockAiForced() || !shouldUseAiGateway()) {
    return Response.json(
      {
        error: "AI_GATEWAY_NOT_CONFIGURED",
        message:
          "Set AI_GATEWAY_API_KEY (or VERCEL_OIDC_TOKEN via vercel env pull) and ensure MAGNUS_AI_MOCK is not set. Model placeholder is configured in src/lib/ai/config.ts.",
        gatewayConfigured: isAiGatewayConfigured(),
        model: getMagnusModel(),
      },
      { status: 503 }
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return Response.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "MESSAGES_REQUIRED", message: "Body must include messages[]" },
      { status: 400 }
    );
  }

  const model =
    typeof body.model === "string" && body.model.includes("/")
      ? body.model.trim()
      : getMagnusModel();

  const surface = body.surface ?? "main";
  const conversationId = body.conversationId;
  const conversationLabel = body.conversationLabel;

  const lastUser = extractLastUserText(messages);
  const { pack, hits } = retrieveContextForQuery(lastUser || "intranet pulse", {
    limit: 8,
    surface,
    conversationId,
    conversationLabel,
  });

  const system = [
    MAGNUS_SYSTEM_PROMPT,
    "",
    pack,
    conversationLabel
      ? `\nYou are answering inside ${conversationLabel}. Stay relevant to that conversation when helpful.`
      : "",
  ].join("\n");

  try {
    const result = streamText({
      model,
      system,
      messages: await convertToModelMessages(messages),
      tools: buildMagnusTools({
        surface,
        conversationId,
        conversationLabel,
      }),
      // Allow multi-step tool use so Magnus can search then answer
      stopWhen: isStepCount(5),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    console.error("[api/chat]", message, { hits: hits.length, model });
    return Response.json(
      {
        error: "AI_STREAM_FAILED",
        message,
        model,
      },
      { status: 502 }
    );
  }
}

/** Lightweight readiness check for demos / health. */
export async function GET() {
  const { knowledgeStats } = await import("@/lib/ai/knowledge");
  return Response.json({
    ok: true,
    sdk: "ai@7",
    gateway: shouldUseAiGateway(),
    model: getMagnusModel(),
    mockForced: isMockAiForced(),
    knowledge: knowledgeStats(),
  });
}
