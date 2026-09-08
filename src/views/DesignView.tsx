import React, { useMemo, useState } from "react";
import { Palette, Plus, Share2, EyeOff, Trash2, Layers } from "lucide-react";
import type { Event, Client } from "@/types";
import { useConcepts } from "@/hooks/useConcepts";
import { useInspirationBoards } from "@/hooks/useInspirationBoards";
import { usePortalResponses } from "@/hooks/usePortalResponses";
import { Btn, FormInput, FormTextArea, FormSelectLabeled } from "@/components/app/FormElements";
import { Modal } from "@/components/app/Modal";
import { Badge } from "@/components/app/Badge";
import { Empty } from "@/components/app/Empty";
import { MoodBoardCard } from "@/components/design/MoodBoardCard";

interface Props {
  events: Event[];
  clients: Client[];
  canEdit: boolean;
  toast: (msg: string) => void;
}

export function DesignView({ events, clients, canEdit, toast }: Props) {
  const [eventId, setEventId] = useState<string>(() => events[0]?.id ?? "");
  const activeEvent = events.find((e) => e.id === eventId) ?? null;
  const clientId = activeEvent?.clientId || null;
  const clientName = clients.find((c) => c.id === clientId)?.name ?? "No client attached";

  const concepts = useConcepts(eventId || null);
  const boardsApi = useInspirationBoards(eventId || null, clientId);
  const { responses } = usePortalResponses({ eventId: eventId || null });

  const [conceptModal, setConceptModal] = useState(false);
  const [boardModal, setBoardModal] = useState(false);
  const [filterConcept, setFilterConcept] = useState<string>("all");

  const visibleBoards = useMemo(
    () =>
      filterConcept === "all"
        ? boardsApi.boards
        : boardsApi.boards.filter((b) => (b.concept_id ?? "none") === filterConcept),
    [boardsApi.boards, filterConcept],
  );

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast(msg);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (events.length === 0) {
    return (
      <Empty
        icon={Palette}
        text="No events yet"
        hint="Create an event first, then build its concepts and mood boards here."
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl">Design</h1>
        {canEdit && (
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={() => setConceptModal(true)}>
              <Layers size={14} className="inline mr-1" /> New concept
            </Btn>
            <Btn onClick={() => setBoardModal(true)}>
              <Plus size={14} className="inline mr-1" /> New mood board
            </Btn>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-8">
        <FormSelectLabeled
          label="Event"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          options={events.map((e) => ({ value: e.id, label: e.name }))}
        />
        <FormSelectLabeled
          label="Concept"
          value={filterConcept}
          onChange={(e) => setFilterConcept(e.target.value)}
          options={[
            { value: "all", label: "All concepts" },
            { value: "none", label: "Not linked to a concept" },
            ...concepts.concepts.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
      </div>

      <p className="text-xs font-sans text-muted-foreground -mt-4 mb-8">Client: {clientName}</p>

      {/* Concepts */}
      <section className="mb-10">
        <h2 className="font-display text-xl mb-3">Concepts</h2>
        {concepts.concepts.length === 0 ? (
          <p className="text-sm font-sans text-muted-foreground">
            No concepts yet. A concept groups mood boards, budgets and vendor options into one direction.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {concepts.concepts.map((c) => (
              <div key={c.id} className="border border-input hover:border-foreground transition-colors p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg">{c.name}</h3>
                  <Badge status={c.status} />
                </div>
                {c.summary && <p className="text-xs font-sans text-muted-foreground mt-1">{c.summary}</p>}
                {canEdit && (
                  <div className="flex gap-2 mt-3">
                    {c.shared_at ? (
                      <button title="Stop sharing" onClick={() => void run(() => concepts.unshareConcept(c.id), "Concept hidden from the client")}
                        className="p-1.5 border border-input hover:border-foreground transition-colors"><EyeOff size={14} /></button>
                    ) : (
                      <button title="Share with client" onClick={() => void run(() => concepts.shareConcept(c.id), "Concept shared with the client")}
                        className="p-1.5 border border-input hover:border-foreground transition-colors"><Share2 size={14} /></button>
                    )}
                    <button title="Delete concept" onClick={() => void run(() => concepts.deleteConcept(c.id), "Concept deleted")}
                      className="p-1.5 border border-input hover:border-foreground transition-colors"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Mood boards */}
      <section>
        <h2 className="font-display text-xl mb-3">Mood boards</h2>
        {boardsApi.loading ? (
          <p className="text-sm font-sans text-muted-foreground">Loading boards…</p>
        ) : visibleBoards.length === 0 ? (
          <Empty
            icon={Palette}
            text="No mood boards for this event"
            hint="Collect the look and feel in one place, then share it with the client."
            actionLabel={canEdit ? "Create the first board" : undefined}
            onAction={canEdit ? () => setBoardModal(true) : undefined}
          />
        ) : (
          <div className="space-y-6">
            {visibleBoards.map((b) => (
              <MoodBoardCard
                key={b.id}
                board={b}
                responses={responses}
                canEdit={canEdit}
                onUpload={(files) => run(() => boardsApi.uploadImages(b.id, files), "Images added")}
                onShare={() => run(() => boardsApi.shareBoard(b.id), "Board shared with the client")}
                onUnshare={() => run(() => boardsApi.unshareBoard(b.id), "Board hidden from the client")}
                onDelete={() => run(() => boardsApi.deleteBoard(b.id), "Board deleted")}
                onUpdateItem={(id, patch) => run(() => boardsApi.updateItem(id, patch), "Caption saved")}
                onDeleteItem={(item) => run(() => boardsApi.deleteItem(item.id, item.storage_path), "Image removed")}
              />
            ))}
          </div>
        )}
      </section>

      <Modal open={conceptModal} onClose={() => setConceptModal(false)} title="New concept">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void run(
              () => concepts.createConcept(String(fd.get("name") ?? ""), String(fd.get("summary") ?? "")),
              "Concept created",
            ).then(() => setConceptModal(false));
          }}
        >
          <FormInput label="Name" name="name" required placeholder="Garden Romance" />
          <FormTextArea label="Summary" name="summary" placeholder="Soft neutrals, candlelight, long tables" />
          <div className="flex justify-end gap-2 mt-4">
            <Btn variant="secondary" type="button" onClick={() => setConceptModal(false)}>Cancel</Btn>
            <Btn type="submit">Create</Btn>
          </div>
        </form>
      </Modal>

      <Modal open={boardModal} onClose={() => setBoardModal(false)} title="New mood board">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const conceptId = String(fd.get("concept") ?? "");
            void run(
              () =>
                boardsApi.createBoard(
                  String(fd.get("title") ?? ""),
                  String(fd.get("description") ?? ""),
                  conceptId || null,
                ),
              "Mood board created",
            ).then(() => setBoardModal(false));
          }}
        >
          <FormInput label="Title" name="title" required placeholder="Ceremony styling" />
          <FormTextArea label="Description" name="description" placeholder="What this board is showing" />
          <FormSelectLabeled
            label="Concept (optional)"
            name="concept"
            options={concepts.concepts.map((c) => ({ value: c.id, label: c.name }))}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Btn variant="secondary" type="button" onClick={() => setBoardModal(false)}>Cancel</Btn>
            <Btn type="submit">Create</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
