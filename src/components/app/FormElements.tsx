import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FormInput({ label, ...props }: InputProps) {
  return (
    <label className="block mb-3">
      <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-1 block">{label}</span>
      <input {...props} className="w-full border border-input bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:border-foreground transition-colors" />
    </label>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function FormTextArea({ label, ...props }: TextAreaProps) {
  return (
    <label className="block mb-3">
      <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-1 block">{label}</span>
      <textarea {...props} className="w-full border border-input bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:border-foreground transition-colors" rows={3} />
    </label>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
}

export function FormSelect({ label, options, ...props }: SelectProps) {
  return (
    <label className="block mb-3">
      <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-1 block">{label}</span>
      <select {...props} className="w-full border border-input bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:border-foreground transition-colors">
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

interface SelectLabeledProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}

export function FormSelectLabeled({ label, options, ...props }: SelectLabeledProps) {
  return (
    <label className="block mb-3">
      <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-1 block">{label}</span>
      <select {...props} className="w-full border border-input bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:border-foreground transition-colors">
        <option value="">Select...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export function Btn({ children, variant = "primary", ...props }: BtnProps) {
  return (
    <button {...props} className={`px-4 py-2 text-sm font-sans tracking-wide uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${variant === "primary" ? "bg-foreground text-background hover:bg-foreground/90" : "bg-background text-foreground border border-foreground hover:bg-muted"} ${props.className || ""}`}>
      {children}
    </button>
  );
}
