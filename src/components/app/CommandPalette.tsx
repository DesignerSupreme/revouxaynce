import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

export interface Command {
  id: string;
  label: string;
  group: string;
  keywords?: string;
  run: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}

/** Keyboard-first jump list. Opens on Cmd/Ctrl+K, closes on Escape. */
export function CommandPalette({ open, onClose, commands }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.group} ${c.keywords ?? ""}`.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => { setActive(0); }, [query]);

  if (!open) return null;

  const choose = (cmd?: Command) => {
    if (!cmd) return;
    onClose();
    cmd.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); choose(results[active]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-[60] print:hidden" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />
      <div
        className="absolute left-1/2 top-16 w-[92vw] max-w-lg -translate-x-1/2 border border-foreground bg-background"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-foreground px-3 py-3">
          <Search size={16} className="text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Go to a page or start a task"
            aria-label="Search pages and actions"
            className="w-full bg-background text-sm font-sans focus:outline-none"
          />
          <kbd className="hidden sm:block border border-input px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">esc</kbd>
        </div>

        <ul className="max-h-80 overflow-y-auto" role="listbox" aria-label="Results">
          {results.length === 0 && (
            <li className="px-4 py-6 text-sm font-sans text-muted-foreground">Nothing matches that. Try a page name.</li>
          )}
          {results.map((c, i) => {
            const header = c.group !== lastGroup ? c.group : null;
            lastGroup = c.group;
            return (
              <React.Fragment key={c.id}>
                {header && (
                  <li className="bg-muted px-4 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-sans">{header}</li>
                )}
                <li role="option" aria-selected={i === active}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(c)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-sans ${i === active ? "bg-foreground text-background" : "hover:bg-muted"}`}
                  >
                    {c.label}
                  </button>
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
