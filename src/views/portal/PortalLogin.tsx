import React from "react";
import { LinkIcon } from "lucide-react";
import logo from "@/assets/revouxaynce-logo.svg";

/**
 * Shown when a visitor arrives without a valid portal link.
 * There is deliberately no email form: access is by unguessable link only.
 */
export function PortalLogin({ invalid = false }: { invalid?: boolean }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <img src={logo} alt="Revouxaynce" className="h-10 w-auto mx-auto mb-6" />
        <div className="border border-foreground p-6">
          <LinkIcon size={20} className="mx-auto text-muted-foreground mb-3" />
          <h1 className="text-xl mb-2">{invalid ? "This link is no longer valid" : "Private client portal"}</h1>
          <p className="text-sm text-muted-foreground font-sans">
            {invalid
              ? "Ask your event planner to send you a new link."
              : "Open the personal link your event planner sent you to see your events and invoices."}
          </p>
        </div>
        <p className="text-xs text-muted-foreground font-sans mt-6">Revouxaynce · Premium Event Management</p>
      </div>
    </div>
  );
}
