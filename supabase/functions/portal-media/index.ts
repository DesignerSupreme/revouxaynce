import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const token = req.headers.get("x-portal-token");
  if (!token || !token.trim()) return json({ error: "Missing portal token" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: client, error: clientErr } = await admin
    .from("clients")
    .select("id, portal_token_expires_at")
    .eq("portal_token", token.trim())
    .maybeSingle();

  if (clientErr) return json({ error: "Lookup failed" }, 500);
  if (!client) return json({ error: "Invalid portal token" }, 401);
  if (client.portal_token_expires_at && new Date(client.portal_token_expires_at) <= new Date()) {
    return json({ error: "Portal link has expired" }, 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const paths = (body as { paths?: unknown })?.paths;
  if (!Array.isArray(paths) || paths.length === 0 || paths.length > 200) {
    return json({ error: "paths must be an array of 1 to 200 strings" }, 400);
  }
  if (!paths.every((p) => typeof p === "string" && p.length > 0 && p.length < 512)) {
    return json({ error: "paths must contain non-empty strings" }, 400);
  }

  // Authorisation by path prefix: every path must start with this client's id.
  const owned = (paths as string[]).filter((p) => p.split("/")[0] === client.id);
  if (owned.length === 0) return json({ urls: {} });

  const { data: signed, error: signErr } = await admin
    .storage.from("event-media")
    .createSignedUrls(owned, 3600);

  if (signErr) return json({ error: "Could not sign media" }, 500);

  const urls: Record<string, string> = {};
  for (const row of signed ?? []) {
    if (row.path && row.signedUrl) urls[row.path] = row.signedUrl;
  }

  return json({ urls });
});
