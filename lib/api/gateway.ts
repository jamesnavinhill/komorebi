import { createLogger } from "@/lib/logging/logger"

const log = createLogger("Gateway")

/**
 * Agency gateway client (OpenAI-compatible, LiteLLM).
 *
 * Primary lane: https://gateway.yrka.io/v1 — chat completions (streaming SSE),
 * image generations, and MCP tool calls at https://tools.yrka.io/mcp.
 * Only free-tier models are used as defaults.
 */

export const GATEWAY_BASE_URL = process.env.YRKA_GATEWAY_BASE_URL || "https://gateway.yrka.io/v1"
export const MCP_URL = process.env.YRKA_MCP_URL || "https://tools.yrka.io/mcp"

function gatewayKey(): string {
  const key = process.env.YRKA_GATEWAY_API_KEY
  if (!key) {
    throw new Error("YRKA_GATEWAY_API_KEY is not set - gateway AI features are unavailable")
  }
  return key
}

function mcpKey(): string {
  return process.env.YRKA_MCP_GATEWAY_TOKEN || gatewayKey()
}

export function isGatewayConfigured(): boolean {
  return !!process.env.YRKA_GATEWAY_API_KEY
}

export interface GatewayMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface ChatCompletionConfig {
  model: string
  messages: GatewayMessage[]
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
}

export async function chatCompletion(config: ChatCompletionConfig): Promise<string> {
  const body: Record<string, unknown> = {
    model: config.model,
    messages: config.messages,
    max_tokens: config.maxTokens ?? 4096,
  }
  if (config.temperature !== undefined) body.temperature = config.temperature
  if (config.jsonMode) body.response_format = { type: "json_object" }

  const res = await fetch(`${GATEWAY_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gatewayKey()}`,
      "Content-Type": "application/json",
      "x-agency-surface": "komorebi",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gateway chat error ${res.status}: ${text.slice(0, 300)}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (typeof content !== "string") {
    throw new Error("Gateway chat returned no content")
  }
  return content
}

/**
 * Streaming chat completion. Yields text deltas from the SSE stream.
 */
export async function* chatCompletionStream(config: ChatCompletionConfig): AsyncGenerator<string, void, unknown> {
  const body: Record<string, unknown> = {
    model: config.model,
    messages: config.messages,
    max_tokens: config.maxTokens ?? 4096,
    stream: true,
  }
  if (config.temperature !== undefined) body.temperature = config.temperature

  const res = await fetch(`${GATEWAY_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gatewayKey()}`,
      "Content-Type": "application/json",
      "x-agency-surface": "komorebi",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "")
    throw new Error(`Gateway stream error ${res.status}: ${text.slice(0, 300)}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let newlineIndex: number
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim()
      buffer = buffer.slice(newlineIndex + 1)

      if (!line.startsWith("data:")) continue
      const payload = line.slice(5).trim()
      if (!payload || payload === "[DONE]") continue

      try {
        const chunk = JSON.parse(payload)
        const delta = chunk.choices?.[0]?.delta?.content
        if (typeof delta === "string" && delta) {
          yield delta
        }
      } catch {
        // Skip malformed chunks (keep-alives, partial frames)
      }
    }
  }
}

export interface GatewayImage {
  base64: string
  mediaType: string
}

/**
 * Image generation via the gateway's OpenAI-shaped /images/generations endpoint.
 * Free models: cf-img-flux-1-schnell (fast default), cf-img-flux-2-dev,
 * cf-img-sdxl-lightning, cf-img-sdxl-base-1-0, cf-img-dreamshaper-8-lcm.
 */
export async function generateGatewayImage(prompt: string, model = "cf-img-flux-1-schnell"): Promise<GatewayImage> {
  log.info("Generating image via gateway", { model, promptLength: prompt.length })

  const res = await fetch(`${GATEWAY_BASE_URL}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gatewayKey()}`,
      "Content-Type": "application/json",
      "x-agency-surface": "komorebi",
    },
    body: JSON.stringify({ model, prompt, n: 1 }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gateway image error ${res.status}: ${text.slice(0, 300)}`)
  }

  const data = await res.json()
  const b64 = data.data?.[0]?.b64_json
  if (!b64) {
    throw new Error("Gateway image returned no image data")
  }

  // Flux/SDXL on Workers AI return JPEG bytes; sniff the SOI marker to be sure.
  const mediaType = b64.slice(0, 8) === "/9j/4AAQ" ? "image/jpeg" : "image/png"
  return { base64: b64, mediaType }
}

interface McpToolContent {
  type: string
  text?: string
}

/**
 * Call an MCP tool on the agency toolbox (https://tools.yrka.io/mcp).
 * Streamable HTTP JSON-RPC: initialize handshake is stateless on this server,
 * so a plain tools/call round-trip is sufficient.
 */
export async function mcpToolCall(toolName: string, args: Record<string, unknown>): Promise<string> {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mcpKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "x-agency-surface": "komorebi",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name: toolName, arguments: args },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MCP tool error ${res.status}: ${text.slice(0, 300)}`)
  }

  const data = await res.json()
  if (data.error) {
    throw new Error(`MCP tool ${toolName} failed: ${JSON.stringify(data.error).slice(0, 300)}`)
  }
  const content: McpToolContent[] = data.result?.content ?? []
  return content.map((c) => c.text ?? "").join("\n").trim()
}

export interface WebSearchResult {
  title: string
  url: string
  content: string
}

/**
 * Web search via the MCP toolbox: you_search primary, tavily_search fallback.
 * The markdown result block parses into title/url/content sections.
 */
export async function webSearch(query: string, count = 8): Promise<WebSearchResult[]> {
  const markdown = await mcpToolCall("you_search", { query, count })
    .catch(async (err) => {
      log.warn("you_search failed, falling back to tavily_search", { error: err.message })
      return mcpToolCall("tavily_search", { query, max_results: count })
    })

  const results: WebSearchResult[] = []
  const sections = markdown.split(/^###\s+/m).filter(Boolean)
  for (const section of sections) {
    const match = section.match(/^(\d+)\.\s+\[(.+?)]\((https?:\/\/[^\s)]+)\)\s*\n?([\s\S]*)$/)
    if (!match) continue
    results.push({
      title: match[2].trim(),
      url: match[3].trim(),
      content: match[4].replace(/\s+/g, " ").trim().slice(0, 500),
    })
  }
  return results
}
