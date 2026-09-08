import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Mapper, Row } from "@/lib/dbMappers";

/** Untyped view of the generated client so one hook can serve every table. */
const db = supabase as unknown as SupabaseClient;

export interface Collection<T> {
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Drop-in replacement for useLocalStorage: exposes a [items, setItems] pair
 * but persists every change to Postgres by diffing the previous snapshot.
 */
export function useSupabaseCollection<T extends { id: string }>(mapper: Mapper<T>): Collection<T> {
  const [items, setLocal] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const snapshot = useRef<T[]>([]);

  const refresh = useCallback(async () => {
    const { data, error } = await db.from(mapper.table).select("*").order(mapper.orderBy, { ascending: true });
    if (error) {
      console.error(`[${mapper.table}] load failed`, error.message);
      setLoading(false);
      return;
    }
    const mapped = ((data ?? []) as Row[]).map(mapper.fromRow);
    snapshot.current = mapped;
    setLocal(mapped);
    setLoading(false);
  }, [mapper]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sync = useCallback(
    async (prev: T[], next: T[]) => {
      const prevById = new Map(prev.map((p) => [p.id, p]));
      const nextById = new Map(next.map((n) => [n.id, n]));

      const inserts = next.filter((n) => !prevById.has(n.id)).map(mapper.toRow);
      const updates = next.filter((n) => {
        const before = prevById.get(n.id);
        return before && JSON.stringify(before) !== JSON.stringify(n);
      });
      const deletes = prev.filter((p) => !nextById.has(p.id)).map((p) => p.id);

      try {
        if (inserts.length) {
          const { error } = await db.from(mapper.table).upsert(inserts);
          if (error) throw error;
        }
        for (const item of updates) {
          const { error } = await db.from(mapper.table).update(mapper.toRow(item)).eq("id", item.id);
          if (error) throw error;
        }
        if (deletes.length) {
          const { error } = await db.from(mapper.table).delete().in("id", deletes);
          if (error) throw error;
        }
      } catch (err) {
        console.error(`[${mapper.table}] save failed`, err);
        void refresh();
      }
    },
    [mapper, refresh],
  );

  const setItems = useCallback<React.Dispatch<React.SetStateAction<T[]>>>(
    (action) => {
      const prev = snapshot.current;
      const next = typeof action === "function" ? (action as (p: T[]) => T[])(prev) : action;
      snapshot.current = next;
      setLocal(next);
      void sync(prev, next);
    },
    [sync],
  );

  return { items, setItems, loading, refresh };
}
