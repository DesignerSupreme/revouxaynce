import React, { useState, useCallback, useContext, createContext } from "react";
import { uid } from "@/lib/helpers";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

type ShowToast = (msg: string, action?: ToastAction) => void;

const ToastCtx = createContext<ShowToast>(() => {});

export const useToast = () => useContext(ToastCtx);

interface ToastItem { id: string; msg: string; action?: ToastAction }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const show = useCallback<ShowToast>((msg, action) => {
    const id = uid();
    setToasts(t => [...t, { id, msg, action }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), action ? 8000 : 3000);
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-[calc(100vw-2rem)]">
        {toasts.map(t => (
          <div key={t.id} className="bg-foreground text-background px-4 py-2 font-sans text-sm shadow-lg animate-slide-in-right flex items-center gap-4">
            <span>{t.msg}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => { t.action?.onClick(); dismiss(t.id); }}
                className="text-xs uppercase tracking-wider underline underline-offset-2 shrink-0 hover:opacity-70 transition-opacity"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export { ToastCtx };
