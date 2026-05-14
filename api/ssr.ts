import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Configuración de Supabase self-hosted
const SUPABASE_URL = "https://debatechiapas.supabase.poesis.net";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4NTc0ODUxLCJleHAiOjIwOTQxNTA4NTF9.5U1zBZQRF82uT_TOFfxH4G8eNOOAogPfpAwLdT2UoDQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Obtener slug de los parámetros de la URL (inyectados por el rewrite de vercel.json)
    const { slug } = req.query;
    
    // Valores por defecto (Fallback seguro)
    let title = "Debate Chiapas";
    let description = "Debate y opinión desde Chiapas para el mundo.";
    let image = "https://debatechiapas.dockerapps.top/debate-og.jpg";
    const canonicalUrl = `https://debatechiapas.dockerapps.top/noticias/${slug}`;

    if (slug && typeof slug === 'string') {
      // Consultar artículo en Supabase
      const { data: article, error } = await supabase
        .from('articles')
        .select('title, excerpt, featured_image')
        .eq('slug', slug)
        .eq('status', 'published') // Solo artículos publicados
        .maybeSingle();

      if (!error && article) {
        title = article.title || title;
        description = article.excerpt || description;
        if (article.featured_image) {
          // Asegurar URL absoluta
          image = article.featured_image.startsWith('http') 
            ? article.featured_image 
            : `https://debatechiapas.dockerapps.top${article.featured_image}`;
        }
      }
    }

    // Limpieza básica de strings para evitar romper el HTML
    const clean = (str: string) => str.replace(/"/g, '&quot;').replace(/</g, '<').replace(/>/g, '>');

    // Generar HTML mínimo exclusivo para el scraper
    const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <title>${clean(title)}</title>
    <meta name="description" content="${clean(description)}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${clean(title)}" />
    <meta property="og:description" content="${clean(description)}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:site_name" content="Debate Chiapas" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${clean(title)}" />
    <meta name="twitter:description" content="${clean(description)}" />
    <meta name="twitter:image" content="${image}" />
  </head>
  <body>
    <h1>${clean(title)}</h1>
    <p>${clean(description)}</p>
    <img src="${image}" alt="${clean(title)}" style="max-width:100%;" />
  </body>
</html>`;

    // Enviar respuesta HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Cachear respuesta corta para agilidad en redes sociales (1 hora)
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
    return res.status(200).send(html);

  } catch (error) {
    console.error('[SSR Error]', error);
    // En caso de error catastrófico, devolver HTML genérico para no dar error 500 a Facebook
    const fallbackHtml = `<!doctype html><html><head><meta property="og:title" content="Debate Chiapas" /></head><body>Error</body></html>`;
    return res.status(200).send(fallbackHtml);
  }
}