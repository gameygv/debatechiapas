---
name: Supabase en supabase.poesis.net
description: Todas las instancias Supabase de Gamey están en supabase.poesis.net (IP 23.189.168.140), NO en EasyPanel VPS. Buscar contenedores Supabase ahí.
type: feedback
originSessionId: 765c6376-d5a2-4a95-9297-f1441ee954a7
---
Supabase ya NO está self-hosted en EasyPanel (162.251.123.4). Todas las instancias Supabase de todos los proyectos de Gamey están en un servidor dedicado: **supabase.poesis.net** (IP 23.189.168.140).

**Why:** Gamey migró Supabase fuera de EasyPanel a un servidor dedicado. Ha corregido esto múltiples veces — no volver a buscar en EasyPanel.

**How to apply:**
- Para listar stacks Supabase: `ssh` al servidor `supabase.poesis.net` (buscar alias SSH correspondiente)
- Para env vars de edge functions: `docker exec` en los contenedores de ese servidor
- Para migrations: conectar al DB container en ese servidor
- Aplica a TODOS los proyectos de Gamey, no solo debatechiapas
