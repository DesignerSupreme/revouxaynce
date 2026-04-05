import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface InvoiceComment {
  id: string;
  invoice_id: string;
  author: string;
  body: string;
  created_at: string;
}

export function useInvoiceComments(invoiceId: string | null) {
  const [comments, setComments] = useState<InvoiceComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!invoiceId) { setComments([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("invoice_comments")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: true });
    if (!error && data) setComments(data);
    setLoading(false);
  }, [invoiceId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const addComment = async (body: string, author = "admin") => {
    if (!invoiceId || !body.trim()) return;
    const { error } = await supabase.from("invoice_comments").insert({
      invoice_id: invoiceId,
      author,
      body: body.trim(),
    });
    if (error) throw new Error(error.message);
    await fetchComments();
  };

  const deleteComment = async (id: string) => {
    const { error } = await supabase.from("invoice_comments").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await fetchComments();
  };

  return { comments, loading, addComment, deleteComment, fetchComments };
}
