import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import logo from "@/assets/revouxaynce-logo.svg";
import type { TeamMember } from "@/types";

interface LoginPageProps {
  onLogin: (member: TeamMember) => void;
  team: TeamMember[];
}

export function LoginPage({ onLogin, team }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const member = team.find(m => m.email.toLowerCase() === email.toLowerCase() && m.password === password);
    if (member) {
      onLogin(member);
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="flex justify-center mb-10">
          <img src={logo} alt="Revouxaynce" className="h-12 sm:h-16 w-auto" />
        </div>
        <div className="border border-foreground p-6 sm:p-8">
          <h1 className="font-display text-2xl text-center mb-1">Welcome Back</h1>
          <p className="text-xs text-muted-foreground font-sans text-center mb-8 uppercase tracking-wider">Sign in to continue</p>
          <form onSubmit={handleSubmit}>
            <label className="block mb-4">
              <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-1 block">Email</span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-input bg-background px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-foreground transition-colors"
                placeholder="you@example.com" required />
            </label>
            <label className="block mb-6">
              <span className="text-xs font-sans uppercase tracking-wider text-muted-foreground mb-1 block">Password</span>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full border border-input bg-background px-3 py-2.5 text-sm font-sans focus:outline-none focus:border-foreground pr-10 transition-colors"
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            {error && <p className="text-sm font-sans mb-4 text-foreground bg-muted px-3 py-2 border border-foreground animate-fade-in">{error}</p>}
            <button type="submit" className="w-full bg-foreground text-background py-2.5 text-sm font-sans uppercase tracking-wider hover:bg-foreground/90 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]">
              Sign In
            </button>
          </form>
        </div>
        <p className="text-xs text-muted-foreground font-sans text-center mt-6">© Revouxaynce 2026</p>
      </div>
    </div>
  );
}
