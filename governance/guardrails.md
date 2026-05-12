---
type: guardrails
version: "1.0.0"
---

# Guardrails: debatechiapas

## Guardrails Activos

### Code Quality

| ID | Level | Guardrail | Verification | Derived from |
|----|-------|-----------|--------------|--------------|
| GR-01 | MUST | TypeScript en todo el código fuente | `tsc --noEmit` pasa sin errores | Convención del proyecto |
| GR-02 | MUST | ESLint sin errores antes de commit | `npm run lint` exit 0 | eslint.config.js |
| GR-03 | MUST | Build de producción exitoso | `npm run build` exit 0 | CI gate |
| GR-04 | SHOULD | Imágenes en WebP, max 1080px | Verificar en MediaUploader | RF-03 |

### Security

| ID | Level | Guardrail | Verification | Derived from |
|----|-------|-----------|--------------|--------------|
| GR-05 | MUST | HTML sanitizado con DOMPurify antes de render | Grep por `dangerouslySetInnerHTML` → siempre con DOMPurify | OWASP XSS |
| GR-06 | MUST | Anon key en cliente, service_role solo en edge functions | Grep por SERVICE_ROLE en src/ → 0 resultados | Supabase best practice |
| GR-07 | MUST | CORS headers en todas las edge functions | Verificar OPTIONS handler en cada función | RF-05 |
| GR-08 | MUST | Operaciones admin verifican rol vía JWT | Edge functions validan role claim | RF-06 |

### Architecture

| ID | Level | Guardrail | Verification | Derived from |
|----|-------|-----------|--------------|--------------|
| GR-09 | MUST | Supabase self-hosted, nunca Supabase Cloud | Verificar URL en client.ts → supabase.poesis.net | RF-08 |
| GR-10 | MUST | DDL con usuario supabase_admin, nunca postgres | Migraciones usan -U supabase_admin | Gotcha VPS |
| GR-11 | SHOULD | Edge functions no hardcodean URLs de dominio | Grep por URLs hardcodeadas en supabase/functions/ | Portabilidad |
| GR-12 | MUST | Deploy a Vercel vía `vercel --prod`, dominio en dockerapps.top | Verificar en Vercel dashboard | RF-08 |
