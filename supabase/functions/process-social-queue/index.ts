import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAKE_WEBHOOK_URL = Deno.env.get('MAKE_WEBHOOK_URL') ?? '';
const MAKE_API_KEY = Deno.env.get('MAKE_API_KEY') ?? '';
const MIN_INTERVAL_MS = 10 * 60 * 1000; // 10 minutos entre envíos

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar último envío exitoso para dosificar
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
          JSON.stringify({
            processed: 0,
            reason: `Esperando dosificación (${Math.ceil((MIN_INTERVAL_MS - elapsed) / 1000)}s restantes)`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Tomar el siguiente item pendiente (el más antiguo cuyo retry ya pasó)
    const { data: items } = await supabase
      .from('social_queue')
      .select('*, articles(id, title, slug, excerpt, featured_image, published_at)')
      .in('status', ['pending', 'processing'])
      .lte('next_retry_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(1);

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, reason: 'Cola vacía' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const item = items[0];
    const article = item.articles;

    if (!article) {
      await supabase.from('social_queue').update({
        status: 'failed',
        error_message: 'Artículo no encontrado',
        last_attempt_at: new Date().toISOString()
      }).eq('id', item.id);

      return new Response(
        JSON.stringify({ processed: 0, error: 'Artículo no encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Marcar como procesando
    await supabase.from('social_queue').update({
      status: 'processing',
      last_attempt_at: new Date().toISOString(),
      attempts: item.attempts + 1
    }).eq('id', item.id);

    // Enviar a Make.com
    const payload = {
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || '',
      featured_image: article.featured_image,
      url: `https://debatechiapas.com/noticias/${article.slug}`,
      published_at: article.published_at,
      timestamp: new Date().toISOString()
    };

    const res = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-make-apikey': MAKE_API_KEY },
      body: JSON.stringify(payload)
    });

    const responseText = await res.text();

    if (res.ok) {
      // Éxito
      await supabase.from('social_queue').update({
        status: 'published',
        published_at: new Date().toISOString(),
        webhook_response: responseText.substring(0, 500)
      }).eq('id', item.id);

      // Actualizar last_social_push en el artículo
      await supabase.from('articles').update({
        last_social_push: new Date().toISOString()
      }).eq('id', article.id);

      return new Response(
        JSON.stringify({ processed: 1, article: article.title, status: 'published' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Error — calcular backoff exponencial
      const newAttempts = item.attempts + 1;
      const isFinal = newAttempts >= item.max_attempts;
      // Backoff: 5min, 15min, 45min, 2h, 6h
      const backoffMinutes = Math.min(5 * Math.pow(3, newAttempts - 1), 360);
      const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000);

      await supabase.from('social_queue').update({
        status: isFinal ? 'failed' : 'pending',
        error_message: `HTTP ${res.status}: ${responseText.substring(0, 300)}`,
        webhook_response: responseText.substring(0, 500),
        next_retry_at: isFinal ? null : nextRetry.toISOString()
      }).eq('id', item.id);

      return new Response(
        JSON.stringify({
          processed: 0,
          article: article.title,
          error: `HTTP ${res.status}`,
          attempt: newAttempts,
          maxAttempts: item.max_attempts,
          nextRetry: isFinal ? null : nextRetry.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
