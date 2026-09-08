import { useCallback, useRef, useState } from "react";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portal-media`;

/**
 * Batch signed-URL lookup for portal images, cached in memory for the session.
 * One call per board render, never one per image.
 */
export function usePortalMedia(token: string | null) {
  const cache = useRef<Record<string, string>>({});
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (paths: string[]) => {
    if (!token) return;
    const missing = paths.filter(p => p && !cache.current[p]);
    if (missing.length === 0) { setUrls({ ...cache.current }); return; }

    setLoading(true); setError(null);
    try {
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-portal-token": token,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ paths: missing }),
      });
      if (!res.ok) throw new Error("Image did not load. Reload the page to try again.");
      const json = (await res.json()) as { urls?: Record<string, string> };
      cache.current = { ...cache.current, ...(json.urls ?? {}) };
      setUrls({ ...cache.current });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image did not load. Reload the page to try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const urlFor = useCallback((path: string | null) => (path ? cache.current[path] ?? null : null), []);

  return { urls, urlFor, load, loading, error };
}
