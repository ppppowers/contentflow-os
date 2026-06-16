import { z } from "zod";
import { AGENT_SCHEMAS, type AgentName } from "./agent-io";

// Typed as the AgentName literal union so `upTo` infers to AgentName (not string)
// and flows directly into DispatchRequest without a cast.
const agentNames = Object.keys(AGENT_SCHEMAS) as [AgentName, ...AgentName[]];

// Validates the Command Center dispatch endpoint body. The router performs the
// deeper check that `target` matches a known workflow/agent; this guards shape.
export const dispatchRequestSchema = z
  .object({
    kind: z.enum(["workflow", "agent"]),
    target: z.string().min(1),
    projectId: z.string().uuid(),
    upTo: z.enum(agentNames).optional(),
  })
  .strict();

export type DispatchRequestInput = z.infer<typeof dispatchRequestSchema>;
