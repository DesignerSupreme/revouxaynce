import React, { useEffect, useState } from "react";
import { Heart, Check, MessageSquare } from "lucide-react";
import type { Event } from "@/types";
import { usePortalBoards } from "@/hooks/usePortalBoards";
import { usePortalMedia } from "@/hooks/usePortalMedia";
import { usePortalResponses } from "@/hooks/usePortalResponses";
import { Btn } from "@/components/app/FormElements";

export function PortalMoodBoards({ token, events }: { token: string | null; events: Event[] }) {
  const { db, concepts, boards, loading } = usePortalBoards(token);
  const { urls, load } = usePortalMedia(token);
  const { responses, respond } = usePortalResponses({ client: db ?? undefined, eventId: null });
  const [comment, setComment] = useState<Record<string, string>>({});

  const allPaths = boards.flatMap((b) => b.items.map((i) => i.storage_path));
  const pathKey = allPaths.join("|");
  useEffect(() => {
    if (pathKey) void load(pathKey.split("|"));
  }, [pathKey, load]);

  if (loading || boards.length === 0) return null;

  const favourites = new Set(
    responses.filter((r) => r.subject_type === "inspiration_item" && r.action === "favourited").map((r) => r.subject_id),
  );
  const approved = new Set(
    responses.filter((r) => r.subject_type === "inspiration_board" && r.action === "approved").map((r) => r.subject_id),
  );
  const eventName = (id: string) => events.find((e) => e.id === id)?.name ?? "";

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl mb-1">Look and feel</h2>
      <p className="text-sm font-sans text-muted-foreground mb-6">
        Tap the heart on the images you love, then approve the board or tell us what to change.
      </p>

      {concepts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {concepts.map((c) => (
            <span key={c.id} className="border border-input px-3 py-1 text-xs font-sans uppercase tracking-wider">
              {c.name}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-8">
        {boards.map((b) => (
          <article key={b.id} className="border border-input">
            <header className="border-b border-input px-4 py-3">
              <h3 className="font-display text-lg">{b.title}</h3>
              <p className="text-xs font-sans text-muted-foreground">
                {eventName(b.event_id)}{b.description ? ` · ${b.description}` : ""}
              </p>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4">
              {b.items.map((item) => {
                const fav = favourites.has(item.id);
                return (
                  <figure key={item.id} className="relative border border-input">
                    {urls[item.storage_path] ? (
                      <img src={urls[item.storage_path]} alt={item.caption ?? b.title} loading="lazy"
                        className="w-full h-36 object-cover" />
                    ) : (
                      <div className="w-full h-36 bg-muted animate-pulse" />
                    )}
                    <button
                      aria-label={fav ? "Remove favourite" : "Mark as favourite"}
                      onClick={() =>
                        void respond({
                          subject_type: "inspiration_item",
                          subject_id: item.id,
                          action: fav ? "unfavourited" : "favourited",
                          event_id: b.event_id,
                        })
                      }
                      className="absolute top-1 right-1 bg-background/90 p-1.5 hover:bg-background transition-colors"
                    >
                      <Heart size={14} className={fav ? "fill-foreground" : ""} />
                    </button>
                    {item.caption && (
                      <figcaption className="px-2 py-1 text-[11px] font-sans text-muted-foreground">{item.caption}</figcaption>
                    )}
                  </figure>
                );
              })}
            </div>

            <div className="border-t border-input px-4 py-3 space-y-2">
              {approved.has(b.id) ? (
                <p className="text-xs font-sans uppercase tracking-wider flex items-center gap-1">
                  <Check size={14} /> You approved this board
                </p>
              ) : (
                <Btn onClick={() => void respond({ subject_type: "inspiration_board", subject_id: b.id, action: "approved", event_id: b.event_id })}>
                  Approve this board
                </Btn>
              )}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  value={comment[b.id] ?? ""}
                  onChange={(e) => setComment((c) => ({ ...c, [b.id]: e.target.value }))}
                  placeholder="Ask for a change"
                  className="flex-1 border border-input bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:border-foreground transition-colors"
                />
                <Btn
                  variant="secondary"
                  onClick={() => {
                    const body = (comment[b.id] ?? "").trim();
                    if (!body) return;
                    void respond({
                      subject_type: "inspiration_board", subject_id: b.id,
                      action: "changes_requested", body, event_id: b.event_id,
                    }).then(() => setComment((c) => ({ ...c, [b.id]: "" })));
                  }}
                >
                  <MessageSquare size={14} className="inline mr-1" /> Send
                </Btn>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
