import React from "react";
import { Star } from "lucide-react";

export function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={14} className={`transition-all duration-200 ${i <= value ? "fill-foreground" : "fill-none"} ${onChange ? "cursor-pointer hover:scale-110" : ""}`}
          onClick={() => onChange?.(i)} />
      ))}
    </div>
  );
}
