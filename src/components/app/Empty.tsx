import React from "react";

export function Empty({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-fade-in">
      <Icon size={40} strokeWidth={1} className="mb-4" />
      <p className="font-sans text-sm">{text}</p>
    </div>
  );
}
