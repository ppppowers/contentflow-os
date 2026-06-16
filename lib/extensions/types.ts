// Plugin/Extension framework contract. Concrete integrations implement this in a
// later milestone; Phase 22 ships the framework + registry + storage ONLY.

export type ProviderCategory = "email" | "cms" | "social";

export type IntegrationProvider = {
  id: string;
  name: string;
  category: ProviderCategory;
  capabilities: string[];   // e.g. ["send_campaign", "manage_lists"]
  description: string;
};

export type PublishPayload = {
  projectId: string;
  channel: string;
  title?: string;
  body: string;
  metadata?: Record<string, unknown>;
};

export type PublishResult = { ok: true; externalId?: string } | { ok: false; error: string };

// A future integration registers a publisher implementing this.
export interface IntegrationPublisher {
  readonly provider: IntegrationProvider;
  publish(payload: PublishPayload, config: Record<string, unknown>): Promise<PublishResult>;
}
