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
})