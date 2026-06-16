import type { INTAKE_TYPES } from "@/lib/validation/intake";

type IntakeType = (typeof INTAKE_TYPES)[number];

// Quick Action Cards — one-click capture shortcuts. Each preselects an intake
// type and offers a guiding prompt so staff/clients know exactly what to jot.
export type HarvestCard = {
  key: string;
  label: string;
  icon: string;
  intakeType: IntakeType;
  prompt: string; // placeholder shown in the capture box
};

export const HARVEST_CARDS: HarvestCard[] = [
  {
    key: "customer_story",
    label: "Customer Story",
    icon: "🗣️",
    intakeType: "customer_story",
    prompt: "Who was the customer, what did they need, what was the result? Names, numbers, a quote if you have one.",
  },
  {
    key: "project_complete",
    label: "Project Complete",
    icon: "✅",
    intakeType: "project_complete",
    prompt: "What project wrapped? Scope, location, timeline, the before/after, anything that surprised you.",
  },
  {
    key: "new_employee",
    label: "New Employee",
    icon: "👋",
    intakeType: "team_update",
    prompt: "Who joined, their role, a sentence on background, and one human detail worth sharing.",
  },
  {
    key: "upcoming_event",
    label: "Upcoming Event",
    icon: "📅",
    intakeType: "event",
    prompt: "What, when, where, who it's for, and the one action you want people to take.",
  },
  {
    key: "promotion",
    label: "Promotion",
    icon: "🏷️",
    intakeType: "promotion",
    prompt: "The offer, the exact dates, the fine print, and how someone redeems it.",
  },
  {
    key: "volunteer_spotlight",
    label: "Volunteer Spotlight",
    icon: "🙌",
    intakeType: "volunteer_story",
    prompt: "Who, what they did, how long they've helped, and the impact in concrete terms.",
  },
  {
    key: "donor_story",
    label: "Donor Story",
    icon: "💛",
    intakeType: "donor_story",
    prompt: "The donor (or anonymized), what they gave, what it funded, and the outcome it made possible.",
  },
  {
    key: "quick_update",
    label: "Quick Update",
    icon: "⚡",
    intakeType: "business_update",
    prompt: "Anything new worth a sentence or two — wins, news, milestones.",
  },
];
