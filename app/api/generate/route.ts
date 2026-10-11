import { generateText } from "ai"
import { google } from "@/lib/api/google-ai-sdk"
import { generateImage } from "@/lib/api/imagen"
import { DEFAULT_CHAT_MODEL, DEFAULT_CODE_MODEL } from "@/lib/api/models"

export const maxDuration = 120

export async function POST(req: Request) {
  const { prompt, type } = await req.json()

  // Image generation runs through the gateway's /images/generations endpoint
  // (free FLUX/SDXL models) via lib/api/imagen.
  if (type === "image") {
    const imagePrompt = `Create a detailed, artistic image based on this description: ${prompt}`
    const image = await generateImage(imagePrompt)
    const mediaType = image.url.match(/^data:([^;]+);/)?.[1] ?? "image/jpeg"

    return Response.json({
      text: `Generated image for: ${prompt}`,
      images: [
        {
          base64: image.url.replace(/^data:[^;]+;base64,/, ""),
          mediaType,
        },
      ],
    })
  }

  // For text generation
  const result = await generateText({
    model: google(type === "code" ? DEFAULT_CODE_MODEL : DEFAULT_CHAT_MODEL),
    prompt,
    maxOutputTokens: 4096,
  })

  return Response.json({
    text: result.text,
    usage: result.usage,
  })
}
