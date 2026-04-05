import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}

export function Modal({ open, onClose, title, children, wide }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className={`bg-background border border-foreground w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto animate-scale-in`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-foreground px-6 py-4">
          <h2 className="font-display text-xl">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
