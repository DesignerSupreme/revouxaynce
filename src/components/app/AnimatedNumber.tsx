import React, { useState, useEffect, useRef } from "react";
import { useInView } from "@/hooks/useInView";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function AnimatedNumber({ value, prefix = "", suffix = "", duration = 1200 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const { ref, inView } = useInView();
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!inView) return;
    startRef.current = null;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, value, duration]);

  const formatted = typeof value === "number" && prefix === "$"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(display)
    : `${prefix}${display.toLocaleString()}${suffix}`;

  return <span ref={ref}>{formatted}</span>;
}
