import React, { useState, useCallback, useContext, createContext } from "react";
import { uid } from "@/lib/helpers";

const ToastCtx = createContext<(msg: string) => void>(() => {});

export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: string; msg: string }[]>([]);
  const show = useCallback((msg: string) => {
    const id = uid();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className="bg-foreground text-background px-4 py-2 font-sans text-sm shadow-lg animate-slide-in-right">{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export { ToastCtx };
