import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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
    const imageBase64 = encode(imageBuffer);
    
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
})