import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { GATEWAY_BASE_URL } from "./gateway"
import { translateLegacyModelId, DEFAULT_CHAT_MODEL } from "./models"

/**
 * Gateway language-model factory for the Vercel AI SDK (ToolLoopAgent, generateText).
 * Kept the historical `google` export name so all call sites keep working;
 * the model ids are translated from Gemini-era ids to gateway ids.
 */
const provider = createOpenAICompatible({
  name: "yrka-gateway",
  baseURL: GATEWAY_BASE_URL,
  apiKey: process.env.YRKA_GATEWAY_API_KEY,
  headers: { "x-agency-surface": "komorebi" },
})

export function gatewayModel(model: string | undefined, fallback = DEFAULT_CHAT_MODEL) {
  return provider(translateLegacyModelId(model?.trim() || fallback))
}

/** Legacy alias — call sites use google("model-id"). */
export const google = gatewayModel

export function resolveGoogleModelId(
  model: string | undefined,
  fallback = DEFAULT_CHAT_MODEL
): string {
  const candidate = model?.trim() || fallback
  return translateLegacyModelId(candidate.startsWith("google/") ? candidate.slice("google/".length) : candidate)
}
