import { generateGatewayImage, isGatewayConfigured } from "./gateway"
import { translateLegacyModelId, DEFAULT_IMAGE_MODEL } from "./models"
import type { ImageGenerationResult } from "./types"
import { createLogger } from "@/lib/logging/logger"

const log = createLogger("ImageGen")

export type ImagenModel = string

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9"

export interface ImagenConfig {
  model?: ImagenModel
  numberOfImages?: number
  aspectRatio?: AspectRatio
  personGeneration?: "dont_allow" | "allow_adult" | "allow_all"
}

const DEFAULT_CONFIG: ImagenConfig = {
  model: DEFAULT_IMAGE_MODEL,
  numberOfImages: 1,
  aspectRatio: "9:16",
}

async function generateOne(prompt: string, config: ImagenConfig): Promise<ImageGenerationResult> {
  const model = translateLegacyModelId(config.model || DEFAULT_IMAGE_MODEL)
  const image = await generateGatewayImage(prompt, model)

  return {
    url: `data:${image.mediaType};base64,${image.base64}`,
    prompt,
    timestamp: new Date(),
    metadata: { model, aspectRatio: config.aspectRatio },
  }
}

export async function generateImage(
  prompt: string,
  config: ImagenConfig = {}
): Promise<ImageGenerationResult> {
  if (!isGatewayConfigured()) {
    throw new Error("YRKA_GATEWAY_API_KEY is not set - image generation unavailable")
  }

  log.info("Generating image", {
    model: config.model || DEFAULT_CONFIG.model,
    promptLength: prompt.length,
    aspectRatio: config.aspectRatio ?? DEFAULT_CONFIG.aspectRatio,
  })

  try {
    const result = await generateOne(prompt, { ...DEFAULT_CONFIG, ...config })
    log.action("Image generated successfully", { prompt: prompt.slice(0, 50) })
    return result
  } catch (error: any) {
    log.error("Image generation failed", { error: error.message })
    throw error
  }
}

export async function generateImages(
  prompt: string,
  config: ImagenConfig = {}
): Promise<ImageGenerationResult[]> {
  if (!isGatewayConfigured()) {
    throw new Error("YRKA_GATEWAY_API_KEY is not set - image generation unavailable")
  }

  const merged = { ...DEFAULT_CONFIG, ...config }
  const count = merged.numberOfImages ?? 4

  log.info("Generating multiple images", { model: merged.model, count })

  try {
    const results: ImageGenerationResult[] = []
    for (let i = 0; i < count; i += 1) {
      results.push(await generateOne(prompt, merged))
    }
    log.action("Multiple images generated", { count: results.length })
    return results
  } catch (error: any) {
    log.error("Multi-image generation failed", { error: error.message })
    throw error
  }
}

export function isImagenConfigured(): boolean {
  return isGatewayConfigured()
}
