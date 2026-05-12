---
type: architecture_design
project: "debatechiapas"
status: active
layers:
  - name: presentation
    description: SPA React con routing client-side
    modules: [pages, components, layout]
  - name: data
    description: Supabase client + React Query para cache y fetching
    modules: [supabase-client, react-query-hooks]
  - name: edge-functions
    description: 12 funciones Deno en Supabase Edge Runtime
    modules: [generate-article, generate-image, rewrite-text, analyze-content, publish-social, search-news, rss, sitemap, create-user, delete-user, update-user, system-maintenance]
  - name: infrastructure
    description: Supabase self-hosted (DB + Auth + Storage + Kong) + Vercel
    modules: [supabase-stack, vercel-deploy, cloudflare-dns]
---

# System Design: debatechiapas

## Architecture Overview

SPA React desplegada en Vercel que consume una API Supabase self-hosted. El frontend maneja routing, rendering y estado. Las operaciones pesadas (IA, scraping, distribución social) se ejecutan en Edge Functions de Supabase. SSR selectivo en Vercel solo para crawlers de redes sociales.

## Components

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| SPA Frontend | UI pública y panel admin | React 18, Vite, Tailwind, shadcn/ui |
| Editor WYSIWYG | Creación de contenido rich-text | TipTap 2 (StarterKit + extensiones) |
| Supabase Client | Acceso a DB, Auth y Storage desde cliente | @supabase/supabase-js |
| React Query | Cache y sincronización de datos | @tanstack/react-query |
| Edge Functions | Lógica de negocio server-side (IA, distribución) | Deno + Supabase Edge Runtime |
| Kong API Gateway | Routing, auth, CORS para la API Supabase | Kong 2.8 (declarativo) |
| PostgreSQL | Almacenamiento persistente | Supabase Postgres 15.8 |
| GoTrue | Autenticación y gestión de usuarios | Supabase Auth v2.184 |
| Storage API | Almacenamiento de archivos/medios | Supabase Storage v1.33 |
| SSR Handler | OG tags dinámicos para crawlers sociales | Vercel Serverless (api/ssr.ts) |

## Key Decisions

- **SPA sobre SSR**: El contenido es dinámico y el SEO se resuelve con SSR selectivo solo para crawlers
- **Supabase self-hosted sobre Cloud**: Control total de datos, sin límites de uso, hosting en VPS propio
- **Edge Functions sobre API custom**: Aprovecha la infraestructura Supabase existente, sin servidor adicional
- **WebP automático**: Todas las imágenes se convierten en cliente antes de subir, optimizando ancho de banda
