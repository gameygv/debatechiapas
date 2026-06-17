---
name: Make.com webhook compartido
description: Todos los proyectos de Gamey usan el mismo escenario de Make.com "Integration Webhooks" para publicar en Facebook. Webhook URL y API key compartidos.
type: reference
originSessionId: 765c6376-d5a2-4a95-9297-f1441ee954a7
---
- **Escenario Make.com**: "Integration Webhooks" (ID 4533733, org 741332)
- **Webhook URL**: se obtiene desde el módulo Webhooks (5) del escenario — puede cambiar si se edita
- **API key**: token por proyecto en Make.com → API access
- **Publica en**: 7 páginas de Facebook (Create a Post with Photos)
- **Payload esperado**: `{ id, title, slug, excerpt, featured_image, url, published_at, timestamp }`
- **El módulo Facebook mapea**: `url` → `5.featured_image`, `Post caption` → `5.title`, `Ver artículo` → `5.url`
- **Aplica a**: debatechiapas, moymontes, y futuros proyectos

## Causa raíz de los atascos recurrentes ("se atora")
Cuando un módulo Facebook falla (error **324** imagen inválida / WebP, o **368** rate-limit), Make.com **detiene todo el escenario** ("Fix the error or clear the queue") y la cola de webhooks se acumula sin ejecutarse.
- **Por qué no se auto-recupera**: la edge function `process-social-queue` (en `main/index.ts`, Phase 3) solo llama a `/scenarios/{id}/start` cuando el **webhook responde HTTP 422/400**. Pero un escenario detenido **sigue respondiendo HTTP 200** (Make encola el payload aunque esté parado), así que la auto-reactivación nunca se dispara. Queda muerto hasta reactivar manualmente (UI o `POST /scenarios/4533733/start`).
- **Mitigación de 324**: subir imágenes como JPEG, no WebP (Facebook rechaza WebP). Ya implementado en el CMS (commit 3c7aa1e).
- **Fix durable DESPLEGADO 2026-06-16** (debatechiapas, commits `5e84c4a`+`7e368a4`; moymontes desplegado el mismo día en servidor): Fase 0 reactiva el escenario si `isActive:false`/`isPaused`; image-guard en Fase 3 rechaza imágenes inaccesibles/WebP marcando solo ese ítem como `failed`; se separó `MAKE_API_TOKEN` (916e551e, con scope de API real) del `MAKE_API_KEY` por-stack (que da 401). En moymontes se corrigió además el crontab que tenía el `Bearer` vacío. moymontes NO tiene repo local — el edge function vive solo en el servidor.
- **Cron**: crontab del sistema en supabase-poesis dispara la función cada 5 min; dosificación interna = 1 post / 15 min (`MIN_INTERVAL_MS`).
