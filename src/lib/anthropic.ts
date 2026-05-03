import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

/**
 * Singleton Anthropic client.
 *
 * The grading service in `features/grading/` is the only consumer today; if
 * we add other Claude-powered features later (summaries, content generation),
 * they should reuse this client.
 */
export const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

/** Default model used for grading. Configurable per-environment via env. */
export const GRADING_MODEL = env.ANTHROPIC_GRADING_MODEL;
