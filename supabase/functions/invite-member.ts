import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type InviteBody = {
  email: string;
  roleId?: string;
  roleName?: string; // Este campo é importante
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized: missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: InviteBody | null = null;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const email = body?.email?.trim();
  const roleId = body?.roleId?.trim();
  // Prioriza roleName do body, mas tem um fallback
  const roleName = (body?.roleName ?? "Técnico").trim(); 

  if (!email) {
    return new Response(JSON.stringify({ error: "Email é obrigatório" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Cliente autenticado (anon key) para ler role do usuário chamador
  const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await authedClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized: invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verificar role do chamador (apenas Admin e Coordenador podem convidar)
  const { data: profile, error: profileErr } = await authedClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profileErr || !profile?.role || !["Admin", "Coordenador"].includes(profile.role)) {
    return new Response(JSON.stringify({ error: "Forbidden: sem permissão para convidar" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Cliente com service role para chamar o endpoint admin
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Passa os user_metadata com roleName
  const { data: inviteRes, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { 
      role: roleName, // Isso é importante para o trigger handle_new_user
      role_id: roleId ?? null 
    },
  });

  if (inviteErr) {
    return new Response(JSON.stringify({ error: inviteErr.message || "Falha ao enviar convite" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Ajustar/garantir o perfil com role desejada (id já deve existir via trigger)
  const newUserId = inviteRes?.user?.id;
  if (newUserId) {
    // Upsert para garantir que o perfil exista com a role correta
    // Mesmo que o trigger falhe ou não tenha rodado
    await adminClient.from("profiles").upsert(
      { 
        id: newUserId, 
        role: roleName, // Define explicitamente a role
        updated_at: new Date().toISOString() 
      },
      { onConflict: "id" },
    );
  }

  return new Response(JSON.stringify({ success: true, userId: newUserId }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});