import React from "react";
import { Btn } from "@/components/app/FormElements";

interface EmptyProps {
  icon: React.ElementType;
  /** What is not here yet, in plain words. */
  text: string;
  /** One line telling the reader what this screen is for. */
  hint?: string;
  /** The single next step, e.g. "Add the first guest". */
  actionLabel?: string;
  onAction?: () => void;
}

export function Empty({ icon: Icon, text, hint, actionLabel, onAction }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <Icon size={40} strokeWidth={1} className="mb-4 text-muted-foreground" aria-hidden="true" />
      <p className="font-sans text-sm">{text}</p>
      {hint && <p className="font-sans text-sm text-muted-foreground mt-1 max-w-sm">{hint}</p>}
      {actionLabel && onAction && (
        <div className="mt-5">
          <Btn onClick={onAction}>{actionLabel}</Btn>
        </div>
      )}
    </div>
  );
}
