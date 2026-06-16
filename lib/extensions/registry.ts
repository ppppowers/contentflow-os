import type { IntegrationProvider, PublishPayload, PublishResult } from "./types";

// Available providers — METADATA ONLY. No client code, no API calls (Phase 22 is
// the framework). A future milestone registers IntegrationPublisher impls keyed by id.
export const PROVIDERS: IntegrationProvider[] = [
  { id: "mailchimp", name: "Mailchimp", category: "email", capabilities: ["send_campaign", "manage_lists"], description: "Email marketing campaigns and audiences." },
  { id: "brevo", name: "Brevo", category: "email", capabilities: ["send_campaign", "transactional"], description: "Email + SMS marketing." },
  { id: "constant_contact", name: "Constant Contact", category: "email", capabilities: ["send_campaign"], description: "Email marketing for small business." },
  { id: "wordpress", name: "WordPress", category: "cms", capabilities: ["publish_post"], description: "Publish blog posts to a WordPress site." },
  { id: "social_publishing", name: "Social Publishing", category: "social", capabilities: ["publish_post", "schedule"], description: "Publish/schedule social posts." },
];

const BY_ID = new Map(PROVIDERS.map((p) => [p.id, p]));

export function getProvider(id: string): IntegrationProvider | null {
  return BY_ID.get(id) ?? null;
}

export function isProvider(id: string): boolean {
  return BY_ID.has(id);
}

// Extension point. No integrations are implemented yet — this is where a
// registered IntegrationPublisher would be dispatched. Returns a clear
// not-implemented result so callers/UI can reflect framework-only status.
export async function publishVia(providerId: string, _payload: PublishPayload): Promise<PublishResult> {
  if (!isProvider(providerId)) return { ok: false, error: `Unknown provider: ${providerId}` };
  return { ok: false, error: "Framework only — this integration is not implemented yet." };
}
