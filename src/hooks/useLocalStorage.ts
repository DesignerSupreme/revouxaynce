import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, seed: () => T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : seed();
    } catch {
      return seed();
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(val));
  }, [key, val]);
  return [val, setVal];
}
