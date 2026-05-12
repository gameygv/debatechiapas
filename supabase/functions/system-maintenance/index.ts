// @ts-nocheck
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

  const { action } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

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
})
