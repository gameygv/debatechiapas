---
name: IA usa OpenRouter no OpenAI
description: Las edge functions de IA en debatechiapas usan OPENROUTER_API_KEY y openrouter.ai/api/v1, no api.openai.com directamente.
type: project
originSessionId: 765c6376-d5a2-4a95-9297-f1441ee954a7
---
Las edge functions `analyze-content`, `generate-article`, `rewrite-text` usan **OpenRouter** (no OpenAI directo).

**Why:** Gamey tiene cuenta de OpenRouter, no OpenAI directo. OpenRouter es compatible con la API de OpenAI cambiando URL y prefijando modelo.

**How to apply:**
- Env var: `OPENROUTER_API_KEY` (no `OPENAI_API_KEY`)
- URL: `https://openrouter.ai/api/v1/chat/completions`
- Modelos: `openai/gpt-4o-mini`, `openai/gpt-4o` (con prefijo `openai/`)
- `FAL_KEY` para generación de imágenes (fal.ai)
