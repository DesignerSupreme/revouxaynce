import React from "react";

export function ConfirmDelete({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2 text-sm animate-fade-in">
      <span>Delete?</span>
      <button onClick={onConfirm} className="bg-foreground text-background px-2 py-0.5 text-xs font-sans">Yes</button>
      <button onClick={onCancel} className="border border-foreground px-2 py-0.5 text-xs font-sans">No</button>
    </div>
  );
}
