export type ProjectStatus =
  | "intake_received"
  | "research_complete"
  | "draft_generated"
  | "internal_review"
  | "client_review"
  | "revision_requested"
  | "approved"
  | "scheduled"
  | "sent"
  | "archived";

export type RunContext = {
  agencyId: string;
  userId: string;
};
