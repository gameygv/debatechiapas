# PRD: debatechiapas

## Problem

Los medios de comunicación locales en Chiapas necesitan herramientas ágiles para publicar contenido de opinión y debate. La generación manual de artículos, clasificación y distribución social consume tiempo valioso que debería dedicarse al periodismo.

## Goals

- Publicar artículos de opinión y debate con flujo editorial completo (borrador → publicación → distribución)
- Reducir el tiempo de publicación con asistencia de IA (generación, reescritura, clasificación)
- Maximizar alcance vía distribución automática a redes sociales y SEO optimizado
- Monetizar con sistema de anuncios publicitarios programables

---

## Requirements

### RF-01: Gestión de artículos

CMS completo con editor WYSIWYG (TipTap), soporte para imágenes redimensionables, videos embebidos, YouTube. Estados: borrador, publicado, programado. Clasificación por secciones y tags.

### RF-02: Asistencia IA editorial

Generación de artículos desde noticias (Google News scraping + GPT-4o), reescritura de títulos y cuerpos con control de longitud, generación de imágenes con Fal.ai, análisis automático de contenido (excerpt SEO, tags, categorías).

### RF-03: Biblioteca de medios

Upload con conversión automática a WebP (85% calidad, max 1080px). Gestión por tipo (imágenes, videos, IA, anuncios). Limpieza de archivos huérfanos.

### RF-04: Sistema de anuncios

CRUD de banners publicitarios con programación por fecha (inicio/fin), métricas de rendimiento (vistas/clicks), inserción automática en vistas públicas.

### RF-05: Distribución social

Publicación a redes sociales vía webhook Make.com. SSR selectivo en Vercel para crawlers (Facebook, WhatsApp, Twitter, Google) con OG tags dinámicos. RSS feed y sitemap XML automáticos.

### RF-06: Gestión de usuarios

Roles superuser y editor. CRUD de usuarios (solo superuser). Autenticación vía Supabase Auth (email/password).

### RF-07: Vista pública

Home con grid de noticias, ticker de últimas noticias, banners, anuncios. Detalle de artículo con botones de compartir (WhatsApp, Facebook, X). Búsqueda por título. Navegación por secciones.

### RF-08: Infraestructura self-hosted

Supabase self-hosted en VPS dedicado (supabase.poesis.net). Deploy en Vercel. Dominio en debatechiapas.dockerapps.top.
