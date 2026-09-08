import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Concept } from "@/types";

/** Concepts for one event: create, rename, reorder, share and unshare. */
export function useConcepts(eventId: string | null) {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!eventId) { setConcepts([]); setLoading(false); return; }
    setLoading(true); setError(null);
    const { data, error: err } = await supabase
      .from("concepts").select("*").eq("event_id", eventId)
      .order("position", { ascending: true }).order("created_at", { ascending: true });
    if (err) setError(err.message);
    setConcepts((data ?? []) as Concept[]);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { void refetch(); }, [refetch]);

  const createConcept = useCallback(async (name: string, summary?: string) => {
    if (!eventId) throw new Error("No event selected");
    const position = concepts.length;
    const { data, error: err } = await supabase
      .from("concepts").insert({ event_id: eventId, name, summary: summary ?? null, position })
      .select().single();
    if (err) throw new Error(err.message);
    await refetch();
    return data as Concept;
  }, [eventId, concepts.length, refetch]);

  const updateConcept = useCallback(async (id: string, patch: Partial<Concept>) => {
    const { error: err } = await supabase.from("concepts").update(patch).eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  const reorderConcepts = useCallback(async (orderedIds: string[]) => {
    await Promise.all(orderedIds.map((id, i) =>
      supabase.from("concepts").update({ position: i }).eq("id", id)));
    await refetch();
  }, [refetch]);

  const shareConcept = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("concepts")
      .update({ shared_at: new Date().toISOString(), status: "Shared" }).eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  const unshareConcept = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("concepts")
      .update({ shared_at: null, status: "Draft" }).eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  const deleteConcept = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("concepts").delete().eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  /** Attach or detach any module record to a concept. Null means general to the event. */
  const attachToConcept = useCallback(async (
    table: "inspiration_boards" | "budgets" | "vendor_options",
    recordId: string,
    conceptId: string | null,
  ) => {
    const { error: err } = await supabase.from(table).update({ concept_id: conceptId }).eq("id", recordId);
    if (err) throw new Error(err.message);
  }, []);

  return { concepts, loading, error, refetch, createConcept, updateConcept, reorderConcepts, shareConcept, unshareConcept, deleteConcept, attachToConcept };
}
