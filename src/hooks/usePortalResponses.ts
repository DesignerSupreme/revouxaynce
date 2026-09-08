import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { PortalResponse, PortalResponseAction, PortalSubjectType } from "@/types";

type Client = SupabaseClient<Database>;

/**
 * Client responses. Reads work on both sides; the insert is the only write a
 * client ever makes. A database trigger derives the record's status from it.
 */
export function usePortalResponses(opts: {
  client?: Client;
  eventId?: string | null;
  subject?: { type: PortalSubjectType; id: string } | null;
}) {
  const db = opts.client ?? supabase;
  const { eventId, subject } = opts;
  const [responses, setResponses] = useState<PortalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!eventId && !subject) { setResponses([]); setLoading(false); return; }
    setLoading(true); setError(null);
    let query = db.from("portal_responses").select("*").order("created_at", { ascending: false });
    if (subject) query = query.eq("subject_type", subject.type).eq("subject_id", subject.id);
    else if (eventId) query = query.eq("event_id", eventId);
    const { data, error: err } = await query;
    if (err) setError(err.message);
    setResponses((data ?? []) as PortalResponse[]);
    setLoading(false);
  }, [db, eventId, subject?.type, subject?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void refetch(); }, [refetch]);

  const respond = useCallback(async (input: {
    subject_type: PortalSubjectType;
    subject_id: string;
    action: PortalResponseAction;
    body?: string | null;
    event_id?: string | null;
  }) => {
    const { error: err } = await db.from("portal_responses").insert({
      // client_id is stamped from the portal token by a database trigger.
      client_id: "00000000-0000-0000-0000-000000000000",
      event_id: input.event_id ?? eventId ?? null,
      subject_type: input.subject_type,
      subject_id: input.subject_id,
      action: input.action,
      body: input.body ?? null,
    });
    if (err) throw new Error(err.message);
    await refetch();
  }, [db, eventId, refetch]);

  return { responses, loading, error, refetch, respond };
}
