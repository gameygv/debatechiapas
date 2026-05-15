import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let { title, snippet, url } = await req.json()

    if (!title && !url) {
      throw new Error('Se requiere un Título o una URL');
    }

    const apiKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured')
    }

    console.log('[generate-article] Processing with OpenAI:', title || url)
    
    let fullContext = snippet || '';
    
    // Scraping logic (se mantiene igual, es efectiva)
    if (url) {
      try {
        console.log('[generate-article] Scraping URL:', url);
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);
          
          if (!title) {
            title = $('h1').first().text().trim() || $('title').text().trim() || 'Noticia detectada';
          }

          $('script, style, nav, footer, header, .ad, .advertisement, .social-share, form, iframe').remove();
          let scrapedText = '';
          $('p').each((i, el) => {
            const text = $(el).text().trim();
            if (text.length > 50) scrapedText += text + '\n\n';
          });

          if (scrapedText.length > 300) {
            fullContext = scrapedText.substring(0, 15000); 
          }
        }
      } catch (scrapeError) {
        console.error('[generate-article] Scraping failed:', scrapeError);
      }
    }

    if (!title) title = "Noticia Generada";

    const systemPrompt = `Eres un periodista experto de "El Divo de Chiapas".
    
    CONTEXTO POLÍTICO OBLIGATORIO (MÉXICO 2024-2030):
    1. Claudia Sheinbaum es la Presidenta.
    2. Andrés Manuel López Obrador (AMLO) es EXPRESIDENTE.
    3. Jamás pongas a políticos en situaciones de desastres (sismos, huracanes) a menos que la noticia diga explícitamente que están visitando la zona.
    
    TAREA: Generar un objeto JSON con el contenido de la noticia y un prompt de imagen.
    `;

    const userPrompt = `
    INFORMACIÓN FUENTE:
    Título: ${title}
    Contexto: ${fullContext}
    
    INSTRUCCIONES:
    1. 'content': Redacta la noticia completa en HTML (usa <h2>, <p>). Tono profesional, objetivo, periodismo mexicano. Mínimo 400 palabras.
    2. 'suggestedTitle': Un título atractivo, corto y en "Sentence case".
    3. 'imagePrompt': Un prompt para generar una imagen realista (Flux/Midjourney).
       - IDIOMA PROMPT: Inglés (English).
       - Si la noticia es sobre un evento genérico (clima, sismo, economía), describe la escena visual, NO uses políticos.
       - Si la noticia es política, usa los cargos correctos (Claudia = President, AMLO = Former President).
       - Estilo: "Journalistic photography, 8k, realistic lighting".

    Responde SOLO con el JSON.
    `;

    // OpenAI API Request
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('OpenAI Error:', data)
      throw new Error(data.error?.message || 'Failed to generate article')
    }

    const jsonResponse = JSON.parse(data.choices[0].message.content);

    return new Response(
      JSON.stringify(jsonResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[generate-article] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})