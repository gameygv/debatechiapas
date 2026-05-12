import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { title, content } = await req.json()

    if (!title || !content) {
      throw new Error('Title and content are required')
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    // 1. Obtener categorías disponibles de la DB
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const { data: categoriesData } = await supabase.from('categories').select('name');
    const availableCategories = categoriesData?.map(c => c.name).join(', ') || "Chiapas, Nacional, Internacional, Cultura, Política";

    const cleanContent = content.replace(/<[^>]*>?/gm, '').substring(0, 5000);

    const systemPrompt = `Eres un editor jefe experto en SEO y taxonomía para un periódico mexicano. Respondes siempre en JSON.`;
    
    const userPrompt = `
    Analiza esta noticia:
    Título: ${title}
    Contenido: ${cleanContent}
    
    Categorías del sistema: [${availableCategories}]

    TAREA:
    1. Genera un 'excerpt' (resumen) atractivo de máximo 160 caracteres.
    2. Genera 'tags' (etiquetas) relevantes (máximo 5).
    3. Selecciona las 'categories' más apropiadas de la lista dada.
       - Si menciona Chiapas o sus municipios -> Incluye "Chiapas".
       - Si menciona al Gobierno Federal o temas de México -> "Nacional".
       - Si es de otros países -> "Internacional".

    Responde con este JSON exacto:
    {
      "excerpt": "texto...",
      "tags": ["tag1", "tag2"],
      "categories": ["Cat1", "Cat2"]
    }`;

    // OpenAI API Request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Mini es suficiente y rápido para análisis
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('OpenAI API Error:', data);
      throw new Error(data.error?.message || 'Failed to analyze content')
    }

    const jsonResponse = JSON.parse(data.choices[0].message.content);

    return new Response(
      JSON.stringify(jsonResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[analyze-content] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})