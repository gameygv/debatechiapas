// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAKE_WEBHOOK_URL = Deno.env.get('MAKE_WEBHOOK_URL') ?? '';
const MAKE_API_KEY = Deno.env.get('MAKE_API_KEY') ?? '';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { articleId } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: article } = await supabase.from('articles').select('*').eq('id', articleId).single();
    if (!article) throw new Error('Artículo no encontrado');

    const payload = {
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || '',
      featured_image: article.featured_image,
      url: `https://www.moymontes.com/noticias/${article.slug}`,
      published_at: article.published_at,
      timestamp: new Date().toISOString()
    };

    const res = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-make-apikey': MAKE_API_KEY },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Error en webhook de Make.com");

    await supabase.from('articles').update({ last_social_push: new Date().toISOString() }).eq('id', articleId);

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})
