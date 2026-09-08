import React, { useRef, useState } from "react";
import { Image as ImageIcon, Upload, Trash2, Share2, EyeOff, Heart, MessageSquare } from "lucide-react";
import type { InspirationItem, PortalResponse } from "@/types";
import type { BoardWithItems } from "@/hooks/useInspirationBoards";
import { useEventMedia } from "@/hooks/useEventMedia";
import { Btn } from "@/components/app/FormElements";
import { Badge } from "@/components/app/Badge";

interface Props {
  board: BoardWithItems;
  responses: PortalResponse[];
  canEdit: boolean;
  onUpload: (files: File[]) => Promise<void>;
  onShare: () => Promise<void>;
  onUnshare: () => Promise<void>;
  onDelete: () => Promise<void>;
  onUpdateItem: (id: string, patch: Partial<InspirationItem>) => Promise<void>;
  onDeleteItem: (item: InspirationItem) => Promise<void>;
}

export function MoodBoardCard({
  board, responses, canEdit, onUpload, onShare, onUnshare, onDelete, onUpdateItem, onDeleteItem,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const urls = useEventMedia(board.items.map((i) => i.storage_path));

  const boardFeedback = responses.filter(
    (r) => r.subject_type === "inspiration_board" && r.subject_id === board.id,
  );
  const favourites = new Set(
    responses
      .filter((r) => r.subject_type === "inspiration_item" && r.action === "favourited")
      .map((r) => r.subject_id),
  );
  const comments = boardFeedback.filter((r) => r.body);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(`Adding ${files.length} image${files.length === 1 ? "" : "s"}…`);
    try {
      await onUpload(Array.from(files));
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="border border-input hover:border-foreground transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-input px-4 py-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg truncate">{board.title}</h3>
          {board.description && (
            <p className="text-xs font-sans text-muted-foreground mt-0.5">{board.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge status={board.status} />
          {canEdit && (
            board.shared_at ? (
              <button onClick={() => void onUnshare()} title="Stop sharing with the client"
                className="p-1.5 border border-input hover:border-foreground transition-colors">
                <EyeOff size={14} />
              </button>
            ) : (
              <button onClick={() => void onShare()} title="Share with the client"
                className="p-1.5 border border-input hover:border-foreground transition-colors">
                <Share2 size={14} />
              </button>
            )
          )}
          {canEdit && (
            <button onClick={() => void onDelete()} title="Delete board"
              className="p-1.5 border border-input hover:border-foreground transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {board.items.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <ImageIcon size={28} strokeWidth={1} className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-sans text-muted-foreground">No images yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-4">
          {board.items.map((item) => (
            <figure key={item.id} className="group relative border border-input">
              {urls[item.storage_path] ? (
                <img src={urls[item.storage_path]} alt={item.caption ?? board.title}
                  loading="lazy" className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 bg-muted animate-pulse" />
              )}
              {favourites.has(item.id) && (
                <span className="absolute top-1 left-1 bg-background/90 p-1" title="Client favourite">
                  <Heart size={12} className="fill-foreground" />
                </span>
              )}
              {canEdit && (
                <button onClick={() => void onDeleteItem(item)} title="Remove image"
                  className="absolute top-1 right-1 bg-background/90 p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                  <Trash2 size={12} />
                </button>
              )}
              <figcaption className="p-1">
                <input
                  defaultValue={item.caption ?? ""}
                  placeholder="Add a caption"
                  disabled={!canEdit}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (item.caption ?? "")) void onUpdateItem(item.id, { caption: v || null });
                  }}
                  className="w-full bg-transparent text-[11px] font-sans px-1 py-0.5 focus:outline-none focus:bg-muted"
                />
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {comments.length > 0 && (
        <div className="border-t border-input px-4 py-3 space-y-2">
          {comments.map((c) => (
            <p key={c.id} className="text-xs font-sans flex gap-2">
              <MessageSquare size={12} className="mt-0.5 shrink-0 text-muted-foreground" />
              <span><span className="uppercase tracking-wider text-muted-foreground">{c.action.replace("_", " ")}</span> — {c.body}</span>
            </p>
          ))}
        </div>
      )}

      {canEdit && (
        <div className="border-t border-input px-4 py-3 flex items-center gap-3">
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => void handleFiles(e.target.files)} />
          <Btn variant="secondary" onClick={() => fileRef.current?.click()} disabled={Boolean(busy)}>
            <Upload size={14} className="inline mr-1" /> Add images
          </Btn>
          {busy && <span className="text-xs font-sans text-muted-foreground">{busy}</span>}
        </div>
      )}
    </div>
  );
}
