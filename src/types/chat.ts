export type Role = "user" | "assistant";

export type ScheduleStatus = "free" | "busy" | "tentative" | "ooo" | "away";

export interface ScheduleEvent {
  id: string;
  title: string;
  start: string; // "9:45 AM"
  end: string;
  status: ScheduleStatus;
}

export interface ScheduleDay {
  /** ISO date YYYY-MM-DD */
  date: string;
  weekday: string; // MON
  dayNum: number;
  events: ScheduleEvent[];
}

/** Clickable open slot for scheduling */
export interface ScheduleOpenWindow {
  id: string;
  label: string;
  detail: string;
  dayIndex: number;
}

export interface ScheduleAction {
  id: string;
  label: string;
  kind: "teams" | "email" | "invite" | "copy";
  value?: string;
}

export interface ScheduleData {
  person: {
    name: string;
    title: string;
    office: string;
    email?: string;
    /** Portrait URL */
    imageUrl?: string;
    initials?: string;
  };
  timezone: string; // CDT
  rangeLabel: string; // Jul 20 – Jul 24
  /** Index of “today” column when in range */
  todayIndex?: number;
  days: ScheduleDay[];
  /** Suggested free windows user can act on */
  openWindows?: ScheduleOpenWindow[];
  /** Header / footer actions */
  actions?: ScheduleAction[];
  summary?: string;
}

export type ContentBlock =
  | { type: "text"; content: string }
  | { type: "section"; title: string; body: string }
  | {
      type: "cards";
      items: {
        title: string;
        description: string;
        meta?: string;
        badge?: string;
        /** Personalization line (e.g. Catch me up “for you”) */
        forYou?: string;
      }[];
    }
  | { type: "list"; items: string[]; ordered?: boolean }
  | {
      type: "callout";
      tone?: "info" | "warn" | "success";
      title?: string;
      content: string;
    }
  | {
      type: "stats";
      items: { label: string; value: string; hint?: string }[];
    }
  | { type: "schedule"; data: ScheduleData }
  | { type: "research"; label?: string }
  | {
      type: "code";
      /** Source language label, e.g. typescript */
      language?: string;
      content: string;
    };

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
  followUps?: string[];
  /** Rich structured content for assistant messages */
  blocks?: ContentBlock[];
}

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: string;
  /** Optional short subtitle for list UI */
  preview?: string;
  messages: Message[];
  /** Hidden from the main chat list when true */
  archived?: boolean;
  /**
   * Sensitive / 1:1 thread — list UI may mask title until open.
   * Used by person-profile Message chats.
   */
  private?: boolean;
}

/** Demo capabilities — not real IAM; drives gated nav/surfaces. */
export type UserCapability = "insights";

export interface AppUser {
  name: string;
  initials: string;
  /** Privileged surfaces the demo user can open */
  capabilities?: UserCapability[];
}
