/**
 * Verify clean Magnus AI output for the demo.
 * Calls shipped pure functions only — no mocked returns.
 *
 * Run: npx tsx scripts/verify-ai-output.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MAGNUS_SYSTEM_PROMPT } from "../src/lib/ai/config";
import {
  answerFromKnowledge,
  formatAvailabilityAnswer,
  formatCalendarAgendaAnswer,
  resetKnowledgeCorpus,
  searchKnowledge,
} from "../src/lib/ai/knowledge";
import {
  cleanReplyText,
  hasMarkdownMarkers,
} from "../src/lib/ai/clean-reply";
import { calendarDays } from "../src/lib/calendar-data";
import { initialChats } from "../src/lib/mock-data";
import { briefToAssistantMessage } from "../src/lib/scout";
import { buildCatchUpBrief } from "../src/lib/scout";
import { scoutSignals } from "../src/lib/scout-data";

function assertClean(label: string, text: string) {
  assert.ok(text && text.trim().length > 0, `${label}: empty`);
  assert.equal(
    hasMarkdownMarkers(text),
    false,
    `${label}: still has markdown markers → ${text.slice(0, 160)}`
  );
  assert.ok(!/\*\*/.test(text), `${label}: contains **`);
  assert.ok(!/```/.test(text), `${label}: contains code fence`);
  assert.ok(!/(^|\n)\s*#{1,6}\s/.test(text), `${label}: contains heading #`);
}

