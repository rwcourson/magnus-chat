import type { CalendarDay } from "@/types/calendar";

/** Mock Outlook-style agenda for the current demo week. */
export const calendarDays: CalendarDay[] = [
  {
    dateLabel: "Jul 24",
    weekday: "Thu",
    isToday: true,
    events: [
      {
        id: "ev-1",
        title: "Standup — Downtown tower",
        start: "7:30 AM",
        end: "7:50 AM",
        location: "Teams",
        kind: "meeting",
        project: "Downtown tower",
        withWhom: "Maya Chen + field leads",
        prepHint: "Pull look-ahead and open RFIs.",
      },
      {
        id: "ev-2",
        title: "Pour coordination — Level 3",
        start: "9:00 AM",
        end: "10:00 AM",
        location: "Jobsite trailer",
        kind: "site",
        project: "Nashville Level 3",
        withWhom: "Derek Walsh",
        prepHint: "Weather window + trucking sequence.",
      },
      {
        id: "ev-3",
        title: "Focus: OnBase invoices",
        start: "11:00 AM",
        end: "11:45 AM",
        kind: "focus",
        prepHint: "2 invoices pending your release.",
      },
      {
        id: "ev-4",
        title: "Magnus office hours",
        start: "2:00 PM",
        end: "2:45 PM",
        location: "Birmingham HQ · 4B",
        kind: "meeting",
        withWhom: "James Courson",
        prepHint: "Demo Catch me up + approvals inbox.",
      },
      {
        id: "ev-5",
        title: "SuccessFactors review due",
        start: "4:30 PM",
        end: "5:00 PM",
        kind: "deadline",
        prepHint: "Self-assessment draft in SuccessFactors.",
      },
    ],
  },
  {
    dateLabel: "Jul 25",
    weekday: "Fri",
    events: [
      {
        id: "ev-6",
        title: "Owner walk — envelope",
        start: "8:00 AM",
        end: "10:00 AM",
        location: "Downtown tower · north laydown",
        kind: "site",
        project: "Downtown tower",
        withWhom: "Owner’s rep + AE",
      },
      {
        id: "ev-7",
        title: "Drive to jobsite",
        start: "6:30 AM",
        end: "7:45 AM",
        kind: "travel",
      },
      {
        id: "ev-8",
        title: "Weekly safety sync",
        start: "1:00 PM",
        end: "1:30 PM",
        location: "Teams",
        kind: "meeting",
        withWhom: "Safety Ops",
        prepHint: "Toolbox talk of the week is live.",
      },
    ],
  },
  {
    dateLabel: "Jul 28",
    weekday: "Mon",
    events: [
      {
        id: "ev-9",
        title: "LRP planning working session",
        start: "9:00 AM",
        end: "11:00 AM",
        location: "Charlotte · estimating",
        kind: "meeting",
        project: "Long Range Plan",
        withWhom: "Priya Nair",
      },
    ],
  },
];

export function todayCalendar(days: CalendarDay[] = calendarDays) {
  return days.find((d) => d.isToday) ?? days[0]!;
}
