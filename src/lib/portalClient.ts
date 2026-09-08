import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const PORTAL_TOKEN_KEY = "revouxaynce_portal_token";

/**
 * Reads the portal token from `?t=` (storing it for the session) or from
 * sessionStorage on subsequent navigations. The query parameter is stripped
 * from the address bar so the link is not left sitting in browser history UI.
 */
export function readPortalToken(): string | null {
  try {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("t");
    if (fromUrl && fromUrl.trim()) {
      const token = fromUrl.trim();
      sessionStorage.setItem(PORTAL_TOKEN_KEY, token);
      url.searchParams.delete("t");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      return token;
    }
    return sessionStorage.getItem(PORTAL_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearPortalToken(): void {
  try {
    sessionStorage.removeItem(PORTAL_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * An anonymous client that sends the portal token on every request.
 * The token-checking security definer functions in the database read this header.
 */
export function createPortalClient(token: string): SupabaseClient<Database> {
  return createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { "x-portal-token": token } },
    },
  );
}

export function portalUrlFor(token: string): string {
  return `${window.location.origin}/portal?t=${token}`;
}