function main() {
  resetKnowledgeCorpus();

  // ── System prompt markers (production identity + demo formatting) ──
  const prompt = MAGNUS_SYSTEM_PROMPT;
  assert.ok(
    /Miller Gorrie|founder/i.test(prompt),
    "system prompt must mention founder / Miller Gorrie"
  );
  assert.ok(
    /Brasfield\s*&\s*Gorrie|B&G/i.test(prompt),
    "system prompt must identify B&G in-house assistant"
  );
  assert.ok(/Magnus/i.test(prompt), "system prompt must name Magnus");
  assert.ok(
    /smart coworker|warm and approachable/i.test(prompt),
    "system prompt must include coworker personality"
  );
  assert.ok(
    /Certainly|Absolutely|Great question|AI filler/i.test(prompt),
    "system prompt must ban AI filler"
  );
  assert.ok(
    /Never use Markdown|no markdown|No \*\*/i.test(prompt),
    "system prompt must require no markdown"
  );
  assert.ok(
    /Knowledge-first|knowledge base|CONTEXT/i.test(prompt),
    "system prompt must be knowledge-first for B&G"
  );
  assert.ok(
    /calendar|time labels|7:30/i.test(prompt) ||
      /real day and time labels/i.test(prompt),
    "system prompt must require real calendar day/time labels"
  );

  // ── cleanReplyText helper ──
  const dirty = "Here's a **bold** tip with ## Heading\nand `code`.";
  const cleaned = cleanReplyText(dirty);
  assertClean("cleanReplyText", cleaned);
  assert.ok(cleaned.includes("bold"), "cleanReplyText keeps words");
  assert.ok(!cleaned.includes("##"), "cleanReplyText strips headings");

  // ── Calendar seed labels used for grounding checks ──
  const today = calendarDays.find((d) => d.isToday) ?? calendarDays[0]!;
  assert.ok(today.events.length >= 1, "calendar seed has events");
  const sampleEvent = today.events[0]!;
  const realTime = sampleEvent.start;
  const realDay = today.dateLabel;
  const realTitle = sampleEvent.title;

  // ── Calendar agenda answer ──
  const calAns = answerFromKnowledge("what's on my calendar today");
  assertClean("calendar answer", calAns);
  assert.ok(
    calAns.includes(realTime) || calAns.includes(sampleEvent.end),
    `calendar answer must include real seed time (${realTime}): ${calAns.slice(0, 200)}`
  );
  assert.ok(
    calAns.includes(realDay) || calAns.includes(today.weekday),
    `calendar answer must include real day label: ${calAns.slice(0, 200)}`
  );
  assert.ok(
    /standup|pour|onbase|magnus|safety|focus|owner/i.test(calAns),
    `calendar answer should mention a real event title family: ${calAns.slice(0, 200)}`
  );

  const calFmt = formatCalendarAgendaAnswer("calendar today");
  assertClean("formatCalendarAgendaAnswer", calFmt);
  assert.ok(calFmt.includes(realTime), "formatter includes seed start time");

  // ── Availability (James) ──
  const jamesAns = answerFromKnowledge("When is James Courson free?");
  assertClean("james availability", jamesAns);
  assert.ok(
    /James/i.test(jamesAns),
    `james answer should name James: ${jamesAns.slice(0, 160)}`
  );
  // Must ground in calendar time OR directory role — not invent random times
  const jamesOnCal = calendarDays.some((d) =>
    d.events.some((e) => (e.withWhom ?? "").includes("James"))
  );
  if (jamesOnCal) {
    const jamesEvent = calendarDays
      .flatMap((d) => d.events.map((e) => ({ d, e })))
      .find(({ e }) => (e.withWhom ?? "").includes("James"));
    assert.ok(jamesEvent);
    assert.ok(
      jamesAns.includes(jamesEvent!.e.start) ||
        jamesAns.includes(jamesEvent!.d.dateLabel),
      `james answer must cite real calendar slot: ${jamesAns.slice(0, 200)}`
    );
  }

  const availDirect = formatAvailabilityAnswer("When is James free?");
  assert.ok(availDirect, "formatAvailabilityAnswer returns for James");
  assertClean("formatAvailabilityAnswer", availDirect!);

  // ── News / safety ──
  const newsAns = answerFromKnowledge("What's the latest news about safety?");
  assertClean("news/safety", newsAns);
  assert.ok(
    /TRIR|safety|observation|news|feed/i.test(newsAns),
    `safety answer grounded: ${newsAns.slice(0, 160)}`
  );

  // ── People ──
  const peopleAns = answerFromKnowledge("who is Maya Chen");
  assertClean("people", peopleAns);
  assert.ok(/Maya/i.test(peopleAns), "people answer names Maya");

  // ── Catch me up ──
  const catchAns = answerFromKnowledge("catch me up");
  assertClean("catch-up", catchAns);
  assert.ok(
    catchAns.includes("•") || catchAns.length > 60,
    "catch-up should be scannable"
  );

  // ── Catch-up template (structured brief) ──
  const brief = buildCatchUpBrief(scoutSignals, {
    window: "week",
    limit: 3,
    firstName: "Robert",
  });
  const briefMsg = briefToAssistantMessage(
    brief,
    "a-test",
    new Date().toISOString()
  );
  assertClean("briefToAssistantMessage content", briefMsg.content);

  // ── Seeded chat assistant bodies ──
  for (const chat of initialChats) {
    for (const m of chat.messages) {
      if (m.role !== "assistant") continue;
      assertClean(`seed chat ${chat.id} msg ${m.id} content`, m.content);
      if (m.blocks) {
        for (const b of m.blocks) {
          if (b.type === "text" && "content" in b && typeof b.content === "string") {
            assertClean(
              `seed chat ${chat.id} block`,
              b.content
            );
          }
        }
      }
    }
  }

  // ── Search still ranks calendar for schedule queries ──
  const calHits = searchKnowledge("what's on my calendar today standup");
  assert.ok(
    calHits.some((h) => h.source === "calendar"),
    "searchKnowledge ranks calendar for schedule asks"
  );

  // Static file check: system prompt source on disk matches export markers
  const configPath = join(process.cwd(), "src/lib/ai/config.ts");
  const configSrc = readFileSync(configPath, "utf8");
  assert.ok(
    configSrc.includes("Miller Gorrie"),
    "config.ts source includes founder identity"
  );
  assert.ok(
    configSrc.includes("Never use Markdown"),
    "config.ts source includes no-markdown rule"
  );

  console.log("verify-ai-output: all assertions passed");
  console.log(`  promptChars=${prompt.length}`);
  console.log(`  calendarToday=${today.weekday} ${realDay} first=${realTitle} @ ${realTime}`);
  console.log(`  calAnsPreview=${calAns.slice(0, 100).replace(/\n/g, " ")}…`);
  console.log(`  jamesPreview=${jamesAns.slice(0, 100).replace(/\n/g, " ")}…`);
  console.log(`  seedChatsChecked=${initialChats.length}`);
}

main();
