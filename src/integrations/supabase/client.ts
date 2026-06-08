import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://supabase-api.hostingwarlock.com";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4NTc0ODUxLCJleHAiOjIwOTQxNTA4NTF9.5U1zBZQRF82uT_TOFfxH4G8eNOOAogPfpAwLdT2UoDQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);