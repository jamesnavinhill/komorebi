# Komorebi

Komorebi is an autonomous agent interface built with Next.js. It combines a reactive UI, scheduled task execution, and media generation. All AI runs through the Yrka Agency gateway (OpenAI-compatible, free models); video generation (Veo) is BYOK via a Google API key. State persists in Neon Postgres and media on the local filesystem.

Deployed at https://komorebi.navinhill.com

## Core Capabilities (From Current Code)

- Agent chat with AI SDK orchestration and streaming (ToolLoopAgent over the gateway).
- Text/chat/code-gen through gateway free models (GLM 5.3 Flash default).
- Morning Read research task with MCP web search (you_search primary, tavily fallback).
- Image generation via the gateway's /images/generations (FLUX/SDXL/Dreamshaper).
- Video generation with Veo (BYOK: requires GOOGLE_API_KEY).
- Memory and knowledge capture in Postgres.
- Gallery persistence with local media storage under `public/`.
- Scheduling via cron expressions and a local cron trigger.
- Sandbox project storage and LLM-backed execution APIs.
- Browser snapshot task using Playwright.

## Quickstart

Install dependencies.

```bash
pnpm install
```

Configure environment.

```bash
cp .env.local.example .env.local
```

Required variables:

- `YRKA_GATEWAY_API_KEY` — Agency gateway master key (all AI)
- `DATABASE_URL` — Neon Postgres
- `CRON_SECRET` — Bearer token for /api/cron

Optional:

- `YRKA_MCP_GATEWAY_TOKEN` — MCP toolbox token (falls back to the gateway key)
- `GOOGLE_API_KEY` — BYOK, enables Veo video generation only

Apply database schema (core + sandbox tables).

```bash
pnpm run db:migrate
```

Seed default tasks.

```bash
pnpm run db:seed:morning-read
pnpm run db:seed:media-task
pnpm run db:seed:motion-art
pnpm run db:seed:morning-ritual
```

Run the dev server.

```bash
pnpm run dev
```

## Validation Commands

```bash
pnpm run lint
pnpm run test
pnpm run typecheck
pnpm run build
```

Notes:

- `pnpm run build` now runs `pnpm run typecheck` first.
- Typecheck covers the full repository (`.ts`/`.tsx`), including `scripts/`.

## Documentation

- `docs/ARCHITECTURE.MD`
- `docs/API.MD`
- `docs/CONFIG.MD`
- `docs/DATABASE.MD`
- `docs/DEVELOPMENT.MD`
- `docs/MEDIA_GENERATION.MD`
- `docs/MODELS.MD`
- `docs/COMPONENTS.MD`
- `docs/SCHEDULING.MD`
- `docs/STORAGE.MD`

## License

MIT
