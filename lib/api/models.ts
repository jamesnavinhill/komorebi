/**
 * Model Configuration — Agency gateway (free models)
 * Centralized model definitions for Komorebi.
 * All models run through the OpenAI-compatible gateway; legacy Gemini ids
 * from before the migration are translated on read.
 */

export interface ModelConfig {
  id: string
  name: string
  description: string
  category: "reasoning" | "fast" | "image" | "video" | "audio" | "code"
  capabilities: string[]
  recommended?: boolean
}

export const DEFAULT_CHAT_MODEL = "nv-z-ai-glm-5-3-flash"
export const DEFAULT_CODE_MODEL = "cf-jami-qwen-qwen2-5-coder-32b-instruct"
export const DEFAULT_IMAGE_MODEL = "cf-img-flux-1-schnell"

/** Gateway free models (verified live). */
export const GATEWAY_MODELS: ModelConfig[] = [
  // Text — truly-free lanes first (NVIDIA NIM, OpenRouter free, Inception);
  // Cloudflare Workers AI models are dev/fallback options (limited free quota).
  {
    id: "nv-z-ai-glm-5-3-flash",
    name: "GLM 5.3 Flash (NVIDIA)",
    description: "Fast frontier model — default for chat, agents, and analysis",
    category: "fast",
    capabilities: ["text", "vision", "function-calling", "thinking"],
    recommended: true,
  },
  {
    id: "nv-z-ai-glm-5-3",
    name: "GLM 5.3 (NVIDIA)",
    description: "Deep reasoning and large-context work",
    category: "reasoning",
    capabilities: ["text", "vision", "function-calling", "thinking"],
    recommended: true,
  },
  {
    id: "nv-moonshotai-kimi-k3",
    name: "Kimi K3 (NVIDIA)",
    description: "Strong general assistant for agentic tasks",
    category: "reasoning",
    capabilities: ["text", "vision", "function-calling"],
  },
  {
    id: "nv-nvidia-nemotron-3-nano-omni-30b-a3b-reasoning",
    name: "Nemotron 3 Nano Omni",
    description: "Omni-modal reasoning (text + vision + audio input)",
    category: "fast",
    capabilities: ["text", "vision", "function-calling", "thinking"],
  },
  {
    id: "in-mercury-2",
    name: "Mercury 2 (Inception)",
    description: "Diffusion LLM — very fast text generation",
    category: "fast",
    capabilities: ["text"],
  },
  {
    id: "or-free",
    name: "OpenRouter Free",
    description: "Catch-all free lane with automatic fallbacks",
    category: "fast",
    capabilities: ["text"],
  },
  {
    id: "cf-jami-qwen-qwen2-5-coder-32b-instruct",
    name: "Qwen 2.5 Coder 32B (CF)",
    description: "Code generation and repair",
    category: "code",
    capabilities: ["text", "code", "code-execution"],
    recommended: true,
  },
  // Image generation (gateway /images/generations)
  {
    id: "cf-img-flux-1-schnell",
    name: "FLUX 1 Schnell",
    description: "Fast image generation — default",
    category: "image",
    capabilities: ["image-generation"],
    recommended: true,
  },
  {
    id: "cf-img-flux-2-dev",
    name: "FLUX 2 Dev",
    description: "Higher-fidelity image generation",
    category: "image",
    capabilities: ["image-generation"],
  },
  {
    id: "cf-img-sdxl-lightning",
    name: "SDXL Lightning",
    description: "Very fast stylized image generation",
    category: "image",
    capabilities: ["image-generation"],
  },
  {
    id: "cf-img-dreamshaper-8-lcm",
    name: "Dreamshaper 8 LCM",
    description: "Artistic/dreamlike image generation",
    category: "image",
    capabilities: ["image-generation"],
  },
]

/**
 * Model ids referenced before the gateway migration (Gemini-era) mapped onto
 * the closest surviving gateway model. Unknown ids pass through unchanged.
 */
const LEGACY_MODEL_MAP: Record<string, string> = {
  "gemini-3-flash-preview": DEFAULT_CHAT_MODEL,
  "gemini-2.5-flash": "cf-jami-qwen-qwen3-30b-a3b-fp8",
  "gemini-2.5-flash-lite": "or-free",
  "gemini-2.5-pro": "cf-jami-zai-org-glm-5-3",
  "gemini-3-pro-preview": "cf-jami-zai-org-glm-5-3",
  "gemini-2.5-flash-image": DEFAULT_IMAGE_MODEL,
  "gemini-3-pro-image-preview": "cf-img-flux-2-dev",
  "imagen-4.0-generate-001": DEFAULT_IMAGE_MODEL,
  "imagen-4.0-ultra-generate-001": "cf-img-flux-2-dev",
  "imagen-4.0-fast-generate-001": "cf-img-sdxl-lightning",
}

export function translateLegacyModelId(modelId: string): string {
  return LEGACY_MODEL_MAP[modelId] ?? modelId
}

/** Back-compat alias for code that referenced the Gemini catalog by name. */
export const GEMINI_MODELS: ModelConfig[] = GATEWAY_MODELS

export function getModelsByCategory(category: ModelConfig["category"]): ModelConfig[] {
  return GATEWAY_MODELS.filter((m) => m.category === category)
}

export function getModelsByCapability(capability: string): ModelConfig[] {
  return GATEWAY_MODELS.filter((m) => m.capabilities.includes(capability))
}

/** Model presets for different use cases. */
export const MODEL_PRESETS = {
  codeExecution: {
    default: DEFAULT_CODE_MODEL,
    fast: "or-free",
    advanced: "nv-z-ai-glm-5-3",
  },
  research: {
    default: "nv-z-ai-glm-5-3",
    fast: DEFAULT_CHAT_MODEL,
    advanced: "nv-nvidia-nemotron-3-ultra-550b-a55b",
  },
  creative: {
    text: "nv-z-ai-glm-5-3",
    image: DEFAULT_IMAGE_MODEL,
    imageAdvanced: "cf-img-flux-2-dev",
  },
  orchestrator: {
    default: "nv-z-ai-glm-5-3",
    advanced: "nv-nvidia-nemotron-3-ultra-550b-a55b",
  },
  subAgents: {
    researcher: "nv-z-ai-glm-5-3",
    creator: "nv-z-ai-glm-5-3",
    coder: DEFAULT_CODE_MODEL,
    reviewer: DEFAULT_CHAT_MODEL,
  },
} as const

export function getModel(id: string): ModelConfig | undefined {
  return GATEWAY_MODELS.find((m) => m.id === id)
}
