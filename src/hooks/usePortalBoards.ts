import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortalClient } from "@/lib/portalClient";
import type { Concept, InspirationItem, InspirationBoard } from "@/types";

export interface PortalBoard extends InspirationBoard {
  items: InspirationItem[];
}

/** Shared concepts and mood boards a client may see, read-only. */
export function usePortalBoards(token: string | null) {
  const db = useMemo(() => (token ? createPortalClient(token) : null), [token]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [boards, setBoards] = useState<PortalBoard[]>([]);
  const [loading, setLoading] = useState(Boolean(token));

  const refresh = useCallback(async () => {
    if (!db) { setLoading(false); return; }
    setLoading(true);
    const [{ data: conceptRows }, { data: boardRows }] = await Promise.all([
      db.from("concepts").select("*").not("shared_at", "is", null).order("position"),
      db.from("inspiration_boards").select("*, inspiration_items(*)").not("shared_at", "is", null),
    ]);
    setConcepts((conceptRows ?? []) as Concept[]);
    setBoards(
      (boardRows ?? []).map((b) => {
        const { inspiration_items, ...board } = b as typeof b & { inspiration_items: InspirationItem[] };
        return {
          ...(board as unknown as InspirationBoard),
          items: [...(inspiration_items ?? [])].sort((a, z) => a.position - z.position),
        };
      }),
    );
    setLoading(false);
  }, [db]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { db, concepts, boards, loading, refresh };
}
