import React from "react";
import { useInView } from "@/hooks/useInView";

interface FadeInUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeInUp({ children, delay = 0, className = "" }: FadeInUpProps) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`transition-all duration-500 ${inView ? "animate-fade-in-up" : "opacity-0 translate-y-5"} ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}>
      {children}
    </div>
  );
}
