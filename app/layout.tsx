import React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Analytics } from "@vercel/analytics/react"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Komorebi | Autonomous AI Interface — Navin Hill",
  description: "A multimodal AI agent interface for creative exploration, research, and autonomous task execution",
  generator: "v0.app",
  manifest: "https://media.navinhill.com/brand/site.webmanifest",
  icons: {
    icon: [
      {
        url: "https://media.navinhill.com/brand/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "https://media.navinhill.com/brand/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "https://media.navinhill.com/brand/favicon-dark-32x32.png",
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "https://media.navinhill.com/brand/favicon-dark-16x16.png",
        sizes: "16x16",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    shortcut: "https://media.navinhill.com/brand/favicon.ico",
    apple: [
      {
        url: "https://media.navinhill.com/brand/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "Komorebi | Autonomous AI Interface — Navin Hill",
    description: "A multimodal AI agent interface for creative exploration, research, and autonomous task execution",
    siteName: "Navin Hill",
    images: [
      {
        url: "https://media.navinhill.com/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "Navin Hill",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Komorebi | Autonomous AI Interface — Navin Hill",
    description: "A multimodal AI agent interface for creative exploration, research, and autonomous task execution",
    images: ["https://media.navinhill.com/brand/og-image.png"],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased overflow-hidden">
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
