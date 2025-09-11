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
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
  }

  const { email, roleId, roleName, employeeId } = body;
  if (!email || !roleName) {
    return new Response(JSON.stringify({ error: "Email and role required" }), { status: 400, headers: corsHeaders });
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const { data: inviteRes, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { role: roleName, role_id: roleId, employee_id: employeeId },
    });

    if (inviteErr) {
      return new Response(JSON.stringify({ error: inviteErr.message }), { status: 500, headers: corsHeaders });
    }

    const newUserId = inviteRes?.user?.id;
    if (newUserId) {
      await adminClient.from("profiles").upsert({
        id: newUserId,
        role: roleName,
        updated_at: new Date().toISOString(),
      });

      if (employeeId) {
        await adminClient.from("employees").update({ user_id: newUserId }).eq("id", employeeId);
      }

      await adminClient.from("user_actions_log").insert({
        action_type: "invite",
        actor_id: userData.user.id,
        target_user_id: newUserId,
        target_email: email,
        details: { role: roleName, employee_id: employeeId },
      });
    }

    return new Response(JSON.stringify({ success: true, userId: newUserId }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});