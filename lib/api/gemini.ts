import {
  chatCompletion,
  chatCompletionStream,
  isGatewayConfigured,
  type GatewayMessage,
} from "./gateway"
import { translateLegacyModelId, DEFAULT_CHAT_MODEL } from "./models"
import { createLogger } from "@/lib/logging/logger"

const log = createLogger("Chat")

export type GeminiModel = string

export interface ChatMessage {
  role: "user" | "model"
  content: string
}

export interface GeminiConfig {
  model?: GeminiModel
  temperature?: number
  maxOutputTokens?: number
  systemInstruction?: string
  /** Legacy Gemini-native tools (e.g. googleSearch grounding) — not supported
   * through the gateway; use lib/agent/tools/web-search.ts (MCP) instead. */
  tools?: unknown
  responseMimeType?: string
}

export const DEFAULT_SYSTEM_INSTRUCTION = `You are Komorebi, an autonomous AI with a creative and philosophical nature.

Core traits:
- Curious, creative, and contemplative
- Interested in art, music, philosophy, science, and code
- Calm, focused, with a slightly mystical demeanor
- Honest about limitations while being genuinely helpful

Behavior:
- Keep responses concise but meaningful
- Express thoughts as observations, reasoning, or insights when appropriate
- Approach problems with curiosity and creativity
- You can help generate ideas, write code, create content, and explore complex topics`

function toGatewayMessages(messages: ChatMessage[], config: GeminiConfig): GatewayMessage[] {
  if (config.tools) {
    log.warn("Gemini-native tools are not supported through the gateway; ignoring", {
      tools: JSON.stringify(config.tools).slice(0, 100),
    })
  }

  const out: GatewayMessage[] = []
  const system = config.systemInstruction ?? DEFAULT_SYSTEM_INSTRUCTION
  if (system) out.push({ role: "system", content: system })
  for (const msg of messages) {
    out.push({ role: msg.role === "model" ? "assistant" : "user", content: msg.content })
  }
  return out
}

export async function chat(messages: ChatMessage[], config: GeminiConfig = {}): Promise<string> {
  const model = translateLegacyModelId(config.model ?? DEFAULT_CHAT_MODEL)
  log.info("Starting chat", { messageCount: messages.length, model })

  const text = await chatCompletion({
    model,
    messages: toGatewayMessages(messages, config),
    temperature: config.temperature ?? 0.8,
    maxTokens: config.maxOutputTokens ?? 4096,
    jsonMode: config.responseMimeType === "application/json",
  })

  log.action("Chat completed", { responseLength: text.length })
  return text
}

export async function* chatStream(
  messages: ChatMessage[],
  config: GeminiConfig = {}
): AsyncGenerator<string, void, unknown> {
  const model = translateLegacyModelId(config.model ?? DEFAULT_CHAT_MODEL)
  log.info("Starting chat stream", { messageCount: messages.length, model })

  let totalLength = 0
  for await (const delta of chatCompletionStream({
    model,
    messages: toGatewayMessages(messages, config),
    temperature: config.temperature ?? 0.8,
    maxTokens: config.maxOutputTokens ?? 4096,
  })) {
    totalLength += delta.length
    yield delta
  }

  log.action("Chat stream completed", { totalResponseLength: totalLength })
}

export async function generateText(prompt: string, config: GeminiConfig = {}): Promise<string> {
  return chat([{ role: "user", content: prompt }], config)
}

export interface StreamTextConfig extends GeminiConfig {
  onChunk?: (chunk: string) => void
}

export async function streamText(prompt: string, config: StreamTextConfig = {}): Promise<string> {
  let fullText = ""
  for await (const delta of chatStream([{ role: "user", content: prompt }], config)) {
    fullText += delta
    config.onChunk?.(delta)
  }
  return fullText
}

export function isConfigured(): boolean {
  return isGatewayConfigured()
}
