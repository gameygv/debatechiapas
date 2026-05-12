import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { text, type, lengthOption } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    let systemInstruction = "";
    let userInstruction = "";
    let temperature = 0.7; // Default

    // Contexto Político Actualizado
    const contextRules = `
    CONTEXTO POLÍTICO OBLIGATORIO:
    1. Claudia Sheinbaum Pardo es la Presidenta de México.
    2. Andrés Manuel López Obrador (AMLO) es Expresidente.
    3. Gustavo Petro es Presidente de Colombia.
    `;

    if (type === 'title') {
      // Aumentamos temperatura para más creatividad en títulos
      temperature = 0.9;
      systemInstruction = `Eres un editor jefe de un periódico digital de alto impacto. Tu especialidad es crear titulares "gancho" (clicky pero veraces) que inviten a leer.
      ${contextRules}
      
      REGLAS PARA TÍTULOS:
      1. NO repitas el título original con sinónimos simples. CAMBIA la estructura.
      2. Usa verbos activos y fuertes al inicio.
      3. Elimina palabras vacías o redundantes.
      4. Busca el ángulo más polémico o interesante de la noticia.
      5. Máximo 12 palabras.
      6. Formato "Sentence case" (Solo primera letra mayúscula).
      `;
      
      userInstruction = `Reinventa totalmente este titular para hacerlo viral y periodístico. Dame la mejor opción posible.
      Titular original aburrido: "${text}"`;

    } else if (type === 'prompt') {
      systemInstruction = `Eres un experto ingeniero de prompts para generación de imágenes con IA (Flux Pro 1.1).
      ${contextRules}
      
      OBJETIVO: Crear una imagen fotoperiodística realista.
      IDIOMA DE SALIDA: Inglés (English).
      
      ESTRATEGIA PARA PERSONAJES PÚBLICOS (CRÍTICO):
      - Si se menciona a alguien famoso (Sheinbaum, AMLO, Petro, Trump, etc), DEBES describir sus rasgos físicos clave para ayudar a la IA, no solo poner su nombre.
      - Ejemplo: "Claudia Sheinbaum, woman with ponytail hair, glasses, mexican presidential sash..."
      - Ejemplo: "Gustavo Petro, man with glasses, thinning hair, colombian president suit..."
      
      ESTRUCTURA DEL PROMPT:
      [Sujeto principal + Descripción física detallada] + [Acción/Contexto] + [Iluminación/Atmósfera] + "RAW photo, 8k, hyperrealistic, press photography".
      `;
      
      userInstruction = `Genera un prompt visual detallado y mejorado para Flux Pro basado en este texto: "${text}"`;

    } else {
      // Body rewrite (Mantenemos lógica anterior para el cuerpo)
      let lengthInstruction = "Mantén una longitud similar.";
      switch (lengthOption) {
        case 'shorter-50': lengthInstruction = "Reduce el texto un 50%. Sé muy conciso."; break;
        case 'shorter-25': lengthInstruction = "Reduce el texto un 25%."; break;
        case 'longer-25': lengthInstruction = "Expande un 25% añadiendo contexto explicativo."; break;
        case 'longer-50': lengthInstruction = "Expande un 50% con mayor detalle narrativo y antecedentes."; break;
      }

      systemInstruction = `Eres un periodista senior. Reescribes noticias para darles un tono profesional, objetivo y fluido.
      ${contextRules}
      ${lengthInstruction}
      `;
      
      userInstruction = `Reescribe el siguiente texto. Mejora la narrativa.
      Texto: "${text}"`;
    }

    // OpenAI API Request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', 
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userInstruction }
        ],
        temperature: temperature,
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('OpenAI Error:', data)
      throw new Error(data.error?.message || 'Failed to rewrite text');
    }

    let rewrittenText = data.choices[0].message.content.trim();
    rewrittenText = rewrittenText.replace(/^"|"$/g, ''); 

    return new Response(
      JSON.stringify({ rewrittenText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})