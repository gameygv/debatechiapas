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
