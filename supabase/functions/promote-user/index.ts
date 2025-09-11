import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await authedClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });
  }

  const { data: profile, error: profileErr } = await authedClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profileErr || !profile?.role || !["Admin", "Coordenador"].includes(profile.role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return<dyad-write path="supabase/functions/promote-user/index.ts" description="Continuação do edge function para promover usuários">
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
  }

  const { targetUserId, newRole, reason } = body;
  if (!targetUserId || !newRole) {
    return new Response(JSON.stringify({ error: "Target user and new role required" }), { status: 400, headers: corsHeaders });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const { data: currentProfile, error: fetchErr } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", targetUserId)
      .single();

    if (fetchErr || !currentProfile) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: corsHeaders });
    }

    if (currentProfile.role === newRole) {
      return new Response(JSON.stringify({ error: "Role unchanged" }), { status: 400, headers: corsHeaders });
    }

    await adminClient.from("profiles").update({ role: newRole, updated_at: new Date().toISOString() }).eq("id", targetUserId);
    await adminClient.from("employees").update({ role: newRole }).eq("user_id", targetUserId);

    await adminClient.from("notifications").insert({
      title: "Role Atualizado",
      description: `Seu role foi alterado para ${newRole} por ${profile.role}. Motivo: ${reason || 'N/A'}`,
      user_id: targetUserId,
      type: "system",
    });

    await adminClient.from("user_actions_log").insert({
      action_type: "promote",
      actor_id: userData.user.id,
      target_user_id: targetUserId,
      details: { old_role: currentProfile.role, new_role: newRole, reason },
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});