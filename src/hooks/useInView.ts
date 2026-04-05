import { useRef, useState, useEffect } from "react";

export function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}
