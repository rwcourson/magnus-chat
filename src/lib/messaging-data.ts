import type {
  Conversation,
  TeamAuthor,
  TeamMessage,
} from "@/types/messaging";
import { currentUser } from "@/lib/mock-data";
import { peopleDirectory } from "@/lib/people-data";

export const MAGNUS_AUTHOR: TeamAuthor = {
  id: "magnus",
  name: "Magnus",
  initials: "M",
  handle: "magnus",
  isMagnus: true,
};

export const SELF_AUTHOR: TeamAuthor = {
  id: "self",
  name: currentUser.name,
  initials: currentUser.initials,
  handle: "rcourson",
};

function personAuthor(id: string): TeamAuthor {
  const p = peopleDirectory.find((x) => x.id === id);
  if (!p) {
    return { id, name: id, initials: "??" };
  }
  return {
    id: p.id,
    name: p.name,
    initials: p.initials,
    handle: p.handle,
    avatarUrl: p.avatarUrl,
  };
}

function msg(
  id: string,
  conversationId: string,
  author: TeamAuthor,
  body: string,
  createdAt: string,
  extras?: {
    reactions?: TeamMessage["reactions"];
    threadReplies?: TeamMessage[];
    attachments?: TeamMessage["attachments"];
  }
): TeamMessage {
  return {
    id,
    conversationId,
    author,
    body,
    createdAt,
    mentionsMagnus: /@magnus\b/i.test(body),
    reactions: extras?.reactions,
    threadReplies: extras?.threadReplies,
    attachments: extras?.attachments,
  };
}

const maya = personAuthor("p-maya");
const derek = personAuthor("p-derek");
const james = personAuthor("p-james");
const priya = personAuthor("p-priya");
const safety = personAuthor("p-safety");
const lena = personAuthor("p-lena");
const marcus = personAuthor("p-marcus");
const aisha = personAuthor("p-aisha");
const tom = personAuthor("p-tom");
const sofia = personAuthor("p-sofia");
const chris = personAuthor("p-chris");
const nina = personAuthor("p-nina");
const evan = personAuthor("p-evan");
const jordan = personAuthor("p-jordan");
const rachel = personAuthor("p-rachel");
const kevin = personAuthor("p-kevin");
const hannah = personAuthor("p-hannah");

/** Channel cover images — construction / office imagery for demo identity */
const IMG = {
  general:
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=256&h=256&fit=crop",
  downtown:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=256&h=256&fit=crop",
  safety:
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=256&h=256&fit=crop",
  estimating:
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=256&h=256&fit=crop",
} as const;

/**
 * Seed team conversations — B&G channels + DMs for an internal walkthrough.
 *
 * Mix intentionally covers:
 * - company-wide, project, EH&S, estimating, social (hash-only) channels
 * - multiple 1:1 DMs linked to directory faces
 * - unread vs read, reactions, thread, @magnus, attachments
 */
