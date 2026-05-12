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
})