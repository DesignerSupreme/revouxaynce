import React from "react";

/** A grey placeholder block that holds the space content is about to fill. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-muted motion-safe:animate-pulse ${className}`} aria-hidden="true" />;
}

/** Placeholder rows shaped like a table, used while records load. */
export function SkeletonTable({ rows = 6, cols = 5, label = "Loading" }: { rows?: number; cols?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="border border-foreground">
      <span className="sr-only">{label}</span>
      <div className="flex gap-4 border-b border-foreground bg-muted px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-input px-4 py-3 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Placeholder cards, used while summary panels load. */
export function SkeletonCards({ count = 4, label = "Loading" }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-foreground p-4">
          <Skeleton className="h-2 w-20 mb-3" />
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  );
}

/** Short stack of lines, used inside panels and detail drawers. */
export function SkeletonLines({ lines = 3, label = "Loading" }: { lines?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-2">
      <span className="sr-only">{label}</span>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? "w-1/2" : "w-full"}`} />
      ))}
    </div>
  );
}
