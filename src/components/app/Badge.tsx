import React from "react";

export function Badge({ status }: { status: string }) {
  const active = ["Confirmed", "Paid", "Attending", "Day-Of"].includes(status);
  const inactive = ["Wrapped", "Completed", "Declined"].includes(status);
  return (
    <span className={`inline-block px-3 py-0.5 text-xs font-sans tracking-wide uppercase transition-all ${active ? "bg-foreground text-background" : inactive ? "bg-muted text-muted-foreground" : "border border-muted-foreground text-muted-foreground"}`}>
      {status}
    </span>
  );
}
