import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Cache-Control": "no-store", "Content-Type": "application/json" }
  });
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Username sign-in is not configured." }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid username or password." }, 401);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return jsonResponse({ error: "Invalid username or password." }, 401);
  }
  const credentials = body as Record<string, unknown>;
  const username = typeof credentials.username === "string" ? credentials.username.trim().toLowerCase() : "";
  const password = typeof credentials.password === "string" ? credentials.password : "";
  if (!/^[a-z0-9._-]{3,32}$/.test(username) || password.length === 0 || password.length > 256) {
    return jsonResponse({ error: "Invalid username or password." }, 401);
  }

  const profileClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: profile, error: profileError } = await profileClient
    .from("profiles")
    .select("email")
    .eq("username", username)
    .neq("role", "pending")
    .maybeSingle();
  if (profileError) return jsonResponse({ error: "Username sign-in is temporarily unavailable." }, 503);

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data, error } = await authClient.auth.signInWithPassword({
    email: profile?.email || "invalid-username@invalid.local",
    password
  });
  if (!profile?.email || error || !data.session) {
    return jsonResponse({ error: "Invalid username or password." }, 401);
  }

  return jsonResponse({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });
});
