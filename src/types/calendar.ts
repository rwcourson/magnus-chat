export type CalendarEventKind =
  | "meeting"
  | "site"
  | "focus"
  | "travel"
  | "deadline";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  kind: CalendarEventKind;
  project?: string;
  withWhom?: string;
  prepHint?: string;
};

export type CalendarDay = {
  dateLabel: string;
  weekday: string;
  isToday?: boolean;
  events: CalendarEvent[];
};
