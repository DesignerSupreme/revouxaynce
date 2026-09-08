import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import logo from "@/assets/revouxaynce-logo.svg";
import { supabase } from "@/integrations/supabase/client";

export function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) setError(err.message);
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (err) setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <img src={logo} alt="Revouxaynce" className="h-12 sm:h-16 w-auto" />
        </div>
        <div className="border border-foreground p-6 sm:p-8">
          <h1 className="font-display text-2xl text-center mb-1">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-xs text-muted-foreground font-sans text-center mb-8 uppercase tracking-wider">
            {mode === "signin" ? "Sign in to continue" : "For the Revouxaynce team"}
          </p>
          <form onSubmit={handleSubmit}>
            {mode === "signup" && (
              <label className="block mb-4">
                <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-1 block">Full name</span>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)} required
                  className="w-full border border-input bg-background px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-foreground transition-colors"
                  placeholder="Your name"
                />
              </label>
            )}
            <label className="block mb-4">
              <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-1 block">Email</span>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border border-input bg-background px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-foreground transition-colors"
                placeholder="you@example.com"
              />
            </label>
            <label className="block mb-6">
              <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-1 block">Password</span>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full border border-input bg-background px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-foreground pr-10 transition-colors"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            {error && <p className="text-sm font-sans mb-4 text-foreground bg-muted px-3 py-2 border border-foreground">{error}</p>}
            <button type="submit" disabled={busy}
              className="w-full bg-foreground text-background py-2.5 text-sm font-sans uppercase tracking-wider hover:bg-foreground/90 transition-colors disabled:opacity-50">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <button
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
            className="w-full mt-4 text-xs font-sans uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            {mode === "signin" ? "Create an account" : "I already have an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
