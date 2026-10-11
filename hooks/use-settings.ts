"use client"

import { useState, useEffect, useCallback } from "react"

const SETTINGS_KEY = "agent_zero_settings"

export type ChatModelId =
    | "cf-jami-zai-org-glm-5-3-flash"
    | "cf-jami-zai-org-glm-5-3"
    | "cf-jami-moonshotai-kimi-k2-6"
    | "cf-jami-qwen-qwen3-30b-a3b-fp8"
    | "ne-gpt-oss-120b"
    | "or-free"

export type ImageModelId =
    | "cf-img-flux-1-schnell"
    | "cf-img-flux-2-dev"
    | "cf-img-sdxl-lightning"
    | "cf-img-dreamshaper-8-lcm"

export type VideoModelId =
    | "veo-2.0-generate-001"
    | "veo-3.0-fast-generate-001"
    | "veo-3.0-generate-001"
    | "veo-3.1-fast-generate-preview"
    | "veo-3.1-generate-preview"

export interface AgentSettings {
    model: ChatModelId
    imageModel: ImageModelId
    imageAspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9"
    videoModel: VideoModelId
    videoAspectRatio: "16:9" | "9:16"
    videoResolution: "1080p" | "720p"
    videoDurationSeconds: 4 | 6 | 8
    videoIncludeAudio: boolean
    temperature: number
    schedulesEnabled: boolean
}

const defaultSettings: AgentSettings = {
    model: "cf-jami-zai-org-glm-5-3-flash",
    imageModel: "cf-img-flux-1-schnell",
    imageAspectRatio: "9:16",
    videoModel: "veo-3.0-fast-generate-001",
    videoAspectRatio: "16:9",
    videoResolution: "1080p",
    videoDurationSeconds: 6,
    videoIncludeAudio: false,
    temperature: 0.7,
    schedulesEnabled: true,
}

export function useSettings() {
    const [settings, setSettingsState] = useState<AgentSettings>(defaultSettings)
    const [loaded, setLoaded] = useState(false)

    // Load settings from localStorage on mount
    useEffect(() => {
        if (typeof window === "undefined") return

        try {
            const stored = localStorage.getItem(SETTINGS_KEY)
            const parsed = stored ? JSON.parse(stored) : {}

            const allowedVideoModels = new Set<VideoModelId>([
                "veo-2.0-generate-001",
                "veo-3.0-fast-generate-001",
                "veo-3.0-generate-001",
                "veo-3.1-fast-generate-preview",
                "veo-3.1-generate-preview",
            ])
            const allowedVideoResolutions = new Set<AgentSettings["videoResolution"]>([
                "1080p",
                "720p",
            ])
            const allowedVideoDurations = new Set<AgentSettings["videoDurationSeconds"]>([
                4,
                6,
                8
            ])

            setSettingsState({
                ...defaultSettings,
                ...parsed,
                videoModel: allowedVideoModels.has(parsed.videoModel)
                    ? parsed.videoModel
                    : defaultSettings.videoModel,
                videoResolution: allowedVideoResolutions.has(parsed.videoResolution)
                    ? parsed.videoResolution
                    : defaultSettings.videoResolution,
                videoDurationSeconds: allowedVideoDurations.has(parsed.videoDurationSeconds)
                    ? parsed.videoDurationSeconds
                    : defaultSettings.videoDurationSeconds,
                videoIncludeAudio: typeof parsed.videoIncludeAudio === "boolean"
                    ? parsed.videoIncludeAudio
                    : defaultSettings.videoIncludeAudio,
            })
        } catch (error) {
            console.warn("Failed to load settings:", error)
        }
        setLoaded(true)
    }, [])

    // Persist settings whenever they change
    const persist = useCallback((newSettings: AgentSettings) => {
        if (typeof window === "undefined") return

        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
        } catch (error) {
            console.warn("Failed to save settings:", error)
        }
    }, [])

    const setSettings = useCallback((updates: Partial<AgentSettings>) => {
        setSettingsState((prev) => {
            const next = { ...prev, ...updates }
            persist(next)
            return next
        })
    }, [persist])

    const setModel = useCallback((model: ChatModelId) => {
        setSettings({ model })
    }, [setSettings])

    const setImageModel = useCallback((imageModel: ImageModelId) => {
        setSettings({ imageModel })
    }, [setSettings])

    const setImageAspectRatio = useCallback((imageAspectRatio: AgentSettings["imageAspectRatio"]) => {
        setSettings({ imageAspectRatio })
    }, [setSettings])

    const setVideoModel = useCallback((videoModel: VideoModelId) => {
        setSettings({ videoModel })
    }, [setSettings])

    const setVideoAspectRatio = useCallback((videoAspectRatio: AgentSettings["videoAspectRatio"]) => {
        setSettings({ videoAspectRatio })
    }, [setSettings])

    const setVideoResolution = useCallback((videoResolution: AgentSettings["videoResolution"]) => {
        setSettings({ videoResolution })
    }, [setSettings])

    const setVideoDurationSeconds = useCallback((videoDurationSeconds: AgentSettings["videoDurationSeconds"]) => {
        setSettings({ videoDurationSeconds })
    }, [setSettings])

    const setVideoIncludeAudio = useCallback((videoIncludeAudio: AgentSettings["videoIncludeAudio"]) => {
        setSettings({ videoIncludeAudio })
    }, [setSettings])

    const setTemperature = useCallback((temperature: number) => {
        setSettings({ temperature })
    }, [setSettings])

    const setSchedulesEnabled = useCallback((schedulesEnabled: boolean) => {
        setSettings({ schedulesEnabled })
    }, [setSettings])

    const resetToDefaults = useCallback(() => {
        setSettingsState(defaultSettings)
        persist(defaultSettings)
    }, [persist])

    return {
        settings,
        loaded,
        setSettings,
        setModel,
        setImageModel,
        setImageAspectRatio,
        setVideoModel,
        setVideoAspectRatio,
        setVideoResolution,
        setVideoDurationSeconds,
        setVideoIncludeAudio,
        setTemperature,
        setSchedulesEnabled,
        resetToDefaults,
    }
}
