---
type: architecture_context
project: "debatechiapas"
status: active
tech_stack:
  language: TypeScript 5.5
  framework: React 18 + Vite 5
  ui: Tailwind CSS 3 + shadcn/ui (Radix)
  editor: TipTap 2
  database: PostgreSQL 15 (Supabase self-hosted)
  auth: Supabase GoTrue
  storage: Supabase Storage
  deploy: Vercel
  mobile: Capacitor (Android + iOS)
external_dependencies:
  - Supabase self-hosted (supabase.poesis.net)
  - OpenAI API (GPT-4o via OpenRouter)
  - Fal.ai (Flux Schnell)
  - Make.com (webhooks)
  - Google News RSS
  - Vercel (hosting + SSR)
  - Cloudflare (DNS)
users:
  - lector
  - editor
  - superuser
governed_by:
  - governance/guardrails.md
---

# System Context: debatechiapas

## Overview

CMS de publicación periodística con asistencia de IA. Los lectores consumen contenido vía web/móvil, los editores crean artículos con herramientas IA, los superusers administran la plataforma completa.

## Context Diagram

```
┌──────────┐       ┌──────────────────┐       ┌─────────────────┐
│ Lectores │──────►│  Debate Chiapas  │◄──────│ OpenAI (GPT-4o) │
│          │ HTTP  │  (React SPA)     │ API   │ Fal.ai (imgs)   │
└──────────┘       │                  │       │ Make.com (social)│
                   │  Vercel (host)   │       │ Google News RSS  │
┌──────────┐       │                  │       └─────────────────┘
│ Editores │──────►│  Supabase        │
│ Admins   │ Auth  │  (DB+Auth+Store) │
└──────────┘       └──────────────────┘
```

## External Interfaces

| System | Direction | Protocol | Description |
|--------|-----------|----------|-------------|
| Supabase DB | Bidireccional | PostgreSQL (interno Docker) | Almacén de artículos, usuarios, medios, anuncios |
| Supabase Auth | Bidireccional | HTTP/JWT | Autenticación email/password, gestión de sesiones |
| Supabase Storage | Bidireccional | HTTP | Almacenamiento de imágenes y medios (bucket media) |
| OpenAI/OpenRouter | Saliente | HTTPS REST | Generación y reescritura de artículos (GPT-4o) |
| Fal.ai | Saliente | HTTPS REST | Generación de imágenes (Flux Schnell) |
| Make.com | Saliente | HTTPS Webhook | Distribución a redes sociales |
| Google News | Saliente | HTTPS RSS | Búsqueda de noticias fuente |
| Vercel | Hosting | HTTPS | Hosting SPA + SSR selectivo para crawlers sociales |
| Cloudflare | DNS | DNS | Resolución debatechiapas.dockerapps.top |
