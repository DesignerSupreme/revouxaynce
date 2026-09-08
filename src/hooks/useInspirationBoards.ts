import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { compressImage, mediaPath } from "@/lib/imageCompress";
import type { InspirationBoard, InspirationItem } from "@/types";

export interface BoardWithItems extends InspirationBoard {
  items: InspirationItem[];
}

/** Inspiration boards and their images for one event. */
export function useInspirationBoards(eventId: string | null, clientId: string | null) {
  const [boards, setBoards] = useState<BoardWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!eventId) { setBoards([]); setLoading(false); return; }
    setLoading(true); setError(null);
    const { data, error: err } = await supabase
      .from("inspiration_boards")
      .select("*, inspiration_items(*)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });
    if (err) setError(err.message);
    const mapped = (data ?? []).map((b) => {
      const { inspiration_items, ...board } = b as typeof b & { inspiration_items: InspirationItem[] };
      const items = [...(inspiration_items ?? [])].sort((a, z) => a.position - z.position);
      return { ...(board as unknown as InspirationBoard), items };
    });
    setBoards(mapped);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { void refetch(); }, [refetch]);

  const createBoard = useCallback(async (title: string, description?: string, conceptId?: string | null) => {
    if (!eventId) throw new Error("No event selected");
    const { data, error: err } = await supabase.from("inspiration_boards")
      .insert({ event_id: eventId, title, description: description ?? null, concept_id: conceptId ?? null })
      .select().single();
    if (err) throw new Error(err.message);
    await refetch();
    return data as InspirationBoard;
  }, [eventId, refetch]);

  const updateBoard = useCallback(async (id: string, patch: Partial<InspirationBoard>) => {
    const { error: err } = await supabase.from("inspiration_boards").update(patch).eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  const deleteBoard = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("inspiration_boards").delete().eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  const shareBoard = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("inspiration_boards")
      .update({ shared_at: new Date().toISOString(), status: "Shared" }).eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  const unshareBoard = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("inspiration_boards")
      .update({ shared_at: null, status: "Draft" }).eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  /** Compresses each file, uploads it privately, then records the row. */
  const uploadImages = useCallback(async (
    boardId: string,
    files: File[],
    onProgress?: (done: number, total: number) => void,
  ) => {
    if (!eventId || !clientId) throw new Error("Event has no client attached");
    const board = boards.find(b => b.id === boardId);
    let position = board ? board.items.length : 0;
    let done = 0;

    for (const file of files) {
      const blob = await compressImage(file);
      const path = mediaPath(clientId, eventId, boardId);
      const { error: upErr } = await supabase.storage.from("event-media")
        .upload(path, blob, { contentType: "image/webp", upsert: false });
      if (upErr) throw new Error(upErr.message);

      const { error: rowErr } = await supabase.from("inspiration_items")
        .insert({ board_id: boardId, storage_path: path, position });
      if (rowErr) throw new Error(rowErr.message);

      position += 1;
      done += 1;
      onProgress?.(done, files.length);
    }
    await refetch();
  }, [eventId, clientId, boards, refetch]);

  const updateItem = useCallback(async (id: string, patch: Partial<InspirationItem>) => {
    const { error: err } = await supabase.from("inspiration_items").update(patch).eq("id", id);
    if (err) throw new Error(err.message);
    await refetch();
  }, [refetch]);

  const deleteItem = useCallback(async (id: string, storagePath: string) => {
    const { error: err } = await supabase.from("inspiration_items").delete().eq("id", id);
    if (err) throw new Error(err.message);
    await supabase.storage.from("event-media").remove([storagePath]);
    await refetch();
  }, [refetch]);

  const reorderItems = useCallback(async (orderedIds: string[]) => {
    await Promise.all(orderedIds.map((id, i) =>
      supabase.from("inspiration_items").update({ position: i }).eq("id", id)));
    await refetch();
  }, [refetch]);

  return { boards, loading, error, refetch, createBoard, updateBoard, deleteBoard, shareBoard, unshareBoard, uploadImages, updateItem, deleteItem, reorderItems };
}