export const initialConversations: Conversation[] = [
  {
    id: "ch-general",
    kind: "channel",
    name: "general",
    slug: "general",
    purpose: "company",
    topic: "Company-wide · keep it useful",
    imageUrl: IMG.general,
    memberIds: [
      "self",
      "p-maya",
      "p-derek",
      "p-james",
      "p-priya",
      "p-safety",
      "p-lena",
      "p-tom",
      "p-evan",
    ],
    unreadCount: 0,
    updatedAt: "2026-07-24T15:05:00Z",
    messages: [
      msg(
        "m-g1",
        "ch-general",
        james,
        "Reminder: Magnus office hours today 2 PM Birmingham HQ · 4B. Bring a workflow pain if you have one.",
        "2026-07-24T13:05:00Z",
        { reactions: [{ emoji: "👀", count: 4, me: false }] }
      ),
      msg(
        "m-g2",
        "ch-general",
        maya,
        "ATL crew will dial in — want a quick walkthrough of Catch me up for supers.",
        "2026-07-24T13:18:00Z"
      ),
      msg(
        "m-g3",
        "ch-general",
        priya,
        "Estimating will join from Charlotte. LRP working session notes are in Knowledge when ready.",
        "2026-07-24T13:42:00Z"
      ),
      msg(
        "m-g3b",
        "ch-general",
        tom,
        "Self-perform concrete leads will be there — we need the approvals path demo for night shift POs.",
        "2026-07-24T13:55:00Z"
      ),
      msg(
        "m-g4",
        "ch-general",
        safety,
        "Toolbox talk of the week (fall protection) is live — EN + Spanish. Use /safety in Magnus if you’re on site.",
        "2026-07-24T14:20:00Z",
        { reactions: [{ emoji: "✅", count: 6, me: true }] }
      ),
      msg(
        "m-g5",
        "ch-general",
        james,
        "@magnus drop three talking points for office hours — Catch me up + approvals for the demo crowd.",
        "2026-07-24T14:35:00Z"
      ),
      msg(
        "m-g6",
        "ch-general",
        MAGNUS_AUTHOR,
        "Three talking points for office hours:\n\n• Catch me up — one prompt gets project, safety, and open work in plain language (try it on downtown tower).\n• Approvals inbox — show the queue, filter by type, and clear one real item live.\n• @magnus in channels — tag in #downtown-tower or #estimating for drafts, blockers, and follow-ups without leaving the thread.\n\nI can expand any of these into a one-slide outline.",
        "2026-07-24T14:36:00Z",
        { reactions: [{ emoji: "👀", count: 3, me: false }] }
      ),
      msg(
        "m-g7",
        "ch-general",
        lena,
        "Can we record the session? ATL PE rotation starts next week.",
        "2026-07-24T14:50:00Z"
      ),
      msg(
        "m-g8",
        "ch-general",
        evan,
        "I’ll stream to the Magnus library folder — same place as last month’s office hours.",
        "2026-07-24T15:05:00Z",
        { reactions: [{ emoji: "👍", count: 2, me: false }] }
      ),
    ],
  },
  {
    id: "ch-downtown",
    kind: "channel",
    name: "downtown-tower",
    slug: "downtown-tower",
    purpose: "project",
    topic: "ATL-2841 · envelope + look-aheads",
    imageUrl: IMG.downtown,
    memberIds: ["self", "p-maya", "p-derek", "p-james", "p-lena", "p-sofia"],
    unreadCount: 2,
    updatedAt: "2026-07-24T16:20:00Z",
    messages: [
      msg(
        "m-d1",
        "ch-downtown",
        maya,
        "Envelope package is cleared. Crane picks shift north laydown Friday 6–9 AM.",
        "2026-07-24T11:02:00Z",
        {
          reactions: [
            { emoji: "👍", count: 3, me: false },
            { emoji: "🎉", count: 1, me: false },
          ],
          threadReplies: [
            msg(
              "m-d1-t1",
              "ch-downtown",
              derek,
              "I’ll flag the pick radius on the trailer board before lunch.",
              "2026-07-24T11:20:00Z"
            ),
            msg(
              "m-d1-t2",
              "ch-downtown",
              maya,
              "Perfect — leave a photo when it’s staged.",
              "2026-07-24T11:28:00Z"
            ),
            msg(
              "m-d1-t3",
              "ch-downtown",
              lena,
              "Flagger plan draft is in the PE folder — need your markups by Thursday.",
              "2026-07-24T11:45:00Z"
            ),
          ],
        }
      ),
      msg(
        "m-d2",
        "ch-downtown",
        derek,
        "Copy. I’ll stage temp power clear of the pick radius Thursday PM.",
        "2026-07-24T11:40:00Z",
        {
          reactions: [{ emoji: "👀", count: 2, me: true }],
          attachments: [
            {
              id: "att-laydown",
              name: "north-laydown-map.png",
              sizeLabel: "1.1 MB",
              mime: "image/png",
            },
          ],
        }
      ),
      msg(
        "m-d2b",
        "ch-downtown",
        sofia,
        "Clash report for Level 3 MEP is in Workspaces — 14 open, top five tagged for Friday walk.",
        "2026-07-24T12:15:00Z",
        { reactions: [{ emoji: "👍", count: 2, me: false }] }
      ),
      msg(
        "m-d3",
        "ch-downtown",
        maya,
        "Open RFIs are light — @magnus can you flag anything blocking Level 3 coordination?",
        "2026-07-24T14:55:00Z"
      ),
      msg(
        "m-d4",
        "ch-downtown",
        MAGNUS_AUTHOR,
        "Nothing blocking Level 3 from the signals I see. Watch: pour coordination window tomorrow 9 AM, and two OnBase invoices still need release (concrete + temp power).",
        "2026-07-24T15:00:00Z"
      ),
      msg(
        "m-d5",
        "ch-downtown",
        derek,
        "Thanks Magnus. Robert — when you land, check the north laydown map in Workspaces.",
        "2026-07-24T15:10:00Z"
      ),
      msg(
        "m-d6",
        "ch-downtown",
        lena,
        "I’ll walk the envelope joints with Maya Friday if travel holds.",
        "2026-07-24T16:20:00Z"
      ),
    ],
  },
  {
    id: "ch-safety",
    kind: "channel",
    name: "safety",
    slug: "safety",
    purpose: "safety",
    topic: "EH&S · observations + toolbox talks",
    imageUrl: IMG.safety,
    memberIds: ["self", "p-safety", "p-derek", "p-maya", "p-aisha", "p-tom", "p-chris"],
    unreadCount: 1,
    updatedAt: "2026-07-24T13:10:00Z",
    messages: [
      msg(
        "m-s1",
        "ch-safety",
        safety,
        "Q3 TRIR still trending down. Keep stacking clean observations — every report feeds the playbook.",
        "2026-07-24T09:15:00Z",
        { reactions: [{ emoji: "👍", count: 5, me: false }] }
      ),
      msg(
        "m-s2",
        "ch-safety",
        derek,
        "Night shift noted soft edge near pour deck — fixed before dark. Photo in the observation log.",
        "2026-07-24T10:05:00Z"
      ),
      msg(
        "m-s2b",
        "ch-safety",
        chris,
        "NSH laminated the fall-protection cards for the trailer board — works offline.",
        "2026-07-24T10:40:00Z"
      ),
      msg(
        "m-s3",
        "ch-safety",
        safety,
        "Appreciate it. Spanish notes for fall protection are attached to the weekly talk.",
        "2026-07-24T12:30:00Z",
        {
          attachments: [
            {
              id: "att-toolbox",
              name: "fall-protection-es.pdf",
              sizeLabel: "420 KB",
              mime: "application/pdf",
            },
          ],
        }
      ),
      msg(
        "m-s4",
        "ch-safety",
        maya,
        "@magnus summarize open EH&S actions for downtown tower this week — what should supers hit first?",
        "2026-07-24T12:45:00Z"
      ),
      msg(
        "m-s5",
        "ch-safety",
        MAGNUS_AUTHOR,
        "Priority for supers this week:\n\n• Soft edge / pour deck — Derek logged a fix; confirm the observation is closed with photo in the log.\n• Fall protection toolbox — run EN + Spanish notes (attached above) before night shift.\n• Observation cadence — keep stacking clean reports; they feed the TRIR playbook.\n\nNothing else blocking from open signals. I can draft the toolbox talk roster if helpful.",
        "2026-07-24T12:47:00Z"
      ),
      msg(
        "m-s6",
        "ch-safety",
        aisha,
        "Carolinas will mirror the pre-pour QA checklist 90 min before trucks — photos in the same observation path.",
        "2026-07-24T13:10:00Z",
        { reactions: [{ emoji: "✅", count: 3, me: false }] }
      ),
    ],
  },
  {
    id: "ch-estimating",
    kind: "channel",
    name: "estimating",
    slug: "estimating",
    purpose: "estimating",
    topic: "Takeoffs · SLAs · knowledge packs",
    imageUrl: IMG.estimating,
    memberIds: ["self", "p-priya", "p-james", "p-maya", "p-nina", "p-aisha"],
    unreadCount: 2,
    updatedAt: "2026-07-24T17:20:00Z",
    messages: [
      msg(
        "m-e1",
        "ch-estimating",
        priya,
        "Submittal SLA dashboard is green for Carolinas. Two packages still waiting on vendor stamps.",
        "2026-07-24T15:10:00Z"
      ),
      msg(
        "m-e1b",
        "ch-estimating",
        nina,
        "I’ll chase stamps this afternoon — same two vendors as last cycle.",
        "2026-07-24T15:25:00Z"
      ),
      msg(
        "m-e2",
        "ch-estimating",
        james,
        "Can Magnus draft a polite nudge for those two vendors? Happy to review before send.",
        "2026-07-24T15:55:00Z"
      ),
      msg(
        "m-e3",
        "ch-estimating",
        priya,
        "@magnus draft a short vendor follow-up for missing stamp packages — firm but friendly.",
        "2026-07-24T16:40:00Z"
      ),
      msg(
        "m-e4",
        "ch-estimating",
        MAGNUS_AUTHOR,
        "Here’s a short draft you can send or tweak:\n\nSubject: Submittal stamp packages — Carolinas\n\nHi team — following up on the two packages still waiting on vendor stamps. We need stamped drawings back to keep the Carolinas SLA green and protect the coordination window next week.\n\nCould you confirm status and an ETA for the stamped packages by EOD Thursday? Happy to jump on a quick call if anything is blocked on our side.\n\nThanks — Priya / B&G Estimating\n\nI can tighten tone, add package IDs, or turn this into email + text variants if you want.",
        "2026-07-24T16:42:00Z",
        { reactions: [{ emoji: "👍", count: 2, me: false }] }
      ),
      msg(
        "m-e5",
        "ch-estimating",
        james,
        "Solid — I’ll polish package IDs and send. Thanks Magnus.",
        "2026-07-24T16:48:00Z"
      ),
      msg(
        "m-e6",
        "ch-estimating",
        aisha,
        "QA will hold closeout packs until stamps land — flag me if ETA slips past Thursday.",
        "2026-07-24T17:20:00Z"
      ),
    ],
  },
  {
    id: "ch-random",
    kind: "channel",
    name: "random",
    slug: "random",
    purpose: "social",
    topic: "Non-work · keep it kind",
    // No imageUrl — demo hash-only channel affordance
    memberIds: [
      "self",
      "p-james",
      "p-priya",
      "p-maya",
      "p-tom",
      "p-evan",
      "p-hannah",
      "p-kevin",
    ],
    unreadCount: 0,
    updatedAt: "2026-07-24T10:22:00Z",
    messages: [
      msg(
        "m-r1",
        "ch-random",
        james,
        "Best coffee near Birmingham HQ? Taking votes for Friday office hours fuel.",
        "2026-07-23T18:40:00Z",
        { reactions: [{ emoji: "🎉", count: 2, me: false }] }
      ),
      msg(
        "m-r2",
        "ch-random",
        priya,
        "Saturn — cold brew. Not optional.",
        "2026-07-23T19:00:00Z"
      ),
      msg(
        "m-r3",
        "ch-random",
        tom,
        "Counterpoint: the cart on 2nd floor after 7 AM. Free and fast.",
        "2026-07-24T07:40:00Z",
        { reactions: [{ emoji: "👀", count: 3, me: false }] }
      ),
      msg(
        "m-r4",
        "ch-random",
        evan,
        "IT will stock cold brew in 4B for office hours either way.",
        "2026-07-24T09:15:00Z"
      ),
      msg(
        "m-r5",
        "ch-random",
        hannah,
        "Carolinas open house snacks vote is tied between tacos and pizza — drop an emoji reaction if you care.",
        "2026-07-24T10:05:00Z",
        { reactions: [{ emoji: "🎉", count: 5, me: true }] }
      ),
      msg(
        "m-r6",
        "ch-random",
        kevin,
        "As a cost engineer I must vote pizza. Unit cost math is clear.",
        "2026-07-24T10:22:00Z"
      ),
    ],
  },
  {
    id: "ch-logistics",
    kind: "channel",
    name: "logistics",
    slug: "logistics",
    purpose: "project",
    topic: "Laydown · crane · deliveries",
    imageUrl:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=256&h=256&fit=crop",
    memberIds: [
      "self",
      "p-maya",
      "p-derek",
      "p-chris",
      "p-jordan",
      "p-marcus",
    ],
    unreadCount: 1,
    updatedAt: "2026-07-24T16:50:00Z",
    messages: [
      msg(
        "m-log1",
        "ch-logistics",
        maya,
        "North laydown map is final for Friday picks. Trades: confirm your trailers are outside the swing radius by Thursday 3 PM.",
        "2026-07-24T14:00:00Z",
        { reactions: [{ emoji: "👀", count: 4, me: false }] }
      ),
      msg(
        "m-log2",
        "ch-logistics",
        chris,
        "NSH Level 3 will mirror the same buffer rules — posting a photo of our board later.",
        "2026-07-24T14:35:00Z"
      ),
      msg(
        "m-log3",
        "ch-logistics",
        jordan,
        "Dallas Midtown delivery windows are blocked on the freeze — no double-booking the shared crane vendor Friday.",
        "2026-07-24T15:10:00Z"
      ),
      msg(
        "m-log4",
        "ch-logistics",
        derek,
        "@magnus summarize open logistics blockers across downtown tower and Nashville for the super standup.",
        "2026-07-24T16:20:00Z"
      ),
      msg(
        "m-log5",
        "ch-logistics",
        MAGNUS_AUTHOR,
        "Logistics pulse for super standup:\n\n• Downtown tower — north laydown Friday 6–9 AM; confirm trailers clear by Thu 3 PM.\n• Temp power still staged clear of pick radius (Derek).\n• Nashville — switchgear ETA slipped three days; keep temp power path open.\n• Dallas Midtown — look-ahead freeze; no shared crane double-book Friday.\n\nSuggested: confirm Friday walk attendance + glance at laydown map before standup.",
        "2026-07-24T16:22:00Z"
      ),
      msg(
        "m-log6",
        "ch-logistics",
        marcus,
        "Switchgear set day still weather-dependent — I'll post if we re-route temp power.",
        "2026-07-24T16:50:00Z"
      ),
    ],
  },
  /**
   * Direct messages — keep the sidebar tight (4 peers) with white-collar /
   * field names that read clearly in demos. Threads are multi-turn so each
   * open feels like a real ongoing conversation.
   */
  {
    id: "dm-derek",
    kind: "dm",
    name: "Derek Walsh",
    purpose: "dm",
    memberIds: ["self", "p-derek"],
    unreadCount: 1,
    updatedAt: "2026-07-24T16:45:00Z",
    messages: [
      msg(
        "m-dm-derek1",
        "dm-derek",
        derek,
        "Morning — pour night logistics look solid. Trucking sequence is on the trailer board if you want a photo.",
        "2026-07-24T07:55:00Z"
      ),
      msg(
        "m-dm-derek2",
        "dm-derek",
        SELF_AUTHOR,
        "Send it when you can. I’ll glance before the 9 AM coordination.",
        "2026-07-24T08:05:00Z"
      ),
      msg(
        "m-dm-derek3",
        "dm-derek",
        derek,
        "Board shot is in the NSH folder. North laydown stays clear of the crane path — same rule as downtown tower.",
        "2026-07-24T08:18:00Z",
        {
          attachments: [
            {
              id: "att-derek-board",
              name: "nsh-trailer-board.jpg",
              sizeLabel: "1.4 MB",
              mime: "image/jpeg",
              previewUrl:
                "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=640&h=400&fit=crop",
            },
          ],
        }
      ),
      msg(
        "m-dm-derek4",
        "dm-derek",
        SELF_AUTHOR,
        "Got it. Anything blocking Level 3 pour if switchgear slips again?",
        "2026-07-24T08:40:00Z"
      ),
      msg(
        "m-dm-derek5",
        "dm-derek",
        derek,
        "Not yet — temp power path is still open. Marcus is watching weather for set day. If we re-route I’ll ping #logistics.",
        "2026-07-24T09:10:00Z",
        { reactions: [{ emoji: "👍", count: 1, me: true }] }
      ),
      msg(
        "m-dm-derek6",
        "dm-derek",
        derek,
        "One more — night shift wants the fall-protection toolbox in EN + Spanish. Rachel’s deck is in EH&S; can platform deep-link it from Catch me up?",
        "2026-07-24T16:45:00Z"
      ),
    ],
  },
  {
    id: "dm-james",
    kind: "dm",
    name: "James Courson",
    purpose: "dm",
    memberIds: ["self", "p-james"],
    unreadCount: 0,
    updatedAt: "2026-07-24T14:20:00Z",
    messages: [
      msg(
        "m-dm-james1",
        "dm-james",
        james,
        "Office hours deck is still light. Let’s keep it to Catch me up + approvals inbox — five minutes max on each.",
        "2026-07-23T20:40:00Z"
      ),
      msg(
        "m-dm-james2",
        "dm-james",
        SELF_AUTHOR,
        "Works. Channel demo stays short; end on an in-thread Magnus ask so people see the reply land.",
        "2026-07-23T20:55:00Z"
      ),
      msg(
        "m-dm-james3",
        "dm-james",
        james,
        "Perfect. Evan is stocking cold brew in 4B for the room. Morale plan secured.",
        "2026-07-24T10:05:00Z",
        { reactions: [{ emoji: "🎉", count: 1, me: true }] }
      ),
      msg(
        "m-dm-james4",
        "dm-james",
        SELF_AUTHOR,
        "Hannah confirmed the craft open house Wednesday — still good for a five-minute Catch me up demo?",
        "2026-07-24T11:15:00Z"
      ),
      msg(
        "m-dm-james5",
        "dm-james",
        james,
        "Yes. I’ll use downtown tower as the example so supers see project + safety in one brief. Laptop seed ready on your end?",
        "2026-07-24T11:40:00Z"
      ),
      msg(
        "m-dm-james6",
        "dm-james",
        SELF_AUTHOR,
        "I’ll refresh the demo seed tonight so Catch me up is clean. See you in 4B.",
        "2026-07-24T12:05:00Z"
      ),
      msg(
        "m-dm-james7",
        "dm-james",
        james,
        "One tweak — open on the approvals tile first if finance is in the room. Otherwise default to Catch me up.",
        "2026-07-24T14:20:00Z"
      ),
    ],
  },
  {
    id: "dm-tom",
    kind: "dm",
    name: "Tom Hale",
    purpose: "dm",
    memberIds: ["self", "p-tom"],
    unreadCount: 0,
    updatedAt: "2026-07-24T15:10:00Z",
    messages: [
      msg(
        "m-dm-tom1",
        "dm-tom",
        tom,
        "Night shift concrete crew is locked for Friday. Want Magnus to pull a pour checklist summary into #safety?",
        "2026-07-24T07:40:00Z"
      ),
      msg(
        "m-dm-tom2",
        "dm-tom",
        SELF_AUTHOR,
        "Yes — drop the checklist link in #safety and tag Magnus. I’ll make sure Catch me up surfaces it for supers.",
        "2026-07-24T08:00:00Z"
      ),
      msg(
        "m-dm-tom3",
        "dm-tom",
        tom,
        "Posted. Also for the record: coffee cart beats Saturn when we’re on a 5 AM start.",
        "2026-07-24T08:50:00Z",
        { reactions: [{ emoji: "👀", count: 1, me: true }] }
      ),
      msg(
        "m-dm-tom4",
        "dm-tom",
        SELF_AUTHOR,
        "Noted. Anything else before pour night — labor, weather, or temp power?",
        "2026-07-24T09:20:00Z"
      ),
      msg(
        "m-dm-tom5",
        "dm-tom",
        tom,
        "Labor is full. Weather looks dry through Saturday. Temp power stays clear of the pick radius — same note Derek has in #logistics.",
        "2026-07-24T10:05:00Z"
      ),
      msg(
        "m-dm-tom6",
        "dm-tom",
        tom,
        "@magnus quick pour-night checklist for Friday — keep it short for the night shift huddle.",
        "2026-07-24T14:50:00Z"
      ),
      msg(
        "m-dm-tom7",
        "dm-tom",
        MAGNUS_AUTHOR,
        "Pour-night checklist (Friday):\n\n• Confirm crew headcount and roles at 5 AM huddle.\n• Walk soft edges / fall protection before anyone on deck.\n• Trucking sequence matches trailer board; no queue into crane radius.\n• Temp power clear of pick path (Derek / #logistics).\n• Toolbox: fall protection EN + Spanish (Rachel deck in EH&S).\n\nSuggested: photo the board after the huddle and drop it in #safety.",
        "2026-07-24T14:52:00Z"
      ),
      msg(
        "m-dm-tom8",
        "dm-tom",
        tom,
        "That’s the one. Printing for the trailer. Thanks Robert.",
        "2026-07-24T15:10:00Z"
      ),
    ],
  },
  {
    id: "dm-hannah",
    kind: "dm",
    name: "Hannah Berg",
    purpose: "dm",
    memberIds: ["self", "p-hannah"],
    unreadCount: 2,
    updatedAt: "2026-07-24T16:20:00Z",
    messages: [
      msg(
        "m-dm-hannah1",
        "dm-hannah",
        hannah,
        "Craft open house is on the feed for next Wednesday 4–7 PM. Snacks vote is still open in #random.",
        "2026-07-24T09:30:00Z"
      ),
      msg(
        "m-dm-hannah2",
        "dm-hannah",
        SELF_AUTHOR,
        "Saw it. James is confirmed for a five-minute Catch me up demo — I’ll bring a clean laptop seed.",
        "2026-07-24T09:55:00Z"
      ),
      msg(
        "m-dm-hannah3",
        "dm-hannah",
        hannah,
        "Thank you. Benefits enrollment also closes Friday — drop-in hours are on the company post if anyone asks.",
        "2026-07-24T10:30:00Z"
      ),
      msg(
        "m-dm-hannah4",
        "dm-hannah",
        SELF_AUTHOR,
        "I’ll point office hours folks there if finance isn’t the main topic.",
        "2026-07-24T11:00:00Z"
      ),
      msg(
        "m-dm-hannah5",
        "dm-hannah",
        hannah,
        "One favor — can Magnus draft a short invite blurb for supervisors to forward to craft leads? Tone: friendly, not corporate.",
        "2026-07-24T15:40:00Z"
      ),
      msg(
        "m-dm-hannah6",
        "dm-hannah",
        hannah,
        "@magnus draft a short supervisor forward for the Carolinas craft open house — friendly, under 80 words.",
        "2026-07-24T15:42:00Z"
      ),
      msg(
        "m-dm-hannah7",
        "dm-hannah",
        MAGNUS_AUTHOR,
        "Here’s a short forward you can paste:\n\nHey team — next Wednesday 4–7 PM we’re hosting a craft open house (Carolinas). Bring someone who wants to join self-perform. Snacks, benefits overview, and a quick Magnus walkthrough. Drop by if you can, and feel free to forward this.\n\nI can shorten further or add the lobby address if you want.",
        "2026-07-24T15:44:00Z"
      ),
      msg(
        "m-dm-hannah8",
        "dm-hannah",
        hannah,
        "That’s perfect. Sending to supers this afternoon. Pizza is currently winning the snack poll, for what it’s worth.",
        "2026-07-24T16:20:00Z",
        { reactions: [{ emoji: "🎉", count: 1, me: false }] }
      ),
    ],
  },
];

export const DEFAULT_CONVERSATION_ID = "ch-downtown";
