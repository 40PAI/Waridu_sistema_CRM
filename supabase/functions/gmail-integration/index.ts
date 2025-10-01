import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  payload: {
    headers: { name: string; value: string }[];
    body?: { data?: string };
  };
}

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

  // Verificar role (apenas Admin/Coordenador/Comercial podem integrar emails)
  const { data: profile, error: profileErr } = await authedClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profileErr || !profile?.role || !["Admin", "Coordenador", "Comercial"].includes(profile.role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }

  try {
    // Obter access token do usuário (via OAuth Google)
    const { data: session, error: sessionErr } = await authedClient.auth.getSession();
    if (sessionErr || !session?.session?.provider_token) {
      return new Response(JSON.stringify({ error: "No Google OAuth token" }), { status: 401, headers: corsHeaders });
    }

    const googleToken = session.session.provider_token;

    // Buscar mensagens recentes do Gmail (últimas 24h)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const query = `after:${Math.floor(yesterday.getTime() / 1000)}`;

    const gmailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${googleToken}`,
      },
    });

    if (!gmailResponse.ok) {
      throw new Error(`Gmail API error: ${gmailResponse.statusText}`);
    }

    const gmailData = await gmailResponse.json();
    const messages: GmailMessage[] = gmailData.messages || [];

    // Buscar clientes e projetos para matching
    const { data: clients } = await authedClient.from("clients").select("id, name, email");
    const { data: projects } = await authedClient.from("events").select("id, name, client_id").not("pipeline_status", "is", null);

    const clientEmails = new Map(clients?.map(c => [c.email?.toLowerCase(), c.id]) || []);
    const projectNames = new Map(projects?.map(p => [p.name?.toLowerCase(), p.id]) || []);

    // Processar mensagens
    for (const msg of messages.slice(0, 10)) { // Limitar a 10 para evitar rate limits
      const msgResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: {
          Authorization: `Bearer ${googleToken}`,
        },
      });

      if (!msgResponse.ok) continue;

      const fullMsg: GmailMessage = await msgResponse.json();

      const fromHeader = fullMsg.payload.headers.find(h => h.name === "From")?.value || "";
      const subject = fullMsg.payload.headers.find(h => h.name === "Subject")?.value || "";
      const date = fullMsg.payload.headers.find(h => h.name === "Date")?.value || new Date().toISOString();

      // Matching: Verificar se email ou assunto menciona cliente/projeto
      let clientId: string | undefined;
      let projectId: number | undefined;

      // Match por email do cliente
      const emailMatch = fromHeader.match(/<([^>]+)>/)?.[1] || fromHeader.split(" ")[0];
      if (emailMatch) {
        clientId = clientEmails.get(emailMatch.toLowerCase());
      }

      // Match por nome do projeto no assunto
      for (const [projName, projId] of projectNames) {
        if (subject.toLowerCase().includes(projName)) {
          projectId = projId;
          break;
        }
      }

      if (clientId || projectId) {
        // Inserir comunicação
        await authedClient.from("communications").insert({
          client_id: clientId,
          project_id: projectId,
          type: "email",
          subject,
          notes: fullMsg.snippet,
          user_id: userData.user.id,
          date: new Date(date).toISOString(),
        });
      }
    }

    return new Response(JSON.stringify({ success: true, processed: messages.length }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("Gmail integration error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});