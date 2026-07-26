/**
 * Structural checks that AI Gateway + AI SDK 7 scaffolding is wired correctly.
 * Does not call a live model (no network / key required).
 *
 * Run: npx tsx scripts/verify-ai-gateway.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  getMagnusModel,
  isAiGatewayConfigured,
  isMockAiForced,
  MAGNUS_MODEL_PLACEHOLDER,
  MAGNUS_SYSTEM_PROMPT,
  shouldUseAiGateway,
} from "../src/lib/ai/config";
import { toUiMessages, uiMessageText } from "../src/lib/ai/messages";
import type { UIMessage } from "ai";

const root = join(__dirname, "..");

function main() {
  // --- packages ---
  const pkg = JSON.parse(
    readFileSync(join(root, "package.json"), "utf8")
  ) as { dependencies?: Record<string, string> };
  const aiVer = pkg.dependencies?.ai ?? "";
  assert.ok(
    aiVer.includes("7") || aiVer.startsWith("^7") || aiVer.startsWith("~7"),
    `expected ai@^7 in package.json, got ${aiVer}`
  );
  assert.ok(pkg.dependencies?.["@ai-sdk/react"], "expected @ai-sdk/react");
  assert.ok(pkg.dependencies?.zod, "expected zod");

  // --- config placeholders ---
  assert.ok(
    MAGNUS_MODEL_PLACEHOLDER.includes("/"),
    "placeholder model must be provider/model form"
  );
  const model = getMagnusModel();
  assert.ok(model.includes("/"), `getMagnusModel must be provider/model: ${model}`);
  assert.ok(MAGNUS_SYSTEM_PROMPT.length > 40, "system prompt should be set");

  // Pure booleans (no throw without env)
  assert.equal(typeof isAiGatewayConfigured(), "boolean");
  assert.equal(typeof isMockAiForced(), "boolean");
  assert.equal(typeof shouldUseAiGateway(), "boolean");

  // --- message mapping ---
  const ui = toUiMessages([
    { id: "u1", role: "user", content: "Hello Magnus" },
    { id: "a1", role: "assistant", content: "Hi — how can I help?" },
    { id: "u2", role: "user", content: "  " }, // dropped
  ]);
  assert.equal(ui.length, 2);
  assert.equal(ui[0]!.role, "user");
  assert.ok(ui[0]!.parts.some((p) => p.type === "text"));
  assert.equal(
    uiMessageText(ui[1] as UIMessage),
    "Hi — how can I help?"
  );

  // --- route + files exist ---
  const route = join(root, "src/app/api/chat/route.ts");
  assert.ok(existsSync(route), "api/chat/route.ts required");
  const routeSrc = readFileSync(route, "utf8");
  assert.ok(routeSrc.includes("streamText"), "route must use streamText");
  assert.ok(
    routeSrc.includes("convertToModelMessages"),
    "route must convert UI messages"
  );
  assert.ok(
    routeSrc.includes("toUIMessageStreamResponse") ||
      routeSrc.includes("createUIMessageStreamResponse"),
    "route must return UI message stream response"
  );
  assert.ok(
    routeSrc.includes("getMagnusModel") || routeSrc.includes("model"),
    "route must use configured model"
  );
  assert.ok(
    routeSrc.includes("retrieveContextForQuery") ||
      routeSrc.includes("buildMagnusTools"),
    "route must wire knowledge retrieval / tools"
  );

  assert.ok(existsSync(join(root, "src/lib/ai/config.ts")));
  assert.ok(existsSync(join(root, "src/lib/ai/stream-client.ts")));
  assert.ok(existsSync(join(root, "src/lib/ai/messages.ts")));
  assert.ok(existsSync(join(root, "src/lib/ai/knowledge.ts")));
  assert.ok(existsSync(join(root, "src/lib/ai/tools.ts")));
  assert.ok(existsSync(join(root, ".env.example")));

  const envExample = readFileSync(join(root, ".env.example"), "utf8");
  assert.ok(envExample.includes("AI_GATEWAY_API_KEY"));
  assert.ok(envExample.includes("MAGNUS_MODEL"));

  // ChatContext should call stream client
  const chatCtx = readFileSync(join(root, "src/context/ChatContext.tsx"), "utf8");
  assert.ok(
    chatCtx.includes("stream-client") || chatCtx.includes("streamChatCompletion"),
    "ChatContext should integrate stream client"
  );

  console.log("verify-ai-gateway: all assertions passed");
  console.log(`  modelPlaceholder=${MAGNUS_MODEL_PLACEHOLDER}`);
  console.log(`  resolvedModel=${model}`);
  console.log(`  gatewayConfigured=${isAiGatewayConfigured()}`);
  console.log(`  shouldUseGateway=${shouldUseAiGateway()}`);
  console.log(`  aiDep=${aiVer}`);
}

main();
