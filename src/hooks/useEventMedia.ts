import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Batch signed URLs for planner-side private event media, cached in memory. */
export function useEventMedia(paths: string[]) {
  const cache = useRef<Record<string, string>>({});
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = paths.slice().sort().join("|");

  const load = useCallback(async (wanted: string[]) => {
    const missing = wanted.filter((p) => p && !cache.current[p]);
    if (missing.length === 0) {
      setUrls({ ...cache.current });
      return;
    }
    const { data } = await supabase.storage.from("event-media").createSignedUrls(missing, 60 * 60);
    for (const row of data ?? []) {
      if (row.path && row.signedUrl) cache.current[row.path] = row.signedUrl;
    }
    setUrls({ ...cache.current });
  }, []);

  useEffect(() => {
    void load(key ? key.split("|") : []);
  }, [key, load]);

  return urls;
}
