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
})