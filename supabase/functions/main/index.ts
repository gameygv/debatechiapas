import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getSupabase() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {  const bytes = new Uint8Array(buffer);  let binary = "";  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);  return btoa(binary);}
function cleanSnippet(raw: string): string {
  return raw.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/<[^>]*>/g, '').trim()
}

// ==== GENERATE-ARTICLE ====
async function handle_generate_article(req: Request): Promise<Response> {
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
}

// ==== REWRITE-TEXT ====
async function handle_rewrite_text(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { text, type, lengthOption } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    const apiKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured')
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
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
}

// ==== ANALYZE-CONTENT ====
async function handle_analyze_content(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { title, content } = await req.json()

    if (!title || !content) {
      throw new Error('Title and content are required')
    }

    const apiKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured')
    }

    // 1. Obtener categorías disponibles de la DB
    const supabase = getSupabase()
    
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
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
}

// ==== GENERATE-IMAGE ====
async function handle_generate_image(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('[generate-image] Function called (Flux Schnell - Economic Mode)')
    
    const body = await req.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Valid prompt is required');
    }

    const falKey = Deno.env.get('FAL_KEY')
    if (!falKey) {
      throw new Error('FAL_KEY not configured. Please add it to Supabase Secrets.');
    }

    console.log('[generate-image] Calling Fal.ai API...')

    // Usamos 'flux/schnell' que es el modelo más rápido y económico
    const falResponse = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Optimizamos el prompt para el modelo Schnell
        prompt: prompt.trim() + ", news photography, realistic style, 4k",
        image_size: "landscape_4_3",
        safety_tolerance: "2",
        sync_mode: true
      })
    })

    const falData = await falResponse.json()
    
    if (!falResponse.ok) {
      console.error('[generate-image] Fal.ai Error:', falData)
      let errorMessage = falData.detail || falData.message || 'Error generating image with Fal.ai';
      throw new Error(errorMessage);
    }

    const imageUrl = falData.images?.[0]?.url;
    
    if (!imageUrl) {
      console.error('[generate-image] No image URL in response:', falData);
      throw new Error('No image URL received from Fal.ai');
    }

    console.log('[generate-image] Image generated at URL:', imageUrl);
    console.log('[generate-image] Downloading to convert to Base64...');

    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = arrayBufferToBase64(imageBuffer);
    
    const imageB64Full = `data:image/jpeg;base64,${imageBase64}`;

    console.log('[generate-image] Success! Returning Base64 image data')

    return new Response(
      JSON.stringify({ imageB64: imageB64Full }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[generate-image] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ==== CREATE-USER ====
async function handle_create_user(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("[create-user] Function invoked");

    // 1. Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Falta cabecera de autorización');
    }

    // 2. Extract JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // 3. Initialize admin client with Service Role Key
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
        throw new Error('Configuración del servidor incompleta (Service Role Key missing)');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey
    )

    // 4. Verify the JWT token and get user info using admin client
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("[create-user] Auth error:", userError);
      throw new Error('Token inválido o sesión expirada');
    }

    console.log("[create-user] Request by user:", user.email);

    // 5. Verify if the user is SuperUser in the profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
       console.error("[create-user] Profile fetch error:", profileError);
       throw new Error('Error verificando perfil de usuario');
    }

    if (profile?.role !== 'superuser') {
      console.warn("[create-user] Permission denied for:", user.email);
      throw new Error('Permiso denegado: Solo los SuperUsers pueden crear usuarios.')
    }

    // 6. Get new user data from request body
    const { email, password, fullName, role } = await req.json()

    if (!email || !password || !fullName) {
        throw new Error('Faltan datos requeridos (email, password, fullName)');
    }

    console.log("[create-user] Creating user:", email, "Role:", role);

    // 7. Create the user using admin client
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role || 'editor'
      }
    })

    if (error) {
        console.error("[create-user] Admin create error:", error);
        throw error;
    }

    console.log("[create-user] User created successfully:", data.user?.id);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("[create-user] Error:", error.message);
    // Return 200 with error details so the client can read the message
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ==== UPDATE-USER ====
async function handle_update_user(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("[update-user] Function invoked");

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Falta cabecera de autorización');
    }

    const token = authHeader.replace('Bearer ', '');
    
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
        throw new Error('Configuración del servidor incompleta');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey
    )

    // Verify caller is SuperUser
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("[update-user] Auth error:", userError);
      throw new Error('Token inválido o sesión expirada');
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superuser') {
      throw new Error('Permiso denegado: Solo los SuperUsers pueden editar usuarios.')
    }

    // Get update data
    const { userId, fullName, email, role, password } = await req.json()

    if (!userId || !fullName || !email) {
        throw new Error('Faltan datos requeridos');
    }

    console.log("[update-user] Updating user:", userId);

    // Update user metadata and email
    const updateData: any = {
      email,
      user_metadata: {
        full_name: fullName,
        role: role || 'editor'
      }
    };

    // Add password if provided
    if (password) {
      updateData.password = password;
      console.log("[update-user] Password will be updated");
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      updateData
    )

    if (error) {
        console.error("[update-user] Admin update error:", error);
        throw error;
    }

    // Update profile table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName,
        email,
        role: role || 'editor',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.error("[update-user] Profile update error:", profileError);
    }

    console.log("[update-user] User updated successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("[update-user] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ==== DELETE-USER ====
async function handle_delete_user(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("[delete-user] Function invoked");

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Falta cabecera de autorización');
    }

    const token = authHeader.replace('Bearer ', '');
    
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
        throw new Error('Configuración del servidor incompleta');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey
    )

    // Verify caller is SuperUser
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("[delete-user] Auth error:", userError);
      throw new Error('Token inválido o sesión expirada');
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superuser') {
      throw new Error('Permiso denegado: Solo los SuperUsers pueden eliminar usuarios.')
    }

    // Get user to delete
    const { userId } = await req.json()

    if (!userId) {
        throw new Error('userId es requerido');
    }

    // Prevent self-deletion
    if (userId === user.id) {
      throw new Error('No puedes eliminar tu propia cuenta');
    }

    console.log("[delete-user] Deleting user:", userId);

    // Delete user (this will cascade delete the profile via ON DELETE CASCADE)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
        console.error("[delete-user] Admin delete error:", error);
        throw error;
    }

    console.log("[delete-user] User deleted successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("[delete-user] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ==== PUBLISH-SOCIAL ====
// @ts-nocheck





const MAKE_WEBHOOK_URL = Deno.env.get('MAKE_WEBHOOK_URL') ?? '';
const MAKE_API_KEY = Deno.env.get('MAKE_API_KEY') ?? '';
const MAKE_SCENARIO_ID = '4533733';

async function handle_publish_social(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { articleId } = await req.json();
    const supabase = getSupabase();

    const { data: article } = await supabase.from('articles').select('id, title').eq('id', articleId).single();
    if (!article) throw new Error('Artículo no encontrado');

    // Check if already queued
    const { data: existing } = await supabase
      .from('social_queue')
      .select('id, status')
      .eq('article_id', articleId)
      .in('status', ['pending', 'processing'])
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ success: true, queued: true, message: 'Ya está en cola de publicación' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: insertError } = await supabase.from('social_queue').insert({
      article_id: articleId,
      status: 'pending',
      next_retry_at: new Date().toISOString()
    });

    if (insertError) throw new Error('Error al encolar: ' + insertError.message);

    return new Response(
      JSON.stringify({ success: true, queued: true, message: '"' + article.title + '" agregado a la cola' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// ==== SYSTEM-MAINTENANCE ====
// @ts-nocheck





async function handle_system_maintenance(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const { action } = await req.json();
  const supabase = getSupabase();

  const logs = [];

  try {
    if (action === 'clean_empty_files') {
      logs.push("Buscando registros corruptos o menores a 100 bytes...");

      const { data: badFiles, error } = await supabase
        .from('media_files')
        .select('*')
        .or('size_bytes.lt.100,size_bytes.is.null');

      if (error) throw error;

      if (!badFiles || badFiles.length === 0) {
        logs.push("No se encontraron registros de menos de 100 bytes.");
      } else {
        logs.push(`Se encontraron ${badFiles.length} registros para eliminar.`);

        for (const file of badFiles) {
          const path = `${file.folder}/${file.filename}`;
          await supabase.storage.from('media').remove([path]);
          await supabase.from('media_files').delete().eq('id', file.id);
          logs.push(`[Eliminado] ${file.filename} (${file.size_bytes || 0} bytes)`);
        }
        logs.push("Limpieza finalizada.");
      }
    } else {
      logs.push(`Acción desconocida: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, logs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message, logs }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// ==== RSS ====
// Utilidad para escapar caracteres XML
const escapeXml = (unsafe: string) => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '<';
      case '>': return '>';
      case '&': return '&';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
    return c;
  });
}

async function handle_rss(req: Request): Promise<Response> {
  try {
    const supabase = getSupabase()

    // Obtener últimos 20 artículos para el feed
    const { data: articles } = await supabase
      .from('articles')
      .select(`
        title, 
        slug, 
        excerpt, 
        content, 
        published_at, 
        featured_image,
        profiles:author_id (full_name),
        article_categories (
          categories (name)
        )
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20)

    const baseUrl = 'https://debatechiapas.com'
    const buildDate = new Date().toUTCString();

    let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>Debate Chiapas</title>
  <link>${baseUrl}</link>
  <description>Periodismo independiente desde Chiapas.</description>
  <language>es-mx</language>
  <lastBuildDate>${buildDate}</lastBuildDate>
  <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
`

    articles?.forEach(article => {
      const link = `${baseUrl}/noticias/${article.slug}`;
      const pubDate = new Date(article.published_at).toUTCString();
      const author = article.profiles?.full_name || 'Redacción';
      
      // Categoría principal
      const category = article.article_categories?.[0]?.categories?.name || 'Noticias';
      
      // Imagen
      let mediaTag = '';
      if (article.featured_image) {
        let imgUrl = article.featured_image;
        if (imgUrl.startsWith('/')) imgUrl = `${baseUrl}${imgUrl}`;
        mediaTag = `<media:content url="${imgUrl}" medium="image" />`;
      }

      rss += `
  <item>
    <title>${escapeXml(article.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <pubDate>${pubDate}</pubDate>
    <author>contacto@debatechiapas.com (${escapeXml(author)})</author>
    <category>${escapeXml(category)}</category>
    <description>${escapeXml(article.excerpt || '')}</description>
    ${mediaTag}
  </item>`
    })

    rss += `
</channel>
</rss>`

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800'
      }
    })

  } catch (error) {
    return new Response(String(error), { status: 500 })
  }
}

// ==== SITEMAP ====
async function handle_sitemap(req: Request): Promise<Response> {
  try {
    const supabase = getSupabase()

    // 1. Obtener Artículos Publicados
    const { data: articles } = await supabase
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1000)

    // 2. Obtener Categorías
    const { data: categories } = await supabase
      .from('categories')
      .select('slug')

    const baseUrl = 'https://debatechiapas.com'

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>`

    // Añadir Categorías
    categories?.forEach(cat => {
      xml += `
  <url>
    <loc>${baseUrl}/categoria/${cat.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
    })

    // Añadir Artículos
    articles?.forEach(article => {
      const date = article.updated_at || article.published_at || new Date().toISOString()
      xml += `
  <url>
    <loc>${baseUrl}/noticias/${article.slug}</loc>
    <lastmod>${new Date(date).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
    })

    xml += `
</urlset>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    })

  } catch (error) {
    return new Response(String(error), { status: 500 })
  }
}


// ==== SEARCH-NEWS ====
async function handle_search_news(req: Request): Promise<Response> {
  const { keyword } = await req.json()
  if (!keyword) throw new Error('Keyword is required')
  const encodedKw = encodeURIComponent(keyword)
  const rssUrl = `https://news.google.com/rss/search?q=${encodedKw}&hl=es-419&gl=MX&ceid=MX:es-419`
  const response = await fetch(rssUrl)
  if (!response.ok) throw new Error('RSS fetch failed')
  const xml = await response.text()
  const items: any[] = []
  const re = /<item>([\s\S]*?)<\/item>/g
  let m
  while ((m = re.exec(xml)) !== null && items.length < 10) {
    const c = m[1]
    const t = /<title>([\s\S]*?)<\/title>/.exec(c)
    const l = /<link>([\s\S]*?)<\/link>/.exec(c)
    const d = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(c)
    const s = /<source.*?>([\s\S]*?)<\/source>/.exec(c)
    const desc = /<description>([\s\S]*?)<\/description>/.exec(c)
    const snippet = desc ? cleanSnippet(desc[1]) : ''
    if (t && l) {
      const source = s ? s[1] : 'Google News'
      items.push({ title: cleanSnippet(t[1]).replace(' - ' + source, ''), url: l[1].trim(), snippet: snippet || cleanSnippet(t[1]), source, date: d ? d[1] : new Date().toISOString() })
    }
  }
  return new Response(JSON.stringify({ results: items }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}


// ==== PROCESS-SOCIAL-QUEUE ====
const MIN_INTERVAL_MS = 15 * 60 * 1000; // 10 minutes between sends

async function handle_process_social_queue(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = getSupabase();

    // === PHASE 0: Auto-recovery — restart Make.com scenario if it was halted ===
    // Make stops the whole scenario on a module error (e.g. Facebook 324 bad image,
    // 368 rate limit). The webhook keeps returning 200 (it just queues), so the
    // HTTP-422/400 restart in Phase 3 never fires. Detect a stopped scenario here
    // and restart it so the pipeline self-heals within one cron cycle (~5 min).
    try {
      const scRes = await fetch(
        'https://us1.make.com/api/v2/scenarios/' + MAKE_SCENARIO_ID,
        { headers: { 'Authorization': 'Token ' + MAKE_API_KEY } }
      );
      if (scRes.ok) {
        const scData = await scRes.json();
        const sc = scData.scenario || {};
        if (sc.isActive === false || sc.isPaused === true) {
          await fetch('https://us1.make.com/api/v2/scenarios/' + MAKE_SCENARIO_ID + '/start', {
            method: 'POST',
            headers: { 'Authorization': 'Token ' + MAKE_API_KEY, 'Content-Type': 'application/json' }
          });
          console.log('[social-queue] Make.com scenario was stopped — restart requested');
        }
      }
    } catch (e) {
      console.error('[social-queue] Phase 0 scenario check failed:', e.message);
    }

    // === PHASE 1: Verify 'sent' items via Make.com API ===
    const { data: sentItems } = await supabase
      .from('social_queue')
      .select('*, articles(id, title, slug)')
      .eq('status', 'sent')
      .lt('last_attempt_at', new Date(Date.now() - 2 * 60 * 1000).toISOString())
      .order('last_attempt_at', { ascending: true })
      .limit(5);

    if (sentItems && sentItems.length > 0) {
      let makeLogs: any[] = [];
      try {
        const logsRes = await fetch(
          'https://us1.make.com/api/v2/scenarios/' + MAKE_SCENARIO_ID + '/logs?pg%5Blimit%5D=20&pg%5BsortDir%5D=desc',
          { headers: { 'Authorization': 'Token ' + MAKE_API_KEY } }
        );
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          makeLogs = (logsData.scenarioLogs || []).filter((l: any) => l.eventType === 'EXECUTION_END');
        }
      } catch (e) {
        console.error('Error fetching Make.com logs:', e.message);
      }

      for (const item of sentItems) {
        const sentAt = new Date(item.last_attempt_at).getTime();
        const now = Date.now();
        const age = now - sentAt;

        const matchingExec = makeLogs.find((log: any) => {
          const logTime = new Date(log.timestamp).getTime();
          return logTime >= sentAt - 30000 && logTime <= sentAt + 180000;
        });

        if (matchingExec) {
          if (matchingExec.status === 1) {
            await supabase.from('social_queue').update({
              status: 'published',
              published_at: new Date().toISOString(),
              webhook_response: 'Make.com confirmed: ' + matchingExec.id
            }).eq('id', item.id);
            await supabase.from('articles').update({
              last_social_push: new Date().toISOString()
            }).eq('id', item.articles.id);
          } else {
            const errorMsg = matchingExec.error ? matchingExec.error.message : 'Make.com failed (status ' + matchingExec.status + ')';
            const newAttempts = item.attempts;
            const isFinal = newAttempts >= item.max_attempts;
            const backoffMinutes = Math.min(5 * Math.pow(3, newAttempts - 1), 360);
            const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000);
            await supabase.from('social_queue').update({
              status: isFinal ? 'failed' : 'pending',
              error_message: errorMsg.substring(0, 300),
              next_retry_at: isFinal ? null : nextRetry.toISOString()
            }).eq('id', item.id);
          }
        } else if (age > 15 * 60 * 1000) {
          const newAttempts = item.attempts;
          const isFinal = newAttempts >= item.max_attempts;
          const backoffMinutes = Math.min(5 * Math.pow(3, newAttempts - 1), 360);
          const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000);
          await supabase.from('social_queue').update({
            status: isFinal ? 'failed' : 'pending',
            error_message: 'No Make.com execution found after 15 min',
            next_retry_at: isFinal ? null : nextRetry.toISOString()
          }).eq('id', item.id);
        }
      }
    }

    // === PHASE 2: Dosification check ===
    const { data: lastPublished } = await supabase
      .from('social_queue')
      .select('published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)
      .single();

    if (lastPublished?.published_at) {
      const elapsed = Date.now() - new Date(lastPublished.published_at).getTime();
      if (elapsed < MIN_INTERVAL_MS) {
        return new Response(
          JSON.stringify({ processed: 0, reason: 'Esperando dosificacion (' + Math.ceil((MIN_INTERVAL_MS - elapsed) / 1000) + 's restantes)', verified: sentItems?.length || 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // === PHASE 3: Pick next pending item ===
    const { data: items } = await supabase
      .from('social_queue')
      .select('*, articles(id, title, slug, excerpt, featured_image, published_at)')
      .in('status', ['pending', 'processing'])
      .lte('next_retry_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(1);

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, reason: 'Cola vacia', verified: sentItems?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const item = items[0];
    const article = item.articles;

    if (!article) {
      await supabase.from('social_queue').update({
        status: 'failed', error_message: 'Articulo no encontrado',
        last_attempt_at: new Date().toISOString()
      }).eq('id', item.id);
      return new Response(JSON.stringify({ processed: 0, error: 'Articulo no encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Mark as processing
    await supabase.from('social_queue').update({
      status: 'processing', last_attempt_at: new Date().toISOString(),
      attempts: item.attempts + 1
    }).eq('id', item.id);

    // === Image guard: never send a broken/unsupported image to Make ===
    // Facebook rejects unreachable images and WebP (error 324), which halts the
    // whole scenario. Validate here and fail just this item instead of stalling all.
    const imgUrl: string = article.featured_image || '';
    let imgOk = false;
    let imgReason = 'sin imagen';
    if (imgUrl) {
      try {
        const imgRes = await fetch(imgUrl, { method: 'GET', headers: { 'Range': 'bytes=0-0' } });
        const ct = (imgRes.headers.get('content-type') || '').toLowerCase();
        if (!imgRes.ok) {
          imgReason = 'imagen inaccesible (HTTP ' + imgRes.status + ')';
        } else if (ct.includes('webp')) {
          imgReason = 'imagen WebP no soportada por Facebook (324)';
        } else if (!ct.startsWith('image/')) {
          imgReason = 'no es imagen (content-type: ' + ct + ')';
        } else {
          imgOk = true;
        }
      } catch (e) {
        imgReason = 'fallo al verificar imagen: ' + (e?.message || 'error');
      }
    }
    if (!imgOk) {
      await supabase.from('social_queue').update({
        status: 'failed',
        error_message: ('Imagen invalida, no enviado a Make: ' + imgReason).substring(0, 300),
        next_retry_at: null
      }).eq('id', item.id);
      return new Response(
        JSON.stringify({ processed: 0, skipped: 1, article: article.title, reason: imgReason }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send to Make.com
    const payload = {
      id: article.id, title: article.title, slug: article.slug,
      excerpt: article.excerpt || '', featured_image: article.featured_image,
      url: 'https://debatechiapas.com/noticias/' + article.slug,
      published_at: article.published_at, timestamp: new Date().toISOString()
    };

    const res = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-make-apikey': MAKE_API_KEY },
      body: JSON.stringify(payload)
    });

    const responseText = await res.text();

    if (res.ok) {
      // Mark as SENT — verification happens in Phase 1 on next cycle
      await supabase.from('social_queue').update({
        status: 'sent',
        webhook_response: responseText.substring(0, 500)
      }).eq('id', item.id);

      return new Response(
        JSON.stringify({ processed: 1, article: article.title, status: 'sent', note: 'Webhook accepted, will verify via Make.com API' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const newAttempts = item.attempts + 1;
      const isFinal = newAttempts >= item.max_attempts;
      const backoffMinutes = Math.min(5 * Math.pow(3, newAttempts - 1), 360);
      const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000);

      if (res.status === 422 || res.status === 400) {
        try {
          await fetch('https://us1.make.com/api/v2/scenarios/' + MAKE_SCENARIO_ID + '/start', {
            method: 'POST',
            headers: { 'Authorization': 'Token ' + MAKE_API_KEY, 'Content-Type': 'application/json' }
          });
        } catch (_) {}
      }

      await supabase.from('social_queue').update({
        status: isFinal ? 'failed' : 'pending',
        error_message: 'HTTP ' + res.status + ': ' + responseText.substring(0, 300),
        webhook_response: responseText.substring(0, 500),
        next_retry_at: isFinal ? null : nextRetry.toISOString()
      }).eq('id', item.id);

      return new Response(
        JSON.stringify({ processed: 0, article: article.title, error: 'HTTP ' + res.status,
          attempt: newAttempts, maxAttempts: item.max_attempts,
          nextRetry: isFinal ? null : nextRetry.toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// ==== ROUTER ====
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const url = new URL(req.url)
  const func = url.pathname.split('/').filter(Boolean)[0]
  try {
    switch (func) {
      case 'search-news': return await handle_search_news(req)
      case 'generate-article': return await handle_generate_article(req)
      case 'rewrite-text': return await handle_rewrite_text(req)
      case 'analyze-content': return await handle_analyze_content(req)
      case 'generate-image': return await handle_generate_image(req)
      case 'create-user': return await handle_create_user(req)
      case 'update-user': return await handle_update_user(req)
      case 'delete-user': return await handle_delete_user(req)
      case 'publish-social': return await handle_publish_social(req)
      case 'process-social-queue': return await handle_process_social_queue(req)
      case 'system-maintenance': return await handle_system_maintenance(req)
      case 'rss': return await handle_rss(req)
      case 'sitemap': return await handle_sitemap(req)
      default: return new Response('Edge Functions ready', { status: 200 })
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
