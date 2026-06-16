import { getContentHistory, getProjectTopicText } from "./history";
import { findSimilar, type SimilarityMatch } from "./similarity";

// Client Memory engine — ties the History service to the Similarity engine.
// Used by the UI (warning banner) and could feed agents in later phases.

// Warn if a project's topic resembles past content for the same client.
export async function checkProjectSimilarity(
  projectId: string,
  opts: { threshold?: number; limit?: number } = {},
): Promise<SimilarityMatch[]> {
  const probe = await getProjectTopicText(projectId);
  if (!probe?.clientId || !probe.topicText.trim()) return [];

  const history = await getContentHistory(probe.clientId, { excludeProjectId: projectId });
  if (history.length === 0) return [];

  return findSimilar(probe.topicText, history, {
    now: new Date(),
    threshold: opts.threshold ?? 35,
    limit: opts.limit ?? 3,
  });
}

// Warn before committing to a free-text topic (project intake / planning).
export async function checkTopicMemory(
  clientId: string,
  candidateText: string,
  opts: { threshold?: number; limit?: number; excludeProjectId?: string } = {},
): Promise<SimilarityMatch[]> {
  if (!candidateText.trim()) return [];
  const history = await getContentHistory(clientId, { excludeProjectId: opts.excludeProjectId });
  if (history.length === 0) return [];
  return findSimilar(candidateText, history, {
    now: new Date(),
    threshold: opts.threshold ?? 35,
    limit: opts.limit ?? 3,
  });
}
