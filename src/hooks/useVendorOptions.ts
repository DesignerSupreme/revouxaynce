import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { VendorOption, VendorOptionItem } from "@/types";

export interface VendorOptionWithItems extends VendorOption {
  items: VendorOptionItem[];
}

/** Shortlisted vendors presented to a client, per event. */
export function useVendorOptions(eventId: string | null) {
  const [options, setOptions] = useState<VendorOptionWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!eventId) { setOptions([]); setLoading(false); return; }
    setLoading(true); setError(null);
    const { data, error: err } = await supabase
      .from("vendor_options")
      .select("*, vendor_option_items(*)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });
    if (err) setError(err.message);
    const mapped = (data ?? []).map((o) => {
      const { vendor_option_items, ...option } = o as typeof o & { vendor_option_items: VendorOptionItem[] };
      const items = [...(vendor_option_items ?? [])].sort((a, z) => a.position - z.position);
      return { ...(option as unknown as VendorOption), items };
    });
    setOptions(mapped);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { void refetch(); }, [refetch]);

  const createOption = useCallback(async (title: string, category?: string, conceptId?: string | null) => {
    if (!eventId) throw new Error("No event selected");
    const { data, error: err } = await supabase.from("vendor_options")
      .insert({ event_id: eventId, title, category: category ?? null, concept_id: conceptId ?? null })
      .select().single();
    if (err) throw new Error(err.message);
    await refetch();
    return data as VendorOption;
  }, [eventId, refetch]);

  const updateOption = useCallback(async (id: string, patch: Partial<VendorOption>) => {
    const { error: err } = await supabase.from("vendor_options").update(patch).eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  const deleteOption = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("vendor_options").delete().eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  const shareOption = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("vendor_options")
      .update({ shared_at: new Date().toISOString(), status: "Shared" }).eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  const unshareOption = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("vendor_options")
      .update({ shared_at: null, status: "Draft" }).eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  const addItem = useCallback(async (optionId: string, item: Partial<VendorOptionItem> & { vendor_name: string }) => {
    const option = options.find(o => o.id === optionId);
    const position = option ? option.items.length : 0;
    const { error: err } = await supabase.from("vendor_option_items")
      .insert({ ...item, option_id: optionId, position });
    if (err) throw new Error(err.message);
    await refetch();
  }, [options, refetch]);

  const updateItem = useCallback(async (id: string, patch: Partial<VendorOptionItem>) => {
    const { error: err } = await supabase.from("vendor_option_items").update(patch).eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  const deleteItem = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("vendor_option_items").delete().eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  return { options, loading, error, refetch, createOption, updateOption, deleteOption, shareOption, unshareOption, addItem, updateItem, deleteItem };
}
