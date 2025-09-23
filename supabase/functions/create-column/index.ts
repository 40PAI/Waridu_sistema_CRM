import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Client as PostgresClient } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_DB_URL = Deno.env.get("SUPABASE_DB_URL")!;

type CreateColumnBody = {
  table: string;
  column: string;
  column_type?: string; // optional SQL type, e.g., 'text[]' or 'text'
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth header required
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized: missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse body
  let body: CreateColumnBody | null = null;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const table = (body?.table || "").trim();
  const column = (body?.column || "").trim();
  const column_type = (body?.column_type || "").trim() || "text";

  // basic validation
  if (!table || !column) {
    return new Response(JSON.stringify({ error: "table and column are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate identifier: only allow letters, numbers and underscore, cannot start with digit
  const identRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  if (!identRegex.test(table) || !identRegex.test(column)) {
    return new Response(JSON.stringify({ error: "Invalid table or column name" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify caller is authenticated and has Admin role
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

  const { data: profile, error: profileErr } = await authedClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profileErr || !profile?.role || profile.role !== "Admin") {
    return new Response(JSON.stringify({ error: "Forbidden: only Admin can create columns" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Only Admin reached here. Connect to Postgres using SUPABASE_DB_URL and run ALTER TABLE.
  // Be careful to avoid SQL injection: table and column have been validated above.

  // Build SQL. Use IF NOT EXISTS to be idempotent.
  const safeColumnType = column_type.replace(/[^a-zA-Z0-9_\[\]\s\(\),]/g, ""); // very basic sanitize
  const sql = `ALTER TABLE public.${table} ADD COLUMN IF NOT EXISTS "${column}" ${safeColumnType};`;

  let client: PostgresClient | null = null;
  try {
    client = new PostgresClient(SUPABASE_DB_URL);
    await client.connect();
    await client.queryArray(sql);
    await client.end();
    return new Response(JSON.stringify({ success: true, table, column, column_type: safeColumnType }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    try {
      if (client) await client.end();
    } catch {}
    console.error("create-column error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});